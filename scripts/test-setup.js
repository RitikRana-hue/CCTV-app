#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up CCTV Platform Test Environment...\n');

// Create test stream directories
const streamsDir = path.join(__dirname, '../public/streams');
const cameras = ['camera-1', 'camera-2', 'camera-3'];

console.log('📁 Creating stream directories...');
cameras.forEach(cameraId => {
  const cameraDir = path.join(streamsDir, cameraId);
  if (!fs.existsSync(cameraDir)) {
    fs.mkdirSync(cameraDir, { recursive: true });
    console.log(`  ✓ Created: ${cameraDir}`);
  } else {
    console.log(`  ✓ Exists: ${cameraDir}`);
  }
});

// Create mock HLS playlist for testing
console.log('\n📺 Creating mock HLS playlists...');
cameras.forEach(cameraId => {
  const cameraDir = path.join(streamsDir, cameraId);
  const playlistPath = path.join(cameraDir, 'playlist.m3u8');
  
  if (!fs.existsSync(playlistPath)) {
    const mockPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:LIVE
#EXTINF:4.0,
segment000.ts
#EXTINF:4.0,
segment001.ts
#EXTINF:4.0,
segment002.ts
#EXTINF:4.0,
segment003.ts
#EXTINF:4.0,
segment004.ts
#EXTINF:4.0,
segment005.ts
#EXT-X-ENDLIST`;
    
    fs.writeFileSync(playlistPath, mockPlaylist);
    console.log(`  ✓ Created: ${playlistPath}`);
  } else {
    console.log(`  ✓ Exists: ${playlistPath}`);
  }
});

// Create mock segment files
console.log('\n🎬 Creating mock segment files...');
cameras.forEach(cameraId => {
  const cameraDir = path.join(streamsDir, cameraId);
  
  for (let i = 0; i < 6; i++) {
    const segmentPath = path.join(cameraDir, `segment${String(i).padStart(3, '0')}.ts`);
    
    if (!fs.existsSync(segmentPath)) {
      // Create a small mock video segment (just empty file for testing)
      fs.writeFileSync(segmentPath, Buffer.alloc(1024)); // 1KB dummy file
      console.log(`  ✓ Created: ${segmentPath}`);
    } else {
      console.log(`  ✓ Exists: ${segmentPath}`);
    }
  }
});

console.log('\n✅ Test environment setup complete!');
console.log('\n🌐 Next.js Development Server: http://localhost:3000');
console.log('📊 Dashboard: http://localhost:3000/dashboard');
console.log('\n📝 Next steps:');
console.log('1. Open http://localhost:3000 in your browser');
console.log('2. Navigate to the dashboard');
console.log('3. Test camera management features');
console.log('4. Check stream status indicators');
console.log('\n🔧 For real streaming:');
console.log('1. Install FFmpeg: brew install ffmpeg (macOS)');
console.log('2. Configure RTSP camera URLs in .env.local');
console.log('3. Run: npm run stream:start');
