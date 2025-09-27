# GEMINI CLI - GalloBets ESLint Cleanup Optimization Guide

## **PROJECT CONTEXT**
**Sistema**: GalloBets - Professional Cockfighting Streaming Platform
**Stack**: React + TypeScript + Tailwind CSS + SSE/WebSocket Hybrid
**Current Task**: ESLint Warning Cleanup (Stage 2 of 3-AI Pipeline)
**Pipeline**: QWEN CLI (35% done) → **GEMINI CLI (50% target)** → Claude (15% validation)
**Coordination**: Build on QWEN CLI baseline → Gemini specialized cleanup → Claude final validation

---

## **🚨 CRITICAL MCP TIMEOUT PREVENTION (LESSONS FROM QWEN CLI)**

### **⚠️ QWEN CLI Failed 60% Due to MCP Timeouts (Error -32001)**
```yaml
Problem Discovered:
  - QWEN CLI MCP operations timed out repeatedly
  - 4-hour session completed only 18% of work (63/309 warnings)
  - MCP errors disrupted systematic workflow

GEMINI CLI Strategy (Unknown MCP Behavior):
  - Assume similar timeout risks exist
  - Use native Gemini CLI tools first
  - Immediate fallback when MCPs fail
  - 25-30 minute focused micro-sessions
```

### **🛡️ Defensive MCP Strategy for Gemini CLI**
```yaml
Session Structure:
  - Duration: 25-30 minutes maximum
  - Focus: Single warning type only
  - Tools: Native Gemini CLI preferred
  - Fallback: Manual commands when MCPs timeout
  - Validation: Defer to session end

If MCPs Timeout:
  1. Document which tools failed
  2. Switch to alternative approach immediately
  3. Continue work with available tools
  4. Report timeout patterns for optimization
```

### **🎯 Gemini CLI Strengths for ESLint Cleanup**
- **TypeScript Expertise**: Specialized in type system cleanup
- **React Pattern Recognition**: Understands component dependencies
- **Systematic Refactoring**: Perfect for warning-by-warning approach
- **Frontend Context**: Knows React/TS patterns vs generic fixes

---

## **📊 ESLINT BASELINE FROM QWEN CLI**

### **Current Warning State (200 Total)**
```yaml
QWEN CLI Results (1 hour):
  - Started: 309 warnings
  - Fixed: 63 warnings (18% completion)
  - Remaining: 200 warnings

Category Breakdown:
  - no-explicit-any: 84 remaining (GEMINI focus)
  - no-unused-vars: 104 remaining (GEMINI focus)
  - exhaustive-deps: 10 remaining (GEMINI focus)
  - only-export-components: 2 remaining (leave for Claude)
```

### **Gemini CLI Target Goals**
```yaml
Session 1 (30 min): no-explicit-any
  - Current: 84 warnings
  - Target: 30-40 warnings (50% reduction)
  - Focus: catch(error: any) → catch(error: unknown)

Session 2 (30 min): no-unused-vars
  - Current: 104 warnings
  - Target: 40-50 warnings (50% reduction)
  - Focus: Remove unused imports/variables safely

Session 3 (30 min): exhaustive-deps
  - Current: 10 warnings
  - Target: 0-2 warnings (90% reduction)
  - Focus: Add missing useEffect dependencies
```

---

## **🔧 NATIVE GEMINI CLI TOOL STRATEGIES**

### **Strategy 1: TypeScript 'any' Type Replacement**
```typescript
// BEFORE (QWEN CLI missed these)
catch (error: any) {
  console.error('Error:', error);
}

// AFTER (GEMINI specialization)
catch (error: unknown) {
  console.error('Error:', error);
}

// More GEMINI specialized patterns
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// BEFORE: function handleData(data: any)
function handleData<T>(data: ApiResponse<T>) {
  return data.data;
}

// BEFORE: const response: any = await fetch(url);
const response: Response = await fetch(url);
const data: ApiResponse<User> = await response.json();
```

### **Strategy 2: Unused Import/Variable Removal**
```typescript
// BEFORE (Common QWEN CLI missed patterns)
import React, { useState, useEffect, useMemo } from 'react'; // useMemo unused
import { User, Event, Fight } from '../types'; // Fight unused
import lodash from 'lodash'; // entirely unused

const MyComponent = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false); // unused

  // Component logic using only data, setData
};

// AFTER (GEMINI systematic cleanup)
import React, { useState } from 'react';
import { User } from '../types';

const MyComponent = () => {
  const [data, setData] = useState<User[]>([]);

  // Component logic
};
```

