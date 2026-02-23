#!/bin/bash

# Import Cameras from JSON File
# Usage: ./scripts/import-cameras-json.sh [path/to/cameras.json]

set -e

JSON_FILE="${1:-cameras.json}"

if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Error: File '$JSON_FILE' not found!"
    echo ""
    echo "Usage: ./scripts/import-cameras-json.sh [path/to/cameras.json]"
    echo ""
    echo "Create a JSON file with this format:"
    echo '{'
    echo '  "cameras": ['
    echo '    {'
    echo '      "name": "Camera Name",'
    echo '      "rtspUrl": "rtsp://url",'
    echo '      "enabled": true'
    echo '    }'
    echo '  ]'
    echo '}'
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📹 Importing Cameras from JSON File"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "File: $JSON_FILE"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: 'jq' is required but not installed."
    echo "Install with: brew install jq"
    exit 1
fi

# Count total cameras
TOTAL_CAMERAS=$(jq '.cameras | length' "$JSON_FILE")
ENABLED_CAMERAS=$(jq '[.cameras[] | select(.enabled == true)] | length' "$JSON_FILE")

echo "📊 Found $TOTAL_CAMERAS cameras in file"
echo "✅ $ENABLED_CAMERAS cameras are enabled"
echo ""

# Process each enabled camera
SUCCESS_COUNT=0
FAIL_COUNT=0

jq -c '.cameras[] | select(.enabled == true)' "$JSON_FILE" | while read -r camera; do
    NAME=$(echo "$camera" | jq -r '.name')
    RTSP_URL=$(echo "$camera" | jq -r '.rtspUrl')
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📹 Processing: $NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Test camera connection (optional, comment out if you want faster import)
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
