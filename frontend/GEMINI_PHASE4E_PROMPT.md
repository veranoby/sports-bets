# GEMINI - Phase 4E Execution Prompt

## 📋 PROMPT PARA COPIAR Y PEGAR

```
Eres GEMINI, un asistente de IA especializado en TypeScript y React. Tu tarea es eliminar 198 warnings de @typescript-eslint/no-explicit-any en el proyecto sports-bets/frontend.

**OBJETIVO**: Reducir warnings de 319 → 121 (eliminar 198 warnings de 'any')

**REGLAS CRÍTICAS - NO NEGOCIABLES**:
1. ❌ NO crear nuevas interfaces/types innecesarias
2. ❌ NO avanzar si TypeScript falla - revertir inmediatamente
3. ❌ NO hacer commits grandes - máximo 25 archivos
4. ✅ LEER archivo completo antes de modificar
5. ✅ BUSCAR tipo en types/index.ts PRIMERO
6. ✅ VALIDAR `npx tsc --noEmit` después de CADA edit
7. ✅ COMMIT incremental cada 20-25 casos exitosos

**PROTOCOLO PASO A PASO**:

1. **Identificar warnings**:
   ```bash
   npm run lint 2>&1 | grep "no-explicit-any" | head -20
   ```

2. **Para CADA warning**:
   - Leer archivo completo
   - Identificar el uso del parámetro `any`
   - Buscar tipo existente en `src/types/index.ts`
   - Si existe → importar y usar
   - Si NO existe → crear tipo inline basado en uso
   - Aplicar cambio
   - Validar: `npx tsc --noEmit`
   - Si falla → revertir, analizar error, ajustar
   - Si OK → continuar

3. **Commit cada 20-25 casos exitosos**:
   ```bash
   git add <archivos>
   git commit -m "[TYPES] Fix no-explicit-any warnings (batch X)

   Fixed X warnings in:
   - file1.tsx (line XX)
   - file2.tsx (line YY)

   TypeScript: 0 errors ✅
   Warnings reduced: -X

   🤖 Generated with Gemini
   Co-Authored-By: Gemini <noreply@google.com>"
   ```

**DOCUMENTOS REQUERIDOS** (leer antes de empezar):
1. ✅ GEMINI_PHASE4E_PROTOCOL.md - Protocolo completo paso a paso
2. ✅ GEMINI_PHASE4E_TYPES_REFERENCE.md - Referencia de tipos disponibles
3. ✅ PHASE4_TASK_ASSIGNMENT.md - Contexto y asignación de tareas

**TIPOS DISPONIBLES** (usar ESTOS primero):
- User, UserSubscription, UserRole
- Bet, BetData, BetSide, BetStatus
- Event, EventData, Fight
- Venue, Gallera
- Wallet, Transaction, PaymentMethod
- ApiResponse<T>, ApiError
- React event handlers: React.MouseEvent, React.ChangeEvent, React.FormEvent

**PATRONES COMUNES**:

Event handlers:
```typescript
onClick={(e: React.MouseEvent<HTMLButtonElement>) => ...}
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}
```

API responses:
```typescript
import type { User, ApiResponse } from '../../types';
const response: ApiResponse<User> = await api.getUser(id);
```

Inline types (cuando NO existe en types/):
```typescript
const handleData = (data: {
  property1: string;
  property2?: number;
}) => { ... }
```

**EJEMPLOS DE QUÉ NO HACER**:

❌ Crear interface innecesaria:
```typescript
interface UserData { ... } // NO - User ya existe
```

❌ Tipo muy genérico:
```typescript
const data: any = ... // NO
const data: Record<string, any> = ... // NO
```

❌ Avanzar sin validar:
```typescript
// NO editar 50 archivos y luego validar
// SÍ editar 1 archivo → validar → siguiente
```

**EJEMPLOS DE QUÉ SÍ HACER**:

✅ Usar tipo existente:
```typescript
import type { User } from '../../types';
const handleUser = (user: User) => { ... }
```

✅ Event handler correcto:
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

✅ Tipo inline específico:
```typescript
const handleData = (data: {
  membership_type?: string;
  assigned_username?: string;
}) => { ... }
```

**TRACKING DE PROGRESO**:

Mantener archivo GEMINI_PHASE4E_PROGRESS.md:
```markdown
# Phase 4E Progress

## Batch 1 (Commit 1) - 2025-12-27 10:00
- ✅ UserModal.tsx:85 - Fixed subscription type
- ✅ UserModal.tsx:137 - Fixed error response type
- ❌ UserModal.tsx:200 - SKIP: Complex API, needs investigation

Total: 2 fixed, 1 skipped

## Batch 2 (Commit 2) - 2025-12-27 10:30
...

## Summary
- Total warnings: 198
- Fixed: X
- Skipped: Y
- Remaining: 198 - X
```

**SI TE ATASCAS**:
1. Leer error completo de TypeScript
2. Buscar tipo en types/index.ts con otro nombre
3. Analizar código para ver propiedades accedidas
4. Si muy complejo → SKIP y documentar
5. Continuar con siguiente caso

**MÉTRICAS DE ÉXITO**:
- ✅ TypeScript: 0 errors
- ✅ Warnings: -198 (de 319 → 121)
- ✅ Commits: todos pasando build
- ✅ No código basura: 0 interfaces innecesarias

**COMENZAR AHORA**:
1. Leer GEMINI_PHASE4E_PROTOCOL.md completamente
2. Leer GEMINI_PHASE4E_TYPES_REFERENCE.md como referencia
3. Ejecutar: `npm run lint 2>&1 | grep "no-explicit-any" | head -20`
4. Seguir protocolo paso a paso para cada warning
5. Reportar progreso cada 20-25 casos
6. Documentar casos skipped con razón específica

¿Entendiste las instrucciones? Confirma que leíste los documentos y estás listo para comenzar.
```

