# 🎥 GALLOBETS - Guía de Streaming en Producción

**Estado**: ✅ **PRODUCCIÓN READY** - Tutorial verificado contra implementación actual
**Última actualización**: 28 septiembre 2025
**Para**: Administradores y Operadores de la plataforma GalloBets

---

## 📋 ARQUITECTURA DE STREAMING IMPLEMENTADA

### Componentes del Sistema
```
[OBS Studio] → [Servidor RTMP Local] → [HLS Output] → [Frontend React]
    (Origen)     (Puerto 1935)         (HTTP 8000)    (SSE + HLS Player)
```

### Protocolos en Uso
- **RTMP**: Ingesta desde OBS Studio (Puerto 1935)
- **HLS**: Distribución a usuarios (HTTP Live Streaming)
- **SSE**: Real-time admin updates y monitoring
- **WebSocket**: Minimal - solo para PAGO/DOY betting (3min timeout)

---

## 🔧 CONFIGURACIÓN TÉCNICA

### Servidor RTMP - Docker Setup
```bash
# Iniciar servidor RTMP (ya configurado en el proyecto)
docker run -d \
  --name rtmp-server \
  -p 1935:1935 \
  -p 8000:8000 \
  -v /tmp/hls:/var/hls \
  alqutami/rtmp-hls
```

### URLs del Sistema
- **RTMP Input**: `rtmp://localhost:1935/live`
- **HLS Output**: `http://localhost:8000/live/{STREAM_KEY}/index.m3u8`
- **Admin Dashboard**: `http://localhost:5173/admin/streaming`

---

## 🎮 CONFIGURACIÓN OBS STUDIO

### Configuración Básica Recomendada

**Settings → Stream**:
- **Service**: Custom
- **Server**: `rtmp://localhost:1935/live`
- **Stream Key**: `{EVENT_ID}` (generado por el admin dashboard)

**Settings → Output**:
```
Output Mode: Advanced
Streaming Tab:
  - Encoder: x264
  - Rate Control: CBR
  - Bitrate: 2500 Kbps (para 720p)
  - Keyframe Interval: 2
  - CPU Usage Preset: veryfast
  - Profile: high
  - Tune: zerolatency
```

**Settings → Video**:
```
Base Resolution: 1920x1080
Output Resolution: 1280x720
Downscale Filter: Bicubic
FPS: 30
```

**Settings → Audio**:
```
Sample Rate: 48 kHz
Channels: Stereo
Bitrate: 128 kbps
```

---

## 👨‍💼 FLUJO DE TRABAJO PARA ADMINISTRADORES

### 1. Crear Evento
1. Acceder a `/admin/events`
2. Clic en "Crear Nuevo Evento"
3. Completar información del evento:
   - Nombre del evento
   - Venue asignado
   - Fecha y hora programada
4. Guardar evento

### 2. Asignar Operador
1. En la lista de eventos, clic en "Editar"
2. Tab "General" → Seleccionar operador
3. Guardar cambios

### 3. Generar Stream Key
1. En el evento, clic en "Generar Stream Key"
2. La clave se genera automáticamente: `event-{EVENT_ID}`
3. Proporcionar esta clave al operador

### 4. Configurar Streaming
1. Acceder a `/admin/streaming`
2. Monitorear estado del stream en tiempo real
3. Ver métricas de viewers y calidad

---

## 🎯 FLUJO DE TRABAJO PARA OPERADORES

### 1. Preparación del Evento
1. Recibir Stream Key del administrador
2. Configurar OBS Studio con los parámetros anteriores
3. Verificar calidad de video y audio

### 2. Iniciar Transmisión
1. En OBS: Clic en "Start Streaming"
2. Verificar conexión: debe mostrar "🟢 Live" en OBS
3. Confirmar en admin dashboard que el stream está activo

### 3. Gestión de Peleas
1. Crear peleas usando el admin dashboard:
   - Nombre Gallo Rojo
   - Nombre Gallo Azul
   - Peso
   - Número de pelea
2. Abrir ventanas de apuestas:
   - Cambiar status a "betting"
   - Los usuarios pueden hacer PAGO/DOY
3. Iniciar pelea:
   - Cambiar status a "live"
   - Se cierran automáticamente las apuestas
