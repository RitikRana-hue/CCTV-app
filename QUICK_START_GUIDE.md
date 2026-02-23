# 🚀 Quick Start Guide - Adding Cameras

## ⚡ Super Quick Method (One Command)

```bash
./scripts/add-camera.sh "Camera Name" "rtsp://username:password@ip:554/path"
```

**Example:**
```bash
./scripts/add-camera.sh "Front Door" "rtsp://admin:pass123@192.168.1.100:554/stream1"
```

This script will:
- ✅ Test the camera connection
- ✅ Add camera to database
- ✅ Start the video stream
- ✅ Update camera status
- ✅ Give you the direct stream URL

---

## 📱 For Smartphone Cameras

### Android (IP Webcam App):
1. Install "IP Webcam" from Play Store
2. Start server in the app
3. Note the IP address (e.g., 10.191.203.95:8080)
4. Run:
```bash
./scripts/add-phone-camera.sh 10.191.203.95 8080
```

### iOS (IP Camera Lite):
1. Install "IP Camera Lite" from App Store
2. Start streaming
3. Note the IP address
4. Run:
```bash
./scripts/add-camera.sh "iPhone Camera" "rtsp://YOUR_IP:8080/live.sdp"
```

---

## 🎥 Manual Method (Step by Step)

### 1. Add Camera
```bash
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{"name": "My Camera", "rtspUrl": "rtsp://url"}'
```

### 2. Start Stream (use camera ID from step 1)
```bash
curl -X POST http://localhost:3000/api/streams/start \
  -H "Content-Type: application/json" \
  -d '{"cameraId": "cam-xxx", "rtspUrl": "rtsp://url"}'
```

### 3. Update Status
```bash
sqlite3 data/cctv.db "UPDATE cameras SET status = 'streaming' WHERE id = 'cam-xxx';"
```

---

## 🔍 Common RTSP URLs

| Brand | RTSP URL Format |
|-------|----------------|
| **Hikvision** | `rtsp://admin:pass@IP:554/Streaming/Channels/101` |
| **Dahua** | `rtsp://admin:pass@IP:554/cam/realmonitor?channel=1&subtype=0` |
| **TP-Link** | `rtsp://admin:pass@IP:554/stream1` |
| **Reolink** | `rtsp://admin:pass@IP:554/h264Preview_01_main` |
| **Foscam** | `rtsp://admin:pass@IP:554/videoMain` |
| **Generic** | `rtsp://admin:pass@IP:554/stream1` |

---

## 📋 Useful Commands

### View all cameras:
```bash
curl http://localhost:3000/api/cameras | jq .
```

### Test camera before adding:
```bash
./scripts/test-camera.sh "rtsp://url"
```

### Check if stream is working:
```bash
ls -lh public/streams/CAMERA_ID/
```

### View dashboard:
```
http://localhost:3000/dashboard
```

---

## 🆘 Troubleshooting

**Camera not connecting?**
- Verify IP address and credentials
- Check camera is on same network
- Test with VLC player first

**Stream not showing?**
- Wait 5-10 seconds for HLS segments to generate
- Refresh the dashboard
- Check: `ls public/streams/CAMERA_ID/`

**Need help?**
- Read: `HOW_TO_ADD_CAMERA.md`
- Check server logs in terminal
