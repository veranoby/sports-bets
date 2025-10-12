# Redis Caching Implementation Checklist

## Pre-Implementation Verification

- [x] **Verify Redis configuration exists** (`/backend/src/config/redis.ts`)
- [x] **Confirm graceful degradation working** (system works without Redis)
- [x] **Analyze existing cached endpoints** (10 endpoints already cached)
- [x] **Identify high-frequency uncached endpoints** (8 critical endpoints found)
- [x] **Create implementation plan** (this document)

---

## Phase 1: Fight Queries (Priority 🔴 CRITICAL)

### File: `/backend/src/routes/fights.ts`

**Estimated Time:** 3 hours

### Step 1: Add Cache Imports
- [ ] **Line 7:** Add `import { transaction, retryOperation, cache } from "../config/database";`
- [ ] **Remove:** Old import that only has `transaction`

### Step 2: Cache GET /api/fights (Lines 12-38)
- [ ] **Add cache key generation:** `fights_list_{eventId}_{status}`
- [ ] **Wrap query with:** `cache.getOrSet(cacheKey, async () => { ... }, 60)`
- [ ] **Add retry wrapper:** `retryOperation(async () => { ... })`
- [ ] **Test:** Request twice, verify second is cached

### Step 3: Cache GET /api/fights/:id (Lines 41-72)
- [ ] **Add cache key:** `fight_detail_{fightId}`
- [ ] **Implement caching** with 30 second TTL
- [ ] **Test:** Request fight details twice

### Step 4: Cache GET /api/events/:eventId/current-betting (Lines 904-970)
- [ ] **Add cache key:** `event_current_betting_{eventId}`
- [ ] **Implement caching** with 15 second TTL (short for real-time accuracy)
- [ ] **Test:** Check active betting window

### Step 5: Add Cache Invalidation

#### POST /api/fights (Line 189 - Create Fight)
- [ ] **Add before response:**
```typescript
// Invalidate fights list cache
await cache.invalidatePattern('fights_list_*');
```

#### PUT /api/fights/:id (Line 293 - Update Fight)
- [ ] **Add before response:**
```typescript
// Invalidate fights cache
await Promise.all([
  cache.invalidatePattern('fights_list_*'),
  cache.invalidate(`fight_detail_${fight.id}`)
]);
```

#### PATCH /api/fights/:id/status (Line 471 - Status Change)
- [ ] **Add before response:**
```typescript
// Invalidate fights cache after status change
await Promise.all([
  cache.invalidatePattern('fights_list_*'),
  cache.invalidate(`fight_detail_${fight.id}`),
  cache.invalidate(`event_current_betting_${fight.eventId}`)
]);
```

#### POST /api/fights/:fightId/open-betting (Line 817)
- [ ] **Add after opening betting:**
```typescript
await cache.invalidate(`event_current_betting_${fight.eventId}`);
```

#### POST /api/fights/:fightId/close-betting (Line 900)
- [ ] **Add after closing betting:**
```typescript
await cache.invalidate(`event_current_betting_${fight.eventId}`);
```

### Testing Checklist - Fights
- [ ] **Test:** Create fight → verify cache invalidated
- [ ] **Test:** Update fight → verify cache invalidated
- [ ] **Test:** Change status → verify cache invalidated
- [ ] **Test:** Place bet → verify fight detail cache updated
- [ ] **Load test:** `ab -n 1000 -c 10 /api/fights` → verify 5x improvement

---

## Phase 2: Event Details (Priority 🟡 HIGH)

### File: `/backend/src/routes/events.ts`

**Estimated Time:** 2 hours

### Step 1: Verify Imports
- [ ] **Check Line 7:** Ensure `import { retryOperation, cache } from "../config/database";` exists

### Step 2: Cache GET /api/events/:id (Lines 146-174)
- [ ] **Add cache key:** `event_detail_{eventId}_{role}`
- [ ] **Implement caching** with 120 second TTL
- [ ] **Test:** Request event details twice

### Step 3: Cache GET /api/events/:id/stats (Lines 732-757)
- [ ] **Add cache key:** `event_stats_{eventId}`
- [ ] **Implement caching** with 180 second TTL
- [ ] **Test:** Check stats endpoint

