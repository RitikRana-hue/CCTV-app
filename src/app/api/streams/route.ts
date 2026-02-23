import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get('cameraId');
    const filename = searchParams.get('file');
    
    if (!cameraId || !filename) {
      return NextResponse.json({ error: 'Camera ID and filename are required' }, { status: 400 });
    }

    // Security: Validate camera ID format
    const cameraIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
    if (!cameraIdRegex.test(cameraId)) {
      return NextResponse.json({ error: 'Invalid camera ID format' }, { status: 400 });
    }

    // Security: Only allow specific file types
    if (!filename.endsWith('.m3u8') && !filename.endsWith('.ts')) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'public', 'streams', cameraId, filename);
    
    // Security: Prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    const expectedBase = path.join(process.cwd(), 'public', 'streams');
    if (!normalizedPath.startsWith(expectedBase)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      // If .m3u8 doesn't exist, try to generate it
      if (filename === 'stream.m3u8') {
        const segmentDir = path.join(process.cwd(), 'public', 'streams', cameraId);
        try {
          await fs.access(segmentDir);
          const segments = await fs.readdir(segmentDir);
          const tsSegments = segments.filter(file => file.endsWith('.ts'));
          
          if (tsSegments.length > 0) {
            let playlist = '#EXTM3U\n';
            playlist += '#EXT-X-VERSION:3\n';
            playlist += '#EXT-X-MEDIA-SEQUENCE:0\n';
            playlist += '#EXT-X-ALLOW-CACHE:NO\n';
            playlist += '#EXT-X-TARGETDURATION:10\n';
            
            tsSegments.forEach((segment, index) => {
              playlist += `#EXTINF:10.0,\n`;
              playlist += `/api/streams?cameraId=${cameraId}&file=${segment}\n`;
            });
            
            playlist += '#EXT-X-ENDLIST\n';

            return new NextResponse(playlist, {
              status: 200,
              headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Range',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
            });
          }
        } catch {
          // Directory doesn't exist
        }
      }
      
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read and serve existing file
    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filename);
    
    // Set appropriate content type
    let contentType = 'application/octet-stream';
    if (fileExtension === '.m3u8') {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (fileExtension === '.ts') {
      contentType = 'video/mp2t';
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range',
        'Cache-Control': fileExtension === '.m3u8' ? 'no-cache, no-store, must-revalidate' : 'max-age=2',
      },
    });

  } catch (error) {
    console.error('Error serving HLS file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
