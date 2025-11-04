'use client'

import { AlertTriangle, Database, Copy, Check, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MigrationRequiredProps {
  onRetry?: () => void
}

export function MigrationRequired({ onRetry }: MigrationRequiredProps) {
  const [copied, setCopied] = useState(false)

  const migrationSQL = `-- Run this SQL in your Supabase SQL Editor
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

-- Create club_staff table
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
    
    -- Ensure email is unique per organization
    UNIQUE(organization_id, email)
);

-- Add RLS policies
ALTER TABLE club_staff ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view staff from their organization
CREATE POLICY "Users can view staff from their organization"
ON club_staff FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_users 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Admin/Owner users can manage staff
CREATE POLICY "Admin/Owner users can manage staff"
ON club_staff FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_users 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_club_staff_updated_at 
    BEFORE UPDATE ON club_staff 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to activate staff account when user signs up
CREATE OR REPLACE FUNCTION activate_staff_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Find pending staff record with matching email
    UPDATE club_staff 
    SET 
        status = 'active',
        user_id = NEW.id,
        activated_at = now()
    WHERE 
        email = NEW.email 
        AND status = 'pending' 
        AND user_id IS NULL;

    -- If staff record was found and updated, add to organization_users
    IF FOUND THEN
        INSERT INTO organization_users (organization_id, user_id, role)
        SELECT 
            organization_id,
            NEW.id,
            CASE 
                WHEN role = 'gestor' THEN 'owner'::text
                WHEN role = 'admin' THEN 'admin'::text  
                WHEN role = 'profesor' THEN 'staff'::text
            END
        FROM club_staff
        WHERE email = NEW.email AND user_id = NEW.id
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for account activation
DROP TRIGGER IF EXISTS on_auth_user_created_activate_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_activate_staff
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION activate_staff_account();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_staff_organization_id ON club_staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_club_staff_email ON club_staff(email);
CREATE INDEX IF NOT EXISTS idx_club_staff_user_id ON club_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_club_staff_status ON club_staff(status);`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Database className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-amber-900">Database Setup Required</CardTitle>
              <CardDescription className="text-amber-700">
                The staff management system needs to be set up in your database.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The <code className="bg-gray-100 px-1 rounded">club_staff</code> table and related functions need to be created
              in your Supabase database before you can manage staff members.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Migration Steps</h3>
              <Badge variant="outline" className="text-xs">
                002_add_club_staff_table.sql
              </Badge>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <div>
                  <p className="font-medium">Open Supabase Dashboard</p>
                  <p className="text-gray-600">Go to your Supabase project dashboard</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium">Navigate to SQL Editor</p>
                  <p className="text-gray-600">Click on "SQL Editor" in the left sidebar</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium">Copy and run the SQL</p>
                  <p className="text-gray-600">Paste the migration SQL below and click "Run"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <div>
                  <p className="font-medium">Refresh this page</p>
                  <p className="text-gray-600">The staff management system will be ready to use</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Migration SQL</CardTitle>
            <CardDescription>
              Copy this SQL and run it in your Supabase SQL Editor
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy SQL
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-2"
            >
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Open Supabase
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
              <code>{migrationSQL}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        {onRetry && (
          <Button onClick={onRetry} className="bg-teal-600 hover:bg-teal-700">
            I've run the migration - Retry
          </Button>
        )}
      </div>
    </div>
  )
}