# QWEN.md - GalloBets Safety-First Development Protocol

## **🚨 CRITICAL SAFETY NOTICE**
**QWEN has demonstrated DESTRUCTIVE behavior in GalloBets. These protocols are MANDATORY.**

**Project**: GalloBets - Professional Cockfighting Streaming Platform
**Stack**: React + TypeScript + Node.js + PostgreSQL
**QWEN Role**: EXTREMELY LIMITED - Only isolated, safe tasks
**Evidence**: Destroyed Profile.tsx, broke authentication, uses placeholder comments

---

## **🔴 QWEN DESTRUCTIVE INCIDENT LOG**

### **Incident #1: Profile.tsx Destruction**
```markdown
Date: 2025-09-18
File: frontend/src/pages/user/Profile.tsx
Damage: Replaced working code with placeholder comments
Impact: User profile editing completely broken
Recovery: Manual restoration by Claude
Pattern: {/* ... (content remains the same) ... */}
```

### **Incident #2: Authentication Breaking**
```markdown
Date: 2025-09-18
Files: AuthContext.tsx, api.ts
Damage: Modified auth flow breaking login
Impact: Users couldn't access system
Recovery: Git revert + Claude fixes
Pattern: Removed critical auth logic
```

### **Known Destructive Patterns**
1. **Placeholder Comments**: Replaces code with `{/* content */}`
2. **Logic Deletion**: Removes business logic claiming "optimization"
3. **Import Breaking**: Comments out necessary imports
4. **Type Destruction**: Replaces TypeScript with 'any'
5. **Hook Removal**: Deletes React hooks breaking components

---

## **🛡️ MANDATORY SAFETY PROTOCOLS**

### **ABSOLUTELY FORBIDDEN FILES**
```markdown
NEVER ALLOW QWEN TO MODIFY:
❌ frontend/src/pages/user/Profile.tsx
❌ frontend/src/contexts/AuthContext.tsx
❌ backend/src/routes/auth.ts
❌ frontend/src/services/api.ts
❌ Any Sequelize models
❌ Any database queries
❌ Any SSE/WebSocket code
❌ Any authentication logic
❌ Any betting business logic
❌ JWT token handling or session management
❌ Payment processing logic
❌ User role and permission systems
❌ Core business logic (betting/wallet/user critical paths)
❌ Database schema changes (NO model modifications)
❌ WebSocket/SSE real-time features
```

### **BEFORE ANY QWEN SESSION**
```bash
# MANDATORY BACKUP
git add .
git commit -m "BACKUP before QWEN session $(date +%Y%m%d_%H%M%S)"

# TEST CURRENT STATE
npm run dev  # Frontend must work
npm start    # Backend must work

# DOCUMENT WHAT WORKS
echo "Login: working" >> qwen_session.log
echo "Profile edit: working" >> qwen_session.log
echo "Betting: working" >> qwen_session.log
```

### **QWEN SESSION LIMITS**
```markdown
⏱️ Time: 30 minutes MAXIMUM
📝 Changes: 30 lines MAXIMUM
📁 Files: 1 file per session
✅ Testing: Every 10 lines
🚨 Abort: ANY error = immediate stop
```

---

## **✅ SAFE ZONE - APPROVED FOR MODIFICATION**

### **API Optimizations (SAFE)**
- ✅ API response pagination (READ-ONLY endpoints)
- ✅ Response structure optimization (data formatting only)
- ✅ Rate limiting middleware (protective measures)
- ✅ Performance monitoring enhancements
- ✅ Caching layer improvements (non-destructive)
- ✅ Payload size optimization and selective attributes
- ✅ Response time tracking and monitoring

### **Database Operations (READ-ONLY)**
- ✅ Query optimization analysis
- ✅ Index usage recommendations
- ✅ Performance monitoring queries
- ✅ Database health checks (non-destructive)
- ✅ Connection pool optimization (configuration only)
- ✅ Memory usage profiling and reporting

### **Frontend Enhancements (VISUAL ONLY)**
- ✅ UI component improvements (styling, layout)
- ✅ User experience enhancements (animations, transitions)
- ✅ Visual design polish (colors, spacing, typography)
- ✅ Responsive design improvements
- ✅ Accessibility enhancements
- ✅ Component size and modal optimizations
- ✅ CSS/Tailwind class additions
- ✅ Layout improvements (non-structural)

### **Configuration & Monitoring**
- ✅ Environment variable optimization
- ✅ Performance configuration tuning
- ✅ Cache configuration improvements
- ✅ Logging configuration enhancements
- ✅ Error tracking and reporting improvements
- ✅ Health check endpoint implementations

