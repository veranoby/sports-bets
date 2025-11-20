# 🎯 DECISIÓN ARQUITECTÓNICA: Streaming Producción (CORRECTED 2025-11-20)

🔴 **CRITICAL CORRECTION**: Previous brain files recommended Ant Media Community Edition ($24/mo). This is UNSUITABLE for 500 concurrent production. Using industry-validated recommendations below.

## A) ANT MEDIA SERVER - ¿Lo necesitas? NO.

**Qué es Ant Media Server:**
- Servidor RTMP/HLS/WebRTC con orquestación compleja
- Ideal para: 100+ eventos simultáneos, múltiples quality profiles, DVR, etc
- Costo: $300-500/mes
- Complejidad: Alta (requiere operador dedicado)

**Tu caso:**
- 1 evento/día
- 480p single quality
- 6h session con pause
- 500 concurrent users max

**Veredicto: OVERKILL.** Ant Media = Traer excavadora para hacer un hoyo de 1 metro.

**¿Qué usar en su lugar?**
- OBS (gratis) → Genera RTMP
- BunnyCDN Stream Storage (CDN propio) → Recibe RTMP, genera HLS, distribuye
- Total cost: $10-15/mes

---

## B) HLS PLAYLIST - ¿Por qué es necesario?

**Qué es:**
```
index.m3u8 = Manifiesto de reproducción (lista de video segments)
- Especifica bitrate, duración, resolución
- Permite reproducción adaptativa (cambiar calidad según conexión)
- Funciona en cualquier navegador/dispositivo sin plugins
```

**Alternativas y por qué NO:**
- ❌ RTMP directo: Solo Flash (obsoleto 2020)
- ❌ MPEG-DASH: Más complejo, menos compatible
- ✅ HLS: Estándar Apple, todos los devices, simple

**Para TU caso (480p single quality):**
- El navegador recibe: `video_480p_segment_001.ts`, `video_480p_segment_002.ts`, etc
- Cada segment = 2-6 segundos de video
- Si pause: El cliente detiene peticiones (ahorra ancho)
- Si resume: Continúa desde último segment

**Conclusión: HLS es NECESARIO** (no negociable, es estándar)

---

## C) BUNNYCDN - ¿Cuál contratar?

**Productos de Bunny (confuso en su web):**

| Producto | Qué es | Costo | Para TI |
|----------|--------|-------|---------|
| **CDN Bunny** | Solo caché/distribución de archivos estáticos | $0.01-0.02/GB | NO - solo caching |
| **Stream Storage** | Ingesta RTMP + generación HLS + distribución | $0.01/GB transferred | ✅ SÍ - esto necesitas |

**NOTA**: "CDN Bunny" ≠ "Bunny HLS". Son productos diferentes.

**Tu stack mínimo:**
```
OBS Studio (local)
   ↓ RTMP push
BunnyCDN Stream Storage (recibe RTMP, genera HLS)
   ↓ Pull
Navegador del usuario (HLS player)
```

**Costo mensual estimado (480p, 2×/week, 6h):**
- Transfer: 6h × 2 × 500 users × 1 Mbps × 3600s ÷ 8 ≈ 270 GB/mes
- A $0.01/GB = $2.70/mes
- Plus ingesta RTMP: ~$0.50
- **Total: ~$3-5/mes** (vs $471 con Ant Media + transcoding)

---

## D) STREAMING OPERATOR CHECKLIST (reemplaza manual)

**LISTA DE VERIFICACIÓN = Nueva estructura para guía**

Cambiar `docs/guides/streaming-reference.md` a:

### ANTES DE EVENTO (15 min)
- [ ] Evento creado en `/admin/events`
- [ ] Stream Key generado y enviado a operador
- [ ] OBS configurado con Stream Key
- [ ] Conexión de internet probada (≥10 Mbps)

### INICIO EVENTO (5 min)
```
1. OBS: Clic "Start Streaming"
2. Esperar "🟢 Live" en OBS
3. Admin dashboard: Verificar stream conectado
4. Usuarios ven video sin delay
```