### Step 4: Add Cache Invalidation

#### PUT /api/events/:id (Line 319 - Update Event)
- [ ] **Add before response:**
```typescript
// Invalidate event detail cache
await cache.invalidatePattern(`event_detail_${event.id}_*`);
```

#### PATCH /api/events/:id/status (Line 453 - Status Change)
- [ ] **Add before response:**
```typescript
// Invalidate event caches
await Promise.all([
  cache.invalidatePattern(`event_detail_${event.id}_*`),
  cache.invalidatePattern('events:list:*')
]);
```

### Testing Checklist - Events
- [ ] **Test:** Update event → verify cache invalidated
- [ ] **Test:** Change status → verify cache invalidated
- [ ] **Test:** Add fight to event → verify event stats updated
- [ ] **Load test:** Verify 60-70% performance improvement

---

## Phase 3: Venue Queries (Priority 🟡 HIGH)

### File: `/backend/src/routes/venues.ts`

**Estimated Time:** 1.5 hours

### Step 1: Add Cache Imports
- [ ] **Line 5:** Add after body import:
```typescript
import { retryOperation, cache } from "../config/database";
```

### Step 2: Cache GET /api/venues (Lines 33-68)
- [ ] **Add cache key:** `venues_list_{status}_{limit}_{offset}_{role}`
- [ ] **Implement caching** with 600 second TTL (10 minutes)
- [ ] **Test:** Request venues list twice

### Step 3: Cache GET /api/venues/:id (Lines 72-98)
- [ ] **Add cache key:** `venue_detail_{venueId}_{role}`
- [ ] **Implement caching** with 600 second TTL
- [ ] **Test:** Request venue details twice

### Step 4: Add Cache Invalidation

#### POST /api/venues (Line 186 - Create Venue)
- [ ] **Add before response:**
```typescript
// Invalidate venues cache
await cache.invalidatePattern('venues_list_*');
```

#### PUT /api/venues/:id (Line 272 - Update Venue)
- [ ] **Add before response:**
```typescript
// Invalidate venues cache
await Promise.all([
  cache.invalidatePattern('venues_list_*'),
  cache.invalidate(`venue_detail_${venue.id}_*`)
]);
```

#### PUT /api/venues/:id/status (Line 322 - Status Change)
- [ ] **Add before response:**
```typescript
// Invalidate venue cache after status change
await cache.invalidatePattern('venues_list_*');
```

### Testing Checklist - Venues
- [ ] **Test:** Create venue → verify cache invalidated
- [ ] **Test:** Update venue → verify cache invalidated
- [ ] **Test:** Change status → verify cache invalidated
- [ ] **Load test:** Verify 85-90% improvement (near-static data)

---

## Phase 4: Bet Invalidation Hooks (Priority 🟢 MEDIUM)

### File: `/backend/src/routes/bets.ts`

**Estimated Time:** 1 hour

### Step 1: POST /api/bets (Line 267 - Create Bet)
- [ ] **Add before response:**
```typescript
// Invalidate fight and betting caches
await Promise.all([
  cache.invalidate(`fight_detail_${fight.id}`),
  cache.invalidatePattern(`available_bets_${fight.id}_*`),
  cache.invalidate(`event_current_betting_${fight.eventId}`)
]);
```

### Step 2: POST /api/bets/:id/accept (Line 408 - Accept Bet)
- [ ] **Add before response:**
```typescript
// Invalidate fight and betting caches after match
await Promise.all([
  cache.invalidate(`fight_detail_${fight.id}`),
  cache.invalidatePattern(`available_bets_${fight.id}_*`),
  cache.invalidate(`event_current_betting_${fight.eventId}`)
]);
```

### Step 3: PUT /api/bets/:id/cancel (Line 487 - Cancel Bet)
- [ ] **Add before response:**
```typescript
// Invalidate betting caches after cancellation
await cache.invalidatePattern(`available_bets_${bet.fightId}_*`);
```

