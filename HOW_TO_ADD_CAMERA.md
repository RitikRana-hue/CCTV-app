# 📹 How to Add a New Camera

## Method 1: Using API (Recommended)

### Step 1: Add the Camera
```bash
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Camera Name",
    "rtspUrl": "rtsp://username:password@camera-ip:554/stream-path"
  }'
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Front Door Camera",
    "rtspUrl": "rtsp://admin:password123@192.168.1.100:554/stream1"
  }'
```

### Step 2: Get the Camera ID
The response will include a camera ID like `cam-1771850380195`. Save this!

### Step 3: Start the Stream
```bash
curl -X POST http://localhost:3000/api/streams/start \
  -H "Content-Type: application/json" \
  -d '{
    "cameraId": "YOUR_CAMERA_ID",
    "rtspUrl": "rtsp://username:password@camera-ip:554/stream-path"
  }'
```

### Step 4: Update Camera Status (if needed)
```bash
sqlite3 data/cctv.db "UPDATE cameras SET status = 'streaming' WHERE id = 'YOUR_CAMERA_ID';"
```

---

## Method 2: Bulk Import from File (Multiple Cameras) 📁

Perfect for adding many cameras at once!

### JSON File:
1. Edit `cameras.json` with your camera details
2. Run:
```bash
./scripts/import-cameras-json.sh cameras.json
```

### CSV File:
1. Edit `cameras.csv` with your camera details
2. Run:
```bash
./scripts/import-cameras-csv.sh cameras.csv
```

**See `BULK_IMPORT_GUIDE.md` for detailed instructions!**

---

## Method 3: Using Helper Script (Single Camera)

We've created a script that does everything automatically!

```bash
./scripts/add-camera.sh "Camera Name" "rtsp://url"
```

**Example:**
```bash
./scripts/add-camera.sh "Backyard Camera" "rtsp://admin:pass@192.168.1.101:554/stream1"
```

---

## Method 4: For Smartphone Cameras

### Android (IP Webcam):
```bash
./scripts/add-phone-camera.sh PHONE_IP PORT
```

**Example:**
```bash
./scripts/add-phone-camera.sh 10.191.203.95 8080
```

### iOS (IP Camera Lite):
```bash
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone Camera",
    "rtspUrl": "rtsp://PHONE_IP:8080/live.sdp"
  }'
```

---

## Method 5: Manual API Calls

See "Method 1" at the top of this document.

---

## Common RTSP URL Formats by Brand

### Hikvision
```
rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101
```

### Dahua
```
rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
```

### TP-Link/Tapo
```
rtsp://admin:password@192.168.1.100:554/stream1
```

### Reolink
```
rtsp://admin:password@192.168.1.100:554/h264Preview_01_main
```

### Foscam
```
rtsp://admin:password@192.168.1.100:554/videoMain
```

### Generic/ONVIF
```
rtsp://admin:password@192.168.1.100:554/stream1
```

---

## Testing Your Camera Connection

Before adding, test if the RTSP URL works:

```bash
./scripts/test-camera.sh "rtsp://admin:password@192.168.1.100:554/stream1"
```

Or manually with FFmpeg:
```bash
ffmpeg -rtsp_transport tcp -i "rtsp://YOUR_URL" -t 5 -f null -
```

---

## Quick Reference Commands

### List all cameras:
```bash
curl http://localhost:3000/api/cameras | jq .
```

### Delete a camera:
```bash
sqlite3 data/cctv.db "DELETE FROM cameras WHERE id = 'CAMERA_ID';"
```

### Stop a stream:
```bash
curl -X POST http://localhost:3000/api/streams/stop \
  -H "Content-Type: application/json" \
  -d '{"cameraId": "CAMERA_ID"}'
```

### Check stream status:
```bash
curl http://localhost:3000/api/streams/status | jq .
```

---

## Troubleshooting

### Camera not connecting?
1. Check if camera is on the same network
2. Verify RTSP URL format for your camera brand
3. Test with: `./scripts/test-camera.sh "rtsp://url"`
4. Check username/password are correct
5. Ensure RTSP port (usually 554) is accessible

### Stream not showing on dashboard?
1. Make sure camera status is 'streaming'
2. Check if HLS files are being created: `ls public/streams/CAMERA_ID/`
3. Verify FFmpeg is running: `ps aux | grep ffmpeg`
4. Check server logs for errors

### Video quality issues?
You can customize encoding settings when starting the stream (advanced).

---

## Need Help?

- Check logs: `tail -f logs/app.log`
- View server output in the terminal
- Test RTSP URL with VLC player first
