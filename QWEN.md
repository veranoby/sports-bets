# QWEN CLI - GalloBets Optimized Development Protocol

## **🚨 CRITICAL SAFETY NOTICE**
**QWEN CLI has shown MCP timeout issues. These protocols optimize for QWEN CLI specific limitations.**

**Project**: GalloBets - Professional Cockfighting Streaming Platform
**Stack**: React + TypeScript + Node.js + PostgreSQL
**Tool**: QWEN CLI (External Tool) - NOT QWEN MCP
**QWEN CLI Role**: ESLint cleanup specialist with MCP timeout mitigation
**Evidence**: 60% MCP timeouts during 4h session, 18% completion rate (63/309 warnings)

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

## **🎯 QWEN CLI OPTIMIZATION SPECIALIST (V3)**

### **ROLE DEFINITION**
- **Tool**: QWEN CLI (External Command Line Tool)
- **Phase**: ESLint Warning Cleanup + TypeScript Improvements (Native QWEN CLI Tools)
- **Scope**: 45-60 minute focused sessions with MCP timeout mitigation
- **Critical Change**: Use QWEN CLI native tools first, fallback strategies when MCPs timeout

### **🚨 QWEN CLI MCP TIMEOUT PREVENTION PROTOCOL (V3)**

#### **Root Cause Analysis for QWEN CLI**
- **Primary Issue**: QWEN CLI's internal MCP error -32001 disrupted 60% of 4-hour session
- **Secondary Issue**: Hardware/connectivity insufficient for QWEN CLI MCP operations
- **Tertiary Issue**: Long sessions (4h) overwhelm QWEN CLI capabilities
- **Quaternary Issue**: Over-reliance on shell commands when QWEN CLI MCPs fail

#### **V3 Solution: QWEN CLI Native Tools + Fallback Strategies**
1. ✅ **Use QWEN CLI native tools first** - search_file_content, read_file, edit
2. ✅ **Immediate fallback** - When MCPs timeout, switch to run_shell_command
3. ✅ **45-60 minute focused sessions** - Single warning type completion
4. ✅ **End-session validation** - run_shell_command for npm run lint only at end

#### **New QWEN CLI Session Structure**
```
Session 1 (45-60 min): Single warning type focus
├─ search_file_content to find patterns
├─ read_file to understand context
├─ edit to make specific changes
├─ FALLBACK: Manual shell commands if MCPs timeout
└─ run_shell_command: npm run lint (validation at end)

Session Break: Commit + Report + Plan next session
```

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

## **✅ QWEN CLI SAFE TASKS ONLY (V3 - OPTIMIZED WORKFLOW)**

### **Task 1: Simple TypeScript 'any' Cleanup (QWEN CLI Optimized)**
```bash
# V3 QWEN CLI COMMAND TEMPLATE
qwen cli "Fix @typescript-eslint/no-explicit-any warnings - QWEN CLI OPTIMIZED

QWEN CLI MCP TIMEOUT PREVENTION:
🚫 NO complex multi-tool operations
🚫 NO immediate npm validation during work
🚫 NO shell commands unless MCPs fail
⏱️ MAXIMUM 45-60 minutes
🎯 FOCUS: Only 'explicit-any' warnings this session

QWEN CLI PREFERRED WORKFLOW:
✅ search_file_content ': any' to find all instances
✅ read_file to understand structure and context
✅ edit each ': any' to proper type
✅ FALLBACK: run_shell_command if MCPs timeout

FALLBACK COMMANDS (if MCPs timeout):
⚡ run_shell_command "grep -rn ': any' src/ | head -20"
⚡ run_shell_command "sed -i 's/: any/: ApiResponse/g' src/file.ts"

SAFETY RULES:
🚫 Do NOT change any logic
🚫 Do NOT remove any code
🚫 Do NOT use placeholder comments like {/* */}
🚫 ONLY add type definitions
🚫 Focus on single warning type
✅ Types must match actual usage
✅ Complete category before moving to next"
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

### **Step 2: QWEN CLI Optimized Command Structure (V3)**
```bash
qwen cli "[SPECIFIC SAFE TASK - QWEN CLI NATIVE TOOLS + FALLBACK]

QWEN CLI MCP TIMEOUT PREVENTION:
🚫 NO complex multi-step MCP operations
🚫 NO immediate validation during work
🚫 NO shell commands unless MCPs timeout
⏱️ MAXIMUM 45-60 minutes per session
🎯 SINGLE warning type focus per session

QWEN CLI NATIVE TOOLS PREFERRED:
✅ search_file_content to find patterns
✅ read_file to understand context
✅ edit to make specific changes
✅ glob for file discovery

FALLBACK WHEN MCPs TIMEOUT:
⚡ run_shell_command with exact commands:
   - grep -rn 'pattern' src/
   - sed -i 's/old/new/g' filename
   - npm run lint (validation only)

