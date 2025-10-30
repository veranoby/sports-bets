# Admin Filters Implementation Plan
## /admin/users, /admin/venues, /admin/galleras

---

## 1. Current State Analysis

### Backend API Support

#### GET /api/users (Line 49-94, users.ts)
**Currently supports:**
- ✅ `role` - filter by user role
- ✅ `isActive` - filter by active/inactive status
- ✅ `search` - search by username or email
- ❌ `approved` - NOT SUPPORTED (must add)
- ❌ `subscriptionType` - NOT SUPPORTED (must add)

**Current usage in frontend:** Users.tsx line 26
```typescript
const users = await usersAPI.getAll({ role: "user", limit: 1000 });
```

#### GET /api/venues (Line 36-135, venues.ts)
**Currently supports:**
- ✅ `status` - filter by venue status (pending, active, suspended, approved, rejected)
- ❌ `ownerApproved` - NOT SUPPORTED (must add)
- ❌ `ownerSubscription` - NOT SUPPORTED (must add)
- ❌ `search` - NOT SUPPORTED (search by venue name, owner)

**Current usage in frontend:** Venues.tsx line 53
```typescript
const venues = await venuesAPI.getAll({ limit: 1000 });
```

#### GET /api/galleras (Line 14-111, galleras.ts)
**Currently supports:**
- ✅ `status` - filter by gallera status (pending, active, suspended, rejected)
- ❌ `ownerApproved` - NOT SUPPORTED (must add)
- ❌ `ownerSubscription` - NOT SUPPORTED (must add)
- ❌ `search` - NOT SUPPORTED (search by gallera name, owner)

**Current usage in frontend:** Galleras.tsx line 85
```typescript
const galleras = await gallerasAPI.getAll({ limit: 1000 });
```

---

## 2. Filter Requirements (from user feedback)

### /admin/users Filter Options
```
Status options:
- todos (all) = show all users
- activos (active) = user.isActive = true
- inactivos (inactive) = user.isActive = false
- aprobados (approved) = user.approved = true
- pendientes (pending) = user.approved = false

Subscription options:
- todos (all) = show all subscriptions
- free = subscription.type = null (or status = 'free')
- pago mensual (monthly) = subscription.type = 'monthly'
- pago 24H (24h) = subscription.type = 'daily'
```

### /admin/venues Filter Options
```
Status options:
- todos (all) = show all venues
- activos (active) = venue.status = 'active'
- pendientes (pending) = venue.status = 'pending'
- rechazados (rejected) = venue.status = 'rejected'

Owner Approval:
- todos (all) = any owner approval status
- aprobados (approved) = owner.approved = true
- pendientes (pending) = owner.approved = false

Owner Subscription:
- todos (all) = any subscription
- free = owner.subscription = free
- pago mensual = owner.subscription = monthly
- pago 24H = owner.subscription = daily
```

### /admin/galleras Filter Options
```
Status options:
- todos (all) = show all galleras
- activos (active) = gallera.status = 'active'
- pendientes (pending) = gallera.status = 'pending'
- rechazados (rejected) = gallera.status = 'rejected'

Owner Approval:
- todos (all) = any owner approval status
- aprobados (approved) = owner.approved = true
- pendientes (pending) = owner.approved = false

Owner Subscription:
- todos (all) = any subscription
- free = owner.subscription = free
- pago mensual = owner.subscription = monthly
- pago 24H = owner.subscription = daily
```

---

## 3. Implementation Steps

### PHASE 1: Backend API Extensions (Days 1-2)

#### 1.1 Extend GET /api/users with new filters
**File:** `backend/src/routes/users.ts` (line 54)

