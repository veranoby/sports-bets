# GEMINI - Phase 4E Protocol: TypeScript Any Cleanup
**Objetivo**: Eliminar 198 warnings de @typescript-eslint/no-explicit-any
**Meta**: 0 TypeScript errors, tipos correctos, código funcional

---

## 🔴 REGLAS CRÍTICAS - NO NEGOCIABLES

### ❌ PROHIBIDO:
1. **NO crear nuevas interfaces/types** a menos que sean absolutamente necesarias
2. **NO usar tipos genéricos excesivos** (`Record<string, unknown>`, `Map<any, any>`)
3. **NO avanzar si TypeScript falla** - revertir inmediatamente
4. **NO hacer commits grandes** - máximo 25 archivos por commit
5. **NO inventar nombres de propiedades** - usar solo las que existen en el código
6. **NO cambiar lógica** - solo cambiar tipos
7. **NO usar `as` casting** a menos que sea estrictamente necesario
8. **NO usar tipos de bibliotecas externas** sin verificar que estén disponibles

### ✅ OBLIGATORIO:
1. **Leer archivo completo** antes de hacer cualquier cambio
2. **Buscar tipo en types.ts PRIMERO** antes de crear inline type
3. **Validar tsc --noEmit** después de CADA edit
4. **Usar grep** para verificar uso de la variable/parámetro
5. **Commit incremental** cada 20-25 casos exitosos
6. **Documentar casos skipped** con razón específica

---

## 📋 Protocolo Paso a Paso

### PASO 1: Identificar el warning
```bash
npm run lint 2>&1 | grep "no-explicit-any" | head -20
```

Ejemplo de output:
```
src/components/admin/UserModal.tsx
  85:65  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

### PASO 2: Leer el archivo completo
```bash
# Leer TODO el archivo antes de modificar
cat src/components/admin/UserModal.tsx
```

**NO hacer suposiciones** - leer TODO el archivo para entender contexto.

### PASO 3: Identificar el uso del parámetro `any`

En línea 85:
```typescript
const handleSubscriptionSave = useCallback((subscriptionData: any) => {
  // ...
}, []);
```

**Analizar**:
- ¿Qué propiedades de `subscriptionData` se usan en el código?
- ¿Hay un tipo existente para esto?

### PASO 4: Buscar tipo existente en types.ts

```bash
# Buscar tipos relacionados con subscription
grep -n "interface.*Subscription\|type.*Subscription" src/types.ts
grep -n "membership_type\|assigned_username" src/types.ts
```

**Resultado**:
```typescript
// Si encuentras el tipo en types.ts:
import type { SubscriptionData } from '../types';

// Si NO encuentras el tipo → crear inline type
```

### PASO 5: Determinar el tipo correcto

**Opción A: Tipo existe en types.ts**
```typescript
import type { User, Subscription } from '../../types';

const handleSubscriptionSave = useCallback((subscriptionData: Subscription) => {
  // ...
}, []);
```

**Opción B: Tipo NO existe - crear inline**

Analiza el código para ver qué propiedades se usan:
```typescript
setPendingSubscription({
  membership_type: subscriptionData.membership_type || subscriptionData.type || "free",
  assigned_username: subscriptionData.assigned_username || "",
});
```

Tipo inline requerido:
```typescript
const handleSubscriptionSave = useCallback((subscriptionData: {
  membership_type?: string;
  type?: string;
  assigned_username?: string;
}) => {
  // ...
}, []);
```

**Opción C: Parámetro es event handler de React**
```typescript
// Para event handlers:
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
onClick={(e: React.MouseEvent<HTMLButtonElement>) => ...}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}
```

**Opción D: Parámetro es response de API**

Busca el tipo de response:
```typescript
// Si response tiene estructura conocida:
const response: { success: boolean; data?: User; error?: string } = await adminAPI.updateUser(...);

