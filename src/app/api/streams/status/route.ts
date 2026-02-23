import { NextRequest, NextResponse } from 'next/server';
import { streamService } from '@/services/streamService';
import { RequestValidator } from '@/utils/validator';
import { ResponseBuilder, HTTP_STATUS } from '@/utils/apiResponse';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraIdParam = searchParams.get('cameraId');

    if (cameraIdParam) {
      const validatedCameraId = RequestValidator.validateCameraIdParam(cameraIdParam);

      logger.info('Fetching stream status', { cameraId: validatedCameraId });

      const status = streamService.getStreamStatus(validatedCameraId);

      const responseData = {
        running: status?.isRunning || false,
        lastError: status?.error
      };

      const response = ResponseBuilder.success(
        `Stream status retrieved for camera ${validatedCameraId}`,
        responseData
      );

      return NextResponse.json(response, { status: HTTP_STATUS.OK });
    } else {
      logger.info('Fetching all stream statuses');

      const allStatuses = streamService.getAllStreamStatuses();
      const responseData = allStatuses.map(status => ({
        cameraId: status.cameraId,
        running: status.isRunning,
        lastError: status.error,
        startTime: status.startTime,
        rtspUrl: status.rtspUrl,
        outputPath: status.outputPath,
        playlistUrl: status.playlistUrl
      }));

      const response = ResponseBuilder.success(
        'All stream statuses retrieved',
        { streams: responseData, count: responseData.length }
      );

      return NextResponse.json(response, { status: HTTP_STATUS.OK });
    }

  } catch (error) {
    logger.error('Failed to fetch stream status', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof Error && error.name === 'ValidationError') {
      const response = ResponseBuilder.validationError(
        'Invalid request parameters',
        error.message
      );
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const response = ResponseBuilder.internalError(
      'Failed to fetch stream status',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}
