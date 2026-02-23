import { NextRequest, NextResponse } from 'next/server';
import { streamService } from '@/services/streamService';
import { RequestValidator, StartStreamRequest } from '@/utils/validator';
import { ResponseBuilder, HTTP_STATUS } from '@/utils/apiResponse';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    const validatedRequest: StartStreamRequest = RequestValidator.validateStartStreamRequest(body);

    logger.info('Starting stream request', {
      cameraId: validatedRequest.cameraId,
      rtspUrl: validatedRequest.rtspUrl
    });

    const existingStatus = streamService.getStreamStatus(validatedRequest.cameraId);
    if (existingStatus?.isRunning) {
      logger.warn('Stream already running', { cameraId: validatedRequest.cameraId });
      const response = ResponseBuilder.conflictError(
        `Stream for camera ${validatedRequest.cameraId} is already running`
      );
      return NextResponse.json(response, { status: HTTP_STATUS.CONFLICT });
    }

    await streamService.startStream(validatedRequest.cameraId, validatedRequest.rtspUrl);

    // Update camera status to streaming
    try {
      const { cameraRepository } = await import('@/repositories/cameraRepository');
      await cameraRepository.updateCamera(validatedRequest.cameraId, { status: 'streaming' });
    } catch (error) {
      logger.warn('Failed to update camera status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cameraId: validatedRequest.cameraId
      });
    }

    logger.info('Stream started successfully', { cameraId: validatedRequest.cameraId });

    const response = ResponseBuilder.success(
      `Stream started successfully for camera ${validatedRequest.cameraId}`,
      { cameraId: validatedRequest.cameraId, rtspUrl: validatedRequest.rtspUrl }
    );

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to start stream', {
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
      'Failed to start stream',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}
