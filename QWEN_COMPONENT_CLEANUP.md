# QWEN CLI - COMPONENT CLEANUP SPRINT (24H)

## **OBJETIVO**: Limpieza sistemática de componentes no utilizados

### **TAREAS ASIGNADAS A QWEN:**

#### **1. Second Batch Component Removal (4 horas)**
Remove these 8 VERIFIED unused components:
```bash
rm -f src/components/shared/FightStatusIndicator.tsx
rm -f src/components/shared/PageContainer.tsx
rm -f src/components/shared/PageHeader.tsx
rm -f src/components/shared/StatsGrid.tsx
rm -f src/components/shared/StatusFilterDropdown.tsx
rm -f src/components/shared/UserEntityCard.tsx
rm -f src/components/user/BetHistoryTable.tsx
rm -f src/components/user/DetailModalConfigs.tsx
```

#### **2. Import Cleanup (2 horas)**
Search and remove any remaining imports of deleted components:
```bash
# Search pattern for imports:
grep -r "DatePicker\|NotificationBadge\|Tooltip\|Tabs\|AnalyticsDashboard" src/
grep -r "FightStatusIndicator\|PageContainer\|PageHeader" src/
```

#### **3. Bundle Size Verification (1 hour)**
After cleanup, verify build succeeds:
```bash
npm run build
# Check bundle size reduction
```

### **SAFETY RULES FOR QWEN:**
- ❌ **NEVER touch authentication files**
- ❌ **NEVER debug complex logic**
- ❌ **NEVER modify user flows**
- ✅ **ONLY remove specified files**
- ✅ **ONLY clean imports**
- ✅ **ONLY verify builds**

### **SUCCESS CRITERIA:**
1. ✅ 8 components successfully removed
2. ✅ No remaining import references
3. ✅ Frontend builds without errors
4. ✅ Dev server starts successfully

### **TIME LIMIT**: 7 horas máximo
### **SAFETY**: Max 30-minute sessions

### **REFERENCE**:
- Verified unused list: `/UNUSED_COMPONENTS_REPORT.md`
- First batch already removed successfully