```typescript
// BEFORE:
const { limit = 50, offset = 0, role, isActive, search } = req.query;

// AFTER - Add these parameters:
const { limit = 50, offset = 0, role, isActive, search, approved, subscriptionType } = req.query;

// Then update the where clause:
const where: any = {};
if (role) where.role = role;
if (isActive !== undefined) where.isActive = isActive === "true";
if (approved !== undefined) where.approved = approved === "true";
if (search) {
  where[Op.or] = [
    { username: { [Op.iLike]: `%${search}%` } },
    { email: { [Op.iLike]: `%${search}%` } },
  ];
}

// NEW: Add subscription filtering via JOIN
if (subscriptionType) {
  // Need to build a complex query filtering by subscription
  // subscriptionType can be: 'free', 'daily', 'monthly'
  const { Subscription } = require('../models');
  const subWhere = subscriptionType === 'free'
    ? { status: 'free' }
    : { type: subscriptionType };

  // This requires including Subscription in the query
  // See implementation notes below
}
```

**Implementation Details:**
- Add `include: [{ model: Subscription, attributes: ['type', 'status'] }]` to handle subscription filtering
- When subscriptionType is provided, filter via the associated Subscription model
- Handle the case where a user has no subscription (treat as 'free')

**Test Command:**
```bash
curl "http://localhost:3001/api/users?role=venue&approved=true&subscriptionType=monthly"
```

---

#### 1.2 Extend GET /api/venues with new filters
**File:** `backend/src/routes/venues.ts` (line 40)

```typescript
// BEFORE:
const { status, limit = 20, offset = 0 } = req.query as any;

// AFTER - Add these parameters:
const { status, limit = 20, offset = 0, ownerApproved, ownerSubscription, search } = req.query as any;

// Then update the userWhere clause:
const userWhere: any = {
  role: 'venue',
  isActive: true
};

// NEW: Add owner filters
if (ownerApproved !== undefined) {
  userWhere.approved = ownerApproved === "true";
}

if (search) {
  // Search in venue name, location, and owner username
  userWhere[Op.or] = [
    { username: { [Op.iLike]: `%${search}%` } },
    // venue name and location will be searched in the transformed rows
  ];
}

// NEW: Add subscription filtering
if (ownerSubscription) {
  // Need to include Subscription model and filter
  // This is more complex - see implementation notes
}
```

**Implementation Details:**
- The `status` filter already works (filters the Venue model)
- Add `ownerApproved` filter on the User model
- Add subscription filtering via User's Subscription relation
- For search, filter on both user (username) and venue name in the results

**Updated Query Structure:**
```typescript
const { count, rows } = await User.findAndCountAll({
  where: userWhere,
  attributes: ["id", "username", "email", "profileInfo", "approved", "createdAt", "updatedAt"],
  include: [
    {
      model: Venue,
      as: "venues",
      attributes: venueAttributes,
      required: false,
      separate: true,
      where: status ? { status } : {},
    },
    // NEW: Include Subscription for filtering
    ...(ownerSubscription ? [{
      model: Subscription,
      attributes: ['type', 'status'],
      required: true,
      where: ownerSubscription === 'free'
        ? { status: 'free' }
        : { type: ownerSubscription },
      separate: true,
    }] : []),
  ],
  order: [["createdAt", "DESC"]],
  limit: parseInt(limit as string),
  offset: parseInt(offset as string),
  subQuery: false,
});
```

**Test Command:**
```bash
curl "http://localhost:3001/api/venues?status=active&ownerApproved=true&ownerSubscription=monthly"
```

---

#### 1.3 Extend GET /api/galleras with new filters
**File:** `backend/src/routes/galleras.ts` (line 18)

**Exactly the same pattern as venues.ts**

```typescript
const { status, limit = 50, offset = 0, ownerApproved, ownerSubscription, search } = req.query as any;

const userWhere: any = {
  role: 'gallera',
  isActive: true
};

if (ownerApproved !== undefined) {
  userWhere.approved = ownerApproved === "true";
}

// Similar subscription filtering as venues
```

---

### PHASE 2: Frontend Dashboard Updates (Days 2-3)

