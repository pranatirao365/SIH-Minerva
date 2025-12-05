# Miner Testimonial System

## Overview
The testimonial system allows miners to upload video testimonials about their safety experiences. All testimonials require safety officer approval before becoming visible to other miners.

## Workflow

### 1. Miner Uploads Testimonial
- **Location**: Miner Dashboard → Testimonials
- **Actions**: 
  - Record or select video (max 60 seconds)
  - Add caption (max 200 characters)
  - Submit for review
- **Status**: `pending` (awaiting safety officer review)
- **Storage**: Firestore `testimonials` collection

### 2. Safety Officer Reviews
- **Location**: Safety Officer Dashboard → Testimonial Review
- **Notification**: Red badge shows count of pending testimonials
- **Auto-refresh**: Pending count updates every 30 seconds
- **Actions**:
  - **Approve**: Testimonial becomes visible to all miners
  - **Reject**: Testimonial hidden, optional reason provided to miner

### 3. Approved Testimonials Display
- **Location**: Miner Dashboard → Testimonials
- **Visible to**: All miners (only approved testimonials)
- **Features**:
  - Instagram Reels-style vertical feed
  - Like/unlike functionality
  - Share capability
  - Comments counter
- **Status**: `approved`

## Database Structure

### Collection: `testimonials`

```typescript
{
  id: string (auto-generated)
  userId: string (phone or user.id)
  userName: string
  userRole: string
  userPhone: string
  videoUri: string
  thumbnailUri?: string
  caption: string
  likes: number
  comments: number
  shares: number
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
  likedBy: string[]
  createdAt: Timestamp
  approvedAt?: Timestamp
  approvedBy?: string
  rejectedAt?: Timestamp
  rejectedBy?: string
  rejectionReason?: string
}
```

## Firestore Indexes

Three composite indexes created for efficient querying:

1. **Pending Testimonials** (Safety Officer Review)
   - `status` (ASC) + `createdAt` (DESC)

2. **Approved Testimonials** (Miner Feed)
   - `status` (ASC) + `approvedAt` (DESC)

3. **User's Testimonials** (My Testimonials)
   - `userId` (ASC) + `createdAt` (DESC)

## Security Rules

### Test Mode (until Dec 26, 2025)
- Open access to all operations

### Normal Mode
- **Read**: 
  - Approved testimonials: all authenticated users
  - Own testimonials: testimonial creator
  - All testimonials: safety officers
- **Create**: All authenticated users
- **Update**: Testimonial creator OR safety officers

## Components

### Files Created/Modified

1. **`services/testimonialService.ts`** (NEW)
   - `submitTestimonial()` - Miner uploads testimonial
   - `getApprovedTestimonials()` - Load public feed
   - `getPendingTestimonials()` - Safety officer review queue
   - `getMyTestimonials()` - User's own testimonials
   - `approveTestimonial()` - Safety officer approves
   - `rejectTestimonial()` - Safety officer rejects
   - `toggleLikeTestimonial()` - Like/unlike functionality
   - `getTestimonialStats()` - Dashboard statistics

2. **`app/miner/Testimonials.tsx`** (UPDATED)
   - Integrated Firebase backend
   - Real-time testimonial feed
   - Upload modal with video picker
   - My Testimonials view with status badges
   - Pull-to-refresh functionality

3. **`app/safety-officer/TestimonialReview.tsx`** (UPDATED)
   - Full review interface (replaced placeholder)
   - Statistics dashboard (pending/approved/rejected)
   - Approve/reject actions with confirmation
   - Optional rejection reason input
   - Real-time updates

4. **`app/safety-officer/SafetyOfficerHome.tsx`** (UPDATED)
   - Added pending testimonials badge
   - Auto-refreshes every 30 seconds
   - Clears badge on testimonial review navigation

5. **`firestore.rules`** (UPDATED)
   - Added testimonials collection rules
   - Status-based read permissions
   - Role-based write permissions

