#!/bin/bash

# Quick script to restart a camera stream
# Usage: ./scripts/restart-stream.sh CAMERA_ID

CAMERA_ID="${1:-cam-1771850380195}"

echo "🔄 Restarting stream for camera: $CAMERA_ID"
echo ""

# Get camera details
CAMERA_DATA=$(curl -s http://localhost:3000/api/cameras | jq -r ".data.cameras[] | select(.id == \"$CAMERA_ID\")")

if [ -z "$CAMERA_DATA" ]; then
    echo "❌ Camera not found: $CAMERA_ID"
    exit 1
fi

RTSP_URL=$(echo "$CAMERA_DATA" | jq -r '.rtspUrl')
CAMERA_NAME=$(echo "$CAMERA_DATA" | jq -r '.name')

echo "Camera: $CAMERA_NAME"
echo "RTSP URL: $RTSP_URL"
echo ""

# Stop existing stream
echo "⏹️  Stopping existing stream..."
curl -s -X POST http://localhost:3000/api/streams/stop \
  -H "Content-Type: application/json" \
  -d "{\"cameraId\": \"$CAMERA_ID\"}" > /dev/null

sleep 2

# Clear old segments
echo "🗑️  Clearing old segments..."
rm -f public/streams/$CAMERA_ID/*.ts
rm -f public/streams/$CAMERA_ID/*.m3u8

# Start new stream
echo "▶️  Starting new stream..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/streams/start \
  -H "Content-Type: application/json" \
  -d "{\"cameraId\": \"$CAMERA_ID\", \"rtspUrl\": \"$RTSP_URL\"}")

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Stream restarted successfully!"
    
    # Update status
    sqlite3 data/cctv.db "UPDATE cameras SET status = 'streaming' WHERE id = '$CAMERA_ID';" 2>/dev/null
    
    echo ""
    echo "🎥 View stream:"
    echo "   Dashboard: http://localhost:3000/dashboard"
    echo "   Direct: http://localhost:3000/api/hls/$CAMERA_ID/playlist.m3u8"
else
    echo "❌ Failed to restart stream"
    echo "$RESPONSE" | jq .
fi