### Testing Checklist - Bet Hooks
- [ ] **Test:** Place bet → verify fight cache invalidated
- [ ] **Test:** Accept bet → verify betting window updated
- [ ] **Test:** Cancel bet → verify available bets refreshed

---

## Phase 5: Monitoring & Validation

### File: `/backend/src/routes/monitoring.ts`

**Estimated Time:** 1 hour

### Step 1: Add Cache Stats Endpoint
- [ ] **Import Redis client:**
```typescript
import { redisClient, redisAvailable } from '../config/redis';
```

- [ ] **Add endpoint:**
```typescript
router.get('/cache-stats', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  let cacheStats = {
    redis_connected: false,
    cache_enabled: false,
    estimated_hit_rate: 0,
    redis_memory_used: 0,
    redis_keys_count: 0
  };

  if (redisClient && redisAvailable) {
    try {
      const info = await redisClient.info('stats');
      const memory = await redisClient.info('memory');
      const keysCount = await redisClient.dbSize();

      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

      const memoryMatch = memory.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'Unknown';

      cacheStats = {
        redis_connected: true,
        cache_enabled: true,
        estimated_hit_rate: Math.round(hitRate * 100) / 100,
        redis_memory_used: memoryUsed,
        redis_keys_count: keysCount,
        hits,
        misses
      };
    } catch (error) {
      logger.warn('Failed to fetch Redis stats:', error);
    }
  }

  res.json({
    success: true,
    data: cacheStats
  });
}));
```

### Step 2: Test Monitoring
- [ ] **Test:** `GET /api/monitoring/cache-stats` → verify response
- [ ] **Check:** Hit rate, memory usage, key count

---

## Phase 6: Local Testing

### Without Redis (Fallback Testing)

**Time:** 15 minutes

