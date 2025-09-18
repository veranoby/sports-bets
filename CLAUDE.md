# GALLOBETS - Claude Code Development Instructions

## **PROJECT CONTEXT**
- **Company**: GalloBets (plataforma streaming + apuestas gallos de pelea)
- **Mission**: First professional streaming platform for cockfighting events + P2P betting
- **Timeline**: 15 días MVP development

## **CORE ARCHITECTURE (NO CAMBIAR)**

### **Technology Stack Finalizado**
- **Database**: PostgreSQL en Neon.tech (schema completo)
- **Backend**: Node.js + Express + Sequelize + Socket.io
- **Frontend**: React + TypeScript + Tailwind CSS
- **Streaming**: RTMP + OBS Studio + HLS delivery
- **Pagos**: Kushki (Ecuador/LATAM)
- **Real-time**: SSE (admin) + WebSocket MÍNIMO (betting only)

### **Decisions Técnicas Cerradas**
- ✅ **Híbrido SSE+WebSocket** (no solo WebSocket)
- ✅ **PAGO/DOY WebSocket MÍNIMO** (bidirectional timeout 3min)
- ✅ **SSE para admin** + auto-matching notifications
- ✅ **Fight-based betting windows** (temporal logic)
- ✅ **Manual wallet refresh** (no WebSocket wallet ops)

---

## **JSON WORK PLAN EXECUTION**

### **How to Follow JSON Instructions**
When receiving a JSON work plan:

1. **Read complete JSON first** - understand full scope
2. **Follow order specified** in task_decomposition
3. **Implement tests FIRST** from tdd_specification
4. **Use exact patterns** from context_injection
5. **Validate against** success_criteria continuously

### **GalloBets Context Awareness**
Always apply these business rules from JSON context:
- **Fight temporal logic**: upcoming → betting → live → completed
- **Betting windows**: Apuestas SOLO permitidas durante status='betting'
- **WebSocket MÍNIMO**: Solo PAGO/DOY proposals (3min timeout)
- **Operator hierarchy**: Cannot manage admin/operator users

---

## **DEVELOPMENT STANDARDS**

### **React + TypeScript Conventions**
```typescript
// Functional components REQUIRED
import React, { useState, useEffect } from 'react';
import { User, Event } from '../types';

interface Props {
  events: Event[];
  onEventSelect: (event: Event) => void;
}

const EventList: React.FC<Props> = ({ events, onEventSelect }) => {
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {events.map(event => (
        <div key={event.id} className="border-b py-2">
          <button onClick={() => onEventSelect(event)}>
            {event.title}
          </button>
        </div>
      ))}
    </div>
  );
};
```

### **API Integration Pattern**
```javascript
// services/api.js REQUIRED for all API calls
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Always use proper error handling
const fetchEvents = async () => {
  try {
    const response = await api.get('/api/events');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, error: error.message };
  }
};

// SSE for real-time updates
const useSSE = (endpoint: string) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const eventSource = new EventSource(endpoint);
    eventSource.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };
    return () => eventSource.close();
  }, [endpoint]);
  
  return data;
};
```

### **File Structure REQUIRED**
```
backend/
├── src/
│   ├── routes/         # API endpoints
│   │   ├── events.js   # Event management
│   │   ├── fights.js   # Fight management
│   │   ├── bets.js     # Betting system
│   │   └── sse.js      # SSE endpoints
│   ├── services/       # Business logic
│   │   ├── rtmpService.ts
│   │   ├── sseService.js
│   │   └── bettingService.js
│   └── sockets/        # WebSocket (minimal)
│       └── streamingSocket.ts

frontend/
├── src/
│   ├── components/     # Reusable components
│   │   ├── admin/      # Admin interface
│   │   ├── user/       # User betting panel
│   │   └── shared/     # Common components
│   ├── pages/          # Route components
│   │   ├── admin/      # Admin dashboard
│   │   ├── operator/   # Operator interface
│   │   └── user/       # User interface
│   └── hooks/          # Custom hooks
│       └── useSSE.js   # SSE hook
```

## **BUSINESS LOGIC CRÍTICO**

### **Fight Status Flow (Temporal Logic)**
```javascript
// ALWAYS enforce fight status progression
const fightStatuses = ['upcoming', 'betting', 'live', 'completed']
const validateStatusTransition = (currentStatus, newStatus) => {
  const currentIndex = fightStatuses.indexOf(currentStatus)
  const newIndex = fightStatuses.indexOf(newStatus)
  
  // Can only advance to next status or stay same
  return newIndex >= currentIndex
}

// Betting ONLY allowed during 'betting' status
const canCreateBet = (fightStatus) => {
  return fightStatus === 'betting'
}
```

### **PAGO/DOY Proposal Logic**
```javascript
// WebSocket MINIMAL usage for proposals
const createPagoProposal = async (originalBetId, proposedAmount) => {
  // Validate original bet exists and is 'pending'
  const originalBet = await getBet(originalBetId)
  if (originalBet.status !== 'pending') {
    throw new Error('Cannot propose PAGO on non-pending bet')
  }
  
  // Create proposal with 3-minute timeout
  const proposal = {
    originalBetId,
    proposedAmount,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000) // 3 min
  }
  
  // Send via WebSocket to original bettor
  io.to(`user_${originalBet.userId}`).emit('pago_proposal', proposal)
  
  return proposal
}
```

