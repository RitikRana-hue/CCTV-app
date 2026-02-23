# Troubleshooting Guide

## Stream Shows "Connecting..." But RTSP URL Works

### Problem
The dashboard shows "Connecting..." for a camera, but the RTSP URL works fine when tested directly (e.g., with VLC or ffplay).

### Root Causes

1. **Orphaned FFmpeg Process**: An FFmpeg process is running but not tracked by the streamService
2. **Camera Status Out of Sync**: Database shows camera as "offline" but stream is actually running
3. **Missing Segments**: Playlist references segments that have been deleted

### Quick Fix

Run the sync script to restart all streams properly:

```bash
./scripts/sync-stream-status.sh
```

Choose option 1 to kill orphaned processes and restart through the API.

### Manual Fix

1. **Check for orphaned FFmpeg processes:**
   ```bash
   ps aux | grep ffmpeg | grep rtsp://
   ```

2. **Kill orphaned processes:**
   ```bash
   kill <PID>
   ```

3. **Restart stream through API:**
   ```bash
   curl -X POST http://localhost:3000/api/streams/start \
     -H "Content-Type: application/json" \
     -d '{"cameraId":"<CAMERA_ID>","rtspUrl":"<RTSP_URL>"}'
   ```

4. **Verify stream is running:**
   ```bash
   curl http://localhost:3000/api/streams/status
   ```

### Prevention

The following improvements have been made to prevent this issue:

1. **Auto-sync camera status**: When streams start/stop, camera status is automatically updated in the database
2. **Faster status polling**: Dashboard now checks stream status every 5 seconds (was 30 seconds)
3. **Immediate status check**: Dashboard fetches stream status immediately on load

### Checking Stream Health

1. **View active streams:**
   ```bash
   curl http://localhost:3000/api/streams/status | jq
   ```

2. **Check playlist exists:**
   ```bash
   ls -la public/streams/<CAMERA_ID>/playlist.m3u8
   ```

3. **View recent segments:**
   ```bash
   ls -lt public/streams/<CAMERA_ID>/*.ts | head -5
   ```

4. **Check FFmpeg logs:**
   ```bash
   tail -f logs/stream-<CAMERA_ID>.log
   ```

### Common Issues

#### Playlist references missing segments
- **Cause**: Segments are being cleaned up too aggressively
- **Solution**: The stream will self-correct within 1-3 seconds as new segments are generated

#### Stream stops unexpectedly
- **Cause**: Network issues, camera offline, or FFmpeg crash
- **Solution**: Check FFmpeg logs and restart the stream

#### Multiple FFmpeg processes for same camera
- **Cause**: Stream was started multiple times without stopping
- **Solution**: Kill all processes and restart once through the API

### Testing RTSP Connection

Test your RTSP URL directly:

```bash
# Using ffplay (if installed)
ffplay -rtsp_transport tcp rtsp://10.191.203.95:8080/h264_pcm.sdp

# Using ffmpeg
ffmpeg -rtsp_transport tcp -i rtsp://10.191.203.95:8080/h264_pcm.sdp -f null -

# Using VLC (GUI)
vlc rtsp://10.191.203.95:8080/h264_pcm.sdp
```

### Getting Help

If issues persist:

1. Check the logs in `logs/` directory
2. Verify the RTSP URL is accessible from the server
3. Ensure FFmpeg is installed and in PATH
4. Check network connectivity to the camera
5. Verify camera is streaming (check camera app/settings)
