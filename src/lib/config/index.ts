import { AppConfig } from '@/types';

const config: AppConfig = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Wireless CCTV Platform',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  streaming: {
    rtspBaseUrl: process.env.RTSP_BASE_URL || 'rtsp://localhost:554',
    hlsSegmentTime: parseInt(process.env.HLS_SEGMENT_TIME || '4'),
    hlsPlaylistType: (process.env.HLS_PLAYLIST_TYPE as 'live' | 'event') || 'live',
    ffmpegPath: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
    maxCameras: parseInt(process.env.MAX_CAMERAS || '16'),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    apiKeySecret: process.env.API_KEY_SECRET || 'default-api-secret',
  },
  logging: {
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
};

export default config;