// Si response es complejo, usar inline:
const response: {
  success: boolean;
  data?: {
    user: User;
    token?: string;
  };
  error?: string;
} = await adminAPI.updateUser(...);
```

### PASO 6: Aplicar el cambio

```typescript
// ANTES
const handleSubscriptionSave = useCallback((subscriptionData: any) => {

// DESPUÉS
const handleSubscriptionSave = useCallback((subscriptionData: {
  membership_type?: string;
  type?: string;
  assigned_username?: string;
}) => {
```

### PASO 7: VALIDAR TypeScript

```bash
npx tsc --noEmit
```

**CRÍTICO**: Si hay CUALQUIER error:
1. Leer el error completo
2. Si el tipo es incorrecto → ajustar
3. Si hay error de propiedad faltante → agregar al tipo
4. Si no se puede resolver → **REVERTIR** y marcar como "skip"

### PASO 8: Commit incremental

Después de 20-25 casos **exitosos**:

```bash
git add <archivos-modificados>
git commit -m "[TYPES] Fix no-explicit-any warnings (batch X)

Fixed X warnings in:
- archivo1.tsx (line XX)
- archivo2.tsx (line YY)
...

TypeScript: 0 errors ✅
Warnings reduced: -X

🤖 Generated with Gemini
Co-Authored-By: Gemini <noreply@google.com>"
```

---

## 📚 Referencia de Tipos Comunes

### React Event Handlers
```typescript
// Mouse events
onClick={(e: React.MouseEvent<HTMLButtonElement>) => ...}
onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => ...}

// Form events
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}

// Keyboard events
onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => ...}
```

### API Response Pattern
```typescript
// Estructura típica de response:
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Uso:
const response: APIResponse<User> = await userAPI.get(id);
```

### Array/Object Generics
```typescript
// Arrays
const users: User[] = [];
const items: string[] = [];

// Objects como diccionarios
const userMap: Record<string, User> = {};
const config: Record<string, string | number> = {};

// Funciones
const handleClick: (id: string) => void = (id) => { ... };
const fetchData: () => Promise<User[]> = async () => { ... };
```

---

## 🚨 Casos Especiales - Cuando usar `any`

**SOLO en estos casos específicos está permitido mantener `any`:**

1. **Bibliotecas sin tipos**: Código que usa biblioteca externa sin @types
2. **JSON.parse sin estructura conocida**: Cuando realmente no conoces la estructura
3. **Callbacks de bibliotecas de terceros**: Cuando la firma es desconocida

**Marcar estos casos con comentario**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = JSON.parse(unknownString); // Unknown structure from external API
```

---

## 📊 Tracking de Progreso

Mantener un archivo `GEMINI_PHASE4E_PROGRESS.md`:

```markdown
# Phase 4E Progress

## Batch 1 (Commit 1)
- ✅ UserModal.tsx:85 - Fixed subscription type
- ✅ UserModal.tsx:137 - Fixed error response type
- ❌ UserModal.tsx:200 - SKIP: Complex API response, needs investigation
Total: 2 fixed, 1 skipped

## Batch 2 (Commit 2)
...

## Summary
- Total warnings: 198
- Fixed: X
- Skipped: Y
- Remaining: 198 - X
```

---

## ❌ Ejemplos de QUÉ NO HACER

### ❌ INCORRECTO: Crear interface innecesaria
```typescript
// NO hacer esto:
interface SubscriptionSaveData {
  membership_type?: string;
  type?: string;
  assigned_username?: string;
}

const handleSubscriptionSave = useCallback((subscriptionData: SubscriptionSaveData) => {
```

### ❌ INCORRECTO: Tipo muy genérico
```typescript
// NO hacer esto:
const handleChange = (e: any) => { ... }

// Hacer esto:
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

### ❌ INCORRECTO: Avanzar sin validar
```typescript
// NO hacer esto:
// 1. Editar 50 archivos
// 2. Commit todo junto
// 3. npx tsc --noEmit revela 20 errores
// 4. No saber qué cambio causó qué error

// Hacer esto:
// 1. Editar 1 archivo
// 2. npx tsc --noEmit → validar
// 3. Si OK → siguiente archivo
// 4. Cada 20-25 casos → commit
```

---

## ✅ Ejemplos de QUÉ SÍ HACER

### ✅ CORRECTO: Tipo inline específico
```typescript
const handleSubscriptionSave = useCallback((subscriptionData: {
  membership_type?: string;
  type?: string;
  assigned_username?: string;
}) => {
  setPendingSubscription({
    membership_type: subscriptionData.membership_type || subscriptionData.type || "free",
    assigned_username: subscriptionData.assigned_username || "",
  });
}, []);
```

### ✅ CORRECTO: Usar tipo existente
```typescript
import type { User } from '../../types';

const handleUserUpdated = (updatedUser: User) => {
  setUser(updatedUser);
};
```

### ✅ CORRECTO: Event handler tipado
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

---

## 🎯 Métricas de Éxito

Al final de Phase 4E:
- ✅ TypeScript compilation: **0 errors**
- ✅ Warnings reducidos: **-198** (de 319 → 121)
- ✅ Todos los commits: **build passing**
- ✅ No código basura: **0 interfaces innecesarias**
- ✅ Documentación: **casos skipped documentados**

---

## 🆘 Si te atascas

1. **Leer el error completo de TypeScript** - no asumir
2. **Buscar el tipo en types.ts** - puede que esté con otro nombre
3. **Analizar el uso en el código** - ver qué propiedades se acceden
4. **Si es muy complejo** → SKIP y documentar:
   ```markdown
   ## Skipped Cases
   - UserModal.tsx:200 - Complex nested API response, requires API investigation
   ```
5. **Continuar con siguiente caso** - no bloquearse en un caso difícil

---

## 📞 Preguntas Frecuentes

**Q: ¿Qué hago si el tipo no está en types.ts y es complejo?**
A: Crear tipo inline. Si se repite en múltiples archivos (>3), entonces sí crear interface.

**Q: ¿Puedo usar `unknown` en lugar de `any`?**
A: Sí, pero solo si realmente no conoces el tipo Y vas a hacer type checking después.

**Q: ¿Qué hago si TypeScript falla después de mi cambio?**
A: Revertir el cambio, analizar el error, ajustar el tipo. No avanzar con errores.

**Q: ¿Cuántos archivos debo modificar antes de commit?**
A: Máximo 25 archivos. Ideal: 15-20 archivos por commit.

**Q: ¿Qué hago con tipos de bibliotecas externas?**
A: Buscar `@types/nombre-biblioteca`. Si no existe, documentar como skip.
