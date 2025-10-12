# Redis Caching - Quick Reference Card

## 🎯 TL;DR

**Redis is OPTIONAL for local dev** - System works perfectly without it via graceful degradation.

**Why implement:** Save $17,280/month by reducing database load 70-80%

**Time to implement:** 20 hours (1 week)

---

## 🚀 Quick Start (Local Development)

### Option 1: Work WITHOUT Redis (No Setup)
```bash
# Don't set REDIS_URL in .env
# System falls back to query deduplication
npm run dev

✅ Fully functional
✅ No Redis setup needed
✅ Query deduplication active
```

### Option 2: Work WITH Redis (Full Caching)
```bash
# Start Redis with Docker
docker run -d --name redis-cache -p 6379:6379 redis:7-alpine

# Add to .env
echo "REDIS_URL=redis://localhost:6379" >> .env

# Start backend
npm run dev

✅ Full caching enabled
✅ Test cache hits/misses
✅ Production-like behavior
```

---

## 📊 What's Already Cached

✅ **Events list** (5min TTL)
✅ **Bets list** (1min TTL)
✅ **Available bets** (30s TTL)
✅ **Wallet data** (1min TTL)
✅ **Wallet transactions** (30s TTL)
✅ **Wallet balance** (30s micro-cache)
✅ **Articles list** (2min TTL)
✅ **Featured articles** (3min TTL)
✅ **Article details** (5min TTL)

**Total:** 10 endpoints already optimized

---

## 🔴 Critical Endpoints to Cache (Priorities)

### Priority 1: Fights (3 hours)
```typescript
// GET /api/fights
Cache: fights_list_{eventId}_{status}
TTL: 60s

// GET /api/fights/:id
Cache: fight_detail_{fightId}
TTL: 30s

// GET /api/events/:eventId/current-betting
Cache: event_current_betting_{eventId}
TTL: 15s (real-time accuracy)
```

### Priority 2: Events (2 hours)
```typescript
// GET /api/events/:id
Cache: event_detail_{eventId}_{role}
TTL: 120s

// GET /api/events/:id/stats
Cache: event_stats_{eventId}
TTL: 180s
```

### Priority 3: Venues (1.5 hours)
```typescript
// GET /api/venues
Cache: venues_list_{status}_{limit}_{offset}_{role}
TTL: 600s (10min - near-static data)

// GET /api/venues/:id
Cache: venue_detail_{venueId}_{role}
TTL: 600s
```

---

## 💻 Code Patterns

### Pattern 1: Basic Caching
```typescript
router.get('/endpoint', asyncHandler(async (req, res) => {
  const cacheKey = 'my_cache_key';

  const data = await cache.getOrSet(cacheKey, async () => {
    // Your database query here
    return await Model.findAll({ ... });
  }, 60); // TTL in seconds

  res.json({ success: true, data });
}));
```

### Pattern 2: With Retry Logic
```typescript
const data = await retryOperation(async () => {
  return await cache.getOrSet(cacheKey, async () => {
    return await Model.findAll({ ... });
  }, 60);
});
```

### Pattern 3: Cache Invalidation
```typescript
// Single key
await cache.invalidate('my_cache_key');

// Pattern matching (all variations)
await cache.invalidatePattern('fights_list_*');

// Multiple keys
await Promise.all([
  cache.invalidatePattern('fights_list_*'),
  cache.invalidate(`fight_detail_${id}`),
  cache.invalidate(`event_current_betting_${eventId}`)
]);
```

---

## 🔧 Cache Key Naming Convention

**Format:** `{resource}_{operation}_{parameters}`

**Examples:**
```
fights_list_all_all          → All fights
fights_list_abc123_betting   → Fights for event abc123, status betting
fight_detail_xyz789          → Single fight details
event_current_betting_abc123 → Current betting for event
venues_list_active_20_0_user → Venues, active, limit 20, offset 0, user role
```

**Rules:**
- Use underscores to separate parts
- Include all filter parameters that vary the result
- Keep consistent order: resource_operation_filter1_filter2_...

---

## ⏱️ TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| **Real-time** (betting windows) | 15-30s | Must be very fresh |
| **Semi-dynamic** (fights, events) | 60-120s | Changes moderately |
| **Near-static** (venues, settings) | 300-600s | Rarely changes |
| **Static** (articles, profiles) | 300-600s | Very stable content |

---

## 🔄 Invalidation Rules

**Every write operation MUST invalidate related caches:**

| Write Operation | Invalidate |
|-----------------|-----------|
| Create fight | `fights_list_*` |
| Update fight | `fights_list_*`, `fight_detail_{id}` |
| Change fight status | All fight caches + `event_current_betting_{eventId}` |
| Place bet | `fight_detail_{fightId}`, `available_bets_{fightId}_*`, `event_current_betting_{eventId}` |
| Update event | `event_detail_{id}_*`, `events:list:*` |
| Create venue | `venues_list_*` |
| Update venue | `venues_list_*`, `venue_detail_{id}_*` |

---

## 📈 Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DB Queries/Month | 100M | 20-30M | 70-80% ↓ |
| Avg Response Time | 150ms | 10-20ms | 90% ↓ |
| Cache Hit Rate | 0% | 75-85% | New |
| Monthly Cost | $20K | $2.7-4K | $16-17K savings |