---

## **🎯 QWEN API OPTIMIZATION SPECIALIST**

### **ROLE DEFINITION**
- **Agent**: Qwen Coder
- **Phase**: API Optimization + Monitoring Enhancement (Expanded from Gemini)
- **Scope**: Safe API improvements with EXTREME safety protocols

### **COORDINATION PROTOCOL**

#### **Pre-Work Checklist**
1. ✅ **Read brain/performance_optimization.json** - Understand current optimization status
2. ✅ **Check claude-prompt.json** - Verify Claude's assigned tasks to avoid overlap
3. ✅ **Verify backend is running** - Ensure port 3001 is active and responding
4. ✅ **Safety validation** - Confirm all tasks are within SAFE ZONE

#### **Communication with Claude**
- **Status Updates**: Update brain files after each major completion
- **Error Reporting**: Document any blocking issues in brain/issues.json
- **Completion Notification**: Clear indication when phase is complete

#### **Progress Tracking**
```json
{
  "qwen_status": {
    "current_phase": "api_optimization",
    "tasks_completed": [],
    "tasks_in_progress": [],
    "tasks_pending": [],
    "issues_encountered": [],
    "coordination_notes": "Communication with Claude"
  }
}
```

### **SPECIFIC TASKS FOR QWEN**

#### **Phase 1: API Pagination Implementation**
**Target Endpoints (READ-ONLY)**:
- `GET /api/events` - Event listings
- `GET /api/articles` - Article listings
- `GET /api/venues` - Venue listings
- `GET /api/users?role=venue` - User listings (admin only)

**Implementation Pattern**:
```javascript
// Safe pagination with limits
const limit = Math.min(parseInt(req.query.limit) || 10, 50);
const offset = parseInt(req.query.offset) || 0;

// Response format
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 150,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### **Phase 2: Response Optimization**
**Selective Attributes by Endpoint**:
- **User minimal**: `["id", "username", "role", "isActive"]`
- **Event list**: `["id", "title", "status", "scheduledDate", "venue"]`
- **Article summary**: `["id", "title", "summary", "published_at", "author_name"]`

#### **Phase 3: Rate Limiting & Protection**
**Implementation**: Express middleware with safe defaults
```javascript
// Protective rate limiting (non-restrictive for normal users)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: 'Too many requests, please try again later'
});
```

#### **Phase 4: Monitoring Enhancement**
**Target File**: `backend/src/routes/monitoring.ts`
- Expand performance metrics collection
- Add API response time tracking
- Implement cache hit ratio monitoring
- Create health check comprehensiveness

### **QUALITY GATES**

#### **Before Each Implementation**
1. **File Safety Check**: Verify target file is in approved list
2. **Business Logic Validation**: Confirm no core business logic affected
3. **Reversibility Check**: Ensure changes can be rolled back
4. **Testing Strategy**: Plan verification approach

#### **After Each Implementation**
1. **Build Validation**: `npm run build` must pass
2. **API Functionality**: Test basic endpoint responses
3. **Performance Check**: Verify no degradation
4. **Safety Confirmation**: Re-verify no forbidden areas touched

### **AGENTS TO ACTIVATE**
1. **backend-architect** `--focus api --safe-mode`
2. **performance-engineer** `--delegate auto --safe-mode`
3. **quality-engineer** `--validate --safe-mode`

### **SUCCESS CRITERIA**

#### **API Optimization Targets**
- ✅ Consistent pagination across safe GET endpoints
- ✅ Response payload reduction: 20% (conservative target)
- ✅ Rate limiting protection implemented
- ✅ Zero breaking changes to existing functionality

#### **Monitoring Enhancement Targets**
- ✅ Performance monitoring dashboard fully functional
- ✅ Log noise reduction: 60%
- ✅ Health check comprehensiveness: +80%
- ✅ Cache hit ratio tracking operational

---

## **✅ QWEN SAFE TASKS ONLY**

### **Task 1: Simple TypeScript 'any' Cleanup**
```bash
# SAFE COMMAND TEMPLATE
qwen "Fix @typescript-eslint/no-explicit-any in [filename].tsx
🚫 Do NOT change any logic
🚫 Do NOT remove any code
🚫 Do NOT use placeholder comments
🚫 ONLY add type definitions
🚫 Maximum 10 type fixes
✅ Types must match actual usage
✅ Test compilation after each fix"

