export interface RecordingConfig {
  recordingPath: string;
  segmentDuration: number; // seconds
  maxRetentionPolicy: {
    days: number;
    maxStorageGB: number;
  };
  videoSettings: {
    codec: string;
    quality: string;
    resolution: string;
  };
}

export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  recordingPath: process.env.RECORDING_PATH || './recordings',
  segmentDuration: parseInt(process.env.RECORDING_SEGMENT_DURATION || '300'), // 5 minutes
  maxRetentionPolicy: {
    days: parseInt(process.env.RECORDING_RETENTION_DAYS || '30'),
    maxStorageGB: parseInt(process.env.RECORDING_MAX_STORAGE_GB || '100')
  },
  videoSettings: {
    codec: process.env.RECORDING_CODEC || 'h264',
    quality: process.env.RECORDING_QUALITY || 'high',
    resolution: process.env.RECORDING_RESOLUTION || '1920x1080'
  }
};

export function getRecordingPath(cameraId: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${DEFAULT_RECORDING_CONFIG.recordingPath}/${cameraId}/${year}-${month}-${day}`;
}

export function validateRecordingPath(path: string): boolean {
  // Basic path traversal protection
  return !path.includes('..') && !path.includes('~') && !path.startsWith('/');
}
