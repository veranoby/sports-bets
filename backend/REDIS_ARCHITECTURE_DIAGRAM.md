# Redis Caching Architecture - Visual Reference

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           GalloBets Backend                             │
│                                                                         │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐    │
│  │   Frontend   │───────▶│  API Routes  │───────▶│   Database   │    │
│  │  React App   │        │  Express.js  │        │  PostgreSQL  │    │
│  └──────────────┘        └──────────────┘        │    Neon.tech │    │
│                                 │                 └──────────────┘    │
│                                 │                                      │
│                                 ▼                                      │
│                          ┌──────────────┐                             │
│                          │    Redis     │                             │
│                          │    Cache     │                             │
│                          │   Layer      │                             │
│                          └──────────────┘                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow (WITH Redis)

```
┌─────────┐
│ Client  │
│ Request │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Route Handler                           │
│                                                                     │
│  1. Generate Cache Key: "fights_list_all_all"                      │
│  2. Call: cache.getOrSet(key, fetchFn, ttl)                        │
│                                                                     │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Cache Layer Decision                           │
│                                                                     │
│  ┌──────────────────┐                                              │
│  │ Redis Available? │                                              │
│  └────┬──────┬──────┘                                              │
│       │      │                                                      │
│      YES    NO                                                      │
│       │      │                                                      │
│       │      └──▶ Query Deduplication Fallback                     │
│       │           (In-memory map prevents duplicate queries)       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────┐                                                  │
│  │ Check Redis  │                                                  │
│  │ for Cache    │                                                  │
│  └──┬──────┬────┘                                                  │
│     │      │                                                        │
│   HIT    MISS                                                       │
│     │      │                                                        │
└─────┼──────┼─────────────────────────────────────────────────────────┘
      │      │
      │      ▼
      │  ┌────────────────────────────────────────────────────┐
      │  │           Database Query                            │
      │  │                                                     │
      │  │  - Execute Sequelize query                         │
      │  │  - Include all relations                           │
      │  │  - Apply filters                                   │
      │  │                                                     │
      │  └─────────────────┬────────────────────────────────────┘
      │                    │
      │                    ▼
      │  ┌────────────────────────────────────────────────────┐
      │  │         Store in Redis Cache                       │
      │  │                                                     │
      │  │  - Serialize result to JSON                        │
      │  │  - Set key with TTL                                │
      │  │  - Return data                                     │
      │  │                                                     │
      │  └─────────────────┬────────────────────────────────────┘
      │                    │
      ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Return Response                                │
│                                                                     │
│  - Format data                                                      │
│  - Send JSON response to client                                    │
│  - Log cache hit/miss                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Performance:                            │
│  - Cache HIT:  10-20ms response         │
│  - Cache MISS: 100-150ms response       │
│  - Improvement: 90% faster on hits      │
└─────────────────────────────────────────┘
```

---

## 🔄 Request Flow (WITHOUT Redis - Fallback)

```
┌─────────┐
│ Client  │
│ Request │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Route Handler                           │
│                                                                     │
│  1. Generate Cache Key: "fights_list_all_all"                      │
│  2. Call: cache.getOrSet(key, fetchFn, ttl)                        │
│                                                                     │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Query Deduplication Layer                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────┐              │
│  │ Check: Is this query already running?           │              │
│  │                                                  │              │
│  │ ongoingQueries.has(key)?                        │              │
│  └─────┬───────────────────────┬────────────────────┘              │
│        │                       │                                    │
│       YES                     NO                                    │
│        │                       │                                    │
│        ▼                       ▼                                    │
│  ┌──────────────┐      ┌──────────────┐                           │
│  │ Wait for     │      │ Start new    │                           │
│  │ existing     │      │ query and    │                           │
│  │ query to     │      │ store in     │                           │
│  │ complete     │      │ map          │                           │
│  └──────┬───────┘      └──────┬───────┘                           │
│         │                     │                                     │
└─────────┼─────────────────────┼──────────────────────────────────────┘
          │                     │
          │                     ▼
          │         ┌────────────────────────────────────────────┐
          │         │       Database Query                       │
          │         │                                            │
          │         │  - Execute once                            │
          │         │  - Share result with all waiters           │
          │         │  - Remove from ongoing queries map         │
          │         │                                            │
          │         └─────────────────┬──────────────────────────┘
          │                           │
          └───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Return Response                                │
│                                                                     │
│  - All concurrent requests get same result                         │
│  - Prevents N+1 queries                                            │
│  - No caching, but protected from thundering herd                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Performance:                            │
│  - Response: 100-150ms                  │
│  - No duplicate queries                 │
│  - Graceful degradation                 │
└─────────────────────────────────────────┘
```

