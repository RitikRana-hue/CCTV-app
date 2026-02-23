# ⚡ Ultra-Low Latency Setup Complete!

## 🚀 What Was Optimized

### 1. FFmpeg Streaming Settings
- **Segment Duration**: Reduced from 4s to 1s (4x faster updates)
- **Buffer Flags**: Added `nobuffer` and `low_delay` flags
- **GOP Size**: Reduced from 50 to 15 frames (faster seeking)
- **Bitrate**: Optimized to 800k for faster encoding
- **HLS Playlist**: Keeps only 3 segments (minimal buffering)
- **Encoding Preset**: `ultrafast` with `zerolatency` tune

### 2. HLS Player Settings
- **Max Buffer**: Reduced to 2 seconds (was 30s)
- **Live Sync**: Stay only 1 segment behind live edge
- **Max Latency**: Maximum 2 segments behind
- **Back Buffer**: Disabled for live streams
- **Fragment Loading**: Aggressive timeouts (2s)

### 3. Expected Latency
- **Before**: 10-15 seconds delay
- **After**: 2-4 seconds delay ⚡
- **Best Case**: 1-2 seconds with good network

## 📊 Latency Breakdown

```
Camera → RTSP → FFmpeg → HLS Segments → Browser
  ~0.1s    ~0.5s    ~1s        ~0.5-1s      ~0.5s
                                                    
Total: ~2-3 seconds end-to-end latency
```

## 🎯 Add Camera UI Feature

### New "Add Camera" Button
- Located in dashboard header (top right)
- Beautiful modal interface
- Two camera types supported:
  1. **Smartphone** (IP Webcam app)
  2. **IP Camera** (RTSP cameras)

### How to Use:
1. Click "Add Camera" button on dashboard
2. Enter camera details:
   - Camera name
   - IP address
   - Port (8080 for phones, 554 for IP cams)
   - Username/password (for IP cameras only)
3. Click "Add Camera"
4. Camera automatically starts streaming!

### Features:
- ✅ Real-time RTSP URL preview
- ✅ Automatic stream start
- ✅ Error handling with clear messages
- ✅ Loading states
- ✅ Responsive design
- ✅ Dark theme matching dashboard

## 🔧 Technical Details

### FFmpeg Command (Ultra-Low Latency):
```bash
ffmpeg \
  -rtsp_transport tcp \
  -fflags nobuffer \
  -flags low_delay \
  -i rtsp://camera-url \
  -c:v libx264 \
  -preset ultrafast \
  -tune zerolatency \
  -profile:v baseline \
  -g 15 \
  -b:v 800k \
  -c:a aac \
  -b:a 64k \
  -f hls \
  -hls_time 1 \
  -hls_list_size 3 \
  -hls_flags delete_segments+omit_endlist \
  output.m3u8
```

### HLS.js Configuration:
```javascript
{
  lowLatencyMode: true,
  maxBufferLength: 2,
  liveSyncDurationCount: 1,
  liveMaxLatencyDurationCount: 2,
  fragLoadingTimeOut: 2000
}
```

## 📱 Testing the Setup

### 1. Check Current Latency:
- Look at your phone's camera
- Wave your hand
- Count seconds until you see it on screen
- Should be 2-4 seconds!

### 2. Monitor Stream Health:
```bash
# Check FFmpeg process
ps aux | grep ffmpeg

# Check segment creation
watch -n 1 'ls -lht public/streams/cam-*/  | head -5'

# Check playlist
cat public/streams/cam-*/playlist.m3u8
```

### 3. Restart Stream (if needed):
```bash
./scripts/restart-stream.sh CAMERA_ID
```

## 🎮 Controls

### Dashboard:
- **Add Camera**: Top right button
- **View Cameras**: Grid layout
- **Refresh**: Browser refresh to reload

### API:
```bash
# Add camera
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{"name": "My Camera", "rtspUrl": "rtsp://url"}'

# Start stream
curl -X POST http://localhost:3000/api/streams/start \
  -H "Content-Type: application/json" \
  -d '{"cameraId": "cam-xxx", "rtspUrl": "rtsp://url"}'
```

## ⚠️ Trade-offs

### Lower Latency = Higher CPU Usage
- More frequent encoding
- Smaller segments = more overhead
- More network requests

### Recommendations:
- **Good Network**: Use 1s segments (current)
- **Slow Network**: Increase to 2s segments
- **Many Cameras**: Increase to 2-3s segments

### Adjust Segment Time:
Edit `src/services/streamService.ts`:
```typescript
'-hls_time', '2',  // Change from 1 to 2 seconds
```

## 🔥 Performance Tips

1. **Keep Phone Plugged In**: Streaming drains battery
2. **Use WiFi 5GHz**: Faster than 2.4GHz
3. **Close Other Apps**: Free up phone resources
4. **Good Lighting**: Reduces encoding complexity
5. **Stable Position**: Less motion = better compression

## 📈 Monitoring

### Check Latency:
```bash
# View current segments
ls -lht public/streams/cam-*/

# Check segment size (smaller = faster)
du -sh public/streams/cam-*/*.ts
```

### Optimal Segment Size:
- **200-500KB**: Excellent (fast encoding)
- **500KB-1MB**: Good
- **>1MB**: May cause delays

## 🆘 Troubleshooting

### Still High Latency?
1. Check network speed
2. Reduce video resolution in IP Webcam app
3. Increase segment time to 2s
4. Check CPU usage: `top`

### Choppy Video?
1. Increase buffer: `maxBufferLength: 3`
2. Increase segment time: `hls_time 2`
3. Check network stability

### Stream Keeps Stopping?
1. Keep IP Webcam app in foreground
2. Disable battery optimization for IP Webcam
3. Check WiFi signal strength

## 🎉 You're All Set!

Your CCTV system now has:
- ⚡ Ultra-low latency (2-4 seconds)
- 🎨 Beautiful "Add Camera" UI
- 📱 Easy smartphone camera support
- 🚀 Professional-grade streaming

**Access your dashboard:**
```
http://localhost:3000/dashboard
```

Click "Add Camera" to add more cameras instantly!
