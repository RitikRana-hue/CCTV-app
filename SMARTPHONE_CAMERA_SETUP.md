# 📱 Smartphone Camera Setup Guide

## Quick Setup Instructions

### For Android - IP Webcam (Recommended)

1. **Install the app:**
   - Download "IP Webcam" from Google Play Store
   - Open the app

2. **Configure settings:**
   - Scroll down to "Video preferences"
   - Set resolution (720p or 1080p recommended)
   - Set quality to 80-100%
   - Enable "Use HTTPS" if needed

3. **Start the server:**
   - Scroll to bottom and tap "Start server"
   - Note the IP address shown (e.g., http://192.168.1.50:8080)

4. **Get RTSP URL:**
   ```
   rtsp://192.168.1.50:8080/h264_pcm.sdp
   ```
   Or try:
   ```
   http://192.168.1.50:8080/video
   ```

### For iOS - IP Camera Lite

1. **Install the app:**
   - Download "IP Camera Lite" from App Store
   - Open the app

2. **Start streaming:**
   - Tap the power button to start
   - Note the URL shown (e.g., http://192.168.1.51:8080)

3. **Get RTSP URL:**
   ```
   rtsp://192.168.1.51:8080/live.sdp
   ```
   Or HTTP:
   ```
   http://192.168.1.51:8080/live
   ```

## Important Notes

- **Same Network:** Your phone and computer must be on the same WiFi network
- **Firewall:** Make sure your firewall allows the connection
- **Keep Screen On:** Most apps have a "keep screen on" option
- **Battery:** Keep your phone plugged in for extended use

## Testing Your Connection

Use this command to test (replace with your phone's IP):
```bash
./scripts/test-camera.sh rtsp://192.168.1.50:8080/h264_pcm.sdp
```

Or test with curl:
```bash
curl http://192.168.1.50:8080
```
