import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { StreamConfig, StreamInfo } from '@/types';
import config from '../config';
import logger from '../logger';

export class FFmpegManager {
  private static instance: FFmpegManager;
  private activeStreams: Map<string, ChildProcess> = new Map();
  private streamConfigs: Map<string, StreamConfig> = new Map();

  private constructor() {}

  static getInstance(): FFmpegManager {
    if (!FFmpegManager.instance) {
      FFmpegManager.instance = new FFmpegManager();
    }
    return FFmpegManager.instance;
  }

  async startStream(streamConfig: StreamConfig): Promise<void> {
    const { cameraId, outputDir, segmentTime, playlistType, videoCodec, audioCodec } = streamConfig;

    if (this.activeStreams.has(cameraId)) {
      logger.warn(`Stream already active for camera ${cameraId}`);
      return;
    }

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      const rtspUrl = this.getRtspUrl(cameraId);
      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      const segmentPattern = path.join(outputDir, 'segment%03d.ts');

      const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-c:v', videoCodec || 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-c:a', audioCodec || 'aac',
        '-f', 'hls',
        '-hls_time', segmentTime.toString(),
        '-hls_list_size', '6',
        '-hls_flags', 'delete_segments',
        '-hls_segment_filename', segmentPattern,
        playlistPath
      ];

      if (streamConfig.videoBitrate) {
        ffmpegArgs.splice(-4, 0, '-b:v', streamConfig.videoBitrate);
      }

      if (streamConfig.audioBitrate) {
        ffmpegArgs.splice(-4, 0, '-b:a', streamConfig.audioBitrate);
      }

      if (streamConfig.resolution) {
        ffmpegArgs.splice(-4, 0, '-s', streamConfig.resolution);
      }

      if (streamConfig.fps) {
        ffmpegArgs.splice(-4, 0, '-r', streamConfig.fps.toString());
      }

      const ffmpegProcess = spawn(config.streaming.ffmpegPath, ffmpegArgs);

      this.activeStreams.set(cameraId, ffmpegProcess);
      this.streamConfigs.set(cameraId, streamConfig);

      ffmpegProcess.on('error', (error) => {
        logger.error(`FFmpeg process error for camera ${cameraId}`, { error: error.message });
        this.stopStream(cameraId);
      });

      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('error') || output.includes('Error')) {
          logger.error(`FFmpeg stderr for camera ${cameraId}`, { output: output.trim() });
        }
      });

      ffmpegProcess.on('close', (code) => {
        logger.info(`FFmpeg process closed for camera ${cameraId}`, { code });
        this.activeStreams.delete(cameraId);
        this.streamConfigs.delete(cameraId);
      });

      logger.info(`Started FFmpeg stream for camera ${cameraId}`, {
        rtspUrl,
        outputDir,
        segmentTime,
        playlistType
      });

    } catch (error) {
      logger.error(`Failed to start stream for camera ${cameraId}`, { error });
      throw error;
    }
  }

  async stopStream(cameraId: string): Promise<void> {
    const ffmpegProcess = this.activeStreams.get(cameraId);
    
    if (!ffmpegProcess) {
      logger.warn(`No active stream found for camera ${cameraId}`);
      return;
    }

    try {
      // Send SIGTERM to gracefully stop FFmpeg
      ffmpegProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (ffmpegProcess && !ffmpegProcess.killed) {
          ffmpegProcess.kill('SIGKILL');
        }
      }, 5000);

      this.activeStreams.delete(cameraId);
      this.streamConfigs.delete(cameraId);

      logger.info(`Stopped FFmpeg stream for camera ${cameraId}`);

    } catch (error) {
      logger.error(`Failed to stop stream for camera ${cameraId}`, { error });
      throw error;
    }
  }

  async restartStream(cameraId: string): Promise<void> {
    const config = this.streamConfigs.get(cameraId);
    if (!config) {
      throw new Error(`No stream configuration found for camera ${cameraId}`);
    }

    await this.stopStream(cameraId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startStream(config);
  }

  getStreamStatus(cameraId: string): StreamInfo | null {
    const ffmpegProcess = this.activeStreams.get(cameraId);
    const config = this.streamConfigs.get(cameraId);

    if (!ffmpegProcess || !config) {
      return null;
    }

    return {
      cameraId,
      playlistUrl: `/streams/${path.basename(config.outputDir)}/playlist.m3u8`,
      segmentDir: config.outputDir,
      isLive: true,
      startTime: new Date(),
      viewers: 0, // This would be tracked separately
    };
  }

  getAllActiveStreams(): StreamInfo[] {
    const streams: StreamInfo[] = [];
    
    for (const cameraId of this.activeStreams.keys()) {
      const streamInfo = this.getStreamStatus(cameraId);
      if (streamInfo) {
        streams.push(streamInfo);
      }
    }

    return streams;
  }

  isStreamActive(cameraId: string): boolean {
    return this.activeStreams.has(cameraId);
  }

  private getRtspUrl(cameraId: string): string {
    // In a real implementation, this would fetch from database
    // For now, construct a mock URL
    return `${config.streaming.rtspBaseUrl}/camera${cameraId}/stream`;
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up all FFmpeg streams...');
    
    const cameraIds = Array.from(this.activeStreams.keys());
    
    for (const cameraId of cameraIds) {
      try {
        await this.stopStream(cameraId);
      } catch (error) {
        logger.error(`Error stopping stream ${cameraId} during cleanup`, { error });
      }
    }
  }
}

export const ffmpegManager = FFmpegManager.getInstance();
