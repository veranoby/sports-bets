# Phase 4 - Task Assignment Analysis
**Fecha**: 2025-12-27
**Warnings Restantes**: 319

## 📊 Distribución de Warnings

| Tipo | Cantidad | Complejidad | Riesgo | Tokens Estimados |
|------|----------|-------------|--------|------------------|
| @typescript-eslint/no-explicit-any | 198 | ALTA | ALTO | 80K-100K |
| @typescript-eslint/no-unused-vars | 113 | BAJA | BAJO | 30K-40K |
| react-hooks/exhaustive-deps | 5 | MUY ALTA | CRÍTICO | 15K-20K |
| react-refresh/only-export-components | 3 | BAJA | BAJO | 5K |

## 🎯 Asignación de Tareas

### **SONNET (Claude Code) - Phase 4D**
**Responsabilidad**: @typescript-eslint/no-unused-vars (113 casos)

**Justificación**:
- ✅ Baja complejidad (similar a Phase 4C)
- ✅ Bajo riesgo de romper funcionalidad
- ✅ Ya tiene experiencia exitosa (Phase 4C: -27 warnings sin errores)
- ✅ Puede validar con grep antes de remover
- ✅ Tokens disponibles: 100K (suficiente para ~113 casos)

**Scope**:
- Remover imports no utilizados
- Remover variables no utilizadas
- Remover destructuring no utilizado
- Validar cada cambio con grep
- Commit incremental por cada 10-15 archivos

**Estimado**: 35-45K tokens, ~2-3 horas

---

### **GEMINI - Phase 4E**
**Responsabilidad**: @typescript-eslint/no-explicit-any (198 casos)

**Justificación**:
- ⚠️ Alta complejidad (requiere análisis de tipos, contexto de datos)
- ⚠️ Alto riesgo si se tipifica incorrectamente
- ✅ Gemini demostró mejor performance que Qwen en Phase 4B
- ✅ Tiene capacidad de contexto largo
- ❌ NO CONFIAR - requiere protocolo estricto de validación

**Scope**:
- Tipificar parámetros `any` con tipos apropiados
- Priorizar tipos de shared/types.ts
- NO crear nuevos tipos innecesarios
- Validar TypeScript (0 errors) antes de cada commit
- Commits incrementales por cada 20-25 casos

**Protocolo ESTRICTO**:
1. Leer archivo completo antes de modificar
2. Verificar uso del parámetro/variable
3. Buscar tipo existente en types.ts
4. Si no existe tipo → usar tipo inline (no crear new interface)
5. Validar tsc --noEmit después de CADA edición
6. Si validation falla → revertir y marcar como "skip"
7. Commit cada 20-25 casos exitosos

**Estimado**: 80-100K tokens (Gemini), ~4-6 horas

---

### **NO ASIGNAR (Pendiente para futuro con más análisis)**
**Responsabilidad**: react-hooks/exhaustive-deps (5 casos)

**Justificación**:
- 🔴 MUY ALTA complejidad (React hooks, dependency arrays, closures)
- 🔴 RIESGO CRÍTICO (puede causar infinite loops, stale closures, bugs sutiles)
- 🔴 Requiere expertise profundo en React y hooks
- ✅ Solo 5 casos - manejable en sesión futura

**Archivos afectados** (para referencia futura):
1. src/components/betting/BetSuggestionsPanel.tsx:30
2. src/pages/admin/Finance.tsx:112
3. src/hooks/useMultiSSE.ts:157, 165, 173

**Scope futuro** (cuando Sonnet tenga más tokens):
- Analizar cada hook individualmente
- Entender flujo de datos y dependencias
- Aplicar fixes de Phase 4B como referencia
- Validar comportamiento en runtime (no solo TypeScript)
- Testing manual después de cada fix

---

### **NO ASIGNAR (Trivial - hacer en cleanup final)**
**Responsabilidad**: react-refresh/only-export-components (3 casos)

