import { NextRequest, NextResponse } from 'next/server';
import { ResponseBuilder, HTTP_STATUS } from '@/utils/apiResponse';
import { cameraRepository } from '@/repositories/cameraRepository';
import { CreateCameraRequest } from '@/types/camera';
import { logger } from '@/utils/logger';
import { RequestValidator, ValidationError } from '@/utils/validator';

// Initialize database on startup
let dbInitialized = false;

async function ensureDatabase() {
  if (!dbInitialized) {
    const { initializeDatabase } = await import('@/lib/database');
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'online' | 'offline' | 'streaming' | null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let cameras = await cameraRepository.getAllCameras();

    // Filter by status
    if (status) {
      cameras = cameras.filter(camera => camera.status === status);
    }

    // Sort cameras
    cameras.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCameras = cameras.slice(startIndex, endIndex);

    const response = ResponseBuilder.success('Camera list retrieved successfully', {
      cameras: paginatedCameras,
      pagination: {
        page,
        limit,
        total: cameras.length,
        pages: Math.ceil(cameras.length / limit)
      },
      filters: {
        status,
        sortBy,
        sortOrder
      }
    });

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to fetch cameras', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    const response = ResponseBuilder.internalError(
      'Failed to fetch camera list',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();
    
    const body = await request.json();
    
    // Validate request
    if (!body || !body.name) {
      const response = ResponseBuilder.validationError('Camera name is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Validate RTSP URL if provided
    if (body.rtspUrl) {
      try {
        RequestValidator.validateStartStreamRequest({
          cameraId: 'temp',
          rtspUrl: body.rtspUrl
        });
      } catch (validationError) {
        const response = ResponseBuilder.validationError(
          'Invalid RTSP URL format',
          validationError instanceof ValidationError ? validationError.message : 'Invalid format'
        );
        return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
      }
    }

    const camera = await cameraRepository.createCamera({
      name: body.name,
      rtspUrl: body.rtspUrl
    });

    const response = ResponseBuilder.success('Camera created successfully', camera);
    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to create camera', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      cameraName: request.body?.name 
    });
    
    const response = ResponseBuilder.internalError(
      'Failed to create camera',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    
    const { id } = params;
    
    if (!id) {
      const response = ResponseBuilder.validationError('Camera ID is required');
      return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
    }

    await cameraRepository.deleteCamera(id);

    const response = ResponseBuilder.success('Camera deleted successfully', { id });
    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    logger.error('Failed to delete camera', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      cameraId: params.id 
    });
    
    const response = ResponseBuilder.internalError(
      'Failed to delete camera',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
  }
}
