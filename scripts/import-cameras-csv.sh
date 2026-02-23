#!/bin/bash

# Import Cameras from CSV File
# Usage: ./scripts/import-cameras-csv.sh [path/to/cameras.csv]

set -e

CSV_FILE="${1:-cameras.csv}"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: File '$CSV_FILE' not found!"
    echo ""
    echo "Usage: ./scripts/import-cameras-csv.sh [path/to/cameras.csv]"
    echo ""
    echo "Create a CSV file with this format:"
    echo "name,rtspUrl,enabled"
    echo "Front Door,rtsp://admin:pass@192.168.1.100:554/stream1,true"
    echo "Back Door,rtsp://admin:pass@192.168.1.101:554/stream1,true"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📹 Importing Cameras from CSV File"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "File: $CSV_FILE"
echo ""

# Count total cameras (excluding header)
TOTAL_CAMERAS=$(($(wc -l < "$CSV_FILE") - 1))
ENABLED_CAMERAS=$(grep -c ",true$" "$CSV_FILE" || echo "0")

echo "📊 Found $TOTAL_CAMERAS cameras in file"
echo "✅ $ENABLED_CAMERAS cameras are enabled"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

# Skip header and process each line
tail -n +2 "$CSV_FILE" | while IFS=',' read -r NAME RTSP_URL ENABLED; do
    # Skip if not enabled
    if [ "$ENABLED" != "true" ]; then
        echo "⏭️  Skipping (disabled): $NAME"
        continue
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📹 Processing: $NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Test camera connection (optional)
    echo "🔍 Testing connection..."
    if timeout 5 ffmpeg -rtsp_transport tcp -i "$RTSP_URL" -f null - 2>&1 | grep -q "Stream"; then
        echo "✅ Connection successful"
    else
        echo "⚠️  Connection test failed (will still add camera)"
    fi
    
    # Add camera
    echo "📝 Adding to database..."
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/cameras \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"$NAME\", \"rtspUrl\": \"$RTSP_URL\"}")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        CAMERA_ID=$(echo "$RESPONSE" | jq -r '.data.id')
        echo "✅ Camera added: $CAMERA_ID"
        
        # Start stream
        echo "🎬 Starting stream..."
        sleep 1
        STREAM_RESPONSE=$(curl -s -X POST http://localhost:3000/api/streams/start \
          -H "Content-Type: application/json" \
          -d "{\"cameraId\": \"$CAMERA_ID\", \"rtspUrl\": \"$RTSP_URL\"}")
        
        if echo "$STREAM_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
            echo "✅ Stream started"
            
            # Update status
            sqlite3 data/cctv.db "UPDATE cameras SET status = 'streaming' WHERE id = '$CAMERA_ID';" 2>/dev/null
            echo "✅ Status updated"
            
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "⚠️  Stream start failed"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    else
        echo "❌ Failed to add camera"
        echo "$RESPONSE" | jq .
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    echo ""
    sleep 2
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Import Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "   Total in file: $TOTAL_CAMERAS"
echo "   Enabled: $ENABLED_CAMERAS"
echo ""
echo "🎥 View your cameras:"
echo "   Dashboard: http://localhost:3000/dashboard"
echo ""
