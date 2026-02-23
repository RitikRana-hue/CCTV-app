#!/bin/bash

# Add Camera Helper Script
# Usage: ./scripts/add-camera.sh "Camera Name" "rtsp://url"

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./scripts/add-camera.sh \"Camera Name\" \"rtsp://url\""
    echo ""
    echo "Examples:"
    echo "  ./scripts/add-camera.sh \"Front Door\" \"rtsp://admin:pass@192.168.1.100:554/stream1\""
    echo "  ./scripts/add-camera.sh \"Backyard\" \"rtsp://admin:pass@192.168.1.101:554/stream1\""
    echo ""
    exit 1
fi

CAMERA_NAME="$1"
RTSP_URL="$2"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📹 Adding New Camera to CCTV System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Camera Name: $CAMERA_NAME"
echo "RTSP URL: $RTSP_URL"
echo ""

# Step 1: Test camera connection
echo "🔍 Step 1: Testing camera connection..."
timeout 5 ffmpeg -rtsp_transport tcp -i "$RTSP_URL" -f null - 2>&1 | grep -q "Stream" && echo "✅ Camera connection successful!" || {
    echo "❌ Camera connection failed!"
    echo "Please check:"
    echo "  - Camera IP address is correct"
    echo "  - Username and password are correct"
    echo "  - Camera is powered on and connected to network"
    echo "  - RTSP URL format matches your camera brand"
    exit 1
}

echo ""

# Step 2: Add camera to database
echo "📝 Step 2: Adding camera to database..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$CAMERA_NAME\", \"rtspUrl\": \"$RTSP_URL\"}")

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    CAMERA_ID=$(echo "$RESPONSE" | jq -r '.data.id')
    echo "✅ Camera added successfully!"
    echo "   Camera ID: $CAMERA_ID"
else
    echo "❌ Failed to add camera"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo ""

# Step 3: Start streaming
echo "🎬 Step 3: Starting video stream..."
sleep 1
STREAM_RESPONSE=$(curl -s -X POST http://localhost:3000/api/streams/start \
  -H "Content-Type: application/json" \
  -d "{\"cameraId\": \"$CAMERA_ID\", \"rtspUrl\": \"$RTSP_URL\"}")

if echo "$STREAM_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Stream started successfully!"
else
    echo "⚠️  Stream start may have issues"
    echo "$STREAM_RESPONSE" | jq .
fi

echo ""

# Step 4: Update camera status
echo "🔄 Step 4: Updating camera status..."
sqlite3 data/cctv.db "UPDATE cameras SET status = 'streaming' WHERE id = '$CAMERA_ID';" 2>/dev/null && echo "✅ Status updated to 'streaming'" || echo "⚠️  Could not update status"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Camera Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Camera Details:"
echo "   Name: $CAMERA_NAME"
echo "   ID: $CAMERA_ID"
echo "   Status: streaming"
echo ""
echo "🎥 View your camera:"
echo "   Dashboard: http://localhost:3000/dashboard"
echo "   Direct Stream: http://localhost:3000/api/hls/$CAMERA_ID/playlist.m3u8"
echo ""
echo "💡 Useful Commands:"
echo "   Stop stream: curl -X POST http://localhost:3000/api/streams/stop -H 'Content-Type: application/json' -d '{\"cameraId\": \"$CAMERA_ID\"}'"
echo "   Delete camera: sqlite3 data/cctv.db \"DELETE FROM cameras WHERE id = '$CAMERA_ID';\""
echo ""
