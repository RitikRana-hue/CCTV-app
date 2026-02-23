import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

import { StreamConfig, StreamSettings, validateRtspUrl, getStreamOutputPath, DEFAULT_STREAM_SETTINGS } from '../config/streamConfig';
import { logger } from '../utils/logger';

export interface StreamStatus {
  cameraId: string;
  rtspUrl: string;
  isRunning: boolean;
  startTime?: Date;
  pid?: number;
  exitCode?: number;
  error?: string;
  outputPath: string;
  playlistUrl: string;
}

export interface StreamMetrics {
  cameraId: string;
  uptime?: number;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  lastSegmentTime?: Date;
}

interface StreamProcess {
  process: ChildProcess;
  config: StreamConfig;
  startTime: Date;
  lastActivity: Date;
}

class StreamServiceClass extends EventEmitter {
  private static instance: StreamServiceClass;
  private activeStreams: Map<string, StreamProcess> = new Map();
  private settings: StreamSettings;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.settings = DEFAULT_STREAM_SETTINGS;
    this.setupCleanupInterval();
    this.setupProcessHandlers();
  }

  static getInstance(): StreamServiceClass {
    if (!StreamServiceClass.instance) {
      StreamServiceClass.instance = new StreamServiceClass();
    }
    return StreamServiceClass.instance;
  }

  private setupProcessHandlers(): void {
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGUSR2', () => this.shutdown());
    }
  }

  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSegments();
    }, this.settings.streamCleanupInterval);
  }

  private async cleanupOldSegments(): Promise<void> {
    const cameraIds = Array.from(this.activeStreams.keys());
    for (const cameraId of cameraIds) {
      const streamProcess = this.activeStreams.get(cameraId);
      if (!streamProcess) continue;

      try {
        const segmentDir = streamProcess.config.outputDir;
        const files = await fs.readdir(segmentDir);
        const segmentFiles = files.filter(file => file.startsWith('segment') && file.endsWith('.ts'));

        if (segmentFiles.length > this.settings.hlsMaxSegments) {
          const filesToDelete = segmentFiles
            .map(file => ({
              name: file,
              path: path.join(segmentDir, file),
            }))
            .sort((a, b) => b.name.localeCompare(a.name))
            .slice(this.settings.hlsMaxSegments);

          for (const file of filesToDelete) {
            await fs.unlink(file.path);
            logger.debug(`Deleted old segment: ${file.name}`, { cameraId });
          }
        }
      } catch (error) {
        logger.error('Failed to cleanup old segments', { error, cameraId });
      }
    }
  }

  private createStreamConfig(cameraId: string, rtspUrl: string, overrides: Partial<StreamConfig> = {}): StreamConfig {
    if (!validateRtspUrl(rtspUrl)) {
      throw new Error(`Invalid RTSP URL format: ${rtspUrl}`);
    }

    const outputDir = getStreamOutputPath(cameraId);

    return {
      cameraId,
      rtspUrl,
      outputDir,
      segmentTime: this.settings.hlsSegmentTime,
      maxSegments: this.settings.hlsMaxSegments,
      videoCodec: this.settings.videoCodec,
      audioCodec: this.settings.audioCodec,
      preset: this.settings.videoPreset,
      tune: this.settings.videoTune,
      ...overrides,
    };
  }

  private buildFFmpegArgs(config: StreamConfig): string[] {
    const playlistPath = path.join(config.outputDir, 'playlist.m3u8');
    const segmentPattern = path.join(config.outputDir, 'segment%03d.ts');

    const args = [
      // Ultra-low latency RTSP settings
      '-rtsp_transport', this.settings.rtspTransport,
      '-fflags', 'nobuffer',
      '-flags', 'low_delay',
      '-strict', 'experimental',
      '-i', config.rtspUrl,

      // Ultra-fast encoding for minimal latency
      '-c:v', config.videoCodec,
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-profile:v', 'baseline',
      '-level', '3.0',

      // Minimal GOP for faster seeking
      '-g', '15',
      '-keyint_min', '15',
      '-sc_threshold', '0',

      // Bitrate settings
      '-b:v', config.videoBitrate || '800k',
      '-bufsize', '800k',
      '-maxrate', '800k',

      // Audio settings
      '-c:a', config.audioCodec,
      '-b:a', '64k',
      '-ar', '44100',

      // HLS settings for low latency
      '-f', 'hls',
      '-hls_time', '1',  // 1 second segments for ultra-low latency
      '-hls_list_size', '3',  // Keep only 3 segments
      '-hls_flags', 'delete_segments+omit_endlist',
      '-hls_segment_filename', segmentPattern,
      '-start_number', '0',
      playlistPath,
    ];

    if (config.resolution) {
      args.splice(-8, 0, '-s', config.resolution);
    }

    if (config.fps) {
      args.splice(-8, 0, '-r', config.fps.toString());
    }

    return args;
  }

  private async ensureOutputDirectory(outputDir: string): Promise<void> {
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
      logger.info(`Created output directory: ${outputDir}`);
    }
  }

  private setupFFmpegProcess(ffmpegProcess: ChildProcess, config: StreamConfig): void {
    ffmpegProcess.on('error', (error) => {
      logger.error('FFmpeg process error', { error: error.message, cameraId: config.cameraId });
      this.handleStreamEnd(config.cameraId, error.message);
    });

    ffmpegProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      this.parseFFmpegOutput(config.cameraId, output);
    });

    ffmpegProcess.on('close', (code, signal) => {
      logger.info('FFmpeg process closed', {
        code,
        signal,
        cameraId: config.cameraId
      });
      this.handleStreamEnd(config.cameraId, code ? `Process exited with code ${code}` : undefined);
    });

    ffmpegProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.trim()) {
        logger.debug('FFmpeg stdout', { output: output.trim(), cameraId: config.cameraId });
      }
    });
  }

  private parseFFmpegOutput(cameraId: string, output: string): void {
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.includes('error') || trimmedLine.includes('Error')) {
        logger.error('FFmpeg error detected', { output: trimmedLine, cameraId });
      } else if (trimmedLine.includes('frame=')) {
        const frameMatch = trimmedLine.match(/frame=(\d+)/);
        if (frameMatch) {
          const frames = parseInt(frameMatch[1]);
          this.emit('frameUpdate', { cameraId, frames });
        }
      } else if (trimmedLine.includes('bitrate=')) {
        const bitrateMatch = trimmedLine.match(/bitrate=(\d+)k/);
        if (bitrateMatch) {
          const bitrate = parseInt(bitrateMatch[1]);
          this.emit('bitrateUpdate', { cameraId, bitrate });
        }
      }
    }
  }

  private handleStreamEnd(cameraId: string, error?: string): void {
    const streamProcess = this.activeStreams.get(cameraId);
    if (streamProcess) {
      this.activeStreams.delete(cameraId);
      this.emit('streamEnded', {
        cameraId,
        error,
        uptime: Date.now() - streamProcess.startTime.getTime()
      });
    }
  }

  async startStream(cameraId: string, rtspUrl: string, overrides: Partial<StreamConfig> = {}): Promise<void> {
    if (this.activeStreams.has(cameraId)) {
      throw new Error(`Stream already running for camera ${cameraId}`);
    }

    if (this.activeStreams.size >= this.settings.maxConcurrentStreams) {
      throw new Error(`Maximum concurrent streams reached (${this.settings.maxConcurrentStreams})`);
    }

    try {
      const config = this.createStreamConfig(cameraId, rtspUrl, overrides);
      await this.ensureOutputDirectory(config.outputDir);

      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      const args = this.buildFFmpegArgs(config);

      logger.info('Starting FFmpeg process', {
        cameraId,
        rtspUrl,
        ffmpegPath,
        args: args.slice(0, 10)
      });

      const ffmpegProcess = spawn(ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      const streamProcess: StreamProcess = {
        process: ffmpegProcess,
        config,
        startTime: new Date(),
        lastActivity: new Date(),
      };

      this.activeStreams.set(cameraId, streamProcess);
      this.setupFFmpegProcess(ffmpegProcess, config);

      this.emit('streamStarted', { cameraId, config });

      logger.info('Stream started successfully', { cameraId });

    } catch (error) {
      logger.error('Failed to start stream', { error, cameraId });
      throw error;
    }
  }

  async stopStream(cameraId: string): Promise<void> {
    const streamProcess = this.activeStreams.get(cameraId);

    if (!streamProcess) {
      logger.warn('No active stream found', { cameraId });
      return;
    }

    try {
      logger.info('Stopping stream', { cameraId });

      streamProcess.process.kill('SIGTERM');

      const timeout = setTimeout(() => {
        if (streamProcess.process && !streamProcess.process.killed) {
          logger.warn('Force killing FFmpeg process', { cameraId });
          streamProcess.process.kill('SIGKILL');
        }
      }, 5000);

      streamProcess.process.on('close', () => {
        clearTimeout(timeout);
      });

      this.activeStreams.delete(cameraId);
      this.emit('streamStopped', { cameraId });

      logger.info('Stream stopped successfully', { cameraId });

    } catch (error) {
      logger.error('Failed to stop stream', { error, cameraId });
      throw error;
    }
  }

  async restartStream(cameraId: string): Promise<void> {
    const streamProcess = this.activeStreams.get(cameraId);

    if (!streamProcess) {
      throw new Error(`No active stream found for camera ${cameraId}`);
    }

    const { rtspUrl } = streamProcess.config;

    await this.stopStream(cameraId);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.startStream(cameraId, rtspUrl);
  }

  getStreamStatus(cameraId: string): StreamStatus | null {
    const streamProcess = this.activeStreams.get(cameraId);

    if (!streamProcess) {
      return null;
    }

    const { process, config, startTime } = streamProcess;

    return {
      cameraId,
      rtspUrl: config.rtspUrl,
      isRunning: !process.killed,
      startTime,
      pid: process.pid,
      outputPath: config.outputDir,
      playlistUrl: `/streams/${cameraId}/playlist.m3u8`,
    };
  }

  getAllStreamStatuses(): StreamStatus[] {
    const statuses: StreamStatus[] = [];

    const cameraIds = Array.from(this.activeStreams.keys());
    for (const cameraId of cameraIds) {
      const status = this.getStreamStatus(cameraId);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  getStreamMetrics(cameraId: string): StreamMetrics | null {
    const streamProcess = this.activeStreams.get(cameraId);

    if (!streamProcess) {
      return null;
    }

    return {
      cameraId,
      uptime: Date.now() - streamProcess.startTime.getTime(),
      lastSegmentTime: streamProcess.lastActivity,
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down stream service');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const cameraIds = Array.from(this.activeStreams.keys());

    const stopPromises = cameraIds.map(cameraId =>
      this.stopStream(cameraId).catch(error =>
        logger.error('Error stopping stream during shutdown', { error, cameraId })
      )
    );

    await Promise.allSettled(stopPromises);

    logger.info('Stream service shutdown complete');
  }

  updateSettings(newSettings: Partial<StreamSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    if (newSettings.streamCleanupInterval) {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.setupCleanupInterval();
    }

    logger.info('Stream settings updated', { newSettings });
  }

  getSettings(): StreamSettings {
    return { ...this.settings };
  }
}

export const streamService = StreamServiceClass.getInstance();
export type StreamService = StreamServiceClass;
