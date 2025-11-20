# GalloBets - Test Credentials

**Last Updated:** 2025-10-02

## Test User Credentials

All test users have been verified and are working correctly.

### Admin User
- **Username:** `admin_test`
- **Password:** `Admin123456`
- **Email:** admin@sportsbets.com
- **Role:** admin

### Operator User
- **Username:** `operator_test`
- **Password:** `Operator123456`
- **Email:** operator1@sportsbets.com
- **Role:** operator

### Venue Owner
- **Username:** `criadero_test`
- **Password:** `Criadero123456`
- **Email:** criadero1@sportsbets.com
- **Role:** gallera

### Gallera Owner
- **Username:** `gallera_test`
- **Password:** `Gallera123456`
- **Email:** gallera1@sportsbets.com
- **Role:** venue

### Regular User
- **Username:** `user_test`
- **Password:** `User123456`
- **Email:** testuser1@sportsbets.com
- **Role:** user

---

## Password Reset Procedure (For Developers)

If password hashes become corrupted or need to be reset:

### Method 1: Using Node.js Script

```bash
node -e "
require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

async function resetPassword(username, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12);
  await sequelize.query(
    'UPDATE users SET password_hash = :hash WHERE username = :username',
    { replacements: { hash, username } }
  );
  console.log('✅ Password updated for', username);
  process.exit(0);
}

resetPassword('USERNAME_HERE', 'NEW_PASSWORD_HERE');
"
```

### Method 2: Using API Endpoint (Admin Only)

```bash
# Update user password via PUT /api/users/:id/password
curl -X PUT http://localhost:3001/api/users/:userId/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"newPassword": "NewPassword123"}'
```

### Method 3: Direct Database Update (Not Recommended)

```sql
-- Generate hash first using bcryptjs
-- Then update database
UPDATE users
SET password_hash = '$2b$12$YOUR_GENERATED_HASH_HERE'
WHERE username = 'username_here';
```

---

## Security Notes

- All passwords use bcrypt with 12 salt rounds
- Passwords must meet minimum requirements (implementation pending)
- Test credentials are for development/testing only
- Production users should use strong, unique passwords
- Never commit real user credentials to version control

---

## Login Verification

To verify all test users can login:

```bash
node -e "
const axios = require('axios');
const API_URL = 'http://localhost:3001/api';

async function testLogin(username, password) {
  const res = await axios.post(\`\${API_URL}/auth/login\`, {
    login: username,
    password: password
  });
  console.log('✅', username, '- Login successful');
}

// Test all users
testLogin('admin_test', 'Admin123456');
testLogin('operator_test', 'Operator123456');
testLogin('venue_test', 'Test123456');
testLogin('gallera_test', 'Gallera123456');
testLogin('user_test', 'User123456');
"
```

---

## Common Issues & Solutions

### Issue: "Invalid credentials" error
**Cause:** Password hash doesn't match stored hash
**Solution:** Use Method 1 above to reset the password hash

### Issue: Password comparison returns false
**Cause:** bcryptjs version mismatch or corrupted hash
**Solution:** Regenerate hash using current bcryptjs version (3.0.2)

### Issue: User not found
**Cause:** User doesn't exist in database
**Solution:** Check username spelling or create user via API/seeder

---

## Related Files

- Password hashing: `backend/src/models/User.ts` (lines 76-86)
- Login logic: `backend/src/routes/auth.ts` (lines 171-179)
- Password update: `backend/src/routes/users.ts` (PUT /:id/password endpoint)

---

**⚠️ IMPORTANT:** This file contains test credentials for development only.
Never use these credentials in production environments.
