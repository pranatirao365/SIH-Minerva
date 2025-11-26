# 👑 Admin Panel Setup Guide

## Overview
The admin panel allows administrators to manage users and assign roles directly from the mobile app without manually editing Firestore.

## Admin Login Credentials
**Phone:** `+919999999999`  
**Role:** `admin`

## Features

### ✅ User Management
- **Add New Users**: Create users with phone numbers in format `+91XXXXXXXXXX`
- **Assign Roles**: Choose from 5 available roles
  - 👷 Miner
  - 🔧 Engineer  
  - 👨‍💼 Supervisor
  - 🛡️ Safety Officer
  - 👑 Admin
- **View All Users**: Real-time list of all registered users
- **Delete Users**: Remove users from the system
- **Refresh**: Update user list on demand

### 🔒 Security
- Only users with `admin` role can access the admin panel
- Phone numbers are validated before adding (E.164 format: +91XXXXXXXXXX)
- Firestore document IDs use phone without `+` prefix (917416013923)
- Deletion requires confirmation

## How to Use

### 1. Login as Admin
1. Open the app
2. Enter phone: `9999999999` (app adds +91 automatically)
3. Enter OTP received via SMS
4. You'll be redirected to Admin Home

### 2. Add a New User
1. Enter phone number (10 digits, +91 prefix added automatically)
2. Select a role from the available options
3. Tap "Add User"
4. User is created in Firestore with structure:
   ```json
   {
     "phoneNumber": "+919876543210",
     "role": "miner",
     "createdAt": "2025-11-26T...",
     "createdBy": "+919999999999"
   }
   ```

### 3. View Users
- All users are listed with their phone numbers and roles
- Color-coded role badges for easy identification
- Tap "🔄 Refresh" to reload the list

### 4. Delete a User
1. Find the user in the list
2. Tap "🗑️ Delete" button
3. Confirm deletion in the alert
4. User is removed from Firestore

## Current Users in Database

| Phone Number      | Role            |
|-------------------|-----------------|
| +917416013923     | Supervisor      |
| +918885648652     | Miner           |
| +918919125074     | Safety Officer  |
| +919999999999     | **Admin**       |

## Technical Details

### File Structure
```
app/
  admin/
    AdminHome.tsx       # Admin panel interface
  auth/
    OTPVerification.tsx # Updated with admin routing
```

### Firestore Schema
**Collection:** `users`  
**Document ID:** Phone number without + (e.g., `917416013923`)  
**Fields:**
- `phoneNumber`: Full phone with + prefix (string)
- `role`: User role (string)
- `createdAt`: ISO timestamp (string)
- `createdBy`: Admin who created the user (string, optional)

### Role Routing
After OTP verification, users are routed based on their role:
- `miner` → `/miner/MinerHome`
- `engineer` → `/engineer/EngineerHome`
- `safety_officer` → `/safety-officer/SafetyOfficerHome`
- `supervisor` → `/supervisor/SupervisorHome`
- `admin` → `/admin/AdminHome`

## Adding More Admins
An admin can create additional admin users through the app:
1. Login as admin (+919999999999)
2. Add new user with phone number
3. Select "Admin" role
4. New admin can now manage users

## Notes
- Phone numbers must be unique (Firestore document ID)
- Users can only login after being added to Firestore
- Unregistered numbers will be denied access
- Role changes require deleting and re-adding the user