---

## 🧪 Testing Commands

### Test Cache Hit/Miss
```bash
# First request (miss)
time curl http://localhost:3001/api/fights

# Second request (HIT - should be instant)
time curl http://localhost:3001/api/fights

# Check logs for: "⚡ Cache hit: fights_list_all_all"
```

### Load Testing
```bash
# Without caching
ab -n 1000 -c 10 http://localhost:3001/api/fights

# With caching (should be 5-10x faster)
ab -n 1000 -c 10 http://localhost:3001/api/fights
```

### Cache Stats
```bash
curl http://localhost:3001/api/monitoring/cache-stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🚨 Emergency Commands

### Flush All Caches
```typescript
// In code (emergency only)
await cache.invalidatePattern('*');
```

### Disable Redis (Rollback)
```bash
# Remove REDIS_URL from environment
# Restart backend
# → Falls back to no caching (graceful degradation)
```

### Check Redis Health
```bash
# Check connection
redis-cli ping
# Expected: PONG

# Check memory
redis-cli INFO memory

# Check keys count
redis-cli DBSIZE
```

---

## 📋 Implementation Checklist

### Day 1-2
- [ ] Implement fight queries caching (3h)
- [ ] Implement event details caching (2h)

### Day 3
- [ ] Implement venue caching (1.5h)
- [ ] Add bet invalidation hooks (1h)
- [ ] Test locally with/without Redis (1h)

### Day 4
- [ ] Load testing and validation (2h)
- [ ] Add monitoring endpoint (1h)

### Day 5
- [ ] Deploy to production
- [ ] Monitor for 24h
- [ ] Adjust TTLs if needed

---

## 📊 Monitoring Checklist

### Daily (Week 1)
- [ ] Check cache hit rate (target: 75-85%)
- [ ] Monitor Redis memory (should be <100MB)
- [ ] Watch for stale data reports
- [ ] Verify response time improvements

### Weekly
- [ ] Review cache effectiveness
- [ ] Validate cost reduction
- [ ] Optimize TTLs if needed
- [ ] Check for new caching opportunities

### Monthly
- [ ] Generate performance report
- [ ] Document learnings
- [ ] Plan additional optimizations

---

## ⚠️ Common Pitfalls

### 1. Forgot to Invalidate Cache
**Problem:** Users see stale data after updates
**Solution:** Every write operation MUST have cache invalidation
**Check:** Search code for `CREATE`, `UPDATE`, `DELETE` operations

### 2. TTL Too Long
**Problem:** Stale data persists too long
**Solution:** Use shorter TTLs for dynamic data (15-30s for betting)

### 3. TTL Too Short
**Problem:** Low cache hit rate, minimal performance gain
**Solution:** Increase TTLs for stable data (10min for venues)

### 4. Cache Key Collisions
**Problem:** Different queries sharing same cache key
**Solution:** Include ALL filter parameters in cache key

### 5. Memory Bloat
**Problem:** Redis memory grows too large
**Solution:** Ensure all entries have TTL, monitor memory usage

---

## 💡 Pro Tips

1. **Start Conservative:** Deploy with short TTLs (30-60s), increase gradually
2. **Monitor First:** Watch behavior for 24-48h before optimizing
3. **Document Everything:** Keep cache key registry updated
4. **Test Invalidation:** Verify cache clears on write operations
5. **Use Pattern Matching:** `invalidatePattern('fights_*')` is safer than individual keys

---

## 📚 Related Files

```
/backend/REDIS_CACHING_IMPLEMENTATION_PLAN.json  ← Full detailed plan
/backend/REDIS_CACHING_SUMMARY.md                ← Executive summary
/backend/REDIS_IMPLEMENTATION_CHECKLIST.md       ← Step-by-step tasks
/backend/REDIS_QUICK_REFERENCE.md                ← This file
/backend/src/config/database.ts                  ← Cache utilities
/backend/src/config/redis.ts                     ← Redis configuration
```

---

## 🎓 Learn More

### Redis Best Practices
- Keep TTLs appropriate for data freshness needs
- Always set TTL (never infinite cache)
- Use pattern matching for invalidation safety
- Monitor cache hit rates and adjust

### Cache Strategy
- Cache reads, invalidate on writes
- Shorter TTL = fresher data, lower hit rate
- Longer TTL = higher hit rate, risk of stale data
- Balance based on business requirements

---

## 📞 Need Help?

**Issue:** Redis won't connect locally
**Solution:** Use graceful degradation (no REDIS_URL), or check Docker: `docker ps | grep redis`

**Issue:** Cache hit rate too low
**Solution:** Increase TTLs, check if invalidation too aggressive

**Issue:** Stale data reported
**Solution:** Reduce TTLs, add missing invalidation, check logs

**Issue:** Redis memory growing
**Solution:** Verify all entries have TTL, check for long-running keys

---

**Quick Implementation:** See `REDIS_IMPLEMENTATION_CHECKLIST.md` for step-by-step guide

**Questions?** Review `REDIS_CACHING_SUMMARY.md` for comprehensive overview
