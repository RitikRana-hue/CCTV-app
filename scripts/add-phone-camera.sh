#!/bin/bash

# Quick script to add smartphone camera
# Usage: ./scripts/add-phone-camera.sh <phone_ip> <port>

PHONE_IP=${1:-"192.168.1.50"}
PORT=${2:-"8080"}

echo "Adding smartphone camera..."
echo "Phone IP: $PHONE_IP"
echo "Port: $PORT"
echo ""

# Try different common RTSP formats
echo "Testing RTSP URL formats..."

# Format 1: h264_pcm.sdp (IP Webcam Android)
RTSP_URL="rtsp://${PHONE_IP}:${PORT}/h264_pcm.sdp"
echo "Testing: $RTSP_URL"

# Add camera via API
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Smartphone Camera\", \"rtspUrl\": \"${RTSP_URL}\"}" | jq .

echo ""
echo "Camera added! Now start the stream:"
echo "Go to http://localhost:3000/dashboard and click the play button"
echo ""
echo "Or use this command to start streaming:"
echo "CAMERA_ID=\$(curl -s http://localhost:3000/api/cameras | jq -r '.data.cameras[0].id')"
echo "curl -X POST http://localhost:3000/api/streams/start -H 'Content-Type: application/json' -d '{\"cameraId\": \"'\$CAMERA_ID'\", \"rtspUrl\": \"${RTSP_URL}\"}'"