---

## 🔥 Cache Invalidation Flow

```
┌─────────┐
│ Client  │
│ Write   │
│ Request │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Write Operation (POST/PUT/DELETE)                │
│                                                                     │
│  Examples:                                                          │
│  - POST /api/fights (create fight)                                 │
│  - PUT /api/fights/:id (update fight)                              │
│  - PATCH /api/fights/:id/status (status change)                    │
│                                                                     │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Database Transaction                           │
│                                                                     │
│  1. Begin Transaction                                               │
│  2. Execute write operation                                         │
│  3. Commit transaction                                              │
│                                                                     │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Cache Invalidation Logic                           │
│                                                                     │
│  Identify affected cache keys:                                     │
│                                                                     │
│  ┌────────────────────────────────────────────────────┐           │
│  │ Single Key:                                        │           │
│  │   await cache.invalidate('fight_detail_xyz789')    │           │
│  └────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌────────────────────────────────────────────────────┐           │
│  │ Pattern Matching:                                  │           │
│  │   await cache.invalidatePattern('fights_list_*')   │           │
│  │   → Clears: fights_list_all_all                    │           │
│  │   → Clears: fights_list_abc123_betting             │           │
│  │   → Clears: fights_list_xyz789_live                │           │
│  └────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌────────────────────────────────────────────────────┐           │
│  │ Multiple Keys:                                     │           │
│  │   await Promise.all([                              │           │
│  │     cache.invalidatePattern('fights_list_*'),      │           │
│  │     cache.invalidate(`fight_detail_${id}`),        │           │
│  │     cache.invalidate(`event_current_betting_...`)  │           │
│  │   ])                                               │           │
│  └────────────────────────────────────────────────────┘           │
│                                                                     │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Redis Operations                               │
│                                                                     │
│  If Redis available:                                                │
│    - Delete specified keys                                          │
│    - Keys with pattern matching using KEYS command                  │
│    - Clear from Redis memory                                        │
│                                                                     │
│  If Redis NOT available:                                            │
│    - Clear from ongoingQueries map                                  │
│    - No-op (graceful degradation)                                   │
│                                                                     │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Return Success Response                        │
│                                                                     │
│  - Write completed                                                  │
│  - Caches invalidated                                              │
│  - Next read will be cache MISS → fetch fresh data                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Cache Key Hierarchy

```
gallobets_cache_root
│
├── fights_*
│   ├── fights_list_all_all                    (All fights, all statuses)
│   ├── fights_list_event123_all               (Fights for event123)
│   ├── fights_list_event123_betting           (Betting fights for event123)
│   ├── fights_list_event123_live              (Live fights for event123)
│   ├── fight_detail_fight456                  (Single fight details)
│   └── fight_detail_fight789                  (Another fight)
│
├── events_*
│   ├── events:list:admin:all:all:true:10:0    (Events list - admin view)
│   ├── events:list:user:venue123:scheduled:... (Events list - user view)
│   ├── event_detail_event123_admin            (Event detail - admin)
│   ├── event_detail_event123_user             (Event detail - user)
│   ├── event_stats_event123                   (Event statistics)
│   └── event_current_betting_event123         (Current betting window)
│
├── venues_*
│   ├── venues_list_all_20_0_public            (All venues, public view)
│   ├── venues_list_active_20_0_user           (Active venues, user view)
│   ├── venue_detail_venue456_admin            (Venue detail - admin)
│   └── venue_detail_venue456_public           (Venue detail - public)
│
├── bets_*
│   ├── user_bets_user123_all_all_20_0         (User's bets)
│   ├── available_bets_fight456_user123        (Available bets for fight)
│   └── available_bets_fight789_user456        (Available bets for another)
│
├── wallet_*
│   ├── wallet_main_user123                    (User wallet)
│   ├── wallet_transactions_wallet456_20_0_... (Wallet transactions)
│   ├── wallet_balance_user123                 (User balance)
│   └── wallet_stats_wallet456_monthly         (Wallet statistics)
│
└── articles_*
    ├── articles_list_published_10_0_none_...  (Articles list)
    ├── articles_featured_banner_5_public      (Featured articles)
    └── article_detail_article789_user         (Single article)
```

---

## 🔄 Cache Lifecycle Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Cache Entry Lifecycle                           │
│                                                                     │
│  ┌────────────┐                                                    │
│  │   CREATE   │  Cache key generated, TTL set                      │
│  │   CACHE    │  Example: fight_detail_xyz, TTL=30s               │
│  └──────┬─────┘                                                    │
│         │                                                           │
│         ▼                                                           │
│  ┌────────────┐                                                    │
│  │   ACTIVE   │  Cache serves requests                             │
│  │   CACHE    │  Fast responses (10-20ms)                          │
│  │   (HIT)    │  No database queries                               │
│  └──────┬─────┘                                                    │
│         │                                                           │
│         │  ┌───────────────────────────────────┐                  │
│         │  │ Three ways to exit ACTIVE state:  │                  │
│         │  │                                    │                  │
│         │  │ 1. TTL expires                     │                  │
│         │  │ 2. Manual invalidation             │                  │
│         │  │ 3. Redis eviction (memory full)    │                  │
│         │  └───────────────────────────────────┘                  │
│         │                                                           │
│         ├──────────┬──────────┬─────────┐                         │
│         ▼          ▼          ▼         ▼                          │
│  ┌────────────┐ ┌──────┐ ┌─────────┐ ┌────────┐                  │
│  │    TTL     │ │MANUAL│ │ WRITE   │ │ REDIS  │                  │
│  │  EXPIRED   │ │FLUSH │ │OPERATION│ │EVICTION│                  │
│  │  (Auto)    │ │(Code)│ │(Trigger)│ │(Memory)│                  │
│  └──────┬─────┘ └───┬──┘ └────┬────┘ └───┬────┘                  │
│         │           │         │          │                         │
│         └───────────┴─────────┴──────────┘                         │
│                     │                                               │
│                     ▼                                               │
│              ┌────────────┐                                        │
│              │  REMOVED   │  Cache key deleted                     │
│              │  FROM      │  Next request will be MISS             │
│              │  REDIS     │  Fetch fresh from DB                   │
│              └────────────┘                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Cache Strategy Decision Tree

```
                        ┌──────────────────────┐
                        │   Data Changed?      │
                        │  (Write Operation)   │
                        └──────┬───────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
               YES                          NO
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │  Invalidate      │        │  Serve from     │
        │  Cache           │        │  Cache          │
        │                  │        │                  │
        │  Pattern:        │        │  Check TTL:     │
        │  - Single key    │        │  - Not expired  │
        │  - Pattern match │        │  - Return fast  │
        │  - Multiple keys │        │  - 10-20ms      │
        └─────────┬────────┘        └─────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Next Request    │
        │  Cache MISS      │
        │                  │
        │  - Query DB      │
        │  - Rebuild cache │
        │  - Set new TTL   │
        └──────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     TTL Selection Decision                          │
│                                                                     │
│  Data Type?                                                         │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐          │
│  │ Real-time   │    │ Semi-dynamic│    │ Near-static  │          │
│  │ (Betting)   │    │ (Fights)    │    │ (Venues)     │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬───────┘          │
│         │                  │                   │                   │
│         ▼                  ▼                   ▼                   │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐          │
│  │ TTL: 15-30s │    │ TTL: 60-120s│    │ TTL: 300-600s│          │
│  │ Very fresh  │    │ Moderate    │    │ Long cache   │          │
│  └─────────────┘    └─────────────┘    └──────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WITHOUT Redis (Before)                           │
│                                                                     │
│  Client Request                                                     │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ Every Request → Database Query                       │         │
│  │                                                       │         │
│  │ - Full table scan or indexed lookup                  │         │
│  │ - Join multiple tables                               │         │
│  │ - Network latency to Neon.tech                       │         │
│  │ - Query processing time                              │         │
│  │                                                       │         │
│  │ Average: 100-150ms per request                       │         │
│  │ Database load: 100 million queries/month             │         │
│  │ Monthly cost: $20,000                                │         │
│  └──────────────────────────────────────────────────────┘         │
│       │                                                             │
│       ▼                                                             │
│  Response to Client                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     WITH Redis (After)                              │
│                                                                     │
│  Client Request                                                     │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ 75-85% → Redis Cache HIT                             │         │
│  │                                                       │         │
│  │ - Redis in-memory lookup                             │         │
│  │ - Deserialize JSON                                   │         │
│  │ - Minimal latency                                    │         │
│  │                                                       │         │
│  │ Average: 10-20ms per request                         │         │
│  │ 90% FASTER! 🚀                                       │         │
│  └──────────────────────────────────────────────────────┘         │
│       │                                                             │
│       └──▶ Response to Client                                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ 15-25% → Redis Cache MISS                            │         │
│  │                                                       │         │
│  │ - Cache key not found or expired                     │         │
│  │ - Query database (same as before)                    │         │
│  │ - Store result in Redis                              │         │
│  │ - Set TTL for next requests                          │         │
│  │                                                       │         │
│  │ Average: 100-150ms (first request only)              │         │
│  │ Subsequent requests: 10-20ms                         │         │
│  └──────────────────────────────────────────────────────┘         │
│       │                                                             │
│       └──▶ Response to Client                                      │
│                                                                     │
│  Result:                                                            │
│  - Database load: 20-30 million queries/month (70-80% reduction)   │
│  - Monthly cost: $2,720-$4,000 ($16-17K savings!)                 │
│  - Cache hit rate: 75-85%                                          │
│  - User experience: 90% faster on cache hits                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │          Express.js Route Handlers                  │           │
│  │                                                      │           │
│  │  GET /api/fights        POST /api/fights            │           │
│  │  GET /api/events        PUT /api/events/:id         │           │
│  │  GET /api/venues        PATCH /api/fights/:id/status│           │
│  │                                                      │           │
│  │  Each handler calls cache utilities                 │           │
│  └──────────────────────┬───────────────────────────────┘           │
│                         │                                            │
└─────────────────────────┼─────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                         ▼     Cache Abstraction Layer               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │        /backend/src/config/database.ts              │           │
│  │                                                      │           │
│  │  export const cache = {                             │           │
│  │    getOrSet(key, fetchFn, ttl),                     │           │
│  │    invalidate(key),                                 │           │
│  │    invalidatePattern(pattern)                       │           │
│  │  }                                                   │           │
│  │                                                      │           │
│  │  Features:                                           │           │
│  │  - Query deduplication fallback                     │           │
│  │  - Graceful degradation                             │           │
│  │  - Retry logic                                      │           │
│  │                                                      │           │
│  └──────────────────────┬───────────────────────────────┘           │
│                         │                                            │
└─────────────────────────┼─────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                         ▼     Redis Configuration Layer             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │        /backend/src/config/redis.ts                 │           │
│  │                                                      │           │
│  │  - Redis client initialization                      │           │
│  │  - Connection management                            │           │
│  │  - Error handling                                   │           │
│  │  - Basic get/set/delete operations                  │           │
│  │                                                      │           │
│  └──────────────────────┬───────────────────────────────┘           │
│                         │                                            │
└─────────────────────────┼─────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                         ▼     Redis Server Layer                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │              Redis Server                           │           │
│  │                                                      │           │
│  │  Local:    Docker (redis:7-alpine)                  │           │
│  │  Dev:      Redis Cloud free tier                    │           │
│  │  Prod:     Redis Cloud, AWS ElastiCache             │           │
│  │                                                      │           │
│  │  Configuration:                                      │           │
│  │  - maxmemory-policy: allkeys-lru                    │           │
│  │  - All keys have TTL (auto-expiration)              │           │
│  │  - Expected usage: <100MB                           │           │
│  │                                                      │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Production Setup                            │
│                                                                     │
│  ┌──────────────────┐                                              │
│  │   Frontend       │                                              │
│  │   (Vercel/       │                                              │
│  │   Netlify)       │                                              │
│  └────────┬─────────┘                                              │
│           │ HTTPS                                                   │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────┐             │
│  │          Backend API (Node.js + Express)          │             │
│  │                                                    │             │
│  │  Deployment options:                               │             │
│  │  - Railway                                         │             │
│  │  - Render                                          │             │
│  │  - Digital Ocean                                   │             │
│  │  - AWS / GCP                                       │             │
│  │                                                    │             │
│  └─────┬──────────────────────────────┬──────────────┘             │
│        │                              │                             │
│        │                              │                             │
│        ▼                              ▼                             │
│  ┌──────────────────┐       ┌──────────────────┐                  │
│  │   PostgreSQL     │       │   Redis Cache    │                  │
│  │   (Neon.tech)    │       │                  │                  │
│  │                  │       │  Options:        │                  │
│  │  - Serverless    │       │  - Redis Cloud   │                  │
│  │  - Auto-scale    │       │  - AWS           │                  │
│  │  - Connection    │       │    ElastiCache   │                  │
│  │    pooling       │       │  - Upstash       │                  │
│  │                  │       │                  │                  │
│  │  Cost: $2.7-4K   │       │  Cost: $0-50/mo  │                  │
│  │  (with caching)  │       │  (free tier)     │                  │
│  └──────────────────┘       └──────────────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Monitoring Dashboard (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Redis Cache Monitoring Dashboard                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Cache Hit Rate:  █████████████████░░░░░  78.5%       ✅ Good  ││
│  │ Target: 75-85%                                                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ DB Query Reduction: ███████████████████░░  75%         ✅ Good  ││
│  │ Target: 70-80%                                                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Redis Memory: ████░░░░░░░░░░░░░░░░░░░ 45.2MB          ✅ Good  ││
│  │ Target: <100MB                                                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Avg Response Time (cached): 12ms                      ✅ Fast  ││
│  │ Avg Response Time (uncached): 135ms                            ││
│  │ Improvement: 91%                                               ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Cache Operations (Last Hour):                                  ││
│  │   Hits:   15,234                                               ││
│  │   Misses:  4,123                                               ││
│  │   Writes:    487                                               ││
│  │   Invalidations: 89                                            ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Top Cached Endpoints:                                          ││
│  │   1. GET /api/fights          - 8,234 hits (85% hit rate)     ││
│  │   2. GET /api/events          - 4,123 hits (82% hit rate)     ││
│  │   3. GET /api/venues          - 2,456 hits (91% hit rate)     ││
│  │   4. GET /api/articles        - 1,987 hits (79% hit rate)     ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Monthly Cost Savings:                                          ││
│  │   Before:  $20,000/month                                       ││
│  │   After:    $3,150/month                                       ││
│  │   Savings: $16,850/month  💰                                   ││
│  │   Annual:  $202,200/year                                       ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Related Documentation:**
- Implementation Plan: `/backend/REDIS_CACHING_IMPLEMENTATION_PLAN.json`
- Summary: `/backend/REDIS_CACHING_SUMMARY.md`
- Checklist: `/backend/REDIS_IMPLEMENTATION_CHECKLIST.md`
- Quick Reference: `/backend/REDIS_QUICK_REFERENCE.md`
- Architecture: `/backend/REDIS_ARCHITECTURE_DIAGRAM.md` (this file)
