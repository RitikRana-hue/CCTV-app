import { NextRequest, NextResponse } from 'next/server';
import { ResponseBuilder, HTTP_STATUS } from '@/utils/apiResponse';
import { cameraRepository } from '@/repositories/cameraRepository';
import { logger } from '@/utils/logger';

// Initialize database on startup
let dbInitialized = false;

async function ensureDatabase() {
    if (!dbInitialized) {
        const { initializeDatabase } = await import('@/lib/database');
        await initializeDatabase();
        dbInitialized = true;
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

        // Check if camera exists
        const camera = await cameraRepository.getCameraById(id);
        if (!camera) {
            const response = ResponseBuilder.notFound(`Camera with ID ${id} not found`);
            return NextResponse.json(response, { status: HTTP_STATUS.NOT_FOUND });
        }

        // Delete camera
        await cameraRepository.deleteCamera(id);

        // Clean up stream files
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const streamDir = path.join(process.cwd(), 'public', 'streams', id);

            // Check if directory exists and delete it
            try {
                await fs.access(streamDir);
                await fs.rm(streamDir, { recursive: true, force: true });
                logger.info('Stream files cleaned up', { cameraId: id, streamDir });
            } catch (err) {
                // Directory doesn't exist, that's fine
                logger.debug('No stream directory to clean up', { cameraId: id });
            }
        } catch (cleanupError) {
            // Log but don't fail the delete if cleanup fails
            logger.warn('Failed to clean up stream files', {
                cameraId: id,
                error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
            });
        }

        logger.info('Camera deleted successfully', { cameraId: id });

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

export async function GET(
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

        const camera = await cameraRepository.getCameraById(id);

        if (!camera) {
            const response = ResponseBuilder.notFound(`Camera with ID ${id} not found`);
            return NextResponse.json(response, { status: HTTP_STATUS.NOT_FOUND });
        }

        const response = ResponseBuilder.success('Camera retrieved successfully', camera);
        return NextResponse.json(response, { status: HTTP_STATUS.OK });

    } catch (error) {
        logger.error('Failed to get camera', {
            error: error instanceof Error ? error.message : 'Unknown error',
            cameraId: params.id
        });

        const response = ResponseBuilder.internalError(
            'Failed to get camera',
            error instanceof Error ? error.message : 'Unknown error'
        );

        return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureDatabase();

        const { id } = params;
        const body = await request.json();

        if (!id) {
            const response = ResponseBuilder.validationError('Camera ID is required');
            return NextResponse.json(response, { status: HTTP_STATUS.BAD_REQUEST });
        }

        // Check if camera exists
        const existingCamera = await cameraRepository.getCameraById(id);
        if (!existingCamera) {
            const response = ResponseBuilder.notFound(`Camera with ID ${id} not found`);
            return NextResponse.json(response, { status: HTTP_STATUS.NOT_FOUND });
        }

        // Update camera
        const updatedCamera = await cameraRepository.updateCamera(id, body);

        logger.info('Camera updated successfully', { cameraId: id });

        const response = ResponseBuilder.success('Camera updated successfully', updatedCamera);
        return NextResponse.json(response, { status: HTTP_STATUS.OK });

    } catch (error) {
        logger.error('Failed to update camera', {
            error: error instanceof Error ? error.message : 'Unknown error',
            cameraId: params.id
        });

        const response = ResponseBuilder.internalError(
            'Failed to update camera',
            error instanceof Error ? error.message : 'Unknown error'
        );

        return NextResponse.json(response, { status: HTTP_STATUS.INTERNAL_ERROR });
    }
}