#### 2.1 Fix AdminDashboard.tsx - Add missing Galleras card
**File:** `frontend/src/pages/admin/AdminDashboard.tsx`

**Current Issue:** Line 206 only renders pendingVenues card, missing pendingGalleras card

**Changes:**
```typescript
// BEFORE (line 206):
{pendingVenues > 0 && (
  <DashboardCard
    title="Venues"
    count={pendingVenues}
    onClick={() => navigate("/admin/venues?filter=pending")}
  />
)}

// AFTER - Add galleras card:
{pendingGalleras > 0 && (
  <DashboardCard
    title="Galleras"
    count={pendingGalleras}
    onClick={() => navigate("/admin/galleras?filter=pending")}
  />
)}

// Also add a "Usuarios a Aprobar" card if missing:
{pendingUsers > 0 && (
  <DashboardCard
    title="Users Pending Approval"
    count={pendingUsers}
    onClick={() => navigate("/admin/users?filter=pending")}
  />
)}
```

**Styling:** Use consistent DashboardCard component (copy from existing pendingVenues)

---

### PHASE 3: Frontend Admin Pages - Add Filter Dropdowns (Days 3-4)

#### 3.1 Update Users.tsx with filter dropdowns
**File:** `frontend/src/pages/admin/Users.tsx`

**Current State:** Lines 39-44 only do search-based filtering, ignore URL filter param

**Changes:**
```typescript
// 1. Add state for selected filters
const [selectedStatus, setSelectedStatus] = useState<string>(
  new URLSearchParams(location.search).get('status') || 'all'
);
const [selectedSubscription, setSelectedSubscription] = useState<string>(
  new URLSearchParams(location.search).get('subscription') || 'all'
);

// 2. Update the API call to pass filters
useEffect(() => {
  const params: any = { role: "user" };
  if (selectedStatus !== 'all') {
    params.approved = selectedStatus === 'approved' ? 'true' : 'false';
    // For active/inactive use isActive
    if (selectedStatus === 'active') params.isActive = 'true';
    if (selectedStatus === 'inactive') params.isActive = 'false';
  }
  if (selectedSubscription !== 'all') {
    params.subscriptionType = selectedSubscription;
  }

  fetchUsers(params);
}, [selectedStatus, selectedSubscription]);

// 3. Add filter dropdown UI above the table
<div className="flex gap-4 mb-4">
  <select
    value={selectedStatus}
    onChange={(e) => {
      setSelectedStatus(e.target.value);
      // Update URL
      const params = new URLSearchParams(location.search);
      if (e.target.value !== 'all') params.set('status', e.target.value);
      else params.delete('status');
      navigate(`?${params.toString()}`);
    }}
    className="border rounded px-3 py-2"
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
    <option value="approved">Approved</option>
    <option value="pending">Pending Approval</option>
  </select>

  <select
    value={selectedSubscription}
    onChange={(e) => {
      setSelectedSubscription(e.target.value);
      // Update URL
      const params = new URLSearchParams(location.search);
      if (e.target.value !== 'all') params.set('subscription', e.target.value);
      else params.delete('subscription');
      navigate(`?${params.toString()}`);
    }}
    className="border rounded px-3 py-2"
  >
    <option value="all">All Subscriptions</option>
    <option value="free">Free</option>
    <option value="monthly">Monthly (30-day)</option>
    <option value="daily">24-hour</option>
  </select>
</div>
```

---

#### 3.2 Update Venues.tsx with filter dropdowns
**File:** `frontend/src/pages/admin/Venues.tsx`

**Current State:** Line 85-96 only search filtering, no status or owner filters

