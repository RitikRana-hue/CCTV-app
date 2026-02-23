# Wireless CCTV Platform

A professional, scalable CCTV streaming platform built with Next.js, featuring RTSP to HLS conversion using FFmpeg.

## Features

- **Real-time Streaming**: RTSP to HLS conversion with low latency
- **Multi-camera Support**: Manage multiple cameras simultaneously
- **Professional Dashboard**: Dark-themed, responsive interface
- **Stream Management**: Start, stop, and monitor streams
- **Modern Architecture**: Clean separation of concerns
- **Scalable Design**: Ready for cloud deployment
- **TypeScript**: Full type safety
- **Responsive Design**: Works on all devices

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RTSP Camera   │───▶│     FFmpeg      │───▶│   HLS Streams   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│   Next.js      │◀───│   API Routes    │◀─────────────┘
│   Frontend     │    │   (Backend)     │
└─────────────────┘    └─────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Streaming**: FFmpeg, HLS.js
- **Backend**: Next.js API Routes
- **Architecture**: Clean Architecture, SOLID Principles

## Quick Start

### Prerequisites

- Node.js 18+ 
- FFmpeg installed and accessible
- RTSP camera(s) for testing

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wireless-cctv
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Start streaming (optional, for testing):
```bash
npm run stream:start
```

## Configuration

### Environment Variables

Key environment variables in `.env.local`:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Streaming
RTSP_BASE_URL=rtsp://localhost:554
FFMPEG_PATH=/usr/local/bin/ffmpeg
HLS_SEGMENT_TIME=4

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### FFmpeg Installation

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

## Usage

### Adding Cameras

1. Navigate to the dashboard
2. Click "Add Camera"
3. Fill in camera details:
   - Name
   - RTSP URL
   - Location
   - Resolution
   - FPS

### Managing Streams

- **Start Stream**: Click play button on camera card
- **Stop Stream**: Click pause button
- **View Stream**: Click on camera to open full view

### API Endpoints

#### Cameras
- `GET /api/cameras` - List all cameras
- `POST /api/cameras` - Add new camera
- `PUT /api/cameras/:id` - Update camera
- `DELETE /api/cameras/:id` - Remove camera

#### Streams
- `GET /api/streams` - List active streams
- `POST /api/streams` - Control stream (start/stop/restart)
- `GET /api/streams/:cameraId` - Get stream status

## Project Structure

```
wireless-cctv/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/       # Main dashboard
│   │   └── globals.css     # Global styles
│   ├── components/          # React components
│   │   ├── camera/         # Camera components
│   │   ├── layout/         # Layout components
│   │   └── stream/        # Stream components
│   ├── lib/                # Core business logic
│   │   ├── config/         # Configuration
│   │   ├── logger/         # Logging system
│   │   └── streaming/      # Stream management
│   └── types/              # TypeScript definitions
├── public/
│   └── streams/            # HLS output directory
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type checking
- `npm run stream:start` - Start all streams
- `npm run stream:stop` - Stop all streams

### Stream Management Script

The `scripts/stream-manager.js` provides CLI access to stream management:

```bash
# Start all streams
node scripts/stream-manager.js start

# Start specific camera
node scripts/stream-manager.js start 1

# Stop all streams
node scripts/stream-manager.js stop

# Check status
node scripts/stream-manager.js status
```

## Production Deployment

### Docker Deployment

1. Build the image:
```bash
docker build -t wireless-cctv .
```

2. Run with docker-compose:
```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Set up reverse proxy (nginx) for SSL and load balancing

## Security Considerations

- RTSP URLs should be secured (not exposed publicly)
- Use HTTPS in production
- Implement authentication (JWT ready)
- Secure FFmpeg processes
- Network isolation for cameras

## Monitoring

### Logs

Application logs are written to:
- Console (development)
- File path specified in `LOG_FILE_PATH` (production)

### Health Checks

- `GET /api/health` - Application health
- Stream status via `/api/streams`

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in PATH
   - Check `FFMPEG_PATH` environment variable

2. **RTSP connection failed**
   - Verify camera RTSP URL
   - Check network connectivity
   - Ensure camera credentials are correct

3. **HLS stream not loading**
   - Check FFmpeg process is running
   - Verify output directory permissions
   - Check browser console for errors

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Check documentation in `/docs`
- Review troubleshooting section
# CCTV-app