# Example safe fix:
# Before: const data: any = response.data;
# After:  const data: ApiResponse = response.data;
```

### **Task 2: New Test File Creation**
```bash
# SAFE - Creating NEW test files only
qwen "Create NEW test file [ComponentName].test.tsx
🚫 Do NOT modify existing files
🚫 Do NOT import complex logic
🚫 Use simple assertions only
✅ Follow existing test patterns
✅ Maximum 50 lines"
```

### **Task 3: Documentation Updates**
```bash
# SAFE - Documentation only
qwen "Update README.md section [section_name]
🚫 Do NOT modify code blocks
🚫 Do NOT change existing content
🚫 ONLY add new information
✅ Maximum 20 lines of text"
```

### **Task 4: Simple CSS Additions**
```bash
# SAFE - Style additions only
qwen "Add Tailwind classes to [Component].tsx
🚫 Do NOT change component logic
🚫 Do NOT modify state or props
🚫 Do NOT touch event handlers
✅ ONLY add className attributes
✅ Use existing Tailwind classes"
```

---

## **❌ NEVER USE QWEN FOR**

### **Database Work**
```markdown
FORBIDDEN - Claude ONLY:
- Query optimization (1-3 second issue)
- Connection pool fixes
- ETIMEDOUT error resolution
- Sequelize model changes
- Index creation
- Any SQL work
```

### **Real-Time Systems**
```markdown
FORBIDDEN - Claude designs, Gemini implements:
- SSE architecture
- WebSocket implementation
- EventSource management
- Real-time subscriptions
- Live updates
```

### **Authentication/Security**
```markdown
FORBIDDEN - Claude ONLY:
- Login/logout flow
- JWT handling
- Password management
- Role-based access
- Permission checks
```

### **Business Logic**
```markdown
FORBIDDEN - Claude ONLY:
- Betting window logic
- Fight status transitions
- PAGO/DOY proposals
- Wallet operations
- Operator hierarchy
```

### **Debugging/Error Resolution**
```markdown
FORBIDDEN - Claude ONLY:
- ANY error fixing
- Performance issues
- Integration problems
- Broken functionality
- Console error resolution
```

---

## **🚀 SAFE QWEN WORKFLOW**

### **Step 1: Pre-Session Checklist**
```bash
☐ Task is in SAFE category
☐ File not in FORBIDDEN list
☐ Git backup created
☐ Current functionality tested
☐ Session timer set (30 min)
☐ Claude available for validation
```

### **Step 2: Safe Command Structure**
```bash
qwen "[SPECIFIC SAFE TASK]

SAFETY RULES:
🚫 Do NOT delete any existing code
🚫 Do NOT use placeholder comments like {/* */}
🚫 Do NOT modify business logic
🚫 Do NOT change imports or hooks
🚫 Do NOT optimize working code
🚫 Do NOT touch authentication
🚫 MAXIMUM [X] lines changed

REQUIREMENTS:
✅ Preserve ALL existing functionality
✅ Test after every change
✅ Follow existing patterns exactly
✅ Add only what's specified"
```

### **Step 3: During Session Monitoring**
```bash
# Every 10 lines
npm run dev  # Must compile
npm test     # Must pass

# If ANY errors
echo "ERROR DETECTED - ABORTING" >> qwen_session.log
git reset --hard HEAD
# STOP QWEN IMMEDIATELY
```

### **Step 4: Post-Session Validation**
```bash
# Test critical paths
- [ ] Login still works
- [ ] Profile edit works
- [ ] Betting panel loads
- [ ] No console errors
- [ ] TypeScript compiles

# If anything broken
git reset --hard HEAD
# Request Claude to fix properly
```

---

## **🆘 EMERGENCY PROCEDURES**

### **If QWEN Breaks Something**
```bash
# IMMEDIATE ACTIONS
1. STOP QWEN - Do not let it "fix" the error
2. git reset --hard HEAD
3. Document what broke in qwen_incidents.log
4. Request Claude for proper implementation

# NEVER let QWEN debug its own errors
```

### **Recovery Commands**
```bash
# Nuclear reset (lose all changes)
git reset --hard HEAD

# Restore specific file
git checkout HEAD -- frontend/src/pages/user/Profile.tsx

# View what changed
git diff

