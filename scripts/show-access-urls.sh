#!/bin/bash

# Get your IP address
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

if [ -z "$IP" ]; then
    echo "❌ Could not detect IP address automatically"
    echo ""
    echo "Please run this command to find your IP:"
    echo "  ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo ""
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎥 CCTV Dashboard Access URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Local Access (this computer):"
echo "   http://localhost:3000/dashboard"
echo ""
echo "🌐 Network Access (other devices on same WiFi):"
echo "   http://$IP:3000/dashboard"
echo ""
echo "📱 Mobile Access:"
echo "   Open this URL on your phone's browser:"
echo "   http://$IP:3000/dashboard"
echo ""
echo "🔗 Direct Stream URLs:"
echo "   http://$IP:3000/api/cameras"
echo ""
echo "💡 Tips:"
echo "   • Both devices must be on the same WiFi network"
echo "   • Bookmark the URL on your phone for quick access"
echo "   • Add to home screen for app-like experience"
echo ""
echo "🔒 Security Note:"
echo "   This is accessible to anyone on your WiFi network"
echo "   Consider adding authentication for production use"
echo ""
