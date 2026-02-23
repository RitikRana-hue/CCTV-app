import { NextRequest, NextResponse } from 'next/server';
import { ResponseBuilder, HTTP_STATUS } from '@/utils/apiResponse';
import { recordingService } from '@/services/recordingService';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get('cameraId');

    if (!cameraId) {
      const response = ResponseBuilder.validationError('Camera ID is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const recordings = await recordingService.listRecordings(cameraId);
    const storageUsage = await recordingService.getStorageUsage();

    const response = ResponseBuilder.success('Recordings retrieved successfully', {
      cameraId,
      recordings,
      storage: {
        totalSize: storageUsage.totalSize,
        totalFiles: storageUsage.totalFiles,
        totalSizeGB: Math.round(storageUsage.totalSize / (1024 * 1024 * 1024) * 100) / 100
      }
    });

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to fetch recordings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      cameraId
    });

    const response = ResponseBuilder.internalError(
      'Failed to fetch recordings',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get cameraId from both query params and body
    const { searchParams } = new URL(request.url);
    let cameraId = searchParams.get('cameraId');

    if (!cameraId) {
      const body = await request.json();
      cameraId = body?.cameraId;
    }

    if (!cameraId) {
      const response = ResponseBuilder.validationError('Camera ID is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const body = await request.json();
    const { rtspUrl } = body;

    if (!rtspUrl) {
      const response = ResponseBuilder.validationError('RTSP URL is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    await recordingService.startRecording(cameraId, rtspUrl);

    const response = ResponseBuilder.success('Recording started successfully', {
      cameraId,
      status: 'recording'
    });

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to start recording', {
      error: error instanceof Error ? error.message : 'Unknown error',
      cameraId
    });

    const response = ResponseBuilder.internalError(
      'Failed to start recording',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get('cameraId');

    if (!cameraId) {
      const response = ResponseBuilder.validationError('Camera ID is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      const response = ResponseBuilder.validationError('Filename is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    await recordingService.deleteRecording(cameraId, filename);

    const response = ResponseBuilder.success('Recording deleted successfully', {
      cameraId,
      filename
    });

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to delete recording', {
      error: error instanceof Error ? error.message : 'Unknown error',
      cameraId,
      filename: request.body?.filename
    });

    const response = ResponseBuilder.internalError(
      'Failed to delete recording',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}
