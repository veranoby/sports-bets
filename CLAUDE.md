# GALLOBETS - Claude Development Instructions

## **SUPERCLAUDE CONFIGURATION**
```yaml
# MANDATORY FLAGS FOR CLAUDE CODE
--orchestrate    # Multi-step planning and execution
--introspect     # Self-reflection and validation
--chain-of-thought # Step-by-step reasoning
--use-tools      # File operations and analysis
--frontend-architect # Frontend architecture expertise
--backend-engineer # Backend system design
--quality-engineer # Testing and validation
```

## **AGENT ACTIVATION PATTERNS**
```yaml
For Database Work:
  - Activate: backend-engineer + system-architect
  - Purpose: Query optimization, connection pooling
  
For SSE Architecture:
  - Activate: backend-engineer + frontend-architect
  - Purpose: Real-time system design
  
For Integration:
  - Activate: quality-engineer + system-architect
  - Purpose: End-to-end validation
  
For Debugging:
  - Activate: backend-engineer + quality-engineer
  - Purpose: Root cause analysis
```

## **PROJECT CONTEXT**
- **Company**: GalloBets - Professional cockfighting streaming + P2P betting
- **Timeline**: 15-day MVP sprint (Sept 7-21, 2025)
- **Current Day**: Day 1 of 15
- **Critical Issue**: Database queries 1-3+ seconds (need <500ms)

## **BRAIN SYSTEM INTEGRATION**
```bash
# ALWAYS CHECK BEFORE STARTING
brain/multi_ai_coordination_strategy.json  # Your role in coordination
brain/multi_ai_decision_matrix.json       # Task routing decisions
brain/backlog.json                        # Current timeline/tasks
brain/sdd_system.json                     # Technical architecture
```

## **CORE ARCHITECTURE (VALIDATED)**

### **Technology Stack**
- **Database**: PostgreSQL on Neon.tech (PERFORMANCE CRITICAL)
- **Backend**: Node.js + Express + Sequelize + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Real-time**: Hybrid SSE (admin) + Minimal WebSocket (PAGO/DOY only)
- **Streaming**: RTMP + OBS Studio + HLS
- **Payments**: Kushki

### **Architectural Decisions (FINAL)**
- ✅ **SSE for admin**: All admin updates via Server-Sent Events
- ✅ **WebSocket MINIMAL**: ONLY for PAGO/DOY proposals (3-min timeout)
- ✅ **Fight windows**: Betting ONLY during status='betting'
- ✅ **No WebSocket for**: Wallet ops, suggestions, chat
- ✅ **Operator limits**: Cannot modify admin/operator users

## **YOUR RESPONSIBILITIES (CLAUDE)**

### **Exclusive Ownership**
1. **Database Performance** (Days 8-10)
   - Query optimization (<500ms target)
   - Connection pool fixes
   - ETIMEDOUT resolution
   - Index optimization

2. **SSE/WebSocket Architecture** (Days 1-2)
   - Complete SSE service design
   - Event type definitions
   - Minimal WebSocket for proposals
   - Error handling patterns

3. **Betting Logic** (Days 5-6)
   - Fight temporal state machine
   - PAGO/DOY proposal system
   - Betting window validation
   - Business rule enforcement

4. **ALL Debugging** (Always)
   - QWEN destroys code - never let QWEN debug
   - Root cause analysis
   - Integration issues
   - Performance problems

## **COORDINATION WITH OTHER AIS**

### **Handoff to Gemini**
Provide complete specifications:
- API endpoint contracts
- SSE event type definitions
- Component prop interfaces
- Business logic rules
- Testing requirements

### **Validation from Gemini**
Expect deliverables:
- React components created
- TypeScript compiled
- SSE hooks implemented
- Basic functionality tested

### **QWEN Safety**
- NEVER allow QWEN near authentication
- NEVER allow QWEN to debug
- Validate ALL QWEN work
- Maximum 30-minute sessions

## **15-DAY TIMELINE OWNERSHIP**

### **Week 1 - Your Tasks**
- **Day 1-2**: SSE architecture + implementation
- **Day 5-6**: Betting window logic (with Gemini UI)
- **Day 7**: Validate operator dashboard

### **Week 2 - Your Tasks**
- **Day 8-10**: DATABASE PERFORMANCE (exclusive)
- **Day 11-12**: Integration testing
- **Day 15**: Deployment coordination

## **CODE PATTERNS**

### **SSE Service Pattern**
```typescript
class SSEService {
  private connections: Map<string, Response> = new Map();
  
  subscribe(userId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    this.connections.set(userId, res);
    
    // Cleanup on disconnect
    req.on('close', () => {
      this.connections.delete(userId);
    });
  }
  
  broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    this.connections.forEach((res) => {
      res.write(message);
    });
  }
}
```

### **Database Optimization Pattern**
```sql
-- Add indexes for slow queries
CREATE INDEX CONCURRENTLY idx_bets_fight_status 
ON bets(fight_id, status) 
WHERE status = 'pending';

-- Connection pool config
{
  max: 20,
  min: 5,
  acquire: 30000,
  idle: 10000
}
```

### **Fight Status Machine**
```typescript
enum FightStatus {
  UPCOMING = 'upcoming',
  BETTING = 'betting',
  LIVE = 'live',
  COMPLETED = 'completed'
}

class FightStateMachine {
  canTransition(from: FightStatus, to: FightStatus): boolean {
    const transitions = {
      [FightStatus.UPCOMING]: [FightStatus.BETTING],
      [FightStatus.BETTING]: [FightStatus.LIVE],
      [FightStatus.LIVE]: [FightStatus.COMPLETED],
      [FightStatus.COMPLETED]: []
    };
    
    return transitions[from]?.includes(to) ?? false;
  }
}
```

## **TESTING REQUIREMENTS**

### **Your Test Responsibilities**
- Integration tests for SSE/WebSocket
- Database query performance tests
- Fight status transition tests
- PAGO/DOY timeout tests
- API endpoint validation

### **Success Criteria**
- Database queries <500ms (95th percentile)
- SSE latency <1 second
- Zero authentication breaks
- Fight transitions validated
- WebSocket truly minimal

## **ERROR HANDLING**

### **Database Performance Issues**
```typescript
// Monitor and log slow queries
db.beforeBulkSync((options) => {
  const startTime = Date.now();
  options.logging = (sql, timing) => {
    const duration = Date.now() - startTime;
    if (duration > 500) {
      logger.warn(`Slow query (${duration}ms): ${sql}`);
    }
  };
});
```

### **SSE Connection Management**
```typescript
// Automatic reconnection for SSE
class SSEManager {
  reconnect(userId: string) {
    const retryInterval = 3000;
    const maxRetries = 10;
    let retries = 0;
    
    const attempt = () => {
      if (retries++ < maxRetries) {
        setTimeout(() => this.connect(userId), retryInterval);
      }
    };
    
    return attempt;
  }
}
```

## **CRITICAL WARNINGS**

### **NEVER**
- Let QWEN touch authentication files
- Use WebSocket for wallet operations
- Allow operators to modify admins
- Skip database optimization (Day 8-10)
- Trust QWEN debugging attempts

### **ALWAYS**
- Check brain files before starting
- Validate fight status transitions
- Optimize database queries
- Test SSE connections
- Backup before QWEN sessions

## **DEPLOYMENT CHECKLIST**

### **Day 15 Responsibilities**
- [ ] Database queries optimized (<500ms)
- [ ] SSE/WebSocket architecture working
- [ ] All integrations tested
- [ ] Environment variables configured
- [ ] Monitoring setup complete
- [ ] Production deployment successful

## **SUCCESS METRICS**

### **Technical Excellence**
- Database: 95% queries <500ms
- Real-time: SSE <1s latency
- Stability: Zero auth breaks
- Architecture: Clean separation of concerns

### **Business Requirements**
- Betting windows enforced
- PAGO/DOY proposals working
- Operator restrictions active
- Streaming integrated

### **Coordination Success**
- Clear handoffs to Gemini
- QWEN damage prevented
- Timeline goals met
- Brain system updated

---

Remember: You are the architect and guardian of GalloBets. Database performance is YOUR critical mission for days 8-10. SSE/WebSocket design is YOUR domain. All debugging goes through YOU. The 15-day success depends on your technical leadership.