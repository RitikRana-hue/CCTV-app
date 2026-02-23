import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: { cameraId: string; filename: string } }
) {
    try {
        const { cameraId, filename } = params;

        // Validate inputs
        if (!cameraId || !filename) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Security: Validate filename
        if (filename.includes('..') || filename.includes('/')) {
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }

        // Build file path
        const filePath = path.join(process.cwd(), 'public', 'streams', cameraId, filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read file
        const fileBuffer = await fs.readFile(filePath);
        const fileExtension = path.extname(filename);

        // Set content type
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
                'Cache-Control': fileExtension === '.m3u8' ? 'no-cache' : 'max-age=3600',
            },
        });

    } catch (error) {
        console.error('Error serving HLS file:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
