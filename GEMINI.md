# GEMINI.md - GalloBets React/TypeScript Development Guide

## **PROJECT CONTEXT**
**Sistema**: GalloBets - Professional Cockfighting Streaming Platform
**Stack**: React + TypeScript + Tailwind CSS + SSE/WebSocket Hybrid
**Timeline**: 15-day MVP sprint
**Coordination**: Claude Architecture → Gemini Implementation → Claude Validation

---

## **CRITICAL INSTRUCTIONS FOR GEMINI**

### **🧠 Brain System - MANDATORY CONSULTATION**
```markdown
BEFORE ANY IMPLEMENTATION:
1. Read brain/multi_ai_coordination_strategy.json for overall strategy
2. Read brain/gemini_optimization_patterns.json for React patterns
3. Read brain/multi_ai_decision_matrix.json for task routing
4. Read brain/sdd_system.json for technical architecture
5. Read brain/prd_system.json for business requirements
6. Check brain/backlog.json for current task status

NEVER START CODING WITHOUT BRAIN CONTEXT
```

### **🎯 Gemini Core Strengths - LEVERAGE THESE**
- **React/TypeScript Mastery**: 5/5 - Professional component architecture
- **SSE Integration**: 5/5 - Real-time UI updates excellence
- **Betting UI Patterns**: 5/5 - Domain-specific interfaces
- **Responsive Design**: 5/5 - Tailwind CSS expertise
- **Operator Dashboards**: 5/5 - Role-based UI implementation

---

## **SSE IMPLEMENTATION PATTERNS (CRITICAL)**

### **useSSE Hook - COMPLETE IMPLEMENTATION**
```typescript
import { useEffect, useState, useRef, useCallback } from 'react';

interface UseSSEOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

function useSSE<T = any>(
  url: string,
  options: UseSSEOptions = {}
): {
  data: T | null;
  error: Error | null;
  isConnected: boolean;
  reconnect: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  
  const {
    onMessage,
    onError,
    onOpen,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10
  } = options;
  
  const connect = useCallback(() => {
    // Implementation details...
    // CRITICAL: Include reconnection logic
    // CRITICAL: Proper cleanup on unmount
    // CRITICAL: Error handling with backoff
  }, [url, options]);
  
  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);
  
  return { data, error, isConnected, reconnect };
}
```

### **Admin Real-Time Dashboard Pattern**
```typescript
const SystemMonitoring: React.FC = () => {
  const { data, isConnected, error } = useSSE<SystemStats>(
    '/api/sse/system/stats'
  );
  
  if (!isConnected) {
    return <div className="text-yellow-600">Reconnecting...</div>;
  }
  
  if (error) {
    return <div className="text-red-600">Connection error</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Active Users" value={data?.activeUsers || 0} />
      <StatCard title="Live Events" value={data?.liveEvents || 0} />
      <StatCard title="Total Bets" value={data?.totalBets || 0} />
    </div>
  );
};
```

---

## **BETTING COMPONENTS (DOMAIN CRITICAL)**

### **CurrentBettingPanel - MAIN BETTING INTERFACE**
```typescript
interface CurrentBettingPanelProps {
  fightId: string;
  onCreateBet: (bet: BetData) => void;
}

const CurrentBettingPanel: React.FC<CurrentBettingPanelProps> = ({ 
  fightId, 
  onCreateBet 
}) => {
  const [availableBets, setAvailableBets] = useState<Bet[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // SSE for real-time bet updates
  const { data } = useSSE<BetsUpdate>(`/api/sse/fights/${fightId}/bets`);
  
  useEffect(() => {
    if (data?.bets) {
      setAvailableBets(data.bets);
    }
  }, [data]);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Apuestas Disponibles</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Nueva Apuesta
        </button>
      </div>
      
      <div className="space-y-2">
        {availableBets.map(bet => (
          <BetCard key={bet.id} bet={bet} />
        ))}
      </div>
      
      {showCreateModal && (
        <CreateBetModal 
          fightId={fightId}
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateBet}
        />
      )}
    </div>
  );
};
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
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
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
.btn-primary { @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors; }
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