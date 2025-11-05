# ClubOS Staff Management System - Setup Guide

## Overview

The ClubOS staff management system has been successfully implemented using Supabase's native invitation system. This guide explains how to set up and use the system.

## Database Migration Required

**IMPORTANT**: Before using the staff management system, you need to run the database migration.

### Step 1: Run Database Migration

1. Open your Supabase dashboard
2. Navigate to "SQL Editor"
3. Copy and execute the contents of: `supabase/migrations/002_add_club_staff_table.sql`

Or manually copy this SQL:

```sql
-- Create enum types for roles and status
DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM ('gestor', 'admin', 'profesor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_status AS ENUM ('pending', 'active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create club_staff table with all required columns and relationships
CREATE TABLE IF NOT EXISTS club_staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text,
    role staff_role NOT NULL,
    specialties text[] DEFAULT '{}',
    status staff_status DEFAULT 'pending',
    invited_at timestamp with time zone DEFAULT now(),
    activated_at timestamp with time zone,
    added_by uuid REFERENCES auth.users(id),
    user_id uuid REFERENCES auth.users(id),
    first_login_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(organization_id, email)
);

-- Add RLS policies, triggers, and indexes (see full file for complete SQL)
```

### Step 2: Apply Trigger Patch (Nov 2025)

Supabase changed how invitation signups execute triggers. Run the follow-up migration to ensure invited users are linked to their organization even when the original trigger is skipped:

1. In the SQL Editor execute `supabase/migrations/003_add_staff_activation_update_trigger.sql`
2. This refreshes the `activate_staff_account` function and adds an `AFTER UPDATE` trigger on `auth.users` when `email_confirmed_at` becomes non-null.

### Step 3: Verify Setup

After running the migration, visit `/settings/team` in your application. If the migration was successful, you'll see the team management interface. If not, you'll see a helpful setup guide.

## System Features

### 🎯 **Core Features**

- **Native Supabase Invitations**: Uses `inviteUserByEmail()` for secure invitations
- **Role-Based Access**: Manager, Admin, Instructor roles with appropriate permissions
- **Welcome Experience**: New staff members get role-specific onboarding
- **English Interface**: International SaaS-ready with English UI

### 🔐 **Security & Permissions**

- **Organization Isolation**: Staff can only see their organization
- **Role-Based Permissions**: Different access levels for different roles
- **Self-Service**: Users can edit their own profiles
- **Prevention Controls**: Can't deactivate yourself

### 👥 **Staff Roles**

1. **Manager (`gestor`)**
   - Full system access
   - Can manage all staff
   - Organization settings
2. **Admin (`admin`)**
   - Administrative access
   - Can manage members and staff
   - Day-to-day operations
3. **Instructor (`profesor`)**
   - Teaching access only
   - Can manage assigned classes
   - View student analytics

## API Routes

### Staff Management APIs

- `GET /api/staff` - List all staff with filtering and pagination
- `POST /api/staff/invite` - Send staff invitation via Supabase
- `POST /api/staff/resend-invitation` - Resend invitation to pending staff
- `POST /api/staff/cancel-invitation` - Cancel pending invitation
- `POST /api/staff/deactivate` - Deactivate staff member
- `POST /api/staff/reactivate` - Reactivate or reinvite staff
- `POST /api/staff/update` - Update staff information
- `GET /api/staff/[id]` - Get individual staff details
- `DELETE /api/staff/[id]` - Delete pending invitation

### Authentication Flow

- `GET /api/auth/callback` - Handles Supabase invitation acceptance
- Automatic account activation via database triggers
- Metadata preservation for invitation context

## Pages & Routes

### English Routes Structure

- `/settings/team` - Staff listing and management
- `/settings/team/invite` - Invite new staff member
- `/settings/notifications` - Notification management
- `/settings/access-requests` - Handle access requests

### Components

- `<WelcomeModal>` - New staff member onboarding
- `<EditStaffModal>` - Edit staff information
- `<MigrationRequired>` - Database setup helper

## Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage Workflow

### 1. Inviting Staff

1. Navigate to `/settings/team`
2. Click "Invite Member"
3. Fill form with name, email, role, specialties
4. System sends Supabase invitation email
5. Staff record created with "pending" status

### 2. Staff Accepts Invitation

1. User clicks link in email
2. Completes Supabase signup process
3. Database trigger activates account:
   - Updates staff status to "active"
   - Links user_id to staff record
   - Adds to organization_users table
4. Welcome modal shows on first login

### 3. Managing Staff

- **View**: All staff with status, role, specialties
- **Edit**: Phone, specialties, role (admin only)
- **Deactivate**: Remove access while keeping record
- **Reactivate**: Smart reactivation (existing vs new users)
- **Resend**: Resend invitation to pending staff

## Error Handling

The system gracefully handles:

- **Missing database table**: Shows setup instructions
- **Permission errors**: Clear access denied messages
- **Network failures**: Retry mechanisms and user feedback
- **Invalid invitations**: Proper error messages and cleanup

## Security Notes

- Service role key only used server-side
- All database operations use RLS policies
- Input validation and sanitization
- Rate limiting on invitation sending
- Audit trail of staff changes

## Testing

To test the system:

1. Run the database migration
2. Create test staff invitations
3. Use different browser/incognito to test invitation flow
4. Verify role permissions and access controls
5. Test all CRUD operations

## Support

If you encounter issues:

1. Check database migration was run successfully
2. Verify environment variables are set correctly
3. Check Supabase Auth settings allow invitations
4. Review console logs for detailed error messages

The system includes comprehensive error handling and user-friendly messages to guide through any setup issues.
