import { NextRequest, NextResponse } from 'next/server';
import { streamService } from '@/services/streamService';
import { RequestValidator, StopStreamRequest } from '@/utils/validator';
import { ResponseBuilder, HTTP_STATUS } from '@/utils/apiResponse';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    const validatedRequest: StopStreamRequest = RequestValidator.validateStopStreamRequest(body);

    logger.info('Stopping stream request', { cameraId: validatedRequest.cameraId });

    const existingStatus = streamService.getStreamStatus(validatedRequest.cameraId);
    if (!existingStatus || !existingStatus.isRunning) {
      logger.warn('Stream not running', { cameraId: validatedRequest.cameraId });
      const response = ResponseBuilder.success(
        `Stream for camera ${validatedRequest.cameraId} is not running`
      );
      return NextResponse.json(response, { status: HTTP_STATUS.OK });
    }

    await streamService.stopStream(validatedRequest.cameraId);

    // Update camera status to offline
    try {
      const { cameraRepository } = await import('@/repositories/cameraRepository');
      await cameraRepository.updateCamera(validatedRequest.cameraId, { status: 'offline' });
    } catch (error) {
      logger.warn('Failed to update camera status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cameraId: validatedRequest.cameraId
      });
    }

    logger.info('Stream stopped successfully', { cameraId: validatedRequest.cameraId });

    const response = ResponseBuilder.success(
      `Stream stopped successfully for camera ${validatedRequest.cameraId}`,
      { cameraId: validatedRequest.cameraId }
    );

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to stop stream', {
      error: error instanceof Error ? error.message : 'Unknown error',
      cameraId: body?.cameraId
    });

    if (error instanceof Error && error.name === 'ValidationError') {
      const response = ResponseBuilder.validationError(
        'Invalid request parameters',
        error.message
      );
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const response = ResponseBuilder.internalError(
      'Failed to stop stream',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}
