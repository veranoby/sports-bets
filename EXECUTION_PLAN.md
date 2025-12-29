# 🎯 PLAN DE EJECUCIÓN - Betting Refactor

## ✅ COMPLETADO (Sonnet):
- SQL migrations creadas (BETTING_UX_MIGRATIONS.sql)
- Prompts para Gemini y HAIKU listos
- 3 commits realizados (puedes hacer push)

---

## 📋 SECUENCIA DE EJECUCIÓN

### **PASO 1: TÚ - Ejecutar SQL Migrations en pgAdmin** ⏳ **AHORA**

**Archivo**: `BETTING_UX_MIGRATIONS.sql`

**Orden de ejecución**:
1. Migration 01: Fight.status 5→7 estados (~10 seg)
2. Migration 02: Agregar red_owner/blue_owner (~2 seg)
3. Migration 03: Múltiples apuestas por usuario (~3 seg)
4. Migration 04: Montos fijos [5,10,20,50,100,200,500] (~10-30 seg)

**IMPORTANTE**:
- Ejecutar EN ORDEN (no saltear)
- Tomar backup ANTES de Migration 04 (irreversible)
- Ver validation queries al final de cada migration

**Cuando termines**: Dime "SQL migrations ejecutadas exitosamente"

---

### **PASO 2: Sonnet - Backend Fight Model** ⏳ **Después de tus SQLs**

**Yo haré**:
- Actualizar `backend/src/models/Fight.ts` (7 estados)
- Actualizar `backend/src/controllers/fightController.ts` (nuevos endpoints)
- Crear endpoints: `openBetting`, `closeBetting`, `markReady`
- Commit backend changes

**Duración estimada**: 30-45 min
**Cuando termine**: Te diré "Backend listo, Gemini puede iniciar"

---

### **PASO 3: TÚ - Decirle a Gemini que inicie** ⏳ **Después del backend**

**Comando para Gemini**:
```
Lee el archivo gemini-prompt.json y ejecuta el refactor frontend completo.

IMPORTANTE:
- NO toques código WebSocket (HAIKU lo eliminará después)
- NO toques HLSPlayer (HAIKU lo eliminará después)
- NO toques backend (ya está actualizado)
- TypeScript debe compilar después de CADA archivo editado
- Commit cada 10-15 archivos

Reporta progreso cada fase completada.
```

**Duración estimada**: 2-3 horas (Gemini)

---

### **PASO 4: TÚ - Decirle a HAIKU que inicie** ⏳ **Después de Gemini**

**Pre-requisito**: Gemini debe confirmar "Frontend refactor completo"

**Comando para HAIKU**:
```
Lee el archivo claude-prompt.json y ejecuta las 3 tareas de limpieza:

1. Eliminar imports WebSocket (26 archivos)
2. Reemplazar HLSPlayer → VideoPlayer (5 archivos)
3. Eliminar archivos: WebSocketContext.tsx, useWebSocket.ts, HLSPlayer.tsx

REGLAS CRÍTICAS:
- TypeScript debe compilar después de CADA edit
- Si falla: REVERTIR inmediatamente
- Commit cada 5 archivos
- NO modificar otra lógica

Reporta cuando termines.
```

**Duración estimada**: 30-45 min (HAIKU)

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Cambio Principal | Impacto |
|------------|------------------|---------|
| **Database** | 7 estados, montos fijos, múltiples apuestas | Alto |
| **Backend** | Fight model + nuevos endpoints | Alto |
| **Frontend** | Eliminar DOY/PAGO, UI de 7 estados | Alto |
| **Cleanup** | Eliminar WebSocket/HLSPlayer | Medio |

---

## 🔍 VALIDACIÓN FINAL (Después de todo)

**Backend**:
```bash
cd backend
npm run build  # Debe compilar sin errores
```

**Frontend**:
```bash
cd frontend
npx tsc --noEmit  # 0 errors
npm run lint      # 0 errors (warnings OK)
npm run dev       # Probar manualmente
```

**Tests manuales**:
- [ ] Admin puede crear fight (estado: draft)
- [ ] Admin puede marcar scheduled → ready → betting_open
- [ ] Usuario puede crear apuesta con dropdown fijo [5,10,20,50,100,200,500]
- [ ] Usuario puede crear múltiples apuestas en misma pelea
- [ ] Auto-match funciona (PostgreSQL + notificación SSE)
- [ ] Admin puede cerrar betting (betting_open → in_progress)
- [ ] Streaming funciona con VideoPlayer (no HLSPlayer)
- [ ] NO hay referencias a WebSocket/DOY/PAGO

---

## 🚨 SI ALGO FALLA

**Durante SQL migrations**:
- Ver sección TROUBLESHOOTING en BETTING_UX_MIGRATIONS.sql
- Rollback scripts incluidos en cada migration

**Durante Gemini/HAIKU**:
- Si TypeScript falla: Revisar último commit
- Si necesario: `git revert <commit-hash>`
- Reportarme el error para análisis

---

## 📞 ESTADO ACTUAL

✅ Sonnet FASE 1: Completada
⏳ TÚ: Ejecutar SQLs en pgAdmin
⏸️ Sonnet FASE 2: Pendiente (después de tus SQLs)
⏸️ Gemini: Pendiente (después de backend)
⏸️ HAIKU: Pendiente (después de Gemini)

**Próxima acción**: Ejecuta los SQLs en pgAdmin y confírmame.