---

## 📝 Notas para el Usuario (NO incluir en prompt)

**Antes de enviar a Gemini**:
1. ✅ Verificar que Gemini tiene acceso a los archivos del proyecto
2. ✅ Confirmar que Gemini puede ejecutar comandos (npm, git)
3. ✅ Asegurar que Gemini entiende el protocolo de validación
4. ✅ Dar acceso a los 3 documentos requeridos

**Durante la ejecución**:
- Monitorear progreso cada hora
- Revisar commits para asegurar calidad
- Detener si hay >3 errores consecutivos
- Solicitar progress report cada 20-25 casos

**Después de ejecución**:
- Validar TypeScript: `npx tsc --noEmit`
- Revisar warnings finales: `npm run lint 2>&1 | grep "warning" | wc -l`
- Verificar que no hay código basura (grep `interface.*Data\|_unused`)
- Test manual de funcionalidad crítica

**Rollback si es necesario**:
```bash
# Si algo sale mal:
git log --oneline -20  # Ver commits recientes
git revert <commit-hash>  # Revertir commit específico
# O
git reset --hard <good-commit-hash>  # Volver a estado anterior
```

---

## 🎯 Prompt Alternativo (si Gemini no entiende el primero)

**VERSIÓN SIMPLIFICADA**:

```
Tu tarea: Eliminar 198 warnings de "any" en TypeScript.

Protocolo:
1. npm run lint → encontrar warning de "any"
2. Leer archivo completo
3. Buscar tipo en src/types/index.ts
4. Si existe → usar ese tipo
5. Si NO existe → crear tipo inline
6. npx tsc --noEmit → validar (DEBE pasar)
7. Si falla → revertir y ajustar
8. Cada 20 casos → git commit

Tipos disponibles: User, Bet, Fight, Event, Venue, Gallera, ApiResponse<T>

React events:
- React.MouseEvent<HTMLButtonElement>
- React.ChangeEvent<HTMLInputElement>
- React.FormEvent<HTMLFormElement>

NO crear interfaces nuevas si existe el tipo.
NO avanzar si TypeScript falla.

Documentos: Lee GEMINI_PHASE4E_PROTOCOL.md completo.

¿Listo? Confirma y comienza.
```

---

## 🔍 Validación Post-Ejecución

**Checklist para validar el trabajo de Gemini**:

```bash
# 1. TypeScript sin errores
npx tsc --noEmit
# Debe mostrar: "0 errors"

# 2. Warnings reducidos
npm run lint 2>&1 | grep "warning" | wc -l
# Debe mostrar: ~121 (de 319 originales)

# 3. No código basura
grep -r "interface.*Data" src/components/ | grep -v "BetData\|EventData" | wc -l
# Debe mostrar: 0

# 4. No variables _unused
grep -r "_unused" src/
# Debe mostrar: 0 resultados

# 5. Commits limpios
git log --oneline -10
# Revisar mensajes de commit - deben seguir formato

# 6. Tipos importados correctamente
grep -r "from.*types" src/ | grep "import type" | wc -l
# Debe haber aumentado (más imports de tipos)

# 7. No any restantes (excepto documentados)
npm run lint 2>&1 | grep "no-explicit-any" | wc -l
# Debe mostrar: 0
```

**Si alguna validación falla**:
- Revisar commits de Gemini
- Identificar qué salió mal
- Revertir commits problemáticos
- Documentar lección aprendida
- Ajustar protocolo para futura ejecución

---

## 📞 Soporte durante Ejecución

**Si Gemini pregunta algo durante ejecución**:

| Pregunta | Respuesta |
|----------|-----------|
| "¿Creo nueva interface?" | NO. Buscar en types/index.ts primero. Si no existe, usar tipo inline. |
| "¿Qué tipo uso para X?" | Leer GEMINI_PHASE4E_TYPES_REFERENCE.md. Si no está ahí, analizar uso del código. |
| "TypeScript falla, ¿continúo?" | NO. Revertir cambio, analizar error, ajustar tipo. NO avanzar con errores. |
| "¿Cuántos archivos por commit?" | Máximo 25 archivos. Ideal 15-20. |
| "Este caso es muy complejo" | SKIP. Documentar en progress file. Continuar con siguiente caso. |

---

## ✅ Criterios de Aceptación

Al final de Phase 4E, Gemini debe entregar:

1. ✅ **0 errores TypeScript** - `npx tsc --noEmit` pasa
2. ✅ **-198 warnings removidos** - de 319 → 121
3. ✅ **Commits limpios** - mensajes descriptivos, builds pasando
4. ✅ **Progress file** - GEMINI_PHASE4E_PROGRESS.md actualizado
5. ✅ **Casos skipped documentados** - con razones específicas
6. ✅ **No código basura** - 0 interfaces innecesarias, 0 _unused variables
7. ✅ **Tipos correctos** - usando types de types/index.ts cuando existen
8. ✅ **Validación manual** - al menos 3 archivos revisados manualmente

Si algún criterio falla → trabajo NO aceptado, requiere corrección.
