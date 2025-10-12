# GalloBets Production Deployment Checklist

Complete checklist for deploying GalloBets to production VPS. Follow steps in order.

## Prerequisites

- [ ] VPS provisioned (2 CPU, 4GB RAM, 50GB SSD minimum)
- [ ] Domain name configured (DNS pointing to VPS IP)
- [ ] SSH access to VPS (root or sudo user)
- [ ] GitHub repository access
- [ ] Local backup of .env file with production values

## 1. VPS Initial Setup

- [ ] SSH into VPS: `ssh root@YOUR-VPS-IP`
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js 18.x
- [ ] Install PostgreSQL 14+
- [ ] Install nginx
- [ ] Install PM2 globally
- [ ] Install ffmpeg: `sudo apt install ffmpeg -y`
- [ ] Create deployment user: `sudo adduser gallobets`

## 2. Backend Deployment

- [ ] Clone repository to /home/gallobets/
- [ ] Install dependencies: `npm install`
- [ ] Copy .env file with production values
- [ ] Run database migrations: `npm run migrate`
- [ ] Test backend: `npm run dev` (verify port 3001)
- [ ] Setup PM2: `pm2 start npm --name 'gallobets-backend' -- run start`
- [ ] Save PM2 config: `pm2 save && pm2 startup`

## 3. RTMP Server Setup

- [ ] Install node-media-server: `npm install node-media-server`
- [ ] Test rtmp-server: `node rtmp-server.js`
- [ ] Verify RTMP port: `lsof -i :1935`
- [ ] Verify HLS port: `curl http://localhost:8000/stat`
- [ ] Setup PM2: `pm2 start rtmp-server.js --name 'rtmp-server'`
- [ ] Save PM2 config: `pm2 save`

## 4. Firewall Configuration

- [ ] Enable UFW: `sudo ufw enable`
- [ ] Allow SSH: `sudo ufw allow 22/tcp`
- [ ] Allow RTMP: `sudo ufw allow 1935/tcp`
- [ ] Allow HLS: `sudo ufw allow 8000/tcp`
- [ ] Allow API: `sudo ufw allow 3001/tcp`
- [ ] Allow HTTP: `sudo ufw allow 80/tcp`
- [ ] Allow HTTPS: `sudo ufw allow 443/tcp`
- [ ] Check status: `sudo ufw status`

## 5. Frontend Deployment

- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Copy dist/ to /var/www/gallobets/
- [ ] Configure nginx to serve frontend
- [ ] Test nginx config: `sudo nginx -t`
- [ ] Reload nginx: `sudo systemctl reload nginx`

## 6. SSL Certificate (Let's Encrypt)

- [ ] Install certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Obtain certificate: `sudo certbot --nginx -d YOUR-DOMAIN.com`
- [ ] Verify auto-renewal: `sudo certbot renew --dry-run`

## 7. Post-Deployment Validation

- [ ] Test API health: `curl https://YOUR-DOMAIN.com/api/health`
- [ ] Test RTMP from OBS (remote connection)
- [ ] Test HLS playback: `curl http://YOUR-DOMAIN.com:8000/stat`
- [ ] Login to admin panel: https://YOUR-DOMAIN.com/login
- [ ] Create test event
- [ ] Start test stream from OBS
- [ ] Verify stream visible in frontend
- [ ] Check PM2 status: `pm2 status`
- [ ] Check logs: `pm2 logs`

## 8. Rollback Procedures

- [ ] Stop services: `pm2 stop all`
- [ ] Restore database backup: `pg_restore ...`
- [ ] Revert to previous git commit: `git checkout PREVIOUS-COMMIT`
- [ ] Restart services: `pm2 restart all`