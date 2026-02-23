#!/bin/bash

# Camera Connection Test Script
# Usage: ./scripts/test-camera.sh <rtsp_url>

if [ -z "$1" ]; then
    echo "Usage: ./scripts/test-camera.sh <rtsp_url>"
    echo "Example: ./scripts/test-camera.sh rtsp://admin:password@192.168.1.100:554/stream1"
    exit 1
fi

RTSP_URL="$1"

echo "Testing camera connection..."
echo "RTSP URL: $RTSP_URL"
echo ""

# Test with FFmpeg
echo "Testing with FFmpeg (will run for 5 seconds)..."
timeout 5 ffmpeg -rtsp_transport tcp -i "$RTSP_URL" -f null - 2>&1 | grep -E "Stream|Video|Audio|error|Error"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Camera connection successful!"
    echo "You can use this RTSP URL with the platform."
else
    echo ""
    echo "❌ Camera connection failed!"
    echo "Please check:"
    echo "  - Camera IP address is correct"
    echo "  - Username and password are correct"
    echo "  - Camera is powered on and connected to network"
    echo "  - RTSP port (usually 554) is accessible"
    echo "  - RTSP URL format matches your camera brand"
fi
