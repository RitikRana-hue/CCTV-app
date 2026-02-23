# 🎬 Stream Service Architecture Guide

## 📋 Overview

The Stream Service is a professional, production-ready module for managing RTSP to HLS conversion in CCTV systems. It provides a clean separation between business logic and infrastructure components.

## 🏗️ Architecture

### **Component Structure**
```
┌─────────────────────────────────────────────────────────────┐
│                   API Layer                          │
│  ┌─────────────────────────────────────────────┐       │
│  │         Stream Service                    │       │
│  │  ┌─────────────┐  ┌─────────────────┐ │       │
│  │  │ Config      │  │   Logger       │ │       │
│  │  │ Management  │  │   System       │ │       │
│  │  └─────────────┘  └─────────────────┘ │       │
│  │                                             │       │
│  │  ┌─────────────────────────────────────────┐       │
│  │  │      FFmpeg Process Manager          │       │
│  │  │  ┌─────────┐  ┌─────────────────┐ │       │
│  │  │  │ Active  │  │   Event       │ │       │
│  │  │  │ Streams │  │   Emitter    │ │       │
│  │  │  └─────────┘  └─────────────────┘ │       │
│  │  └─────────────────────────────────────────┘       │
│  └─────────────────────────────────────────────────────┘
                        │
                        ▼
                ┌─────────────────┐
                │   FFmpeg       │
                │   Processes     │
                └─────────────────┘
                        │
                        ▼
                ┌─────────────────┐
                │  HLS Output    │
                │  /streams/     │
                └─────────────────┘
```

### **Key Design Principles**

1. **Single Responsibility**: Each module has one clear purpose
2. **Dependency Inversion**: Service depends on abstractions, not concretions
3. **Event-Driven**: Loose coupling through event emission
4. **Resource Management**: Proper cleanup and memory management
5. **Error Isolation**: Failures don't cascade to other components

## 🔧 Core Components

### **1. Configuration (`config/streamConfig.ts`)**

```typescript
export interface StreamConfig {
  cameraId: string;
  rtspUrl: string;
  outputDir: string;
  segmentTime: number;
  maxSegments: number;
  videoCodec: string;
  audioCodec: string;
  // ... additional settings
}

export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
  hlsSegmentTime: 4,
  hlsMaxSegments: 6,
  videoCodec: 'libx264',
  audioCodec: 'aac',
  maxConcurrentStreams: 16,
  // ... environment-based defaults
};
```

**Features:**
- Environment variable integration
- RTSP URL validation
- Configurable FFmpeg parameters
- Type-safe configuration

### **2. Logger (`utils/logger.ts`)**

```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  debug(message: string, context?: any, cameraId?: string): void
  info(message: string, context?: any, cameraId?: string): void
  warn(message: string, context?: any, cameraId?: string): void
  error(message: string, context?: any, cameraId?: string): void
}
```

**Features:**
- Singleton pattern for global consistency
- Log level filtering
- Structured logging with context
- Process shutdown handling
- Memory-efficient log rotation

### **3. Stream Service (`services/streamService.ts`)**

```typescript
class StreamService extends EventEmitter {
  async startStream(cameraId: string, rtspUrl: string): Promise<void>
  async stopStream(cameraId: string): Promise<void>
  async restartStream(cameraId: string): Promise<void>
  getStreamStatus(cameraId: string): StreamStatus | null
  getAllStreamStatuses(): StreamStatus[]
  async shutdown(): Promise<void>
}
```

**Features:**
- Process lifecycle management
- Concurrent stream limiting
- Automatic segment cleanup
- Event-driven status updates
- Graceful shutdown handling

## 🚀 Usage Examples

### **Basic Stream Management**

```typescript
import { streamService } from '@/services/streamService';

// Start a stream
await streamService.startStream('camera-1', 'rtsp://192.168.1.100:554/stream', {
  videoBitrate: '2000k',
  resolution: '1920x1080'
});

// Check status
const status = streamService.getStreamStatus('camera-1');
console.log('Camera running:', status?.isRunning);

// Stop stream
await streamService.stopStream('camera-1');
```

### **Event-Driven Monitoring**

```typescript
streamService.on('streamStarted', ({ cameraId, config }) => {
  console.log(`Stream started for ${cameraId}`);
});

streamService.on('streamEnded', ({ cameraId, error, uptime }) => {
  if (error) {
    console.error(`Stream failed for ${cameraId}:`, error);
  } else {
    console.log(`Stream ended for ${cameraId}, uptime: ${uptime}ms`);
  }
});

streamService.on('frameUpdate', ({ cameraId, frames }) => {
  // Update UI with frame count
});

streamService.on('bitrateUpdate', ({ cameraId, bitrate }) => {
  // Update bandwidth monitoring
});
```

### **API Integration**

```typescript
// API Route: /api/streams/service
export async function POST(request: NextRequest) {
  const { cameraId, rtspUrl, action } = await request.json();
  
  switch (action) {
    case 'start':
      await streamService.startStream(cameraId, rtspUrl);
      break;
    case 'stop':
      await streamService.stopStream(cameraId);
      break;
  }
  
  return NextResponse.json({ success: true });
}
```

## 🔒 Safety & Reliability