### **Strategy 3: useEffect Exhaustive Dependencies**
```typescript
// BEFORE (Common pattern QWEN CLI missed)
const MyComponent = ({ userId }: { userId: string }) => {
  const [userData, setUserData] = useState(null);

  const fetchUserData = async () => {
    const response = await api.get(`/users/${userId}`);
    setUserData(response.data);
  };

  useEffect(() => {
    fetchUserData();
  }, []); // ❌ Missing userId dependency

  return <div>{userData?.name}</div>;
};

// AFTER (GEMINI specialized fix)
const MyComponent = ({ userId }: { userId: string }) => {
  const [userData, setUserData] = useState(null);

  const fetchUserData = useCallback(async () => {
    const response = await api.get(`/users/${userId}`);
    setUserData(response.data);
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); // ✅ Proper dependencies

  return <div>{userData?.name}</div>;
};
```

---

## **⚡ MCP FALLBACK COMMANDS**

### **When Gemini CLI MCPs Timeout**
```bash
# Manual search alternatives
grep -rn "catch.*any" src/ | head -20
grep -rn ": any" src/ | grep -v "node_modules" | head -20
grep -rn "import.*{.*}" src/ | head -20

# Manual edit alternatives (provide exact sed commands)
sed -i 's/catch (error: any)/catch (error: unknown)/g' filename.tsx
sed -i 's/: any\b/: unknown/g' filename.tsx
sed -i '/import.*unused/d' filename.tsx
```

## **🚀 GEMINI CLI SESSION SUCCESS PATTERN**

### **Pre-Session Checklist**
```bash
☐ Check current warning count: npm run lint | tail -5
☐ Create feature branch: git checkout -b feature/gemini-eslint-session-X
☐ Review QWEN CLI changes to understand baseline
☐ Choose single warning type focus (no-explicit-any OR no-unused-vars OR exhaustive-deps)
☐ Set 30-minute timer
```

### **During Session (Native Tools Only)**
```yaml
Step 1: Search Phase
  - Use native Gemini CLI search (NOT grep via MCP)
  - If search times out → provide manual grep commands
  - Focus only on chosen warning type

Step 2: Edit Phase
  - Use native Gemini CLI edit tools
  - If edit fails → provide exact sed commands
  - Make conservative, safe changes only

Step 3: No Validation During Work
  - NO npm run lint during active work
  - NO TypeScript compilation checks
  - Focus on completion, defer validation
```

### **End Session Validation**
```bash
# Only at session end (avoid MCP timeouts during work)
npm run lint | grep [warning-type] | wc -l
npm run build  # Check TypeScript compilation
git add . && git commit -m "Gemini Session X: [warning-type] X→Y warnings"
```

---

## **🎯 SUCCESS HANDOFF TO CLAUDE**

### **Expected Gemini CLI Deliverables**
```yaml
Warning Reductions:
  - no-explicit-any: 84 → 30-40 (50% reduction)
  - no-unused-vars: 104 → 40-50 (50% reduction)
  - exhaustive-deps: 10 → 0-2 (90% reduction)
  - Total: 200 → 75-100 warnings (50% pipeline contribution)

Quality Assurance:
  - TypeScript compilation successful
  - No new console errors introduced
  - All component functionality preserved
  - Git commits with clear progress tracking

Documentation:
  - MCP timeout issues encountered (if any)
  - Remaining warning breakdown for Claude
  - Any risky changes requiring Claude review
```

### **Claude Final Phase (15% remaining)**
```yaml
Claude Responsibilities:
  - Validate all Gemini CLI changes
  - Fix complex TypeScript issues Gemini couldn't handle
  - Complete remaining 75-100 warnings to <50
  - Integration testing and final validation
  - Performance impact assessment
```