# Emergency revert last commit
git revert HEAD
```

### **Incident Documentation**
```bash
# Log format for brain system
{
  "incident_date": "2025-09-21",
  "file_affected": "path/to/file",
  "damage_type": "placeholder_comments|logic_deletion|import_breaking",
  "recovery_method": "git_reset|manual_fix|claude_restoration",
  "pattern_identified": "Description of destructive pattern",
  "prevention_added": "New rule added to FORBIDDEN list"
}
```

### **Rollback Triggers**
- Compilation fails (`npm run build`)
- Any API endpoint returns errors
- Authentication stops working
- Core business logic affected

### **Escalation to Claude**
- Update brain/issues.json with problem description
- Immediate cessation of work
- Request architectural review
- Preserve system stability above all else

---

## **📊 QWEN SAFETY METRICS**

### **Safe Session Indicators**
```markdown
✅ No existing code deleted
✅ No placeholder comments used
✅ Scope limited to specification
✅ Tests passing throughout
✅ Session under 30 minutes
✅ Claude validation passed
```

### **Warning Signs - ABORT IMMEDIATELY**
```markdown
🚨 "Let me optimize this while I'm here"
🚨 "This code could be better written as..."
🚨 "Removing unnecessary complexity"
🚨 {/* ... */} comments appearing
🚨 Large code blocks being replaced
🚨 Import statements being modified
🚨 Authentication code being touched
```

---

## **🎯 QWEN APPROPRIATE TASKS**

### **TypeScript Cleanup (LIMITED)**
```typescript
// SAFE: Adding simple types
interface UserData {
  id: string;
  email: string;
  role: string;
}
const user: UserData = response.data; // was 'any'

// UNSAFE: Changing logic
// QWEN might "optimize" and break functionality
```

### **Test Templates (NEW FILES)**
```typescript
// SAFE: New test file creation
describe('Component', () => {
  it('renders without crashing', () => {
    render(<Component />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});

// UNSAFE: Complex test logic
// QWEN doesn't understand business rules
```

### **Documentation (ADDITIVE)**
```markdown
## SAFE: Adding new sections
### New Feature Documentation
This feature does...

## UNSAFE: Modifying existing docs
QWEN might delete important information
```

---

## **🧠 BRAIN SYSTEM COORDINATION**

### **Before QWEN Session**
```bash
# Check if task is safe
claude "Check brain/multi_ai_decision_matrix.json - is [task] safe for QWEN?"

# Get safety protocols
claude "From brain/multi_ai_coordination_strategy.json, what are QWEN restrictions for [task]?"
```

### **After QWEN Session**
```bash
# Report to Claude
claude "QWEN completed [task]. Changes:
- Files modified: [list]
- Lines changed: [count]
- Tests status: [passing/failing]
Please validate and optimize."

# Update brain if incidents
claude "Update brain/multi_ai_coordination_strategy.json with QWEN incident: [details]"
```

---

## **🎯 FINAL DELIVERABLES**
1. **Implementation Summary**: List of all changes made
2. **Performance Metrics**: Before/after comparisons
3. **Test Results**: Validation of all modified endpoints
4. **Brain Update**: Complete status in brain/performance_optimization.json
5. **Handoff Notes**: Ready for Claude's N+1 query optimization phase

---

## **⚠️ FINAL SAFETY REMINDERS**

### **QWEN IS NOT FOR:**
- 🚫 Debugging (will delete code)
- 🚫 Optimization (will break functionality)
- 🚫 Architecture (doesn't understand)
- 🚫 Complex tasks (will use placeholders)
- 🚫 Business logic (will destroy)

### **QWEN IS ONLY FOR:**
- ✅ Simple type additions
- ✅ New isolated files
- ✅ Documentation additions
- ✅ Basic CSS styling
- ✅ Template-based tasks
- ✅ API response optimization (READ-ONLY)
- ✅ Performance monitoring (non-destructive)

### **GOLDEN RULES:**
1. **BACKUP FIRST** - Always git commit
2. **TEST CONSTANTLY** - Every 10 lines
3. **LIMIT SCOPE** - 30 min, 30 lines max
4. **ABORT ON ERROR** - Never let QWEN "fix"
5. **CLAUDE VALIDATES** - Always have Claude check

---

## **SUCCESS FORMULA**

```
Safe Task Selection
+ Extreme Scope Limitation
+ Constant Testing
+ Immediate Abort on Issues
+ Claude Validation
= QWEN Session Without Destruction
```

**Remember**: QWEN has already broken authentication and Profile.tsx. These safety protocols exist because of real incidents. Follow them exactly or risk breaking the system again.

**Philosophy**: QWEN is a very limited tool for very specific tasks. When in doubt, use Claude or Gemini instead.

**Priority**: System stability > Minor improvements. Never risk breaking working functionality for small gains. Better to under-deliver safely than over-deliver with risks.