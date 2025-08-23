# 🛠️ Debug Tools - Herramientas de Testing de Roles

Este conjunto de herramientas fue creado para facilitar el testing y debugging de diferentes roles durante el desarrollo.

## 📋 Componentes Incluidos

### 1. **RoleSwitcher.tsx**
Componente flotante en la esquina inferior derecha que permite cambiar de rol fácilmente.

**Funcionalidades:**
- Cambio rápido entre los 5 roles disponibles (`user`, `admin`, `operator`, `venue`, `gallera`)
- Indicador visual del rol actual
- Información descriptiva de cada rol
- Solo visible en modo desarrollo

**Uso:**
- Aparece automáticamente en la esquina inferior derecha
- Click en el botón para abrir el panel
- Selecciona un rol para cambiar (recarga la página automáticamente)

### 2. **DebugPanel.tsx**
Panel de información detallada sobre el estado de la aplicación.

**Funcionalidades:**
- Información del usuario actual
- Estado de conexión WebSocket
- Información del sistema y ambiente
- Botones de acción para limpiar datos y logging
- Información de performance

**Uso:**
- Botón toggle en la esquina superior derecha
- Panel desplegable con información completa
- Botón refresh para actualizar información
- Funciones de limpieza y logging

### 3. **DebugTestPage.tsx**
Página completa de testing accesible en `/debug`

**Funcionalidades:**
- Vista completa de todos los roles disponibles
- Descripción de funciones por rol
- Enlaces directos a rutas importantes
- Cambio de rol integrado
- Información de issues conocidos

**Uso:**
- Navega a `http://localhost:5173/debug`
- Vista completa de testing de roles
- Botones para cambiar roles y navegar

### 4. **useDebug.ts**
Hook personalizado con utilidades de debug.

**Funcionalidades:**
- Sistema de logging avanzado
- Usuarios mock para testing
- Información de performance
- Utilidades de cambio de rol
- Toggle de modo debug

**API:**
```typescript
const {
  isDebugMode,    // boolean: si está en modo debug
  logs,           // DebugLog[]: array de logs
  log,            // function: agregar log
  clearLogs,      // function: limpiar logs
  switchRole,     // function: cambiar rol
  getMockUser,    // function: obtener usuario mock
  toggleDebugMode // function: toggle modo debug
} = useDebug();
```

## 🚀 Cómo Usar

### Activación Automática
Las herramientas se activan automáticamente en modo desarrollo (`npm run dev`).

### Navegación de Testing
1. Ve a `http://localhost:5173/debug` para la página completa de testing
2. Usa el RoleSwitcher flotante para cambios rápidos
3. Usa el DebugPanel para información detallada

### Cambio de Roles
1. **Método 1:** RoleSwitcher flotante → seleccionar rol → automático reload
2. **Método 2:** Página /debug → botón "Cambiar a [Rol]" → automático reload
3. **Método 3:** Hook useDebug → `switchRole('admin')` → manual reload

### Logging de Debug
```typescript
const { log } = useDebug();

log('info', 'Mensaje de información');
log('warn', 'Mensaje de advertencia');
log('error', 'Mensaje de error', errorData);
log('success', 'Operación exitosa');
```

## 🔧 Configuración

### Variables de Ambiente
```env
VITE_NODE_ENV=development  # Requerido para mostrar tools
```

### LocalStorage Keys Utilizados
- `debug_mode`: boolean - Estado del modo debug
- `debug_role`: string - Rol actual para testing  
- `debug_user`: JSON - Usuario mock actual

### URLs de Testing Importantes
- `/debug` - Página principal de testing
- `/user` - Dashboard de usuario
- `/admin` - Dashboard de administrador
- `/operator` - Dashboard de operador
- `/venue` - Dashboard de gallera owner
- `/gallera` - Dashboard de escritor

## 📊 Roles Disponibles

### 👤 **User** (`user`)
- Dashboard con eventos del día
- Sistema premium con SubscriptionGuard
- Navegación móvil bottom
- Estados vacíos mejorados

### 🛡️ **Admin** (`admin`)
- Métricas del sistema completas
- Gestión de usuarios, eventos, finanzas
- Panel de monitoreo
- Control de retiros

### ⚙️ **Operator** (`operator`)
- Dashboard con WebSocket en tiempo real
- Control de peleas en vivo
- Gestión de streaming
- Live stats y métricas

### 🏢 **Venue** (`venue`)
- Gestión de galleras propias
- Creación y gestión de eventos
- Estadísticas detalladas por evento
- Formularios con validación

### ✍️ **Gallera** (`gallera`)
- Gestión de artículos y contenido
- Estadísticas de escritor
- Sistema de estados de artículos
- Navegación a artículos individuales

## 🚨 Consideraciones Importantes

### Seguridad
- **Solo funciona en desarrollo** (`import.meta.env.DEV`)
- No está disponible en producción
- Los usuarios mock no persisten en BD

### Limitaciones
- El cambio de rol requiere reload de página
- Los datos mock son temporales
- WebSocket puede necesitar reconexión después del cambio

### Performance
- Los componentes usan lazy loading
- Logging limitado a 50 entradas máximo
- Panel de debug se puede minimizar

## 🐛 Troubleshooting

### Las herramientas no aparecen
1. Verificar que `NODE_ENV=development`
2. Verificar que `import.meta.env.DEV === true`
3. Recargar página

### Cambio de rol no funciona
1. Verificar consola del navegador por errores
2. Limpiar localStorage: `localStorage.clear()`
3. Hard refresh: `Ctrl+F5`

### Issues conocidos
- Operator Dashboard: Error de hoisting **CORREGIDO** ✅
- Premium features: Flujo de upgrade **VERIFICADO** ✅
- Empty states: Mejorados en todos los roles **COMPLETADO** ✅

## 📝 Logs y Debugging

### Consola del Navegador
```javascript
// Ver estado completo de debug
window.localStorage

// Limpiar datos de debug
Object.keys(localStorage)
  .filter(key => key.startsWith('debug_'))
  .forEach(key => localStorage.removeItem(key));

// Habilitar modo debug manualmente
localStorage.setItem('debug_mode', 'true');
```

### Información de Performance
```javascript
const { getPerformanceInfo } = useDebug();
console.log(getPerformanceInfo());
```

---

**Creado para:** Proyecto Sports-Bets  
**Versión:** 1.0  
**Fecha:** 2025-08-23  
**Autor:** Claude AI Assistant

> ⚠️ **Importante**: Estas herramientas solo están disponibles en modo desarrollo y no afectan el código de producción.