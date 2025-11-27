# Galleros.Net Production Deployment Guide

## 🎯 Objetivo
Configurar infraestructura de streaming en producción: **OBS Studio → VPS RTMP → Bunny.net CDN → 1000 viewers**

## 📋 Fases de Deployment

### ✅ PREPARACIÓN COMPLETADA
- Backend optimizations ✅
- Database cleanup ✅  
- TypeScript fixes ✅
- Scripts de deployment ✅

### 🚀 FASES DE EJECUCIÓN (EN VPS)

#### **Fase 1: VPS Setup** 
```bash
# En el VPS (DigitalOcean Ubuntu 22.04)
./deployment/phase1-vps-setup.sh
```
**Duración**: 2-3 horas  
**Resultado**: nginx-rtmp server funcionando  

#### **Fase 2: CDN Integration**
```bash
# Configurar variables de Bunny.net
export BUNNY_STREAM_KEY="tu_clave_bunny"
export BUNNY_INGEST_URL="rtmp://ingest.bunnycdn.com/live"

./deployment/phase2-bunny-cdn.sh
```
**Duración**: 1-2 horas  
**Resultado**: Relay VPS → CDN funcionando  

#### **Fase 3: OBS Studio** (En tu máquina local)
- **Server**: `rtmp://tu_vps_ip:1935/live`
- **Stream Key**: `gallobets_event_001`
- **Bitrate**: 1500 kbps (480p)

#### **Fase 4: Backend Integration**
- Actualizar variables de entorno
- Configurar endpoints de autenticación
- Integrar controles de admin

#### **Fase 5: Testing**
- Load testing (50+ viewers)
- Latencia end-to-end < 5s
- Validación completa del flujo

## 💰 Costos Estimados
- **DigitalOcean VPS**: $4/mes
- **Bunny.net CDN**: $15-25/mes  
- **Total**: $19-29/mes

## 🔒 Seguridad Implementada
- UFW firewall configurado
- fail2ban anti-brute force
- Stream authentication via backend
- Rate limiting en endpoints
- SSL certificates (Let's Encrypt)

## 🎛️ Monitoreo
- **Stats**: `http://vps_ip:8080/stat` (admin only)
- **Health**: `http://vps_ip:8080/health`
- **Monitor Script**: `gallerosnet-stream-monitor.sh`

## ⚠️ IMPORTANTE
- **NO ejecutar** en máquina local de desarrollo
- **SOLO para VPS** de producción
- Backend debe estar en `localhost:3000` en el VPS
- Configurar DNS y SSL antes de producción

## 🚦 Estado Actual
```
✅ Scripts preparados (no ejecutados)
✅ Configuraciones optimizadas  
✅ Seguridad implementada
⏳ Pendiente: Ejecución en VPS real
```