### **Process Management**

```typescript
// Prevent duplicate streams
if (this.activeStreams.has(cameraId)) {
  throw new Error(`Stream already running for camera ${cameraId}`);
}

// Graceful shutdown with timeout
streamProcess.process.kill('SIGTERM');
setTimeout(() => {
  if (!streamProcess.process.killed) {
    streamProcess.process.kill('SIGKILL');
  }
}, 5000);
```

### **Memory Leak Prevention**

```typescript
// Event listener cleanup
ffmpegProcess.on('close', () => {
  clearTimeout(timeout);  // Clear timeout
  this.activeStreams.delete(cameraId);  // Remove reference
});

// Automatic segment cleanup
setInterval(() => {
  this.cleanupOldSegments();  // Delete old files
}, this.settings.streamCleanupInterval);
```

### **Error Handling**

```typescript
ffmpegProcess.on('error', (error) => {
  logger.error('FFmpeg process error', { 
    error: error.message, 
    cameraId: config.cameraId 
  });
  this.handleStreamEnd(config.cameraId, error.message);
});
```

## ⚙️ FFmpeg Configuration

### **Low-Latency Settings**

```bash
ffmpeg -rtsp_transport tcp \
       -i rtsp://camera/stream \
       -c:v libx264 \
       -preset ultrafast \
       -tune zerolatency \
       -g 50 \
       -keyint_min 50 \
       -b:v 1000k \
       -bufsize 2000k \
       -maxrate 1200k \
       -f hls \
       -hls_time 4 \
       -hls_list_size 6 \
       -hls_flags delete_segments+round_durations \
       -hls_segment_filename segment%03d.ts \
       playlist.m3u8
```

### **Key Parameters**

- `-preset ultrafast`: Fastest encoding for low latency
- `-tune zerolatency`: Optimized for real-time streaming
- `-g 50`: GOP size for balance between quality and latency
- `-hls_time 4`: 4-second segments for smooth playback
- `-hls_flags delete_segments`: Auto-cleanup old segments

## 📊 Performance Considerations

### **Resource Management**

```typescript
// Concurrent stream limits
if (this.activeStreams.size >= this.settings.maxConcurrentStreams) {
  throw new Error('Maximum concurrent streams reached');
}

// Memory-efficient logging
if (this.logs.length > this.maxLogs) {
  this.logs = this.logs.slice(-this.maxLogs);
}
```

### **Optimization Strategies**

1. **Segment Management**: Keep only recent segments
2. **Process Pooling**: Reuse FFmpeg processes when possible
3. **Buffer Management**: Optimize FFmpeg buffer sizes
4. **Network Optimization**: TCP transport for reliability

## 🔄 Future-Proofing

### **Microservice Ready**

```typescript
// Service can be extracted to separate process
export class StreamService {
  // No Next.js dependencies
  // Pure Node.js APIs
  // Event-driven architecture
}

// Can be deployed as standalone service
const streamService = new StreamService();
await streamService.start();
```

### **Cloud Deployment**

```typescript
// Environment-based configuration
const settings = {
  hlsSegmentTime: parseInt(process.env.HLS_SEGMENT_TIME),
  maxConcurrentStreams: parseInt(process.env.MAX_CONCURRENT_STREAMS),
  // ... other cloud-specific settings
};

// Storage abstraction
interface StorageAdapter {
  writeSegment(cameraId: string, segment: Buffer): Promise<void>;
  deleteSegment(cameraId: string, segmentName: string): Promise<void>;
}
```

## 🧪 Testing

### **Unit Testing**

```typescript
describe('StreamService', () => {
  it('should start stream successfully', async () => {
    const mockSpawn = jest.fn();
    // Test stream start logic
  });
  
  it('should handle FFmpeg errors', async () => {
    // Test error handling
  });
});
```

### **Integration Testing**

```typescript
// Test with mock RTSP server
const mockRtspServer = new MockRtspServer();
await streamService.startStream('test', mockRtspServer.getUrl());

// Verify HLS output
const playlistExists = await fs.access('playlist.m3u8');
expect(playlistExists).toBeTruthy();
```

## 📈 Monitoring & Debugging

### **Health Checks**

```typescript
const healthCheck = {
  activeStreams: streamService.getActiveStreamCount(),
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
  settings: streamService.getSettings()
};
```

### **Debug Logging**

```typescript
// Enable debug mode
process.env.LOG_LEVEL = 'debug';

// FFmpeg output parsing
private parseFFmpegOutput(cameraId: string, output: string) {
  if (output.includes('error')) {
    logger.error('FFmpeg error', { output, cameraId });
  }
}
```

---

## 🎯 Summary

The Stream Service provides:

✅ **Production-Ready**: Robust error handling and resource management  
✅ **Scalable**: Supports multiple concurrent streams  
✅ **Maintainable**: Clean architecture with separation of concerns  
✅ **Testable**: Pure functions with clear interfaces  
✅ **Future-Proof**: Ready for microservice extraction  
✅ **Performant**: Optimized for low-latency streaming  
✅ **Reliable**: Comprehensive error recovery  

This architecture ensures your CCTV system can handle professional surveillance workloads while maintaining code quality and operational reliability.