- [ ] **Remove REDIS_URL** from `.env` (or don't add it)
- [ ] **Start backend:** `npm run dev`
- [ ] **Check logs:** Look for "Redis URL not configured, running without cache"
- [ ] **Test endpoints:**
  - [ ] `GET /api/fights` → works
  - [ ] `GET /api/events` → works
  - [ ] `GET /api/venues` → works
- [ ] **Verify:** Query deduplication active (no duplicate queries)

### With Redis (Full Caching)

**Time:** 20 minutes

#### Option A: Docker Redis (Recommended for Local)
- [ ] **Start Redis:**
```bash
docker run -d --name redis-cache -p 6379:6379 redis:7-alpine
```

- [ ] **Add to .env:**
```bash
REDIS_URL=redis://localhost:6379
```

#### Option B: Redis Cloud Free Tier
- [ ] **Sign up:** https://redis.com/try-free/
- [ ] **Get connection URL**
- [ ] **Add to .env:** `REDIS_URL=redis://...`

#### Testing Steps
- [ ] **Start backend:** `npm run dev`
- [ ] **Check logs:** "✅ Redis connected successfully"
- [ ] **Test cache hits:**
  - [ ] First request: `curl http://localhost:3001/api/fights` → cache miss
  - [ ] Second request: `curl http://localhost:3001/api/fights` → cache HIT
  - [ ] Check logs for: "⚡ Cache hit: fights_list_all_all"
- [ ] **Test invalidation:**
  - [ ] Create fight via API
  - [ ] Check logs: "Cache invalidation: fights_list_*"
  - [ ] Next request should be cache miss

---

## Phase 7: Performance Testing

### Load Testing

**Time:** 30 minutes

#### Setup
- [ ] **Install Apache Bench:** `sudo apt-get install apache2-utils`
- [ ] **Or use existing tool:** artillery, k6, etc.

#### Test 1: WITHOUT Caching
- [ ] **Disable Redis** (remove REDIS_URL from .env)
- [ ] **Restart backend**
- [ ] **Run test:**
```bash
ab -n 1000 -c 10 http://localhost:3001/api/fights
```
- [ ] **Record results:**
  - Requests per second: ___________
  - Time per request: ___________
  - Failed requests: ___________

#### Test 2: WITH Caching
- [ ] **Enable Redis** (add REDIS_URL to .env)
- [ ] **Restart backend**
- [ ] **Run test:**
```bash
ab -n 1000 -c 10 http://localhost:3001/api/fights
```
- [ ] **Record results:**
  - Requests per second: ___________
  - Time per request: ___________
  - Failed requests: ___________

#### Validation
- [ ] **Compare:** Should see 5-10x improvement
- [ ] **Check cache stats:** `GET /api/monitoring/cache-stats`
- [ ] **Verify hit rate:** Should be 70-85%

---

## Phase 8: Production Deployment

### Pre-Deployment Checklist

- [ ] **All phases complete** (1-7 above)
- [ ] **Code reviewed**
- [ ] **Tests passing**
- [ ] **Performance validated locally**
- [ ] **Redis production instance ready** (Redis Cloud, AWS ElastiCache, etc.)

### Deployment Steps

**Day 1: Deploy with Short TTLs**

- [ ] **Set conservative TTLs** (30s-60s for all endpoints)
- [ ] **Deploy to production**
- [ ] **Monitor for 24 hours:**
  - [ ] Check Redis connection stability
  - [ ] Monitor cache hit rates
  - [ ] Watch for stale data reports
  - [ ] Check error rates

**Day 2-3: Increase TTLs Gradually**

- [ ] **If stable:** Increase TTLs to target values
- [ ] **Monitor:**
  - [ ] Cache invalidation working correctly
  - [ ] No stale data issues
  - [ ] User experience improvements

**Day 4-7: Full Production Validation**

- [ ] **Track metrics:**
  - [ ] Database query reduction: Target 70-80%
  - [ ] API response time: Target 60-80% faster
  - [ ] Cache hit rate: Target 75-85%
  - [ ] Redis memory usage: Should be <100MB
  - [ ] Error rate: Should be stable or improved

---

## Success Criteria

### Performance Metrics

- [ ] **Cache hit rate:** 75-85% or higher
- [ ] **Database query reduction:** 70-80% fewer queries
- [ ] **Response time improvement:** 60-80% faster for cached endpoints
- [ ] **Redis memory usage:** Under 100MB
- [ ] **Zero cache-related errors** in production

### Business Metrics

- [ ] **Cost reduction:** $16,000-$17,280 monthly savings
- [ ] **User experience:** Faster page loads, better responsiveness
- [ ] **System stability:** Improved under high load

---

## Rollback Plan

### If Issues Arise

**Immediate Rollback:**
```bash
# Option 1: Emergency cache flush
curl -X POST http://your-domain/api/monitoring/flush-cache \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Option 2: Disable Redis
# Remove REDIS_URL from production environment variables
# Restart backend → falls back to no caching

# Option 3: Revert code deployment
# System will work fine without caching (graceful degradation)
```

---

## Post-Implementation

### Week 2 Tasks

- [ ] **Monitor daily:**
  - Cache hit rates
  - Performance metrics
  - Cost reduction validation
- [ ] **Optimize TTLs** based on real usage
- [ ] **Document learnings**
- [ ] **Generate performance report**

### Monthly Tasks

- [ ] **Review cache effectiveness**
- [ ] **Check Redis memory trends**
- [ ] **Validate cost savings**
- [ ] **Identify new caching opportunities**

---

## Notes & Observations

### Implementation Notes:
_Add notes during implementation..._

### Issues Encountered:
_Document any issues and resolutions..._

### Performance Results:
_Record actual performance improvements..._

---

## Sign-Off

- [ ] **Implementation Complete:** All phases executed
- [ ] **Testing Complete:** All tests passing
- [ ] **Production Stable:** 7 days monitoring complete
- [ ] **Cost Savings Validated:** Confirmed $16K-$17K monthly reduction
- [ ] **Documentation Updated:** All docs reflect current state

**Implemented By:** _________________
**Date:** _________________
**Approved By:** _________________

---

**Related Documents:**
- Full Plan: `/backend/REDIS_CACHING_IMPLEMENTATION_PLAN.json`
- Summary: `/backend/REDIS_CACHING_SUMMARY.md`
- Infrastructure: `/backend/src/config/database.ts`
- Redis Config: `/backend/src/config/redis.ts`
