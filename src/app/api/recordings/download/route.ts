import { NextRequest, NextResponse } from 'next/server';
import { recordingService } from '@/services/recordingService';
import { logger } from '@/utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get('cameraId');
    const filename = searchParams.get('file');
    
    if (!cameraId || !filename) {
      const response = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Camera ID and filename are required'
        },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    if (!safeFilename.endsWith('.mp4')) {
      const response = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid file type'
        },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(response, { status: 400 });
    }

    try {
      const filePath = await recordingService.getRecordingPath(cameraId, safeFilename);
      const fileBuffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);

      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        }
      });

      logger.info('Recording downloaded', { cameraId, filename: safeFilename, size: stats.size });
      return response;

    } catch (error) {
      logger.error('Failed to download recording', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        cameraId,
        filename 
      });
      
      const response = {
        success: false,
        error: {
          code: 'DOWNLOAD_ERROR',
          message: 'Failed to download recording'
        },
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(response, { status: 500 });
    }
  }
} catch (error) {
    logger.error('Download request error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    const response = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
