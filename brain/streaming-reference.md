# 📺 GUÍA DE OPERADOR DE STREAMING - GalloBets

Instrucciones simples para transmitir eventos de gallos. **Una página, sin tecnicismos.**

---

## ✅ ANTES DEL EVENTO (15 minutos antes)

1. **Evento creado en `/admin/events`**
   - Admin ha creado el evento y asignado una hora

2. **Stream Key generado**
   - Admin proporciona la clave de streaming al operador

3. **OBS Studio configurado**
   - URL: `rtmp://[servidor]/live` (proporcionado por admin)
   - Clave: Pegada en OBS
   - Probar: Clic "Preview Stream" en OBS

4. **Conexión de internet lista**
   - Prueba: `speedtest.net` o similar
   - Mínimo: **10 Mbps de subida**
   - Tipo: **Conexión directa** (no WiFi si es posible)

---

## 🟢 INICIAR TRANSMISIÓN (5 minutos)

```
PASO 1: En OBS, clic "Start Streaming"
        ↓
PASO 2: Esperar a que aparezca "🟢 Live" (color verde)
        ↓
PASO 3: Decir al admin: "Stream iniciado"
        ↓
PASO 4: Admin verifica en dashboard que conectó
        ↓
✅ TRANSMISIÓN ACTIVA - Los usuarios ven video en tiempo real
```

---

## 🥊 DURANTE EL EVENTO (Repetir para cada pelea)

Para cada pelea que se va a transmitir:

```
1. ADMIN CREA LA PELEA
   - Especifica: Gallo rojo, gallo azul, peso, número de pelea
   - Clic: "Crear Pelea"

2. ADMIN ABRE APUESTAS
   - Los usuarios ven la pelea y comienzan a hacer apuestas PAGO/DOY
   - Clic: "Abrir Apuestas"
   - OPERADOR: Verifica que el audio y video sean claros

3. ADMIN INICIA PELEA
   - Apuestas se cierran automáticamente
   - Pelea comienza (transmisión en vivo)
   - OPERADOR: Mantén la cámara enfocada en los gallos

4. [TRANSMISIÓN VIVA]
   - La pelea se transmite
   - El operador monitorea la conexión en OBS
   - Si color rojo aparece = problema de conexión, reinicia streaming

5. PELEA TERMINA
   - Admin registra el resultado (quién ganó)
   - Sistema liquida apuestas automáticamente
   - Pausa de X minutos antes de la siguiente pelea
```

---

## ⏸️ PAUSAR TRANSMISIÓN (Opcional, entre peleas)

Para ahorrar ancho de banda mientras se prepara la siguiente pelea:

```
PASO 1: Admin clic "Pausar Stream"
        ↓
PASO 2: Video se congela para los usuarios (muestran último frame)
        ↓
PASO 3: Aparece contador: "Próxima pelea en X minutos"
        ↓
PASO 4: Cuando admin está listo, clic "Reanudar"
        ↓
✅ Transmisión vuelve a fluir normalmente
```

**Nota:** El operador NO hace nada durante pause. Es un botón de admin.

---

## 🛑 TERMINAR TRANSMISIÓN (5 minutos después del evento)

```
PASO 1: En OBS, clic "Stop Streaming"
        ↓
PASO 2: Esperar "🔴 Stopped" (color rojo)
        ↓
PASO 3: Decir al admin: "Stream detenido"
        ↓
PASO 4: Admin finaliza el evento en dashboard
        ↓
✅ EVENTO TERMINADO
```

---

## 🚨 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| OBS muestra color **rojo** | Conexión perdida. Reinicia OBS "Stop" → "Start" |
| Video **lento/entrecortado** | Velocidad de internet baja. Acércate al router o usa cable |
| Audio **inaudible** | Verifica micrófono en OBS. Sube volumen |
| Admin no ve el stream | Espera 10 segundos. Si persiste, reinicia OBS |
| Admin ve video pero usuarios no | Problema de CDN. Admin debe verificar URL distribución |

---

## 📝 CHECKLIST FINAL

Antes de empezar cada evento:

- [ ] Conexión de internet ≥10 Mbps
- [ ] OBS instalado y configurado
- [ ] Stream Key pegada en OBS
- [ ] Evento creado en `/admin/events`
- [ ] Admin confirmó que está listo
- [ ] Cámara enfocada en los gallos
- [ ] Micrófono funcionando
- [ ] OBS muestra "🟢 Live" cuando empieza

---

**Eso es TODO.** No necesitas saber más. El resto lo hace el sistema automáticamente.

Si algo falla, contacta al admin.