### **Betting Window Validation**
```javascript
// Temporal betting windows per fight
const getCurrentBettingFight = async (eventId) => {
  const event = await getEvent(eventId)
  const activeFight = event.fights.find(f => f.status === 'betting')
  
  if (!activeFight) {
    throw new Error('No active betting window')
  }
  
  return activeFight
}
```

## **COMPONENT PATTERNS**

### **CurrentBettingPanel.tsx Standard**
```tsx
interface BettingPanelProps {
  fightId: string;
  onCreateBet: (bet: BetData) => void;
}

const CurrentBettingPanel: React.FC<BettingPanelProps> = ({ fightId, onCreateBet }) => {
  const [availableBets, setAvailableBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);
  
  // SSE for real-time bet updates
  const sseData = useSSE(`/api/sse/fights/${fightId}/bets`);
  
  useEffect(() => {
    if (sseData) {
      setAvailableBets(sseData.availableBets || []);
    }
  }, [sseData]);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Apuestas Disponibles</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nueva Apuesta
        </button>
      </div>
      
      {availableBets.map(bet => (
        <BetCard key={bet.id} bet={bet} onAccept={handleAcceptBet} />
      ))}
    </div>
  );
};
```

### **FightControl.tsx (Admin/Operator)**
```tsx
interface FightControlProps {
  fight: Fight;
  onStatusChange: (fightId: string, newStatus: FightStatus) => void;
}

const FightControl: React.FC<FightControlProps> = ({ fight, onStatusChange }) => {
  const canOpenBetting = fight.status === 'upcoming';
  const canCloseBetting = fight.status === 'betting';
  const canComplete = fight.status === 'live';
  
  return (
    <div className="flex gap-2">
      {canOpenBetting && (
        <button 
          onClick={() => onStatusChange(fight.id, 'betting')}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Abrir Apuestas
        </button>
      )}
      {canCloseBetting && (
        <button 
          onClick={() => onStatusChange(fight.id, 'live')}
          className="bg-red-600 text-white px-3 py-1 rounded"
        >
          Cerrar Apuestas
        </button>
      )}
      {canComplete && (
        <button 
          onClick={() => onStatusChange(fight.id, 'completed')}
          className="bg-gray-600 text-white px-3 py-1 rounded"
        >
          Finalizar
        </button>
      )}
    </div>
  );
};
```

## **MOBILE DEVELOPMENT (React Native + Expo) - POST-MVP**

### **GalloBets Mobile App Structure**
```javascript
// App.js - Main navigation
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Required screens (Post-MVP):
// - AuthScreen (login)
// - EventListScreen (live events)
// - BettingScreen (current fight betting)
// - WalletScreen (balance management)

// Gluestack UI components ONLY
import { Button, VStack, HStack } from '@gluestack-ui/themed'
```

### **Betting Flow Pattern**
```javascript
const BettingScreen = () => {
  const [currentFight, setCurrentFight] = useState(null)
  const [availableBets, setAvailableBets] = useState([])
  
  const handleCreateBet = async (betData) => {
    // 1. Validate fight status = 'betting'
    // 2. Check wallet balance
    // 3. Submit to API
    // 4. Show confirmation
  }
}
```

## **POSTGRESQL DATABASE**

### **Critical Tables**
- **users**: Admin, operator, venue, gallera, user roles
- **events**: Streaming events with operator assignment
- **fights**: Individual fights within events (temporal status)
- **bets**: P2P betting system (PAGO/DOY logic)
- **subscriptions**: Payment/access control (Kushki)
- **payment_transactions**: Financial audit trail

### **Database Source of Truth**
```javascript
// ALWAYS reference backend/database-analysis/*.json
// These files contain the actual schema, not Sequelize models
const verifySchema = async () => {
  // Check database-analysis/CURRENT_TABLES.json
  // Validate against actual Neon.tech schema
  // Report inconsistencies with Sequelize models
}
```

## **PERFORMANCE REQUIREMENTS**
- **Admin portal**: < 3 seconds page load
- **Streaming**: 99.5% uptime during events
- **Betting API**: < 200ms response time
- **SSE updates**: Real-time < 1 second latency

## **SECURITY PATTERNS**
- **Authentication**: JWT with role-based claims
- **Payment security**: Kushki PCI compliance
- **Audit trail**: Immutable financial transaction logs
- **Role hierarchy**: admin > operator > venue/gallera > user

## **DEPLOYMENT TARGETS**
- **Database**: Neon.tech PostgreSQL
- **Backend**: Node.js server deployment
- **Frontend**: React build deployment
- **SSL**: Production HTTPS requirements

## **TESTING REQUIREMENTS**
- **Unit tests**: Fight status transitions, PAGO/DOY logic
- **Integration tests**: PostgreSQL + SSE + WebSocket
- **E2E tests**: Betting window flow
- **Performance tests**: Streaming under load

## **ERROR HANDLING**
```javascript
// Standard error pattern
try {
  const result = await api.post('/api/bets', betData)
  return { success: true, data: result.data }
} catch (error) {
  console.error('Bet creation failed:', error)
  return { 
    success: false, 
    error: error.response?.data?.message || error.message,
    code: error.response?.status 
  }
}
```

## **BRAIN FILE INTEGRATION**
- **Query before coding**: Check `./brain/sdd_system.json` + `backlog.json`
- **Update after completion**: Status changes in `backlog.json`
- **Database verification**: Always check `backend/database-analysis/*.json`
- **Architecture decisions**: Update brain with progress/decisions