export interface StreamConfig {
  cameraId: string;
  rtspUrl: string;
  outputDir: string;
  segmentTime: number;
  maxSegments: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string;
  fps?: number;
  preset: string;
  tune: string;
}

export interface StreamSettings {
  hlsSegmentTime: number;
  hlsMaxSegments: number;
  hlsPlaylistType: 'live' | 'event';
  videoCodec: string;
  audioCodec: string;
  videoPreset: string;
  videoTune: string;
  rtspTransport: 'tcp' | 'udp';
  maxConcurrentStreams: number;
  streamCleanupInterval: number;
}

export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
  hlsSegmentTime: parseInt(process.env.HLS_SEGMENT_TIME || '4'),
  hlsMaxSegments: parseInt(process.env.HLS_MAX_SEGMENTS || '6'),
  hlsPlaylistType: (process.env.HLS_PLAYLIST_TYPE as 'live' | 'event') || 'live',
  videoCodec: process.env.VIDEO_CODEC || 'libx264',
  audioCodec: process.env.AUDIO_CODEC || 'aac',
  videoPreset: process.env.VIDEO_PRESET || 'ultrafast',
  videoTune: process.env.VIDEO_TUNE || 'zerolatency',
  rtspTransport: (process.env.RTSP_TRANSPORT as 'tcp' | 'udp') || 'tcp',
  maxConcurrentStreams: parseInt(process.env.MAX_CONCURRENT_STREAMS || '16'),
  streamCleanupInterval: parseInt(process.env.STREAM_CLEANUP_INTERVAL || '300000'), // 5 minutes
};

export const validateRtspUrl = (url: string): boolean => {
  const rtspRegex = /^rtsp:\/\/[^\s\/]+(?:\/[^\s]*)?$/;
  return rtspRegex.test(url);
};

export const getStreamOutputPath = (cameraId: string): string => {
  return `public/streams/${cameraId}`;
};
