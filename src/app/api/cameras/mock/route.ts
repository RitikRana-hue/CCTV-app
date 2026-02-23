import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

// Mock camera data - in production, this would come from database
const mockCameras = [
  {
    id: 'camera-1',
    name: 'Front Entrance',
    rtspUrl: 'rtsp://192.168.1.100:554/stream',
    status: 'online',
    location: 'Main Building',
    resolution: '1920x1080',
    fps: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeen: new Date(),
  },
  {
    id: 'camera-2',
    name: 'Parking Lot',
    rtspUrl: 'rtsp://192.168.1.101:554/stream',
    status: 'offline',
    location: 'Parking Area',
    resolution: '1920x1080',
    fps: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeen: new Date(Date.now() - 300000),
  },
  {
    id: 'camera-3',
    name: 'Back Door',
    rtspUrl: 'rtsp://192.168.1.102:554/stream',
    status: 'connecting',
    location: 'Rear Building',
    resolution: '1280x720',
    fps: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let filteredCameras = mockCameras.filter(camera => {
      const matchesSearch = camera.name.toLowerCase().includes(search.toLowerCase()) ||
                           camera.location?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !status || camera.status === status;
      return matchesSearch && matchesStatus;
    });

    // Sort cameras
    filteredCameras.sort((a, b) => a.name.localeCompare(b.name));

    // Paginate
    const total = filteredCameras.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCameras = filteredCameras.slice(startIndex, endIndex);

    const response: ApiResponse = {
      success: true,
      data: {
        data: paginatedCameras,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'FETCH_CAMERAS_ERROR',
        message: 'Failed to fetch cameras',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rtspUrl, location, resolution, fps, description } = body;

    // Validation
    if (!name || !rtspUrl) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and RTSP URL are required',
        },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create new camera
    const newCamera = {
      id: Date.now().toString(),
      name,
      rtspUrl,
      status: 'offline',
      location: location || '',
      resolution: resolution || '',
      fps: fps || 30,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: undefined,
    };

    mockCameras.push(newCamera);

    const response: ApiResponse = {
      success: true,
      message: 'Camera created successfully',
      data: newCamera,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CREATE_CAMERA_ERROR',
        message: 'Failed to create camera',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
