# 📁 Bulk Camera Import Guide

Import multiple cameras at once from a configuration file!

## 🎯 Quick Start

### Option 1: JSON File (Recommended)

1. **Edit the `cameras.json` file:**
```json
{
  "cameras": [
    {
      "name": "Front Door Camera",
      "rtspUrl": "rtsp://admin:password@192.168.1.100:554/stream1",
      "enabled": true
    },
    {
      "name": "Back Entrance Camera",
      "rtspUrl": "rtsp://admin:password@192.168.1.101:554/stream1",
      "enabled": true
    }
  ]
}
```

2. **Run the import:**
```bash
./scripts/import-cameras-json.sh cameras.json
```

### Option 2: CSV File

1. **Edit the `cameras.csv` file:**
```csv
name,rtspUrl,enabled
Front Door Camera,rtsp://admin:password@192.168.1.100:554/stream1,true
Back Entrance Camera,rtsp://admin:password@192.168.1.101:554/stream1,true
Parking Lot Camera,rtsp://admin:password@192.168.1.102:554/stream1,false
```

2. **Run the import:**
```bash
./scripts/import-cameras-csv.sh cameras.csv
```

---

## 📋 File Format Details

### JSON Format

```json
{
  "cameras": [
    {
      "name": "Camera Display Name",
      "rtspUrl": "rtsp://username:password@ip:port/path",
      "enabled": true
    }
  ]
}
```

**Fields:**
- `name` (required): Display name for the camera
- `rtspUrl` (required): Full RTSP URL with credentials
- `enabled` (required): `true` to import, `false` to skip

### CSV Format

```csv
name,rtspUrl,enabled
Camera Name,rtsp://url,true
```

**Rules:**
- First line must be the header: `name,rtspUrl,enabled`
- No spaces after commas
- Set `enabled` to `true` or `false`
- URLs with commas must be quoted

---

## 🎬 What the Import Script Does

For each enabled camera:
1. ✅ Tests the RTSP connection
2. ✅ Adds camera to database
3. ✅ Starts the video stream
4. ✅ Updates camera status to "streaming"
5. ✅ Provides summary report

---

## 📝 Example Files

### Example 1: Home Security System

**cameras.json:**
```json
{
  "cameras": [
    {
      "name": "Front Door",
      "rtspUrl": "rtsp://admin:pass123@192.168.1.100:554/stream1",
      "enabled": true
    },
    {
      "name": "Back Door",
      "rtspUrl": "rtsp://admin:pass123@192.168.1.101:554/stream1",
      "enabled": true
    },
    {
      "name": "Garage",
      "rtspUrl": "rtsp://admin:pass123@192.168.1.102:554/stream1",
      "enabled": true
    },
    {
      "name": "Driveway",
      "rtspUrl": "rtsp://admin:pass123@192.168.1.103:554/stream1",
      "enabled": true
    }
  ]
}
```

### Example 2: Office Building

**cameras.csv:**
```csv
name,rtspUrl,enabled
Lobby Camera,rtsp://admin:office123@10.0.1.10:554/stream1,true
Parking Entrance,rtsp://admin:office123@10.0.1.11:554/stream1,true
Parking Exit,rtsp://admin:office123@10.0.1.12:554/stream1,true
Conference Room A,rtsp://admin:office123@10.0.1.20:554/stream1,false
Conference Room B,rtsp://admin:office123@10.0.1.21:554/stream1,false
Server Room,rtsp://admin:office123@10.0.1.30:554/stream1,true
```

### Example 3: Mixed Camera Brands

**cameras.json:**
```json
{
  "cameras": [
    {
      "name": "Hikvision Front",
      "rtspUrl": "rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/101",
      "enabled": true
    },
    {
      "name": "Dahua Back",
      "rtspUrl": "rtsp://admin:pass@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0",
      "enabled": true
    },
    {
      "name": "TP-Link Side",
      "rtspUrl": "rtsp://admin:pass@192.168.1.102:554/stream1",
      "enabled": true
    }
  ]
}
```

---

## 🔧 Advanced Usage

### Import from Custom Location

```bash
./scripts/import-cameras-json.sh /path/to/my-cameras.json
./scripts/import-cameras-csv.sh /path/to/my-cameras.csv
```

### Skip Connection Testing

Edit the script and comment out the connection test section to speed up import:

```bash
# Comment out these lines in the script:
# if timeout 5 ffmpeg -rtsp_transport tcp -i "$RTSP_URL" -f null - 2>&1 | grep -q "Stream"; then
#     echo "✅ Connection successful"
# else
#     echo "⚠️  Connection test failed"
# fi
```

### Import Only (Don't Start Streams)

Remove the stream start section from the script if you want to add cameras without starting streams immediately.

---

## 📊 Export Current Cameras

Want to backup your current camera configuration?

### Export to JSON:
```bash
curl -s http://localhost:3000/api/cameras | jq '{cameras: [.data.cameras[] | {name, rtspUrl, enabled: true}]}' > my-cameras-backup.json
```

### Export to CSV:
```bash
echo "name,rtspUrl,enabled" > my-cameras-backup.csv
curl -s http://localhost:3000/api/cameras | jq -r '.data.cameras[] | [.name, .rtspUrl, "true"] | @csv' >> my-cameras-backup.csv
```

---

## 🆘 Troubleshooting

### "jq: command not found"
Install jq:
```bash
brew install jq
```

### "Connection test failed"
- Check camera IP addresses
- Verify username/password
- Ensure cameras are on same network
- Test individual camera with: `./scripts/test-camera.sh "rtsp://url"`

### Import stops midway
- Check server logs
- Verify all RTSP URLs are correct
- Try importing cameras one at a time

### Cameras added but not streaming
- Check FFmpeg is installed: `which ffmpeg`
- View server logs for errors
- Manually start stream: `./scripts/add-camera.sh "Name" "rtsp://url"`

---

## 💡 Tips

1. **Start Small**: Test with 1-2 cameras first
2. **Use `enabled: false`**: Keep cameras in file but don't import them yet
3. **Backup First**: Export current cameras before bulk import
4. **Test URLs**: Use `./scripts/test-camera.sh` to verify RTSP URLs
5. **Organize**: Create separate files for different locations/buildings

---

## 📚 Related Files

- `cameras.json` - Example JSON configuration
- `cameras.csv` - Example CSV configuration
- `scripts/import-cameras-json.sh` - JSON import script
- `scripts/import-cameras-csv.sh` - CSV import script
- `scripts/add-camera.sh` - Add single camera
- `scripts/test-camera.sh` - Test RTSP connection

---

## 🎥 After Import

View your cameras:
```
http://localhost:3000/dashboard
```

Check all cameras:
```bash
curl http://localhost:3000/api/cameras | jq .
```

Check streaming status:
```bash
curl http://localhost:3000/api/streams/status | jq .
```