### **Fight Status Indicator with Countdown**
```typescript
const FightStatusIndicator: React.FC<{ fight: Fight }> = ({ fight }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  useEffect(() => {
    if (fight.status === 'betting' && fight.bettingEndsAt) {
      const timer = setInterval(() => {
        const remaining = new Date(fight.bettingEndsAt).getTime() - Date.now();
        setTimeRemaining(Math.max(0, remaining));
        
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [fight]);
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  const statusConfig = {
    upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Próximamente' },
    betting: { bg: 'bg-green-100', text: 'text-green-800', label: `Apuestas Abiertas - ${formatTime(timeRemaining)}` },
    live: { bg: 'bg-red-100', text: 'text-red-800', label: 'En Vivo - Apuestas Cerradas' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Finalizado' }
  };
  
  const config = statusConfig[fight.status];
  
  return (
    <div className={`px-4 py-2 rounded-lg font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </div>
  );
};
```

### **PAGO/DOY Proposal Modal (WebSocket Minimal)**
```typescript
const PAGODOYModal: React.FC<PAGODOYModalProps> = ({ 
  originalBet, 
  onClose 
}) => {
  const [proposedAmount, setProposedAmount] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(180); // 3 minutes
  
  // CRITICAL: WebSocket ONLY for proposals
  // DO NOT use WebSocket for anything else
  const sendProposal = async () => {
    // This is the ONLY WebSocket usage in the system
    const proposal = {
      originalBetId: originalBet.id,
      proposedAmount,
      type: originalBet.type === 'DOY' ? 'PAGO' : 'DOY'
    };
    
    // Send via minimal WebSocket
    socketService.sendProposal(proposal);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Proponer {originalBet.type === 'DOY' ? 'PAGO' : 'DOY'}
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Monto Propuesto
          </label>
          <input
            type="number"
            value={proposedAmount}
            onChange={(e) => setProposedAmount(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          Tiempo restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={sendProposal}
            className="flex-1 bg-blue-400 text-white py-2 rounded-lg"
          >
            Enviar Propuesta
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## **OPERATOR DASHBOARD PATTERNS**

### **Operator Event Manager (Limited Permissions)**
```typescript
const OperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedEvents, setAssignedEvents] = useState<Event[]>([]);
  
  // CRITICAL: Operators can only see assigned events
  useEffect(() => {
    if (user?.role === 'operator') {
      fetchAssignedEvents(user.id).then(setAssignedEvents);
    }
  }, [user]);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Operador</h1>
      
      {/* CRITICAL: No user management for operators */}
      {/* CRITICAL: No admin/operator creation */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventManagement events={assignedEvents} />
        <StreamingControls events={assignedEvents} />
        <FightControl events={assignedEvents} />
      </div>
    </div>
  );
};
```

### **Fight Control Panel (Temporal Logic)**
```typescript
const FightControl: React.FC<{ event: Event }> = ({ event }) => {
  const handleStatusChange = async (fightId: string, newStatus: FightStatus) => {
    // CRITICAL: Validate status progression
    // upcoming → betting → live → completed
    try {
      await api.patch(`/api/fights/${fightId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Status change failed:', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">Control de Peleas</h3>
      
      {event.fights.map(fight => (
        <div key={fight.id} className="border-b py-3 last:border-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{fight.title}</p>
              <FightStatusIndicator fight={fight} />
            </div>
            
            <div className="flex gap-2">
              {fight.status === 'upcoming' && (
                <button
                  onClick={() => handleStatusChange(fight.id, 'betting')}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Abrir Apuestas
                </button>
              )}
              
              {fight.status === 'betting' && (
                <button
                  onClick={() => handleStatusChange(fight.id, 'live')}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Cerrar Apuestas
                </button>
              )}
              
              {fight.status === 'live' && (
                <button
                  onClick={() => handleStatusChange(fight.id, 'completed')}
                  className="bg-gray-600 text-white px-3 py-1 rounded"
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## **TAILWIND CSS PATTERNS**

### **Consistent Design System**
```css
/* Button Styles */
.btn-primary { @apply bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors; }
.btn-success { @apply bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors; }
.btn-danger { @apply bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors; }
.btn-secondary { @apply bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors; }

/* Card Styles */
.card { @apply bg-white rounded-lg shadow-md p-4; }
.card-header { @apply font-semibold text-lg mb-3 pb-2 border-b; }
.card-body { @apply py-2; }

/* Status Indicators */
.status-upcoming { @apply bg-blue-100 text-blue-800; }
.status-betting { @apply bg-green-100 text-green-800; }
.status-live { @apply bg-red-100 text-red-800; }
.status-completed { @apply bg-gray-100 text-gray-800; }

/* Responsive Grid */
.grid-responsive { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4; }
```

### **Mobile-First Responsive Design**
```typescript
const ResponsiveLayout: React.FC = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: Stack vertically */}
      {/* Tablet: 2 columns */}
      {/* Desktop: 3 columns with sidebar */}
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <MobileNav />
      </div>
    </div>
  );
};
```

---

## **TYPESCRIPT PATTERNS (STRICT TYPING)**

### **Interface Definitions**
```typescript
// Types for betting system
interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'operator' | 'venue' | 'gallera' | 'user';
  walletBalance: number;
}

interface Event {
  id: string;
  title: string;
  venueId: string;
  operatorId: string;
  streamKey: string;
  status: 'scheduled' | 'live' | 'completed';
  fights: Fight[];
}

interface Fight {
  id: string;
  eventId: string;
  title: string;
  status: 'upcoming' | 'betting' | 'live' | 'completed';
  bettingStartsAt?: Date;
  bettingEndsAt?: Date;
}

interface Bet {
  id: string;
  fightId: string;
  userId: string;
  type: 'PAGO' | 'DOY';
  amount: number;
  status: 'pending' | 'matched' | 'won' | 'lost' | 'cancelled';
  galloId: string;
  odds?: number;
  matchedBetId?: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SSE Event types
interface SSEEvent<T> {
  type: string;
  data: T;
  timestamp: number;
}

// Component Props with strict typing
interface BetCardProps {
  bet: Bet;
  onAccept?: (betId: string) => void;
  onPropose?: (betId: string) => void;
  disabled?: boolean;
}
```

---

## **TESTING REQUIREMENTS**

### **Component Testing Checklist**
```markdown
BEFORE HANDOFF TO CLAUDE:
☐ All components render without errors
☐ TypeScript compilation successful (npm run tsc)
☐ SSE connections establish and receive data
☐ Responsive design works on mobile/tablet/desktop
☐ No console errors or warnings
☐ Loading states implemented
☐ Error states handled gracefully
☐ Form validation working
☐ Navigation functional
☐ Real-time updates reflect in UI
```

### **Integration Points to Test**
```markdown
☐ SSE subscription connects to backend
☐ Betting window countdown works
☐ Fight status transitions update UI
☐ Operator permissions enforced in UI
☐ PAGO/DOY proposals use minimal WebSocket
☐ API error responses handled
☐ Authentication state managed correctly
☐ Wallet balance updates (manual refresh)
```

---

## **COORDINATION WITH CLAUDE**

### **What Gemini Delivers to Claude**
```markdown
1. All React components created and tested
2. TypeScript interfaces defined
3. SSE integration implemented
4. Responsive layouts verified
5. Basic functionality working
6. List of any issues encountered
7. Integration points documented
```

### **What Gemini Needs from Claude**
```markdown
1. Complete API endpoint specifications
2. SSE event type definitions
3. Business logic validation rules
4. Permission matrix for operators
5. Database schema for reference
6. Error handling requirements
7. Performance targets
```

---

## **COMMON PITFALLS TO AVOID**

### **❌ DO NOT**
- Use WebSocket for anything except PAGO/DOY proposals
- Implement wallet operations via WebSocket
- Allow operators to modify admin/operator users
- Create complex real-time architecture
- Skip TypeScript typing
- Ignore SSE reconnection logic
- Forget cleanup in useEffect
- Mix business logic with UI components

### **✅ ALWAYS**
- Use SSE for admin real-time updates
- Implement proper TypeScript interfaces
- Test responsive design on all breakpoints
- Include loading and error states
- Clean up EventSource on unmount
- Follow fight temporal logic strictly
- Validate operator permissions in UI
- Coordinate with Claude for architecture

---

## **SUCCESS METRICS**

### **Technical Excellence**
- ✅ 100% TypeScript coverage
- ✅ Zero console errors
- ✅ SSE working with <1s latency
- ✅ Responsive on all devices
- ✅ Components properly typed
- ✅ Error boundaries implemented

### **Domain Implementation**
- ✅ Betting windows enforce correctly
- ✅ Fight status transitions work
- ✅ Operator permissions respected
- ✅ PAGO/DOY proposals functional
- ✅ Real-time updates smooth

### **Coordination Success**
- ✅ Clear handoff to Claude
- ✅ All components documented
- ✅ Integration points identified
- ✅ Timeline goals met
- ✅ No architectural violations

---

## **DAILY WORKFLOW**

### **Morning Routine**
1. Check brain/backlog.json for today's tasks
2. Review Claude's specifications
3. Plan component implementation order
4. Set up TypeScript interfaces

### **Implementation Phase**
1. Create components following patterns
2. Test every 30 minutes
3. Verify SSE integration works
4. Check responsive design

### **Evening Handoff**
1. Commit all working code
2. Document any issues
3. Update brain/backlog.json
4. Prepare handoff notes for Claude

---

## **EMERGENCY PROCEDURES**

### **If SSE Doesn't Connect**
```typescript
// Fallback to polling temporarily
const useFallbackPolling = (url: string, interval = 5000) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
    
    return () => clearInterval(poll);
  }, [url, interval]);
  
  return data;
};
```

### **If TypeScript Errors Block Progress**
```typescript
// Temporary bypass (FIX IMMEDIATELY AFTER)
// @ts-expect-error - TODO: Fix typing
const problemVariable = someUntypedValue as any;
// CRITICAL: Track all @ts-expect-error for later fix
```

### **If Component Breaks**
```bash
# Revert to last working version
git checkout -- src/components/ProblemComponent.tsx
# Or restore from backup
git stash pop
```

---

## **15-DAY MVP TIMELINE CONTRIBUTION**

### **Week 1: Core Implementation**
- Day 1-2: SSE hook and real-time components
- Day 3-4: Betting panels and fight controls
- Day 5: Operator dashboard
- Day 6-7: Integration and testing

### **Week 2: Polish and Optimization**
- Day 8-10: Bug fixes from Claude testing
- Day 11-12: UI/UX improvements
- Day 13-14: Final integration
- Day 15: Launch preparation

---

Remember: You are building the UI layer for a professional betting platform. Quality, TypeScript safety, and SSE real-time updates are critical. Coordinate closely with Claude for architecture and validation.