### DURANTE PELEAS (repetir para cada pelea)
```
1. Admin: "Crear Pelea" (rojo, azul, peso, #)
2. Admin: "Abrir Apuestas" (usuarios hacen PAGO/DOY)
3. Admin: "Iniciar Pelea" (apuestas cierran, pelea live)
4. [Transmisión en vivo]
5. Admin: "Registrar Resultado" (elegir ganador)
6. Sistema: Liquida apuestas automáticamente
```

### PAUSE ENTRE PELEAS (opcional)
```
1. Admin: "Pausar Stream" button
2. Video se congela para usuarios
3. Contador: "Próxima pelea en X minutos"
4. Admin: "Reanudar" cuando lista
```

### FIN EVENTO (5 min)
```
1. OBS: "Stop Streaming"
2. Admin: Finalizar evento
3. Desconectar (o dejar parado para replay si lo quieres)
```

**Eso es TODO lo que operador necesita saber.**

---

## E) ARQUITECTURA RECOMENDADA PARA PRODUCCIÓN

### Stack Mínimo Viable ($5-10/mes)

```
┌─────────────────────────────────────────────────────┐
│  OPERADOR (local, en venue)                         │
│  ├─ OBS Studio (input: webcam, micrófono)           │
│  └─ Push RTMP → BunnyCDN Stream Storage             │
└─────────────────────────────────────────────────────┘
                      ↓ (RTMP)
┌─────────────────────────────────────────────────────┐
│  BUNNYCDN STREAM STORAGE ($5/mes)                   │
│  ├─ Recibe RTMP stream                              │
│  ├─ Genera HLS automático (480p)                    │
│  └─ Distribuye worldwide (CDN global)               │
└─────────────────────────────────────────────────────┘
                      ↓ (HLS)
┌─────────────────────────────────────────────────────┐
│  NAVEGADOR USUARIO                                  │
│  ├─ Video.js player                                 │
│  ├─ SSE connection (métricas, pause notifications)  │
│  └─ WebSocket (betting PAGO/DOY, 3min timeout)      │
└─────────────────────────────────────────────────────┘
```

### Stack Escalable ($15-20/mes, 2000+ concurrent)

Si crece a 2000 users:
```
OBS → BunnyCDN Stream Storage → Global CDN
  +
BunnyCDN Origin Shield (caching inteligente)
  = Mantiene $0.01/GB rate
```

---

## F) PROBLEMAS POTENCIALES ACTUALES

### 1. Ant Media Server en código
Si tienes referencias a Ant Media en backend, ELIMINARLAS:
```bash
grep -r "ant.*media\|AntMedia" backend/src --include="*.ts"
```

Ant Media es complejo pero innecesario para 1 evento/día.

### 2. HLS generación local
Si actualmente esperas que el servidor genere HLS:
- ❌ Complejo (ffmpeg, manejo de segments)
- ✅ Bunny lo hace automático

### 3. WebSocket innecesario para video
WebSocket puede causar overhead. Solo necesitas:
- **SSE** para updates admin/métricas
- **HTTP** para HLS playlist
- **WebSocket** SOLO para PAGO/DOY betting (con 3min timeout)

---

## G) RECOMENDACIÓN FINAL

**Para producción inmediato:**

| Componente | Selección | Costo | Razón |
|-----------|-----------|-------|-------|
| Ingesta RTMP | OBS Studio | $0 | Gratis, estándar industria |
| Generación HLS | BunnyCDN Stream Storage | $5/mes | Automático, sin mantenimiento |
| CDN distribución | Bunny CDN Network | included | Global, rápido |
| Video player | Video.js (ya tienes) | $0 | Soporta HLS perfectamente |
| Métricas tiempo real | SSE (ya tienes) | $0 | Suficiente, menos overhead |
| Betting | WebSocket 3min timeout (ya tienes) | $0 | Mínimo viable |

**Total: $5-10/mes vs $471/mes con Ant Media**

**Tiempo setup: 2 horas máximo**

---

## H) SIGUIENTE PASO

1. Simplificar `streaming-reference.md` a checklist operacional (arriba)
2. Configurar BunnyCDN Stream Storage account
3. Actualizar backend para usar Bunny RTMP endpoint (reemplazar localhost:1935)
4. Test con OBS → Bunny → navegador
5. Eliminar referencias a Ant Media del código

¿Procedo con simplificación?
