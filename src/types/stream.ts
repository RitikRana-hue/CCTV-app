export interface StreamConfig {
  cameraId: string;
  outputDir: string;
  segmentTime: number;
  playlistType: 'live' | 'event';
  videoCodec?: string;
  audioCodec?: string;
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string;
  fps?: number;
}

export interface StreamInfo {
  cameraId: string;
  playlistUrl: string;
  segmentDir: string;
  isLive: boolean;
  startTime?: Date;
  viewers: number;
  currentBitrate?: number;
  targetBitrate?: string;
  resolution?: string;
  fps?: number;
}

export interface HLSPlaylist {
  version: number;
  targetDuration: number;
  mediaSequence: number;
  segments: HLSSegment[];
  endList?: boolean;
}

export interface HLSSegment {
  duration: number;
  url: string;
  size?: number;
  timestamp?: Date;
}

export interface StreamQuality {
  name: string;
  resolution: string;
  bitrate: string;
  fps: number;
  codec: string;
}

export interface StreamMetrics {
  cameraId: string;
  timestamp: Date;
  viewers: number;
  bandwidth: number;
  latency: number;
  droppedFrames: number;
  bufferHealth: number;
}
