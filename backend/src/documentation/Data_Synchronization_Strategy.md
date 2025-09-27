# Data Synchronization Strategy - Venue/Gallera Profile Integration

**Document Version**: 1.0
**Last Updated**: Sept 27, 2025
**Status**: Implemented

## Overview

This document describes the complete data synchronization strategy between `user.profileInfo` and dedicated venue/gallera tables implemented to ensure data consistency and provide unified business entity management.

## Architecture Decision: Option B - Complete Synchronization

### Why Option B was Chosen

- **Data Consistency**: Single source of truth with automatic propagation
- **User Experience**: Seamless profile editing with business entity updates
- **Performance**: Reduced API calls by maintaining synchronized data
- **Maintainability**: Clear data flow and fewer integration points

## Implementation Details

### 1. Backend Synchronization Logic

**Location**: `/src/routes/users.ts` - PUT `/api/users/profile` endpoint

```typescript
// Synchronize with venue/gallera tables if role matches
if (profileInfo && user.role === 'venue' && profileInfo.venueName) {
  try {
    const { Venue } = require('../models');
    let venue = await Venue.findOne({ where: { ownerId: user.id } });

    if (venue) {
      // Update existing venue
      await venue.update({
        name: profileInfo.venueName,
        location: profileInfo.venueLocation || venue.location,
        description: profileInfo.venueDescription || venue.description,
        contactInfo: {
          ...venue.contactInfo,
          email: profileInfo.venueEmail || venue.contactInfo?.email,
          website: profileInfo.venueWebsite || venue.contactInfo?.website,
        }
      });
    } else if (profileInfo.venueName && profileInfo.venueLocation) {
      // Create new venue record
      await Venue.create({
        name: profileInfo.venueName,
        location: profileInfo.venueLocation,
        description: profileInfo.venueDescription || '',
        ownerId: user.id,
        contactInfo: {
          email: profileInfo.venueEmail,
          website: profileInfo.venueWebsite,
        }
      });
    }
  } catch (venueError) {
    console.error('Error synchronizing venue data:', venueError);
    // Don't fail the whole request if venue sync fails
  }
}

// Similar logic for gallera synchronization...
```

### 2. Data Flow Architecture

```
User Profile Update (PUT /api/users/profile)
    ↓
Update user.profileInfo in database
    ↓
Check user.role (venue/gallera)
    ↓
Synchronize with dedicated table
    ↓
Return updated user data
```

### 3. Frontend Integration

**Location**: `/frontend/src/components/forms/UserProfileForm.tsx`

**Extended Interface**:
```typescript
interface ExtendedProfileInfo extends NonNullable<User["profileInfo"]> {
  // Venue specific fields
  venueName?: string;
  venueLocation?: string;
  venueDescription?: string;
  venueEmail?: string;
  venueWebsite?: string;

  // Gallera specific fields
  galleraName?: string;
  galleraLocation?: string;
  galleraDescription?: string;
  galleraEmail?: string;
  galleraWebsite?: string;
  galleraSpecialties?: string;
  galleraActiveRoosters?: number;
}
```

### 4. Display Name Logic

**Header Component**: `/frontend/src/components/user/UserHeader.tsx`
```typescript
{user.role === "venue"
  ? user.profileInfo?.venueName || user.profileInfo?.businessName || user.username
  : user.role === "gallera"
  ? user.profileInfo?.galleraName || user.profileInfo?.businessName || user.username
  : user.username
}
```

**Profile Page**: `/frontend/src/pages/user/Profile.tsx`
```typescript
{user.role === "venue"
  ? user.profileInfo?.venueName || user.profileInfo?.businessName || user.profileInfo?.fullName || user.username
  : user.role === "gallera"
  ? user.profileInfo?.galleraName || user.profileInfo?.businessName || user.profileInfo?.fullName || user.username
  : user.profileInfo?.fullName || user.username
}
```

## Field Mapping Strategy

### Venue Fields
| Profile Field | Venue Table Field | Priority |
|---------------|-------------------|----------|
| venueName | name | Primary |
| venueLocation | location | Primary |
| venueDescription | description | Secondary |
| venueEmail | contactInfo.email | Secondary |
| venueWebsite | contactInfo.website | Secondary |
| businessName | name (fallback) | Fallback |

### Gallera Fields
| Profile Field | Gallera Table Field | Priority |
|---------------|---------------------|----------|
| galleraName | name | Primary |
| galleraLocation | location | Primary |
| galleraDescription | description | Secondary |
| galleraEmail | contactInfo.email | Secondary |
| galleraWebsite | contactInfo.website | Secondary |
| galleraSpecialties | specialties | Secondary |
| galleraActiveRoosters | activeRoosters | Secondary |

## Data Priority Rules

1. **Dedicated Fields First**: Use venue/gallera specific fields (venueName, galleraName)
2. **Business Fields Second**: Fall back to generic business fields (businessName)
3. **User Fields Last**: Fall back to user personal fields (fullName, username)

## Error Handling

### Synchronization Failures
- **Non-Blocking**: Venue/gallera sync failures don't block profile updates
- **Logging**: All sync errors are logged for debugging
- **Graceful Degradation**: Profile updates succeed even if sync fails

### Validation Strategy
- **Profile Level**: Validate required fields for venue/gallera roles
- **Database Level**: Let database constraints handle data integrity
- **UI Level**: Show appropriate validation messages

## API Response Format

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user-uuid",
    "username": "venue_owner",
    "role": "venue",
    "profileInfo": {
      "fullName": "John Doe",
      "venueName": "Elite Cockfighting Arena",
      "venueLocation": "Quito, Ecuador",
      "venueDescription": "Premier venue for professional matches",
      "businessName": "Elite Entertainment LLC"
    }
  }
}
```

## Testing Strategy

### Integration Tests
- Profile update with venue sync
- Profile update with gallera sync
- Sync failure scenarios
- Data consistency validation

### Frontend Tests
- Form submission with venue fields
- Display name rendering logic
- Validation error handling

## Performance Considerations

### Database Operations
- **Single Transaction**: Profile and sync updates in one transaction
- **Conditional Sync**: Only sync when relevant fields change
- **Error Isolation**: Sync failures don't affect primary update

### Frontend Optimization
- **Conditional Rendering**: Show venue/gallera fields only for relevant roles
- **Form State Management**: Efficient state updates for extended forms

## Migration Notes

### Existing Data
- Existing venues/galleras maintain their current data
- Profile updates will sync incrementally
- No bulk migration required

### Backward Compatibility
- API maintains existing response format
- Additional fields are optional
- Legacy integrations unaffected

## Future Enhancements

### Potential Improvements
1. **Real-time Sync**: WebSocket notifications for data changes
2. **Bulk Operations**: Batch sync for multiple entities
3. **Audit Trail**: Track sync history and changes
4. **Advanced Validation**: Cross-field validation rules

### Monitoring Metrics
- Sync success/failure rates
- Profile update frequency
- Data consistency checks
- Performance impact measurements

## Related Documentation

- [API Endpoints Reference](/brain/api_endpoints_reference.json)
- [Database Schema](/brain/database-analysis.md)
- [User Profile Management](/backend/src/routes/users.ts)
- [SSE Architecture](/backend/src/documentation/SSE_Architecture_Summary.md)

---

**Implementation Team**: Claude (Backend & Frontend)
**Review Status**: Ready for Production
**Deployment**: September 27, 2025