4. Finalizar pelea:
   - Registrar resultado (Rojo/Azul/Empate)
   - Status cambia a "completed"
   - Sistema liquida apuestas automáticamente

### 4. Finalizar Evento
1. En OBS: Clic en "Stop Streaming"
2. Finalizar todas las peleas pendientes
3. Verificar que todas las apuestas están liquidadas

---

## 📊 MONITORING Y MÉTRICAS

### Dashboard en Tiempo Real
El admin dashboard proporciona:
- **Estado del Stream**: ✅ Activo / ❌ Inactivo
- **Viewers Actuales**: Contador en tiempo real
- **Apuestas Activas**: Total por pelea
- **Estado de Peleas**: upcoming/betting/live/completed

### SSE (Server-Sent Events)
El sistema usa SSE para updates en tiempo real:
- `/api/sse/admin/fights` - Estados de peleas
- `/api/sse/admin/streaming` - Métricas de streaming
- `/api/sse/admin/bets` - Actividad de apuestas

### Logs del Sistema
```bash
# Backend logs
tail -f backend/logs/streaming.log

# RTMP server logs
docker logs rtmp-server -f
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### 1. OBS No Se Conecta
**Síntomas**: OBS muestra "Failed to connect"
**Soluciones**:
- Verificar que el servidor RTMP esté corriendo: `docker ps`
- Comprobar la URL: debe ser `rtmp://localhost:1935/live`
- Revisar firewall en puerto 1935

### 2. Stream No Aparece en Frontend
**Síntomas**: El reproductor muestra error o pantalla negra
**Soluciones**:
- Verificar HLS URL: `http://localhost:8000/live/{STREAM_KEY}/index.m3u8`
- Comprobar que los archivos .m3u8 y .ts se están generando en `/tmp/hls`
- Revisar CORS headers en el servidor HLS

### 3. Alta Latencia (>30 segundos)
**Síntomas**: Retraso significativo entre transmisión y recepción
**Soluciones**:
- Reducir keyframe interval en OBS a 1 segundo
- Verificar configuración de fragmentos HLS (3s por defecto)
- Comprobar ancho de banda de upload

### 4. Pérdida de Calidad
**Síntomas**: Video pixelado o congelado
**Soluciones**:
- Reducir bitrate en OBS (de 2500 a 1500 Kbps)
- Cambiar preset de "veryfast" a "faster"
- Verificar uso de CPU en máquina de streaming

---

## ⚡ OPTIMIZACIONES DE RENDIMIENTO

### Para Eventos Largos (8+ horas)
```bash
# Configurar rotación de logs RTMP
logrotate -f /etc/logrotate.d/rtmp

# Limpiar archivos HLS antiguos cada hora
0 * * * * find /tmp/hls -name "*.ts" -mtime +1 -delete
```

### Monitoring Automático
```bash
# Script para verificar salud del streaming
#!/bin/bash
STREAM_KEY="event-123"
HLS_URL="http://localhost:8000/live/$STREAM_KEY/index.m3u8"

if curl -f $HLS_URL > /dev/null 2>&1; then
    echo "Stream OK"
else
    echo "Stream DOWN - alertar admin"
    # Enviar notificación
fi
```

---

## 🔒 SEGURIDAD Y ACCESO

### Control de Acceso
- Solo administradores pueden generar stream keys
- Solo operadores asignados pueden controlar peleas
- Stream keys son únicos por evento y no reutilizables

### Protección del Sistema
```bash
# Solo permitir conexiones RTMP desde localhost (producción)
iptables -A INPUT -p tcp --dport 1935 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 1935 -j DROP
```

---

## 📋 CHECKLIST PRE-EVENTO

### Para Administradores:
- [ ] Evento creado con información completa
- [ ] Operador asignado y notificado
- [ ] Stream key generado y compartido
- [ ] Sistema de monitoring activo
- [ ] Backup de conexión disponible

### Para Operadores:
- [ ] OBS configurado según especificaciones
- [ ] Stream key configurado correctamente
- [ ] Test de conexión realizado
- [ ] Peleas pre-configuradas en el sistema
- [ ] Plan de contingencia para fallos técnicos

---

## 🆘 CONTACTOS DE EMERGENCIA

