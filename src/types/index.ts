export * from './camera';
export * from './stream';
export * from './api';

export interface AppConfig {
  app: {
    name: string;
    version: string;
    url: string;
  };
  streaming: {
    rtspBaseUrl: string;
    hlsSegmentTime: number;
    hlsPlaylistType: 'live' | 'event';
    ffmpegPath: string;
    maxCameras: number;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    apiKeySecret: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    filePath: string;
  };
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
  userId?: string;
  cameraId?: string;
}

export interface NotificationEvent {
  id: string;
  type: 'camera_offline' | 'stream_error' | 'motion_detected' | 'system_alert';
  cameraId?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}
