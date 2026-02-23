import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { getRecordingPath, DEFAULT_RECORDING_CONFIG, validateRecordingPath } from '@/config/recordingConfig';
import { logger } from '@/utils/logger';

export interface RecordingSession {
  cameraId: string;
  process: ChildProcess | null;
  startTime: Date;
  currentSegment: string;
  isRecording: boolean;
}

export interface RecordingInfo {
  cameraId: string;
  filename: string;
  filepath: string;
  size: number;
  duration: number;
  createdAt: Date;
}

export class RecordingService {
  private sessions: Map<string, RecordingSession> = new Map();
  private retentionTimer: NodeJS.Timeout | null = null;

  async startRecording(cameraId: string, rtspUrl: string): Promise<void> {
    if (this.sessions.has(cameraId)) {
      throw new Error(`Recording already active for camera ${cameraId}`);
    }

    if (!rtspUrl) {
      throw new Error('RTSP URL is required for recording');
    }

    const recordingDate = new Date();
    const recordingDir = getRecordingPath(cameraId, recordingDate);
    
    if (!validateRecordingPath(recordingDir)) {
      throw new Error('Invalid recording path');
    }

    await fs.mkdir(recordingDir, { recursive: true });

    const timestamp = recordingDate.toISOString().replace(/[:.]/g, '-');
    const segmentFilename = `${cameraId}_${timestamp}_%03d.mp4`;
    const segmentPath = path.join(recordingDir, segmentFilename);

    const ffmpegArgs = [
      '-i', rtspUrl,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-g', '50',
      '-keyint_min', '25',
      '-sc_threshold', '40',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-f', 'segment',
      '-segment_time', DEFAULT_RECORDING_CONFIG.segmentDuration.toString(),
      '-segment_format', 'time',
      '-strftime', `${cameraId}_%Y%m%d_%H%M%S_%03d.mp4`,
      '-reset_timestamps', '1',
      '-use_wallclock', '1',
      segmentPath
    ];

    const process = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FFREPORT: 'level=error'
      }
    });

    const session: RecordingSession = {
      cameraId,
      process,
      startTime: recordingDate,
      currentSegment: segmentFilename,
      isRecording: true
    };

    this.sessions.set(cameraId, session);

    logger.info('Recording started', { 
      cameraId, 
      rtspUrl,
      segmentPath,
      segmentDuration: DEFAULT_RECORDING_CONFIG.segmentDuration 
    });

    process.on('error', (error) => {
      logger.error('Recording process error', { cameraId, error: error.message });
      this.stopRecording(cameraId);
    });

    process.on('exit', (code, signal) => {
      logger.info('Recording process exited', { cameraId, code, signal });
      if (code !== 0) {
        logger.error('Recording failed', { cameraId, exitCode: code });
      }
      this.stopRecording(cameraId);
    });
  }

  async stopRecording(cameraId: string): Promise<void> {
    const session = this.sessions.get(cameraId);
    if (!session) {
      logger.warn('No active recording found for camera', { cameraId });
      return;
    }

    logger.info('Stopping recording', { cameraId });

    if (session.process) {
      session.process.kill('SIGTERM');
    }

    session.isRecording = false;
    this.sessions.delete(cameraId);

    logger.info('Recording stopped', { cameraId });
  }

  async getRecordingStatus(cameraId: string): Promise<{ isRecording: boolean; startTime?: Date }> {
    const session = this.sessions.get(cameraId);
    return {
      isRecording: session?.isRecording || false,
      startTime: session?.startTime
    };
  }

  async listRecordings(cameraId: string): Promise<RecordingInfo[]> {
    const recordings: RecordingInfo[] = [];
    const baseRecordingPath = DEFAULT_RECORDING_CONFIG.recordingPath;

    try {
      const cameraDir = path.join(baseRecordingPath, cameraId);
      const dateDirs = await fs.readdir(cameraDir);
      
      for (const dateDir of dateDirs) {
        const dateDirPath = path.join(cameraDir, dateDir);
        const files = await fs.readdir(dateDirPath);
        
        for (const file of files) {
          if (file.endsWith('.mp4')) {
            const filePath = path.join(dateDirPath, file);
            const stats = await fs.stat(filePath);
            
            recordings.push({
              cameraId,
              filename: file,
              filepath: filePath,
              size: stats.size,
              duration: 0,
              createdAt: stats.mtime
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to list recordings', { cameraId, error: error instanceof Error ? error.message : 'Unknown error' });
    }

    recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return recordings;
  }

  async deleteRecording(cameraId: string, filename: string): Promise<void> {
    const safeFilename = path.basename(filename);
    if (!safeFilename.endsWith('.mp4')) {
      throw new Error('Invalid file type for deletion');
    }

    const filePath = path.join(DEFAULT_RECORDING_CONFIG.recordingPath, cameraId, safeFilename);
    
    try {
      await fs.unlink(filePath);
      logger.info('Recording deleted', { cameraId, filename: safeFilename });
    } catch (error) {
      logger.error('Failed to delete recording', { 
        cameraId, 
        filename: safeFilename,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async getRecordingPath(cameraId: string, filename: string): Promise<string> {
    const filePath = path.join(DEFAULT_RECORDING_CONFIG.recordingPath, cameraId, filename);
    
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new Error('Recording file not found');
    }
  }

  async getStorageUsage(): Promise<{ totalSize: number; totalFiles: number }> {
    let totalSize = 0;
    let totalFiles = 0;

    try {
      const recordingDirs = await fs.readdir(DEFAULT_RECORDING_CONFIG.recordingPath);
      
      for (const cameraId of recordingDirs) {
        const cameraDir = path.join(DEFAULT_RECORDING_CONFIG.recordingPath, cameraId);
        const dateDirs = await fs.readdir(cameraDir);
        
        for (const dateDir of dateDirs) {
          const dateDirPath = path.join(cameraDir, dateDir);
          const files = await fs.readdir(dateDirPath);
          
          for (const file of files) {
            if (file.endsWith('.mp4')) {
              const filePath = path.join(dateDirPath, file);
              const stats = await fs.stat(filePath);
              totalSize += stats.size;
              totalFiles += 1;
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to calculate storage usage', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    return {
      totalSize,
      totalFiles
    };
  }

  async shutdown(): Promise<void> {
    const sessionEntries = Array.from(this.sessions.entries());
    
    for (const [cameraId, session] of sessionEntries) {
      if (session.isRecording) {
        await this.stopRecording(cameraId);
      }
    }

    if (this.retentionTimer) {
      clearInterval(this.retentionTimer);
    }

    logger.info('Recording service shutdown');
  }
}

export const recordingService = new RecordingService();