**Soporte Técnico**: Claude Code (disponible 24/7)
**Escalación**: Verificar logs en `/claudedocs/` para troubleshooting

---

## ⚙️ MÁQUINA DE ESTADOS DE PELEAS

### Especificación Técnica de Transiciones Válidas

El sistema implementa un modelo de estados para las peleas con transiciones bien definidas y validaciones en cada cambio de estado. 

**Transiciones Válidas Permitidas**:
- `upcoming` → `betting` (cuando se abre la ventana de apuestas)
- `betting` → `live` (cuando comienza la pelea)
- `live` → `completed` (cuando termina la pelea y se registran resultados)
- `live` → `cancelled` (en caso de cancelación durante pelea)

**Transiciones INVÁLIDAS**:
- `upcoming` → `live` (debe pasar por `betting`)
- `betting` → `completed` (debe pasar por `live`)
- `completed` → `live` (no se puede reanudar pelea completada)

**Implementación Técnica**: 
- Validación en backend/src/routes/fights.ts:694-730
- Cada transición incluye validación de reglas de negocio (tiempo, usuarios conectados, apuestas activas)

---

## 🔄 FLUJO DE INTERMEDIOS (Admin/Operador)

Procedimiento técnico para pausas de intermedio entre peleas o por razones técnicas. El flujo de intermedios ocurre únicamente a nivel de OBS y NO requiere intervención del sistema backend ni llamadas a API.

### Detalles Técnicos de Implementación:
- **Nivel de operación**: Nivel OBS - No hay llamadas a API necesarias
- **Continuidad del stream**: El stream RTMP se mantiene activo (puerto 1935)
- **Comportamiento SSE**: No cambia la emisión de eventos SSE durante intermedios
- **Experiencia del usuario**: Continúa sin interrupción, solo cambia la escena

**Procedimiento recomendado**:
1. En OBS Studio, cambia a una escena de "Intermedio" o "Pausa"
2. NO detengas la transmisión RTMP
3. Mantén el evento en el estado actual (no cambies estados de pelea)
4. Al finalizar el intermedio, cambia de vuelta a la escena principal

---

## 📡 REFERENCIA DE API: Operaciones de Peleas

Documentación completa de la API HTTP para operaciones de peleas con especificaciones técnicas detalladas.

### PATCH /api/fights/:id/status - Abrir Ventana de Apuestas
- **HTTP Method**: PATCH
- **Request Payload**: `{ status: "betting" }`
- **Response Structure**: `{ success: boolean, data: Fight object, message?: string }`
- **SSE Broadcasts Triggered**: `event: "betting_window_opened", data: { fightId, timestamp, fighters }`
- **Side Effects**: Inicia temporizador de 3 minutos para aceptar PAGO bets

### PATCH /api/fights/:id/status - Iniciar Pelea
- **HTTP Method**: PATCH
- **Request Payload**: `{ status: "live" }`
- **Response Structure**: `{ success: boolean, data: Fight object, message?: string }`
- **SSE Broadcasts Triggered**: `event: "fight_started", data: { fightId, timestamp, durationSeconds }`
- **Side Effects**: Cierra automáticamente la ventana de apuestas, todas las apuestas PAGO/DOY pendientes expiran

### PATCH /api/fights/:id - Registrar Resultado (durante estado 'live')
- **HTTP Method**: PATCH
- **Request Payload**: `{ result: "red"|"blue"|"draw", notes?: string }`
- **Response Structure**: `{ success: boolean, data: Fight object, message?: string }`
- **SSE Broadcasts Triggered**: `event: "fight_result_recorded", data: { fightId, result, timestamp }`
- **Side Effects**: Marca el resultado para procesamiento de apuestas pendientes

### PATCH /api/fights/:id/status - Completar Pelea
- **HTTP Method**: PATCH
- **Request Payload**: `{ status: "completed" }`
- **Response Structure**: `{ success: boolean, data: Fight object, message?: string }`
- **SSE Broadcasts Triggered**: `event: "fight_completed", data: { fightId, result, timestamp, payoutsProcessed }`
- **Side Effects**: Liquida todas las apuestas asociadas a la pelea, distribuye ganancias, actualiza balances

---

**✅ Esta guía está verificada contra la implementación actual y es segura para uso en producción.**