**Changes:**
```typescript
// 1. Add state for venue-specific filters
const [venueStatus, setVenueStatus] = useState<string>(
  new URLSearchParams(location.search).get('status') || 'all'
);
const [ownerApproved, setOwnerApproved] = useState<string>(
  new URLSearchParams(location.search).get('ownerApproved') || 'all'
);
const [ownerSubscription, setOwnerSubscription] = useState<string>(
  new URLSearchParams(location.search).get('subscription') || 'all'
);

// 2. Update API call to include all filters
useEffect(() => {
  const params: any = {};
  if (venueStatus !== 'all') params.status = venueStatus;
  if (ownerApproved !== 'all') params.ownerApproved = ownerApproved === 'approved';
  if (ownerSubscription !== 'all') params.ownerSubscription = ownerSubscription;
  if (searchTerm) params.search = searchTerm;

  fetchVenues(params);
}, [venueStatus, ownerApproved, ownerSubscription, searchTerm]);

// 3. Add dropdown UI
<div className="flex gap-4 mb-4">
  <select value={venueStatus} onChange={(e) => setVenueStatus(e.target.value)}>
    <option value="all">All Venues</option>
    <option value="active">Active</option>
    <option value="pending">Pending</option>
    <option value="rejected">Rejected</option>
  </select>

  <select value={ownerApproved} onChange={(e) => setOwnerApproved(e.target.value)}>
    <option value="all">All Owners</option>
    <option value="approved">Owner Approved</option>
    <option value="pending">Owner Pending</option>
  </select>

  <select value={ownerSubscription} onChange={(e) => setOwnerSubscription(e.target.value)}>
    <option value="all">All Subscriptions</option>
    <option value="free">Free Users</option>
    <option value="monthly">Monthly Users</option>
    <option value="daily">24-hour Users</option>
  </select>

  <input
    type="search"
    placeholder="Search venues..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
```

---

#### 3.3 Update Galleras.tsx with filter dropdowns
**File:** `frontend/src/pages/admin/Galleras.tsx`

**Exactly the same pattern as Venues.tsx**

---

### PHASE 4: Fix URL Parameter Handling (Days 4-5)

#### 4.1 Dashboard links should pass correct filter params

**Current issue:** Links use `?filter=pending` but pages expect other params

**Fix in AdminDashboard.tsx:**
```typescript
// BEFORE:
onClick={() => navigate("/admin/users?filter=pending")}

// AFTER:
onClick={() => navigate("/admin/users?status=pending")}

// For venues:
onClick={() => navigate("/admin/venues?status=pending")}

// For galleras:
onClick={() => navigate("/admin/galleras?status=pending")}
```

---

## 4. Backend API Extensions - Detailed Implementation

### Challenge: Subscription Filtering (QWEN: Read This Carefully!)

The tricky part is filtering by subscription type. Here's the EXACT solution to implement:

**IMPORTANT: Three Different Subscription Types**
- `free`: User has NO active subscription (or status='free')
- `monthly`: User has subscription.type = 'monthly' AND status='active'
- `daily`: User has subscription.type = 'daily' AND status='active'

**Complete Implementation for GET /api/users**:

```typescript
// In backend/src/routes/users.ts - Line 54 area
const { limit = 50, offset = 0, role, isActive, search, approved, subscriptionType } = req.query;

const where: any = {};
if (role) where.role = role;
if (isActive !== undefined) where.isActive = isActive === "true";
if (approved !== undefined) where.approved = approved === "true";

// SUBSCRIPTION FILTERING LOGIC:
let subscriptionWhere: any = null;

if (subscriptionType === 'free') {
  subscriptionWhere = {
    // Find users WITH NO active subscription
    // This requires a LEFT JOIN with Subscription and filtering where sub IS NULL
    // OR users where subscription.status = 'free'
  };
} else if (subscriptionType === 'monthly') {
  subscriptionWhere = {
    type: 'monthly',
    status: 'active',
    expiresAt: { [Op.gt]: new Date() }
  };
} else if (subscriptionType === 'daily') {
  subscriptionWhere = {
    type: 'daily',
    status: 'active',
    expiresAt: { [Op.gt]: new Date() }
  };
}

const users = await User.findAndCountAll({
  where,
  attributes: { exclude: ["passwordHash", "verificationToken"] },
  include: subscriptionWhere ? [{
    model: Subscription,
    attributes: ['type', 'status', 'expiresAt'],
    where: subscriptionWhere,
    required: true, // INNER JOIN - only users WITH matching subscription
  }] : [],
  order: [["createdAt", "DESC"]],
  limit: Math.min(parseInt(limit as string), 100),
  offset: parseInt(offset as string),
});
```

