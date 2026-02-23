#!/bin/bash

# Script to sync stream status with running FFmpeg processes
# This helps recover from situations where streams are running but not tracked

set -e

API_URL="${API_URL:-http://localhost:3000}"

echo "🔍 Checking for orphaned FFmpeg processes..."

# Get all running FFmpeg processes for RTSP streams
FFMPEG_PIDS=$(ps aux | grep ffmpeg | grep rtsp:// | grep -v grep | awk '{print $2}' || true)

if [ -z "$FFMPEG_PIDS" ]; then
    echo "✅ No orphaned FFmpeg processes found"
    exit 0
fi

echo "⚠️  Found orphaned FFmpeg processes: $FFMPEG_PIDS"
echo ""
echo "Options:"
echo "1. Kill all orphaned processes and restart through API"
echo "2. Just kill orphaned processes"
echo "3. Exit without changes"
echo ""
read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🛑 Killing orphaned FFmpeg processes..."
        for pid in $FFMPEG_PIDS; do
            kill $pid 2>/dev/null || true
            echo "  Killed PID: $pid"
        done
        
        echo ""
        echo "📋 Fetching cameras from database..."
        
        # Get all cameras with RTSP URLs
        sqlite3 data/cctv.db "SELECT id, rtspUrl FROM cameras WHERE rtspUrl IS NOT NULL;" | while IFS='|' read -r camera_id rtsp_url; do
            if [ -n "$camera_id" ] && [ -n "$rtsp_url" ]; then
                echo "🚀 Starting stream for camera: $camera_id"
                curl -s -X POST "$API_URL/api/streams/start" \
                    -H "Content-Type: application/json" \
                    -d "{\"cameraId\":\"$camera_id\",\"rtspUrl\":\"$rtsp_url\"}" | jq -r '.message' || echo "  Failed to start"
            fi
        done
        
        echo ""
        echo "✅ Stream sync complete!"
        ;;
    2)
        echo "🛑 Killing orphaned FFmpeg processes..."
        for pid in $FFMPEG_PIDS; do
            kill $pid 2>/dev/null || true
            echo "  Killed PID: $pid"
        done
        echo "✅ Done!"
        ;;
    3)
        echo "👋 Exiting without changes"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac
