# Database Performance Optimization - Quick Start Guide

**Target:** Reduce database query times from 1-3+ seconds to <500ms (95th percentile)

**Timeline:** 12 hours over 3 days

---

## Phase 1: Measurement (2 hours) - START HERE

### Task 1: Verify Missing Indexes (45 min)

```bash
# Check existing indexes
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;"

# Identify tables with high sequential scans (BAD - means no indexes used)
psql $DATABASE_URL -c "SELECT relname as table_name, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY seq_scan DESC LIMIT 10;"

# Find common WHERE clause patterns in code
cd /home/veranoby/sports-bets/backend/src/routes
grep -r "where:" *.ts | grep -E "(fightId|userId|eventId|status)" | head -20
```

**Expected findings:**
- Missing composite index on `bets(user_id, status)`
- Missing composite index on `fights(event_id, status)`
- Missing partial index on `bets(fight_id, status) WHERE status='pending'`
- High seq_scan counts on bets, fights, events tables

---

### Task 2: Detect N+1 Queries (45 min)

```bash
# Enable SQL logging temporarily
# Edit: /home/veranoby/sports-bets/backend/src/config/database.ts
# Line 68: Change logging: process.env.NODE_ENV === 'development' ? console.log : false
# To:      logging: console.log

# Start server and make test request
npm run dev &
sleep 5

# Test endpoint and count queries
curl -H "Authorization: Bearer $YOUR_TOKEN" http://localhost:3000/api/bets?limit=20 2>&1 | grep "Executing (default):" | wc -l

# You should see 20+ queries (BAD - should be 1-2)
```

**Known N+1 patterns to fix:**

| File | Line | Issue | Impact |
|------|------|-------|--------|
| `routes/bets.ts` | 31-46 | Missing `required:true` on Fight->Event | N+1 for every bet |
| `routes/events.ts` | 102-114 | No `separate:true` on fights | Loads ALL fights in one query |
| `routes/events.ts` | 153-164 | Deep nesting Fight->Bet without limits | Massive data load |
| `routes/fights.ts` | 44-55 | Missing `separate:true` on bets include | N+1 for each bet |

---

### Task 3: Analyze Connection Pool (30 min)

```bash
# Check current pool utilization
curl http://localhost:3000/api/monitoring/health | jq '.data.database.poolStats'

# Count connection timeout errors
grep -E '(ETIMEDOUT|SequelizeConnectionError)' /home/veranoby/sports-bets/backend/logs/*.log | wc -l

# Install load testing tool
npm install -g autocannon

# Run load test (50 concurrent connections for 30 seconds)
autocannon -c 50 -d 30 http://localhost:3000/api/events

# Watch for:
# - Connection pool maxing out at 10/10
# - ETIMEDOUT errors appearing
# - Response times >2 seconds
```

**Current config problems:**
- Max connections: 10 (TOO LOW for Neon.tech)
- Acquire timeout: 45s (TOO HIGH - should fail faster)
- Idle timeout: 5s (TOO LOW - causes connection churn)

---

## Phase 2: Implementation (8 hours)

### Priority 1: Add Critical Indexes (2 hours)

**Create migration file:**

```bash
cd /home/veranoby/sports-bets/backend/migrations
cat > 20251012000000-add-critical-performance-indexes.js << 'EOF'
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add indexes CONCURRENTLY to avoid locking tables
    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_status ON bets(user_id, status);'
    );

    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_fight_status_pending ON bets(fight_id, status) WHERE status = \'pending\';'
    );

    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fights_event_status_number ON fights(event_id, status, number);'
    );

    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_scheduled_date ON events(status, scheduled_date);'
    );

    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_type_status ON transactions(wallet_id, type, status);'
    );

    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_parent_bet_proposal ON bets(parent_bet_id, proposal_status) WHERE parent_bet_id IS NOT NULL;'
    );

    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_connections_event_disconnected ON event_connections(event_id, disconnected_at);'
    );

    console.log('✅ Created 7 performance indexes');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_bets_user_status;');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_bets_fight_status_pending;');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_fights_event_status_number;');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_events_status_scheduled_date;');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_wallet_type_status;');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_bets_parent_bet_proposal;');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_event_connections_event_disconnected;');

    console.log('✅ Dropped 7 performance indexes');
  }
};
EOF

# Run migration
npm run migrate

# Verify indexes were created
psql $DATABASE_URL -c "\d+ bets" | grep idx_
psql $DATABASE_URL -c "\d+ fights" | grep idx_
```

**Test improvement:**

```bash
# Before index (should be slow)
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM bets WHERE user_id = 'some-uuid' AND status = 'pending';"
# Look for "Seq Scan" and time >100ms

# After index (should be fast)
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM bets WHERE user_id = 'some-uuid' AND status = 'pending';"
# Look for "Index Scan using idx_bets_user_status" and time <10ms
```

---

### Priority 2: Fix N+1 Queries (3 hours)

**Fix 1: routes/bets.ts (line 31)**

```typescript
// BEFORE (20+ queries)
const bets = await retryOperation(async () => {
  return await cache.getOrSet(cacheKey, async () => {
    return await Bet.findAndCountAll({
      where,
      include: [
        {
          model: Fight,
          as: "fight",
          include: [
            {
              model: Event,
              as: "event",
              where: eventId ? { id: eventId } : {},
              attributes: ['id', 'title', 'status', 'scheduledDate']
            },
          ],
          attributes: ['id', 'number', 'status', 'redCorner', 'blueCorner']
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  }, 60);
});

// AFTER (1 query)
const bets = await retryOperation(async () => {
  return await cache.getOrSet(cacheKey, async () => {
    return await Bet.findAndCountAll({
      where,
      include: [
        {
          model: Fight,
          as: "fight",
          required: true, // ⚡ FIX: Force JOIN instead of separate query
          include: [
            {
              model: Event,
              as: "event",
              required: true, // ⚡ FIX: Force JOIN instead of separate query
              where: eventId ? { id: eventId } : {},
              attributes: ['id', 'title', 'status', 'scheduledDate']
            },
          ],
          attributes: ['id', 'number', 'status', 'redCorner', 'blueCorner']
        },
      ],
      subQuery: false, // ⚡ FIX: Prevent subquery, force single query
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  }, 60);
});
```

---

**Fix 2: routes/events.ts (line 102)**

```typescript
// BEFORE (50+ queries for events with fights)
const events = await Event.findAndCountAll({
  where,
  attributes,
  include: [
    { model: Venue, as: 'venue', attributes: ['id', 'name', 'location'] },
    { model: User, as: 'operator', attributes: ['id', 'username'] },
    { model: User, as: 'creator', attributes: ['id', 'username'] },
    { model: Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'] }
  ],
  order: [["scheduledDate", "ASC"]],
  limit,
  offset,
});

// AFTER (3 queries total)
const events = await Event.findAndCountAll({
  where,
  attributes,
  include: [
    {
      model: Venue,
      as: 'venue',
      attributes: ['id', 'name', 'location'],
      required: false
    },
    {
      model: User,
      as: 'operator',
      attributes: ['id', 'username'],
      required: false
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'username'],
      required: false
    },
    {
      model: Fight,
      as: 'fights',
      attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'],
      required: false,
      separate: true, // ⚡ FIX: Use separate query with IN clause (efficient)
      limit: 50, // ⚡ FIX: Limit fights per event
      order: [['number', 'ASC']]
    }
  ],
  subQuery: false, // ⚡ FIX: Force single query for main data
  order: [["scheduledDate", "ASC"]],
  limit,
  offset,
});
```

---

**Fix 3: routes/events.ts (line 153)**

```typescript
// BEFORE (100+ queries for event with fights and bets)
const event = await Event.findByPk(req.params.id, {
  include: [
    { model: Venue, as: 'venue' },
    { model: User, as: 'operator', attributes: ['id', 'username', 'email'] },
    { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
    {
      model: Fight,
      as: 'fights',
      include: [{ model: Bet, as: 'bets', attributes: ['id', 'amount', 'status'] }]
    }
  ]
});

// AFTER (3 queries total)
const event = await Event.findByPk(req.params.id, {
  include: [
    { model: Venue, as: 'venue', required: false },
    { model: User, as: 'operator', attributes: ['id', 'username', 'email'], required: false },
    { model: User, as: 'creator', attributes: ['id', 'username', 'email'], required: false },
    {
      model: Fight,
      as: 'fights',
      required: false,
      separate: true, // ⚡ FIX: Separate query for fights
      order: [['number', 'ASC']],
      include: [
        {
          model: Bet,
          as: 'bets',
          attributes: ['id', 'amount', 'status'],
          required: false,
          where: { status: ['active', 'pending'] }, // ⚡ FIX: Only relevant bets
          limit: 100, // ⚡ FIX: Limit bets per fight
          separate: true // ⚡ FIX: Separate query for bets
        }
      ]
    }
  ]
});
```

---

**Fix 4: routes/fights.ts (line 44)**

```typescript
// BEFORE (10+ queries)
const fight = await Fight.findByPk(req.params.id, {
  include: [
    { model: Event, as: "event" },
    {
      model: Bet,
      as: "bets",
      include: [
        { model: User, as: "user", attributes: ["id", "username"] },
      ],
    },
  ],
});

// AFTER (2 queries)
const fight = await Fight.findByPk(req.params.id, {
  include: [
    { model: Event, as: "event", required: false },
    {
      model: Bet,
      as: "bets",
      required: false,
      separate: true, // ⚡ FIX: Use separate query with IN clause
      where: {
        status: { [Op.in]: ['active', 'pending'] }
      }, // ⚡ FIX: Only relevant bets
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
          required: false
        },
      ],
    },
  ],
});
```

---

### Priority 3: Optimize Connection Pool (1 hour)

**Edit: `/home/veranoby/sports-bets/backend/src/config/database.ts`**

```typescript
// Line 10-26: BEFORE
const MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT_MS = 45000;
const IDLE_CONNECTION_CLEANUP_MS = 5000;
const EVICT_INTERVAL_MS = 15000;

const poolSettings = {
  max: MAX_CONNECTIONS,
  min: 2,
  acquire: CONNECTION_TIMEOUT_MS,
  idle: IDLE_CONNECTION_CLEANUP_MS,
  evict: EVICT_INTERVAL_MS,
  handleDisconnects: true,
  validate: (client: any) => {
    return client.query('SELECT 1').then(() => true).catch(() => false);
  }
};

// Line 10-26: AFTER
const MAX_CONNECTIONS = 15; // ⚡ OPTIMIZED: Increased for better throughput
const CONNECTION_TIMEOUT_MS = 30000; // ⚡ OPTIMIZED: Fail faster to prevent pile-up
const IDLE_CONNECTION_CLEANUP_MS = 10000; // ⚡ OPTIMIZED: Keep connections alive longer
const EVICT_INTERVAL_MS = 20000; // ⚡ OPTIMIZED: Reduce eviction churn

const poolSettings = {
  max: MAX_CONNECTIONS,
  min: 3, // ⚡ OPTIMIZED: Keep more warm connections
  acquire: CONNECTION_TIMEOUT_MS,
  idle: IDLE_CONNECTION_CLEANUP_MS,
  evict: EVICT_INTERVAL_MS,
  handleDisconnects: true,
  validate: (client: any) => {
    return client.query('SELECT 1').then(() => true).catch(() => false);
  }
};

// Line 64-67: ADD these lines inside dialectOptions
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 20000, // ⚡ ADDED: 20 second connection timeout
  query_timeout: 30000, // ⚡ ADDED: 30 second query timeout
  statement_timeout: 30000, // ⚡ ADDED: Database-level statement timeout
},
```

---

## Phase 3: Validation (2 hours)

### Step 1: Run Load Tests

```bash
# Install load testing tool if not already installed
npm install -g autocannon

# Get auth token for testing
export TOKEN="your-jwt-token-here"

# Test 1: User Bets Endpoint
echo "=== Testing GET /api/bets ==="
autocannon -c 50 -d 30 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/bets?limit=20 \
  > /tmp/bets-load-test.txt

# Test 2: Events List Endpoint
echo "=== Testing GET /api/events ==="
autocannon -c 50 -d 30 \
  http://localhost:3000/api/events?limit=10 \
  > /tmp/events-load-test.txt

# Test 3: Event Detail Endpoint
echo "=== Testing GET /api/events/:id ==="
autocannon -c 50 -d 30 \
  "http://localhost:3000/api/events/some-event-id" \
  > /tmp/event-detail-load-test.txt

# Analyze results
echo "=== Load Test Results ==="
grep -E "(Latency|Req/Sec)" /tmp/*-load-test.txt
```

**Success criteria:**
- p50 latency: <200ms (was 500-1000ms)
- p95 latency: <500ms (was 1500-3000ms)
- p99 latency: <1000ms (was 3000-5000ms)
- Req/Sec: >100 (was <20)

---

### Step 2: Verify Query Counts

```bash
# Enable query counting
# Add this to bets.ts route temporarily:
let queryCount = 0;
sequelize.addHook('beforeQuery', () => { queryCount++; });

# Make request and check count
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/bets?limit=20

# Check logs - should see:
# "Query count: 1" (was 20+)
```

---

### Step 3: Verify Index Usage

```bash
# Check that indexes are being used
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
  ORDER BY idx_scan DESC
  LIMIT 20;
"

# Should see high idx_scan counts for:
# - idx_bets_user_status
# - idx_bets_fight_status_pending
# - idx_fights_event_status_number
```

---

### Step 4: Monitor Connection Pool

```bash
# Check pool stats under load
watch -n 1 "curl -s http://localhost:3000/api/monitoring/health | jq '.data.database.poolStats'"

# Run load test in another terminal
autocannon -c 50 -d 60 http://localhost:3000/api/events

# Watch for:
# - Pool utilization: should stay <80% (was 95-100%)
# - Free connections: should always have 3+ free
# - Queue: should stay at 0 (was 5-10)
```

---

## Success Validation Checklist

```
[ ] p95 query time < 500ms (verified with autocannon)
[ ] Query count reduced from 20+ to 1-3 per request
[ ] No ETIMEDOUT errors during load test
[ ] Connection pool utilization < 80% under load
[ ] Sequential scans < 10% of total queries
[ ] Index scans > 90% of queries
[ ] Load test passes: 50 concurrent users, 60 seconds
[ ] No regressions in functionality tests
```

---

## Rollback Procedure (if needed)

```bash
# 1. Revert code changes
git log --oneline -10  # Find commit before optimizations
git revert <commit-hash>
git push

# 2. Rollback migration
npm run migrate:undo
psql $DATABASE_URL -c "\d+ bets" | grep idx_  # Verify indexes dropped

# 3. Restore connection pool settings
# Edit database.ts: Set max back to 10, acquire back to 45000

# 4. Restart server
pm2 restart gallobets-backend

# 5. Verify rollback
curl http://localhost:3000/api/monitoring/health
```

---

## Key Files Modified

1. **NEW:** `/home/veranoby/sports-bets/backend/migrations/20251012000000-add-critical-performance-indexes.js`
2. **MODIFIED:** `/home/veranoby/sports-bets/backend/src/config/database.ts` (lines 10-26, 64-67)
3. **MODIFIED:** `/home/veranoby/sports-bets/backend/src/routes/bets.ts` (line 31-52)
4. **MODIFIED:** `/home/veranoby/sports-bets/backend/src/routes/events.ts` (lines 102-114, 153-164)
5. **MODIFIED:** `/home/veranoby/sports-bets/backend/src/routes/fights.ts` (line 44-55)

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| p95 Response Time | 1500-3000ms | <500ms | 80-85% faster |
| Queries per Request | 20-50 | 1-3 | 95% reduction |
| Connection Timeouts | 10-20/hour | <1/hour | 95% reduction |
| Sequential Scans | 40-60% | <10% | 85% reduction |
| Throughput (req/s) | <20 | >100 | 5x increase |

---

## Next Steps After Completion

1. **Monitor for 48 hours** - Watch for any issues in production
2. **Create Grafana dashboard** - Visualize query performance over time
3. **Set up alerts** - p95 >500ms, pool >90%, ETIMEDOUT errors
4. **Document patterns** - Share N+1 fixes with team
5. **Plan next optimizations** - Caching strategy, read replicas, etc.

---

**Questions? Issues?**
- Check detailed plan: `/home/veranoby/sports-bets/claudedocs/DATABASE_PERFORMANCE_OPTIMIZATION_PLAN.json`
- Monitor logs: `tail -f /home/veranoby/sports-bets/backend/logs/*.log`
- Check pool stats: `curl http://localhost:3000/api/monitoring/health | jq`
