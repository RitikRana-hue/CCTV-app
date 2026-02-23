import { logger } from './logger';

export interface StartStreamRequest {
  cameraId: string;
  rtspUrl: string;
}

export interface StopStreamRequest {
  cameraId: string;
}

export interface CameraStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'streaming';
  createdAt: string;
}

export class ValidationError extends Error {
  constructor(message: string, public details?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RequestValidator {
  private static readonly RTSP_REGEX = /^rtsp:\/\/[^\s]+$/;
  private static readonly CAMERA_ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

  static validateStartStreamRequest(body: any): StartStreamRequest {
    if (!body) {
      throw new ValidationError('Request body is required');
    }

    const { cameraId, rtspUrl } = body;

    if (!cameraId) {
      throw new ValidationError('cameraId is required');
    }

    if (!rtspUrl) {
      throw new ValidationError('rtspUrl is required');
    }

    if (typeof cameraId !== 'string') {
      throw new ValidationError('cameraId must be a string');
    }

    if (typeof rtspUrl !== 'string') {
      throw new ValidationError('rtspUrl must be a string');
    }

    if (!this.CAMERA_ID_REGEX.test(cameraId)) {
      throw new ValidationError(
        'cameraId must be 1-50 characters long and contain only letters, numbers, underscores, and hyphens'
      );
    }

    if (!this.RTSP_REGEX.test(rtspUrl)) {
      throw new ValidationError('rtspUrl must be a valid RTSP URL format (rtsp://...)');
    }

    return { cameraId, rtspUrl };
  }

  static validateStopStreamRequest(body: any): StopStreamRequest {
    if (!body) {
      throw new ValidationError('Request body is required');
    }

    const { cameraId } = body;

    if (!cameraId) {
      throw new ValidationError('cameraId is required');
    }

    if (typeof cameraId !== 'string') {
      throw new ValidationError('cameraId must be a string');
    }

    if (!this.CAMERA_ID_REGEX.test(cameraId)) {
      throw new ValidationError(
        'cameraId must be 1-50 characters long and contain only letters, numbers, underscores, and hyphens'
      );
    }

    return { cameraId };
  }

  static validateCameraIdParam(cameraId: string): string {
    if (!cameraId) {
      throw new ValidationError('cameraId query parameter is required');
    }

    if (typeof cameraId !== 'string') {
      throw new ValidationError('cameraId must be a string');
    }

    if (!this.CAMERA_ID_REGEX.test(cameraId)) {
      throw new ValidationError(
        'cameraId must be 1-50 characters long and contain only letters, numbers, underscores, and hyphens'
      );
    }

    return cameraId;
  }
}
