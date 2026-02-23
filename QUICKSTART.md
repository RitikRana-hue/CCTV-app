# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+
- FFmpeg (for real streaming)

## 1. Development Setup

```bash
# Clone and navigate to project
cd wireless-cctv

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Set up test data
node scripts/test-setup.js

# Start development server
npm run dev
```

## 2. Access the Application

- **Main App**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Browser Preview**: Available in your IDE

## 3. Test Features

### Camera Management
1. Navigate to dashboard
2. View mock cameras (Front Entrance, Parking Lot, Back Door)
3. Check status indicators (online/offline/connecting)
4. Test camera selection and grid view

### Stream Testing
1. Click on any camera card
2. View stream player interface
3. Test playback controls (play/pause, volume, fullscreen)
4. Check stream status indicators

### API Testing
```bash
# Get all cameras
curl http://localhost:3000/api/cameras

# Get stream status
curl http://localhost:3000/api/streams

# Start a stream (requires FFmpeg)
curl -X POST http://localhost:3000/api/streams \
  -H "Content-Type: application/json" \
  -d '{"cameraId":"1","action":"start","config":{"segmentTime":4}}'
```

## 4. Real Streaming Setup

### Install FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### Configure Cameras
1. Edit `.env.local`:
```env
RTSP_BASE_URL=rtsp://your-camera-ip:554
FFMPEG_PATH=/usr/local/bin/ffmpeg  # Adjust for your system
```

2. Start streaming:
```bash
npm run stream:start
```

3. Check status:
```bash
node scripts/stream-manager.js status
```

## 5. Production Deployment

### Docker (Recommended)
```bash
# Build and run
docker-compose up -d

# With nginx reverse proxy
docker-compose --profile with-nginx up -d
```

### Manual
```bash
# Build
npm run build

# Start production
npm start
```

## 6. Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RTSP Camera   │───▶│     FFmpeg      │───▶│   HLS Streams   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│   Next.js      │◀───│   API Routes    │◀─────────────┘
│   Dashboard    │    │   Stream Mgmt   │
└─────────────────┘    └─────────────────┘
```

## 7. Key Features

✅ **Professional Dashboard** - Dark theme, responsive design  
✅ **Multi-Camera Support** - Grid layout, status indicators  
✅ **Stream Management** - Start/stop/restart controls  
✅ **Real-time Updates** - Live status, metrics  
✅ **API Layer** - RESTful endpoints, error handling  
✅ **TypeScript** - Full type safety  
✅ **Scalable Architecture** - Clean separation, ready for cloud  

## 8. Troubleshooting

### Common Issues

**FFmpeg not found:**
```bash
# Check installation
ffmpeg -version

# Update FFMPEG_PATH in .env.local
which ffmpeg
```

**Stream not loading:**
- Check FFmpeg process: `node scripts/stream-manager.js status`
- Verify RTSP URL format
- Check browser console for errors

**Build errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
```env
LOG_LEVEL=debug
```

## 9. Next Steps

1. **Add Real Cameras**: Configure RTSP URLs in camera management
2. **Set Up Authentication**: Implement JWT-based auth (structure ready)
3. **Add Recording**: Implement segment storage and playback
4. **Cloud Deployment**: Deploy to AWS/Azure/GCP
5. **Monitoring**: Add metrics, alerts, and health checks

## 10. Support

- 📖 **Documentation**: Check `README.md` for detailed info
- 🐛 **Issues**: Report bugs in project repository
- 📧 **Help**: Check troubleshooting section first

---

🎉 **Your CCTV Platform is ready!** 

Access it now at: http://localhost:3000
