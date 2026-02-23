import { NextRequest, NextResponse } from 'next/server';
import { streamService } from '@/services/streamService';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cameraId, rtspUrl, action, overrides } = body;

    logger.info('Stream service request', { cameraId, rtspUrl, action });

    switch (action) {
      case 'start':
        await streamService.startStream(cameraId, rtspUrl, overrides);
        return NextResponse.json({ 
          success: true, 
          message: `Stream started for camera ${cameraId}` 
        });

      case 'stop':
        await streamService.stopStream(cameraId);
        return NextResponse.json({ 
          success: true, 
          message: `Stream stopped for camera ${cameraId}` 
        });

      case 'restart':
        await streamService.restartStream(cameraId);
        return NextResponse.json({ 
          success: true, 
          message: `Stream restarted for camera ${cameraId}` 
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Stream service error', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get('cameraId');

    if (cameraId) {
      const status = streamService.getStreamStatus(cameraId);
      const metrics = streamService.getStreamMetrics(cameraId);
      
      return NextResponse.json({
        success: true,
        data: { status, metrics }
      });
    } else {
      const allStatuses = streamService.getAllStreamStatuses();
      const activeCount = streamService.getActiveStreamCount();
      
      return NextResponse.json({
        success: true,
        data: {
          streams: allStatuses,
          activeCount,
          settings: streamService.getSettings()
        }
      });
    }

  } catch (error) {
    logger.error('Failed to get stream status', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