**Justificación**:
- ✅ Muy baja complejidad (mover exports a archivo separado)
- ✅ Muy bajo riesgo
- ⏱️ Solo 3 casos - no vale la pena delegación
- 📋 Mejor hacerlo en cleanup final de Phase 4

**Archivos afectados**:
1. src/contexts/WebSocketContext.tsx:53

---

## 📋 Plan de Ejecución Recomendado

### Fase 1: SONNET (Claude Code) - AHORA
- **Task**: Phase 4D - no-unused-vars (113 casos)
- **Tiempo**: ~2-3 horas
- **Output**: Commits limpios, 0 TypeScript errors
- **Validación**: Grep verification, tsc --noEmit
- **Meta**: Reducir de 319 → ~206 warnings

### Fase 2: GEMINI - SIGUIENTE SESIÓN
- **Task**: Phase 4E - no-explicit-any (198 casos)
- **Tiempo**: ~4-6 horas (Gemini)
- **Output**: Tipos correctos, validación estricta
- **Validación**: tsc --noEmit después de CADA edit
- **Meta**: Reducir de ~206 → ~8 warnings

### Fase 3: SONNET (futuro) - SESIÓN DEDICADA
- **Task**: Phase 4F - exhaustive-deps (5 casos)
- **Tiempo**: ~1-2 horas (análisis profundo)
- **Output**: Dependency arrays correctos, sin bugs
- **Validación**: Runtime testing + tsc validation
- **Meta**: Reducir de ~8 → ~3 warnings

### Fase 4: Cleanup Final
- **Task**: react-refresh/only-export-components (3 casos)
- **Tiempo**: 15 minutos
- **Meta**: 0 warnings 🎉

---

## 🎓 Lecciones Aprendidas (de Phase 4B)

### ✅ LO QUE FUNCIONÓ:
1. **Commits incrementales** - Facilita rollback si algo falla
2. **Validación TypeScript después de cada cambio** - Detecta errores temprano
3. **Grep verification** - Confirma que variables/imports realmente no se usan
4. **Protocolo estricto** - Reduce errores por malentendidos

### ❌ LO QUE NO FUNCIONÓ:
1. **Confiar en AI sin validación** - Qwen creó código basura
2. **Permitir "creative freedom"** - AI inventó variables innecesarias
3. **Instrucciones ambiguas** - Resultó en interpretaciones incorrectas
4. **Batch commits grandes** - Dificulta identificar qué cambio causó error

### 🔧 APLICAR EN PHASE 4D/4E:
1. **Validation gate después de CADA edit** - No avanzar si tsc falla
2. **Instrucciones ultra-específicas** - No dejar espacio a interpretación
3. **Ejemplos concretos** - Mostrar exactamente qué hacer y qué NO hacer
4. **Rollback protocol** - Si algo falla, revertir inmediatamente
5. **Incremental commits** - Máximo 20-25 archivos por commit

---

## 📦 Entregables para AIs Externas

### Para GEMINI (Phase 4E):
1. **GEMINI_PHASE4E_PROTOCOL.md** - Protocolo estricto paso a paso
2. **GEMINI_PHASE4E_EXAMPLES.md** - Ejemplos de tipificación correcta
3. **GEMINI_PHASE4E_FORBIDDEN.md** - Lista de cosas prohibidas
4. **types_reference.txt** - Lista completa de tipos disponibles en types.ts

### Prompt Recomendado para GEMINI:
Ver archivo `GEMINI_PHASE4E_PROMPT.md`

---

## 🚫 NO Delegar a QWEN

**Razón**: Phase 4B demostró problemas consistentes:
- Creación de código basura (_unused variables)
- No seguimiento estricto de protocolos
- Errores de ortografía en nombres de variables
- No validación antes de entregar
- Interpretación creativa de instrucciones

**Decisión**: QWEN no participará en Phase 4 cleanup. Solo tareas de documentación sin código.
