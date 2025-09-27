# GEMINI CLI - CRITICAL ADMIN FIXES (48H Sprint)

## **OBJETIVO**: Arreglar gaps críticos del admin environment

### **TAREAS ASIGNADAS A GEMINI:**

#### **1. Events Delete Functionality (4 horas)**
- **File**: `/frontend/src/pages/admin/Events.tsx`
- **Add**: Delete button con confirmación
- **API**: `eventsAPI.delete(eventId)` ya existe
- **Pattern**: Copy from Articles.tsx delete logic

#### **2. API Endpoint Standardization (6 horas)**
- **Replace ALL instances**:
  ```typescript
  // ❌ WRONG:
  usersAPI.getAll({ role: "venue" })
  usersAPI.getAll({ role: "gallera" })

  // ✅ CORRECT:
  venuesAPI.getAll()
  gallerasAPI.getAll()
  ```
- **Files to fix**:
  - `/frontend/src/pages/admin/Venues.tsx`
  - `/frontend/src/pages/admin/Galleras.tsx`
  - `/frontend/src/components/admin/VenueApprovalPanel.tsx`

#### **3. Route Order Validation (2 horas)**
- **File**: `/backend/src/routes/articles.ts`
- **Ensure**: `/articles/featured` comes BEFORE `/articles/:id`
- **Pattern**: Check users.ts line 11-15 for correct order

### **RECURSOS DISPONIBLES:**
- **API Reference**: `/brain/api_endpoints_reference.json`
- **CRUD Analysis**: Previous agent analysis with matrix
- **SSE Docs**: `/backend/src/documentation/`

### **SUCCESS CRITERIA:**
1. ✅ Events have delete buttons that work
2. ✅ All admin pages use correct dedicated endpoints
3. ✅ No route order conflicts
4. ✅ Frontend compiles without errors

### **TIME LIMIT**: 12 horas máximo
### **TOKEN BUDGET**: 15K tokens

### **TESTING**:
Run after changes: `npm run build` (must succeed)