**CRITICAL NOTES FOR QWEN**:
1. ✅ Subscription model is already imported in users.ts (check line 3-10)
2. ✅ Op is imported from sequelize (already available)
3. ⚠️ 'free' filtering is special - need LEFT JOIN or separate query for users WITHOUT active subscriptions
4. ⚠️ Make sure expiresAt comparison uses proper type (Date, not string)
5. 🔄 Test each filter separately: `?subscriptionType=monthly`, `?subscriptionType=daily`, `?subscriptionType=free`

**Troubleshooting**:
```sql
-- SQL query to test 'free' users (no active subscription):
SELECT u.id, u.username, s.type, s.status
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
  AND s.status = 'active'
  AND s.expires_at > NOW()
WHERE s.id IS NULL AND u.role = 'user';

-- Test 'monthly' users:
SELECT u.id, u.username, s.type, s.status
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.type = 'monthly' AND s.status = 'active' AND s.expires_at > NOW();
```

---

## 5. Testing Checklist

### Backend Testing
```bash
# Test users filtering
curl "http://localhost:3001/api/users?role=venue"
curl "http://localhost:3001/api/users?role=venue&approved=true"
curl "http://localhost:3001/api/users?role=venue&isActive=true"
curl "http://localhost:3001/api/users?subscriptionType=monthly"

# Test venues filtering
curl "http://localhost:3001/api/venues?status=active"
curl "http://localhost:3001/api/venues?ownerApproved=true"
curl "http://localhost:3001/api/venues?ownerSubscription=monthly"

# Test galleras filtering
curl "http://localhost:3001/api/galleras?status=pending"
```

### Frontend Testing
1. Navigate to /admin/users
   - [ ] Filter by status shows correct users
   - [ ] Filter by subscription shows correct users
   - [ ] URL updates when filter changes
   - [ ] Page refreshes with correct filters applied

2. Navigate to /admin/venues
   - [ ] Filter by status, owner approval, subscription work
   - [ ] Clicking dashboard card passes correct filter

3. Navigate to /admin/galleras
   - [ ] Same as venues
   - [ ] Galleras card now appears on dashboard

4. Dashboard
   - [ ] All three cards appear with correct counts
   - [ ] Clicking each card navigates to correct page with filter

---

## 6. File Modification Summary

| File | Changes | LOC | Priority |
|------|---------|-----|----------|
| backend/src/routes/users.ts | Add `approved` & `subscriptionType` filters | 20-30 | High |
| backend/src/routes/venues.ts | Add `ownerApproved` & `ownerSubscription` filters | 30-40 | High |
| backend/src/routes/galleras.ts | Add `ownerApproved` & `ownerSubscription` filters | 30-40 | High |
| frontend/src/pages/admin/Users.tsx | Add filter dropdowns, handle URL params | 40-60 | High |
| frontend/src/pages/admin/Venues.tsx | Add filter dropdowns, handle URL params | 40-60 | High |
| frontend/src/pages/admin/Galleras.tsx | Add filter dropdowns, handle URL params | 40-60 | High |
| frontend/src/pages/admin/AdminDashboard.tsx | Add Galleras card, fix filter links | 20-30 | Medium |

---

## 7. Estimated Timeline
- Backend API extensions: 2-3 days
- Dashboard updates: 1 day
- Frontend dropdowns: 2-3 days
- Testing & debugging: 1-2 days

**Total: 6-9 days**

