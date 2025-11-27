#!/bin/bash

# Galleros.Net Production Streaming Infrastructure
# Phase 2: Bunny.net CDN Integration
# Version: 4.0-production-deployment

set -e

echo "🚀 Starting Galleros.Net Phase 2: Bunny.net CDN Integration"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration variables (to be set by user)
BUNNY_STREAM_KEY="${BUNNY_STREAM_KEY:-}"
BUNNY_INGEST_URL="${BUNNY_INGEST_URL:-}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

if [[ -z "$BUNNY_STREAM_KEY" || -z "$BUNNY_INGEST_URL" ]]; then
    log_error "Please set environment variables:"
    echo "export BUNNY_STREAM_KEY='your_bunny_stream_key'"
    echo "export BUNNY_INGEST_URL='rtmp://ingest.bunnycdn.com/live'"
    exit 1
fi

log_step "Phase 2.A2: Configuring VPS → Bunny.net relay"

# Backup current nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.phase1

# Update nginx configuration with Bunny.net integration
log_info "Updating nginx-rtmp configuration for CDN relay..."

sudo tee /etc/nginx/nginx.conf > /dev/null << EOF
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        timeout 60s;
        
        application live {
            live on;
            
            # Enhanced authentication with Galleros.Net backend
            on_publish ${BACKEND_URL}/api/stream/auth;
            on_publish_done ${BACKEND_URL}/api/stream/end;
            on_record_done ${BACKEND_URL}/api/stream/recorded;
            
            # Relay to Bunny.net with authentication
            push ${BUNNY_INGEST_URL}/\$name?auth=${BUNNY_STREAM_KEY};
            
            # Record streams with rotation
            record all;
            record_path /var/recordings;
            record_suffix .flv;
            record_max_size 1000M;
            record_max_frames 30000;
            
            # Local HLS with security
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
            hls_playlist_length 30;
            hls_cleanup on;
            hls_nested on;
            hls_sync 100ms;
            
            # Stream limits and security
            max_connections 10;
            allow publish 127.0.0.1;
            deny publish all;
            
            # Notifications for stream events
            notify_method get;
            on_play ${BACKEND_URL}/api/stream/play;
            on_play_done ${BACKEND_URL}/api/stream/stop;
        }
    }
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Rate limiting for API protection
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=hls:10m rate=30r/s;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    server {
        listen 8080;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        
        location /hls {
            # Rate limiting for HLS requests
            limit_req zone=hls burst=50 nodelay;
            
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var/www/html;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma no-cache;
            add_header Expires 0;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, HEAD";
            add_header Access-Control-Max-Age 86400;
        }
        
        location /stat {
            # Restrict stats access to local admin only
            allow 127.0.0.1;
            deny all;
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        
        location /control {
            # RTMP control endpoint (local admin only)
            allow 127.0.0.1;
            deny all;
            rtmp_control all;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
    
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Test and reload nginx
log_info "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    log_info "✅ Nginx configuration test passed"
    sudo systemctl reload nginx
    log_info "✅ Nginx reloaded successfully"
else
    log_error "❌ Nginx configuration test failed"
    sudo cp /etc/nginx/nginx.conf.phase1 /etc/nginx/nginx.conf
    exit 1
fi

log_step "Phase 2.A3: Testing CDN distribution"

# Create test monitoring script
log_info "Creating monitoring script for stream testing..."
sudo tee /usr/local/bin/gallerosnet-stream-monitor.sh > /dev/null << 'EOF'
#!/bin/bash

STREAM_NAME="$1"
if [[ -z "$STREAM_NAME" ]]; then
    echo "Usage: $0 <stream_name>"
    exit 1
fi

echo "🔍 Monitoring stream: $STREAM_NAME"
echo "=================================="

# Check if stream is being received
echo "📡 RTMP Status:"
curl -s http://localhost:8080/stat | grep -A 10 "$STREAM_NAME" || echo "No active stream found"

echo -e "\n📁 Local HLS Files:"
ls -la /var/www/html/hls/$STREAM_NAME/ 2>/dev/null || echo "No HLS files yet"

echo -e "\n📊 Recording Status:"
ls -la /var/recordings/*$STREAM_NAME* 2>/dev/null || echo "No recordings yet"

echo -e "\n🌐 Testing HLS Playback:"
if curl -s http://localhost:8080/hls/$STREAM_NAME/index.m3u8 > /dev/null; then
    echo "✅ Local HLS accessible"
else
    echo "❌ Local HLS not accessible"
fi

echo -e "\n🔄 Nginx Process Status:"
ps aux | grep nginx | grep -v grep

echo -e "\n📝 Recent Nginx Logs:"
tail -5 /var/log/nginx/error.log
EOF

sudo chmod +x /usr/local/bin/gallerosnet-stream-monitor.sh

# Validation tests
log_step "Performing validation tests..."

# Test 1: Nginx status
if sudo systemctl is-active --quiet nginx; then
    log_info "✅ Nginx service active"
else
    log_error "❌ Nginx service not active"
    exit 1
fi

# Test 2: RTMP port listening
if netstat -tulpn | grep -q ':1935'; then
    log_info "✅ RTMP server listening on port 1935"
else
    log_error "❌ RTMP server not listening"
    exit 1
fi

# Test 3: Stats endpoint
if curl -s http://localhost:8080/stat > /dev/null; then
    log_info "✅ Stats endpoint accessible"
else
    log_warn "⚠️ Stats endpoint not accessible"
fi

# Test 4: Health check
if curl -s http://localhost:8080/health | grep -q "OK"; then
    log_info "✅ Health check endpoint working"
else
    log_warn "⚠️ Health check endpoint issues"
fi

echo ""
echo "========================================================="
log_info "🎉 Phase 2 Bunny.net CDN Integration completed!"
echo ""
log_info "Configuration Summary:"
echo "  • Bunny.net Ingest: ${BUNNY_INGEST_URL}"
echo "  • Backend Integration: ${BACKEND_URL}"
echo "  • Local HLS: http://$(curl -s ifconfig.me):8080/hls/"
echo "  • Stream Monitor: gallerosnet-stream-monitor.sh <stream_name>"
echo ""
log_info "Next Steps:"
echo "  1. Test streaming with OBS Studio (Phase 3)"
echo "  2. Verify CDN distribution in Bunny.net dashboard"
echo "  3. Monitor stream quality and latency"
echo ""
log_warn "IMPORTANT: Ensure Galleros.Net backend is running for authentication"
echo "========================================================="