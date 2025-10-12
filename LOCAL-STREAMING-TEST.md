# Guía de Pruebas de Streaming Local - GalloBets

**Fecha**: 2025-10-11
**Propósito**: Validar sistema de streaming completo en entorno local
**Duración estimada**: 30-45 minutos

---

## Pre-requisitos Verificados ✅

- ✅ ffmpeg instalado: `/usr/bin/ffmpeg`
- ✅ node-media-server v4.0.21
- ✅ rtmp-server.js configurado
- ✅ Backend corriendo: `npm run dev` (puerto 3001)
- ✅ Frontend corriendo: `npm run dev` (puerto 5173)

---

## Paso 1: Iniciar RTMP Server (Terminal 1)

```bash
cd /home/veranoby/sports-bets
node rtmp-server.js
```

**Salida esperada:**
```
🚀 Starting GalloBets RTMP Server...
📡 RTMP: rtmp://localhost:1935/live
🌐 HTTP: http://localhost:8000

📋 OBS Studio Configuration:
   Server: rtmp://localhost:1935/live
   Stream Key: test (or any key you prefer)

⏳ Waiting for streams...
```

**Verificación:**
- Puerto 1935 (RTMP) abierto
- Puerto 8000 (HTTP/HLS) abierto
- No errores en consola

---

## Paso 2: Configurar OBS Studio

### 2.1 Instalar OBS (si no está instalado)
```bash
sudo apt install obs-studio
# O descargar de: https://obsproject.com/
```

### 2.2 Configuración OBS
1. Abrir OBS Studio
2. `Settings` → `Stream`
3. **Service**: Custom...
4. **Server**: `rtmp://localhost:1935/live`
5. **Stream Key**: `test` (o cualquier key)
6. Click `OK`

### 2.3 Configuración de Video (Opcional)
1. `Settings` → `Output`
   - **Bitrate**: 2500 Kbps
   - **Keyframe Interval**: 2
   - **Preset**: veryfast

2. `Settings` → `Video`
   - **Base Resolution**: 1920x1080
   - **Output Resolution**: 1280x720
   - **FPS**: 30

---

## Paso 3: Crear Evento en Frontend

### 3.1 Login como Admin
1. Ir a: `http://localhost:5173/login`
2. Usuario: `admin_test` / Password: tu contraseña
3. Verificar rol: `admin`

### 3.2 Crear Evento de Prueba
1. Navegar a: `/admin/events`
2. Click `Crear Nuevo Evento`
3. Completar formulario:
   - **Nombre**: "Test Streaming Local - [Fecha]"
   - **Venue**: Seleccionar cualquier venue
   - **Fecha/Hora**: Hoy + 10 minutos
4. Click `Crear Evento`

### 3.3 Activar Evento
1. Encontrar evento en lista
2. Click `Activar` (cambia de scheduled → in-progress)
3. Verificar badge verde: "En Progreso"

---

## Paso 4: Iniciar Streaming

### 4.1 Abrir Modal de Gestión
1. En lista de eventos, click `Gestionar`
2. Modal se abre con 5 tabs
3. Navegar a tab **"Peleas"**

### 4.2 Iniciar Stream desde Frontend
1. En tab Peleas, sección "Control de Streaming"
2. Verificar Stream URL: `rtmp://localhost:1935/live`
3. Click botón `Iniciar Streaming`
4. Verificar badge cambia a "Conectado" (verde)

### 4.3 Iniciar Stream desde OBS
1. En OBS Studio, click `Start Streaming`
2. Verificar indicador verde en OBS: `🟢 LIVE`
3. **Verificar en rtmp-server terminal:**
   ```
   🟢 STREAM STARTED: StreamPath=/live/test
   📺 HLS URL: http://localhost:8000/live/test.m3u8
   ```

---

## Paso 5: Validar HLS Playback

### 5.1 Verificar Stream en Frontend
1. En modal de evento, tab "Peleas"
2. Buscar reproductor HLS (si está visible)
3. O navegar a: `/admin/streaming`

### 5.2 Test Directo HLS (Alternativa)
Abrir en navegador:
```
http://localhost:8000/live/test.m3u8
```

**Salida esperada**: Descarga archivo `.m3u8` o reproduce video

### 5.3 Test con VLC (Recomendado)
```bash
vlc http://localhost:8000/live/test.m3u8
```
Debe reproducir stream con ~2-3 segundos de latencia

---

## Paso 6: Crear y Gestionar Peleas

### 6.1 Crear Pelea de Prueba
1. En tab "Peleas", click `Nueva Pelea`
2. Completar:
   - **Número**: 1
   - **Gallo Rojo**: "Rojo Test"
   - **Gallo Azul**: "Azul Test"
   - **Peso**: 5.5
3. Click `Crear`

### 6.2 Abrir Ventana de Apuestas
1. Encontrar pelea en lista
2. Click `Abrir Apuestas`
3. Verificar estado cambia: `upcoming` → `betting`

