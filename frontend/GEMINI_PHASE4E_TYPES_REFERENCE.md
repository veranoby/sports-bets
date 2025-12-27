# GEMINI Phase 4E - Types Reference
**Source**: `src/types/index.ts` y archivos relacionados

## 📦 Available Types - USE THESE FIRST

### Core Domain Types
```typescript
// User & Authentication
User
UserSubscription
UserRole = "user" | "operator" | "venue" | "gallera" | "admin"

// Betting
Bet
BetData extends Omit<Bet, "odds">
BetSide = "rooster1" | "rooster2" | "draw"
BetStatus = "pending" | "won" | "lost" | "cancelled" | "refunded"
BettingNotificationsResponse

// Events & Fights
Event (alias for EventData)
EventData
Fight

// Entities
Venue
Gallera

// Wallet & Transactions
Wallet
Transaction
PaymentMethod

// Notifications
Notification

// Subscriptions
SubscriptionData (alias for UserSubscription)
```

### API Types
```typescript
ApiResponse<T = unknown>
ApiError extends Error
```

### UI Component Props (shadcn/ui)
```typescript
// Alert Dialog
AlertDialogProps
AlertDialogActionProps
AlertDialogCancelProps
AlertDialogContentProps
AlertDialogDescriptionProps
AlertDialogFooterProps
AlertDialogHeaderProps
AlertDialogTitleProps

// Avatar
AvatarProps
AvatarFallbackProps
AvatarImageProps

// Badge
BadgeProps

// Button
ButtonProps

// Card
CardProps
CardContentProps
CardHeaderProps
CardTitleProps

// Dialog
DialogProps
DialogContentProps
DialogHeaderProps
DialogTitleProps

// Dropdown Menu
DropdownMenuProps
DropdownMenuContentProps
DropdownMenuItemProps
DropdownMenuSeparatorProps
DropdownMenuTriggerProps

// Form
FormControlProps
FormDescriptionProps
FormFieldProps
FormItemProps
FormLabelProps
FormMessageProps

// Input & Textarea
InputProps
TextareaProps

// Label
LabelProps

// Select
SelectProps
SelectContentProps
SelectItemProps
SelectTriggerProps
SelectValueProps

// Sheet
SheetProps
SheetContentProps
SheetDescriptionProps
SheetHeaderProps
SheetTitleProps
SheetTriggerProps

// Tabs
TabsProps
TabsContentProps
TabsListProps
TabsTriggerProps

// Toggle
ToggleProps

// Tooltip
TooltipProps
TooltipContentProps
TooltipTriggerProps
```

---

## 🎯 Common Type Patterns

### React Event Handlers
```typescript
// Click events
onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
onClick: (e: React.MouseEvent<HTMLDivElement>) => void

// Form events
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
onSubmit: (e: React.FormEvent<HTMLFormElement>) => void

// Keyboard events
onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
onKeyPress: (e: React.KeyboardEvent) => void
```

### React Component Types
```typescript
React.FC<Props>
React.ReactNode
React.ReactElement
React.ComponentProps<typeof Component>
```

### Promise/Async Types
```typescript
Promise<User>
Promise<ApiResponse<User>>
Promise<void>
async function fetchData(): Promise<User[]> { ... }
```

### Array & Object Types
```typescript
User[]
string[]
number[]
Record<string, User>
Record<string, string | number>
Map<string, User>
```

---

## 📋 Import Patterns

### Single Type Import
```typescript
import type { User } from '../../types';
```

### Multiple Types Import
```typescript
import type { User, Bet, Fight } from '../../types';
```

### Type + Value Import (if needed)
```typescript
import { BetData } from '../../types'; // If also used as value
import type { User } from '../../types'; // Type-only
```

---

## ⚠️ Types NOT Available (Create Inline)

If you need these types, create inline - they don't exist in types files:

### Subscription-related (partial data)
```typescript
// NOT in types.ts - create inline when needed:
{
  membership_type?: string;
  type?: string;
  assigned_username?: string;
}
```

### API Request Bodies
```typescript
// NOT in types.ts - create inline based on API usage:
{
  userId: string;
  amount: number;
  reason: string;
}
```

### Form Data (not matching domain types)
```typescript
// NOT in types.ts - create inline based on form fields:
{
  username: string;
  email: string;
  password?: string;
  // ...
}
```

---

## 🔍 How to Find the Right Type

### Step 1: Check this reference
Look in the "Available Types" section above

### Step 2: Search in types files
```bash
grep -r "interface TypeName\|type TypeName" src/types/
```

### Step 3: Check imports in similar files
```bash
grep "from.*types" src/components/similar-file.tsx
```

### Step 4: Analyze usage in code
If type doesn't exist, analyze what properties are accessed:
```typescript
// Look at code like this:
console.log(data.username); // needs 'username' property
console.log(data.email);    // needs 'email' property

// Create inline type:
const data: { username: string; email: string } = ...
```

---

## ✅ Examples - Type Selection

### Example 1: User parameter
```typescript
// ✅ CORRECT - type exists
import type { User } from '../../types';
const handleUserUpdate = (user: User) => { ... }

// ❌ WRONG - creating new interface
interface UserData { id: string; username: string; }
const handleUserUpdate = (user: UserData) => { ... }
```

### Example 2: API Response
```typescript
// ✅ CORRECT - using ApiResponse generic
import type { User, ApiResponse } from '../../types';
const response: ApiResponse<User> = await api.getUser(id);

// ❌ WRONG - using any
const response: any = await api.getUser(id);
```

### Example 3: Event Handler
```typescript
// ✅ CORRECT - React event type
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }

// ❌ WRONG - any
const handleClick = (e: any) => { ... }
```

### Example 4: Form Data (no existing type)
```typescript
// ✅ CORRECT - inline type based on usage
const handleSubmit = (formData: {
  username: string;
  email: string;
  password?: string;
}) => { ... }

// ❌ WRONG - creating new interface
interface FormSubmitData {
  username: string;
  email: string;
  password?: string;
}
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ Don't create duplicate types
```typescript
// WRONG - User already exists in types
interface UserData {
  id: string;
  username: string;
  email: string;
}

// CORRECT - use existing type
import type { User } from '../../types';
```

### ❌ Don't use overly generic types
```typescript
// WRONG
const data: Record<string, any> = ...

// CORRECT
import type { User } from '../../types';
const data: Record<string, User> = ...
```

### ❌ Don't create interfaces for one-time use
```typescript
// WRONG - interface used only once
interface ClickHandler {
  onClick: (id: string) => void;
}

// CORRECT - inline type
const handler: (id: string) => void = (id) => { ... }
```

---

## 📞 Quick Reference Cheat Sheet

| Scenario | Type to Use |
|----------|-------------|
| User data | `User` |
| Event data | `Event` or `EventData` |
| Fight data | `Fight` |
| Bet data | `Bet` or `BetData` |
| Venue data | `Venue` |
| Gallera data | `Gallera` |
| Subscription | `UserSubscription` |
| Wallet | `Wallet` |
| Transaction | `Transaction` |
| API response | `ApiResponse<T>` |
| Button click | `React.MouseEvent<HTMLButtonElement>` |
| Input change | `React.ChangeEvent<HTMLInputElement>` |
| Form submit | `React.FormEvent<HTMLFormElement>` |
| Array of users | `User[]` |
| User dictionary | `Record<string, User>` |
| Async function | `Promise<T>` |
| Unknown structure | Create inline type |

---

## 💡 Tips

1. **Always import from `../../types`** (adjust path based on file location)
2. **Use type-only imports** when possible: `import type { ... }`
3. **Check existing imports** in the file before adding new ones
4. **Search before creating** - grep is your friend
5. **When in doubt, inline** - better than wrong generic type