SAFETY RULES:
🚫 Do NOT delete any existing code
🚫 Do NOT use placeholder comments like {/* */}
🚫 Do NOT modify business logic
🚫 Do NOT change imports or hooks
🚫 Do NOT optimize working code
🚫 Do NOT touch authentication

REQUIREMENTS:
✅ Preserve ALL existing functionality
✅ Use QWEN CLI tools strategically
✅ Follow existing patterns exactly
✅ Add only what's specified
✅ Complete single warning type per session"
```

### **Step 3: QWEN CLI Session Monitoring (V3)**
```bash
# During 45-60min focused session
FOCUS ON SINGLE WARNING TYPE ONLY
search_file_content → read_file → edit → Continue

# PREFERRED workflow (when QWEN CLI MCPs work):
# search_file_content 'pattern'  ✅ (QWEN CLI native)
# read_file filename              ✅ (QWEN CLI native)
# edit filename                   ✅ (QWEN CLI native)

# FALLBACK workflow (when QWEN CLI MCPs timeout):
# run_shell_command "grep -rn 'pattern' src/"
# run_shell_command "sed -i 's/old/new/g' filename"

# If QWEN CLI MCP fails:
Switch immediately to manual commands
Document which MCPs failed for future optimization
Continue with run_shell_command approach

# Session end signal:
COMPLETE single warning type (e.g., all unused-vars)
THEN validate with run_shell_command "npm run lint"
```

### **Step 4: QWEN CLI End-Session Validation (V3)**
```bash
# END of 45-60min session validation
# Use run_shell_command for validation in same session

run_shell_command "npm run lint | tail -10"  # Check warning count
# Success: commit changes and report progress
# Failure: analyze what went wrong, selective rollback

# Critical validation points:
- [ ] Target warning type significantly reduced
- [ ] No new errors introduced
- [ ] Files still compile
- [ ] Specific progress measurable (e.g., 50 → 30 unused-vars)

# If validation fails:
Analyze specific failures
run_shell_command "git checkout -- [problematic-files]"
Report partial success and lessons learned
Plan next session focus area
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

## **LESSONS LEARNED FROM COMPONENT ANALYSIS MISTAKES**

### **Analysis Failure Root Causes**
1. **Incomplete Import Tracing**: Only analyzed direct page imports, missing layout components and nested dependencies
2. **Assumption-Based Analysis**: Made assumptions about component usage based on names rather than verification
3. **Manual Tracing Limitations**: Relied on manual dependency tracing instead of systematic tooling
4. **Shallow Dependency Analysis**: Failed to trace beyond first-level imports

### **Improved Strategies for Component Analysis**

#### **1. Automated Component Dependency Analysis**
- Use `search_file_content` to systematically search for import statements for each component
- Create automated scripts that scan the entire codebase for component usage
- Generate comprehensive reports with verified data rather than assumptions

#### **2. Systematic Verification Process**
- For each component, perform a project-wide search for import statements
- Check for both direct and dynamic imports
- Verify usage across all directories (`pages`, `layouts`, `components`, `hooks`, `contexts`, etc.)
- Document findings with evidence (import statements found)

#### **3. Cross-Reference Validation**
- Validate findings through multiple verification methods
- Cross-reference component usage with actual application functionality
- Test application behavior after component removal (in development environment)
- Verify component imports in both development and production builds

#### **4. Incremental Analysis Approach**
- Break down large analysis tasks into smaller, manageable chunks
- Analyze components in batches by directory or type
- Create intermediate reports for each batch
- Validate findings progressively rather than all at once

#### **5. Tool Optimization**
- Leverage available tools more effectively
- Use `glob` to generate complete component lists
- Use `search_file_content` for systematic import verification
- Use `read_file` and `read_many_files` strategically for detailed analysis
- Combine tools for maximum efficiency

#### **6. Documentation and Reporting Standards**
- Create standardized documentation for analysis results
- Use clear, consistent formatting for reports
- Include methodology and verification evidence
- Separate verified findings from assumptions
- Maintain version control for analysis reports

#### **7. Risk Mitigation**
- Implement safeguards to prevent incorrect conclusions
- Always verify before making definitive claims
- Include disclaimers about analysis limitations
- Recommend verification before taking action
- Create backup plans for incorrect analysis

### **Key Takeaways**
1. **Never assume component usage**: Always verify through systematic search
2. **Check all import paths**: Include layouts, shared components, and App.tsx
3. **Use automated tools**: Manual tracing is error-prone and incomplete
4. **Validate findings**: Cross-reference with actual application behavior
5. **Document methodology**: Create reproducible analysis processes
6. **Avoid false positives**: Components flagged as unused may be critical

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