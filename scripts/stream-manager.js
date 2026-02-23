#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const config = {
  ffmpegPath: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
  rtspBaseUrl: process.env.RTSP_BASE_URL || 'rtsp://localhost:554',
  outputDir: './public/streams',
  segmentTime: 4,
};

// Mock cameras configuration
const cameras = [
  {
    id: '1',
    name: 'Front Entrance',
    rtspUrl: `${config.rtspBaseUrl}/camera1/stream`,
    outputDir: path.join(config.outputDir, 'camera-1'),
  },
  {
    id: '2',
    name: 'Parking Lot',
    rtspUrl: `${config.rtspBaseUrl}/camera2/stream`,
    outputDir: path.join(config.outputDir, 'camera-2'),
  },
  {
    id: '3',
    name: 'Back Door',
    rtspUrl: `${config.rtspBaseUrl}/camera3/stream`,
    outputDir: path.join(config.outputDir, 'camera-3'),
  },
];

const activeProcesses = new Map();

function startStream(camera) {
  if (activeProcesses.has(camera.id)) {
    console.log(`Stream already active for camera ${camera.id}`);
    return;
  }

  console.log(`Starting stream for camera ${camera.id}: ${camera.name}`);

  // Ensure output directory exists
  if (!fs.existsSync(camera.outputDir)) {
    fs.mkdirSync(camera.outputDir, { recursive: true });
  }

  const playlistPath = path.join(camera.outputDir, 'playlist.m3u8');
  const segmentPattern = path.join(camera.outputDir, 'segment%03d.ts');

  const ffmpegArgs = [
    '-rtsp_transport', 'tcp',
    '-i', camera.rtspUrl,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-c:a', 'aac',
    '-f', 'hls',
    '-hls_time', config.segmentTime.toString(),
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', segmentPattern,
    playlistPath
  ];

  const ffmpegProcess = spawn(config.ffmpegPath, ffmpegArgs);

  activeProcesses.set(camera.id, ffmpegProcess);

  ffmpegProcess.on('error', (error) => {
    console.error(`FFmpeg process error for camera ${camera.id}:`, error.message);
    activeProcesses.delete(camera.id);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error(`FFmpeg stderr for camera ${camera.id}:`, output.trim());
    }
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg process closed for camera ${camera.id} with code ${code}`);
    activeProcesses.delete(camera.id);
  });

  console.log(`Stream started for camera ${camera.id}`);
}

function stopStream(camera) {
  const ffmpegProcess = activeProcesses.get(camera.id);
  
  if (!ffmpegProcess) {
    console.log(`No active stream found for camera ${camera.id}`);
    return;
  }

  console.log(`Stopping stream for camera ${camera.id}`);

  // Send SIGTERM to gracefully stop FFmpeg
  ffmpegProcess.kill('SIGTERM');
  
  // Force kill after 5 seconds if still running
  setTimeout(() => {
    if (ffmpegProcess && !ffmpegProcess.killed) {
      ffmpegProcess.kill('SIGKILL');
    }
  }, 5000);

  activeProcesses.delete(camera.id);
  console.log(`Stream stopped for camera ${camera.id}`);
}

function startAllStreams() {
  console.log('Starting all streams...');
  cameras.forEach(camera => {
    startStream(camera);
  });
}

function stopAllStreams() {
  console.log('Stopping all streams...');
  cameras.forEach(camera => {
    stopStream(camera);
  });
}

function showStatus() {
  console.log('Stream Status:');
  console.log('===============');
  cameras.forEach(camera => {
    const isActive = activeProcesses.has(camera.id);
    console.log(`${camera.name} (${camera.id}): ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
  });
  console.log(`Total active streams: ${activeProcesses.size}`);
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'start':
    const cameraId = process.argv[3];
    if (cameraId) {
      const camera = cameras.find(c => c.id === cameraId);
      if (camera) {
        startStream(camera);
      } else {
        console.error(`Camera with ID ${cameraId} not found`);
      }
    } else {
      startAllStreams();
    }
    break;

  case 'stop':
    const stopCameraId = process.argv[3];
    if (stopCameraId) {
      const camera = cameras.find(c => c.id === stopCameraId);
      if (camera) {
        stopStream(camera);
      } else {
        console.error(`Camera with ID ${stopCameraId} not found`);
      }
    } else {
      stopAllStreams();
    }
    break;

  case 'restart':
    const restartCameraId = process.argv[3];
    if (restartCameraId) {
      const camera = cameras.find(c => c.id === restartCameraId);
      if (camera) {
        stopStream(camera);
        setTimeout(() => {
          startStream(camera);
        }, 2000);
      } else {
        console.error(`Camera with ID ${restartCameraId} not found`);
      }
    } else {
      stopAllStreams();
      setTimeout(() => {
        startAllStreams();
      }, 2000);
    }
    break;

  case 'status':
    showStatus();
    break;

  default:
    console.log('Usage:');
    console.log('  node stream-manager.js start [cameraId]');
    console.log('  node stream-manager.js stop [cameraId]');
    console.log('  node stream-manager.js restart [cameraId]');
    console.log('  node stream-manager.js status');
    console.log('');
    console.log('Examples:');
    console.log('  node stream-manager.js start      # Start all streams');
    console.log('  node stream-manager.js start 1    # Start camera 1');
    console.log('  node stream-manager.js stop 1     # Stop camera 1');
    console.log('  node stream-manager.js status     # Show status');
    break;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, stopping all streams...');
  stopAllStreams();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, stopping all streams...');
  stopAllStreams();
  process.exit(0);
});
