#!/bin/bash

# Galleros.Net Production Streaming Infrastructure
# Phase 1: DigitalOcean VPS Setup with nginx-rtmp
# Version: 4.0-production-deployment
# Target: Ubuntu 22.04 LTS

set -e  # Exit on any error

echo "🚀 Starting Galleros.Net Phase 1: VPS Setup"
echo "Target: DigitalOcean VPS with nginx-rtmp streaming server"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root. Run as regular user with sudo privileges."
   exit 1
fi

log_info "Phase 1.A2: Basic server setup"

# Update system packages
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log_info "Installing nginx, rtmp module, and security tools..."
sudo apt install -y \
    nginx \
    libnginx-mod-rtmp \
    build-essential \
    fail2ban \
    ufw \
    certbot \
    python3-certbot-nginx \
    htop \
    curl \
    wget \
    unzip

# Configure UFW firewall
log_info "Configuring UFW firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 1935/tcp  # RTMP
sudo ufw allow 8080/tcp  # Stats/Control
sudo ufw --force enable

# Create required directories
log_info "Creating streaming directories..."
sudo mkdir -p /var/recordings /var/www/html/hls
sudo chown -R www-data:www-data /var/www/html/hls /var/recordings
sudo chmod 755 /var/recordings /var/www/html/hls

# Backup original nginx configuration
log_info "Backing up original nginx configuration..."
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create nginx-rtmp configuration
log_info "Creating nginx-rtmp configuration..."
sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
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
            
            # Stream authentication via backend
            on_publish http://localhost:3000/api/stream/auth;
            on_publish_done http://localhost:3000/api/stream/end;
            
            # Record streams with rotation
            record all;
            record_path /var/recordings;
            record_suffix .flv;
            record_max_size 1000M;
            record_max_frames 30000;
            
            # HLS output for CDN
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 1;
            hls_playlist_length 12;
            hls_cleanup on;
            hls_sync 100ms;
            
            # Security: Only allow authenticated streams
            allow publish 127.0.0.1;
            deny publish all;
            
            # Push to Bunny.net CDN (will be configured per stream)
            # push rtmp://ingest.bunnycdn.com/live/$name;
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
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
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
        
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var/www/html;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, HEAD";
        }
        
        location /stat {
            # Restrict stats access to local admin
            allow 127.0.0.1;
            deny all;
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        
        location /control {
            # RTMP control endpoint (local only)
            allow 127.0.0.1;
            deny all;
            rtmp_control all;
        }
    }
    
    # Include additional server configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Test nginx configuration
log_info "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    log_info "Nginx configuration test passed ✅"
else
    log_error "Nginx configuration test failed ❌"
    exit 1
fi

# Enable and start services
log_info "Enabling and starting services..."
sudo systemctl enable nginx fail2ban
sudo systemctl restart nginx
sudo systemctl start fail2ban

# Phase 1.A4: Validation
log_info "Phase 1.A4: Performing validation tests..."

# Check if nginx is running
if sudo systemctl is-active --quiet nginx; then
    log_info "✅ Nginx service is running"
else
    log_error "❌ Nginx service is not running"
    exit 1
fi

# Check if RTMP port is listening
if netstat -tulpn | grep -q ':1935'; then
    log_info "✅ RTMP server listening on port 1935"
else
    log_error "❌ RTMP server not listening on port 1935"
    exit 1
fi

# Check if HTTP stats port is listening
if netstat -tulpn | grep -q ':8080'; then
    log_info "✅ HTTP stats server listening on port 8080"
else
    log_error "❌ HTTP stats server not listening on port 8080"
    exit 1
fi

# Test stats page
if curl -s http://localhost:8080/stat > /dev/null; then
    log_info "✅ Stats page accessible"
else
    log_warn "⚠️ Stats page not accessible (may need backend running)"
fi

# Check firewall status
UFW_STATUS=$(sudo ufw status | grep -c "Status: active")
if [ $UFW_STATUS -eq 1 ]; then
    log_info "✅ UFW firewall is active"
    sudo ufw status verbose
else
    log_error "❌ UFW firewall is not active"
fi

# Check fail2ban status
if sudo systemctl is-active --quiet fail2ban; then
    log_info "✅ fail2ban security service is running"
else
    log_error "❌ fail2ban security service is not running"
fi

# Check directory permissions
log_info "Checking directory permissions..."
ls -la /var/www/html/hls /var/recordings

echo ""
echo "========================================================"
log_info "🎉 Phase 1 VPS Setup completed successfully!"
echo ""
log_info "Next steps:"
echo "  1. Configure your DigitalOcean firewall if using cloud firewall"
echo "  2. Set up SSL certificates with: sudo certbot --nginx"
echo "  3. Proceed to Phase 2: Bunny.net CDN integration"
echo ""
log_info "RTMP Server Details:"
echo "  - RTMP URL: rtmp://$(curl -s ifconfig.me):1935/live"
echo "  - Stats URL: http://$(curl -s ifconfig.me):8080/stat (admin only)"
echo "  - HLS Path: /var/www/html/hls"
echo "  - Recordings: /var/recordings"
echo ""
log_warn "IMPORTANT: Backend must be running on localhost:3000 for stream authentication"
echo "========================================================"