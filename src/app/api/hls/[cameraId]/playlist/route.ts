import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { cameraId: string } }
) {
  try {
    const { cameraId } = params;
    
    if (!cameraId) {
      return NextResponse.json({ error: 'Camera ID is required' }, { status: 400 });
    }

    // Security: Validate camera ID format
    const cameraIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
    if (!cameraIdRegex.test(cameraId)) {
      return NextResponse.json({ error: 'Invalid camera ID format' }, { status: 400 });
    }

    const segmentDir = path.join(process.cwd(), 'public', 'streams', cameraId);
    
    // Check if directory exists
    try {
      await fs.access(segmentDir);
    } catch {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    // Read segments and generate playlist
    const segments = await fs.readdir(segmentDir);
    const tsSegments = segments.filter(file => file.endsWith('.ts'));
    
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';
    playlist += '#EXT-X-MEDIA-SEQUENCE:0\n';
    playlist += '#EXT-X-ALLOW-CACHE:NO\n';
    playlist += '#EXT-X-TARGETDURATION:10\n';
    
    tsSegments.forEach((segment, index) => {
      playlist += `#EXTINF:10.0,\n`;
      playlist += `${cameraId}/${segment}\n`;
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

  } catch (error) {
    console.error('Error serving HLS playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