6. **`firestore.indexes.json`** (UPDATED)
   - Added 3 composite indexes for testimonials

## Testing Workflow

### Test Accounts
- **Safety Officer**: +911234567893 (OTP: 123456)
- **Miner**: +919876543210 (OTP: 123456)

### Testing Steps

1. **Upload Testimonial (as Miner)**
   ```
   Login as miner → Navigate to Testimonials
   → Tap Upload button → Record/Select video
   → Add caption → Submit
   ✓ Should show "Submitted!" alert
   ✓ Check "My Videos" - status should be "pending"
   ```

2. **Review Testimonial (as Safety Officer)**
   ```
   Login as safety officer → Check home screen
   ✓ "Testimonial Review" should show red badge with count
   → Tap Testimonial Review
   ✓ Should see pending testimonial card
   → Tap "Approve" or "Reject"
   ✓ Should show confirmation
   ✓ Badge count should decrease
   ```

3. **View Approved Testimonial (as Miner)**
   ```
   Login as miner → Navigate to Testimonials
   ✓ Approved testimonial should appear in main feed
   → Tap heart icon to like
   ✓ Like count should increase
   → Swipe vertically to see more testimonials
   ```

4. **Check "My Videos" Status (as Miner)**
   ```
   In Testimonials screen → Tap "My Videos"
   ✓ Should show all user's testimonials
   ✓ Status badges: Green (approved), Orange (pending), Red (rejected)
   ✓ Stats only visible for approved testimonials
   ```

## Features

### Miner Features
- ✅ Upload video testimonials (record or select)
- ✅ Write captions (max 200 chars)
- ✅ View approval status of own testimonials
- ✅ Browse approved testimonials from all miners
- ✅ Like/unlike testimonials
- ✅ Share testimonials
- ✅ Pull-to-refresh feed

### Safety Officer Features
- ✅ Real-time pending testimonial notifications
- ✅ Review queue with statistics dashboard
- ✅ Approve testimonials (makes visible to all)
- ✅ Reject testimonials with optional reason
- ✅ View testimonial metadata (user, role, timestamp)
- ✅ Auto-refreshing badge count

### System Features
- ✅ Firebase real-time database integration
- ✅ Optimistic UI updates (instant like feedback)
- ✅ Composite indexes for fast queries
- ✅ Role-based security rules
- ✅ Loading states and error handling
- ✅ Empty state handling

## API Methods

### `submitTestimonial(testimonialData)`
Creates new testimonial with status: pending

### `getApprovedTestimonials()`
Returns all approved testimonials, ordered by approval date (newest first)

### `getPendingTestimonials()`
Returns all pending testimonials, ordered by creation date (safety officer only)

### `getMyTestimonials(userId)`
Returns user's own testimonials (all statuses), ordered by creation date

### `approveTestimonial(testimonialId, approvedBy)`
Updates status to 'approved', sets approvedAt timestamp and approvedBy

### `rejectTestimonial(testimonialId, rejectedBy, reason?)`
Updates status to 'rejected', sets rejectedAt, rejectedBy, and optional reason

### `toggleLikeTestimonial(testimonialId, userId)`
Adds/removes user from likedBy array, increments/decrements likes count

### `getTestimonialStats()`
Returns { total, pending, approved, rejected } counts

## Deployment Status

✅ **Firestore Rules**: Deployed successfully to `sihtut-1`
✅ **Firestore Indexes**: Deployed successfully to `sihtut-1`
✅ **TypeScript Compilation**: No errors
✅ **Ready for Testing**: All components operational

## Future Enhancements

- [ ] Video upload to Firebase Storage (currently using local URIs)
- [ ] Comment system implementation
- [ ] Push notifications for approval/rejection
- [ ] Testimonial analytics (views, engagement)
- [ ] Video playback controls
- [ ] Filtering by category/topic
- [ ] Search functionality
- [ ] Testimonial of the month feature