### 6.3 Iniciar Pelea
1. Click `Iniciar Pelea`
2. Verificar estado: `betting` → `live`
3. **Apuestas se cierran automáticamente**

### 6.4 Registrar Resultado
1. Click `Registrar Resultado`
2. Seleccionar ganador: Rojo / Azul / Empate
3. Click `Confirmar`
4. Verificar estado: `live` → `completed`

---

## Paso 7: Detener Streaming

### 7.1 Detener desde OBS
1. En OBS Studio, click `Stop Streaming`
2. Verificar indicador apagado

### 7.2 Verificar en rtmp-server
Terminal debe mostrar:
```
🔴 STREAM ENDED: StreamPath=/live/test
```

### 7.3 Actualizar Frontend
1. En modal evento, tab "Peleas"
2. Click `Detener Streaming`
3. Badge cambia a "Desconectado" (rojo/gris)

---

## Paso 8: Finalizar Evento

1. Cerrar modal de gestión
2. En lista de eventos, click `Finalizar`
3. Confirmar finalización
4. Verificar estado: `in-progress` → `completed`

---

## Troubleshooting

### ❌ OBS no se conecta
**Síntomas**: OBS muestra error "Failed to connect"

**Soluciones**:
1. Verificar rtmp-server corriendo:
   ```bash
   lsof -i :1935
   ```
2. Reiniciar rtmp-server
3. Verificar URL en OBS: `rtmp://localhost:1935/live`

### ❌ HLS no reproduce
**Síntomas**: URL `.m3u8` no funciona

**Soluciones**:
1. Verificar ffmpeg:
   ```bash
   ffmpeg -version
   ```
2. Verificar puerto 8000:
   ```bash
   lsof -i :8000
   ```
3. Reiniciar rtmp-server con logs:
   ```bash
   NODE_DEBUG=* node rtmp-server.js
   ```

### ❌ Frontend no muestra stream status
**Síntomas**: Badge siempre "Desconectado"

**Soluciones**:
1. Verificar backend corriendo (puerto 3001)
2. Check console de navegador (F12)
3. Verificar SSE connection:
   ```
   Network tab → Filter: EventStream
   ```

### ❌ Peleas no se crean
**Síntomas**: Modal de crear pelea no guarda

**Soluciones**:
1. Verificar evento está en estado `in-progress`
2. Check console de navegador para errores
3. Verificar permisos de usuario (debe ser admin/operator)

---

## Checklist de Validación Completa

### Streaming
- [ ] RTMP server inicia sin errores
- [ ] OBS se conecta exitosamente
- [ ] Stream key visible en frontend
- [ ] HLS URL accesible (puerto 8000)
- [ ] VLC reproduce stream
- [ ] Latencia ~2-3 segundos

### Frontend
- [ ] Evento se crea correctamente
- [ ] Estado cambia: scheduled → in-progress
- [ ] Modal de gestión abre con 5 tabs
- [ ] Tab "Peleas" muestra controles streaming
- [ ] Badge de estado actualiza en tiempo real
- [ ] Stream URL visible en UI

### Fight Management
- [ ] Peleas se crean sin errores
- [ ] Estado transitions: upcoming → betting → live → completed
- [ ] Botones de control responden
- [ ] Resultados se registran correctamente

### Real-time Updates
- [ ] SSE connection activa (check Network tab)
- [ ] Stream status updates en tiempo real
- [ ] Fight status changes reflejan inmediatamente

---

## Logs Útiles

### RTMP Server Logs
```bash
# Terminal donde corre rtmp-server.js
[HH:MM:SS] 🟢 STREAM STARTED: StreamPath=/live/test
[HH:MM:SS] 📺 VIEWER CONNECTED: StreamPath=/live/test
[HH:MM:SS] 👋 VIEWER DISCONNECTED: StreamPath=/live/test
[HH:MM:SS] 🔴 STREAM ENDED: StreamPath=/live/test
```

### Backend Logs (Terminal backend)
```bash
GET /api/events - 200
POST /api/fights - 201
PUT /api/fights/:id/status - 200
```

### Frontend Console (F12)
```javascript
SSE Connected to /api/sse
SSE Event: streamStatus { status: 'connected', eventId: '...' }
SSE Event: fightUpdate { fightId: '...', status: 'live' }
```

---

## Próximos Pasos Después de Validación

### Si todo funciona ✅
1. **Documentar configuración exitosa**
2. **Preparar deployment a producción**
3. **Actualizar streaming-manual.md con hallazgos**
4. **Planificar infraestructura de producción**

### Si hay problemas ⚠️
1. **Anotar errores específicos**
2. **Capturas de pantalla de errores**
3. **Logs completos de cada componente**
4. **Reportar a Claude para debugging**

---

## Contacto Soporte
Para problemas no resueltos con esta guía:
- **Check**: `/home/veranoby/sports-bets/streaming-manual.md` (guía operadores)
- **Logs**: Backend terminal, Frontend console, rtmp-server terminal
- **Debug**: Claude Code con logs específicos

---

**¡Buena suerte con las pruebas! 🎬📺🐓**
