'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouter()
  const { loading, error, canManageStaff, canViewAllStaff, isOwner, isAdmin, userId } = usePermissions()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!loading && !error) {
      // Check if user has access to settings
      if (userId && (isOwner || isAdmin || canViewAllStaff)) {
        setIsAuthorized(true)
      } else if (userId) {
        // User is authenticated but doesn't have permissions
        setIsAuthorized(false)
      } else {
        // User is not authenticated
        router.push('/login')
      }
    }
  }, [loading, error, userId, isOwner, isAdmin, canViewAllStaff, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Permission Error
            </h3>
            <p className="text-red-700 mb-4">
              Failed to load user permissions: {error}
            </p>
            <Link href="/">
              <Button variant="outline" className="border-red-300 text-red-800 hover:bg-red-100">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-amber-700 mb-4">
              You don't have permission to access the settings area. 
              Please contact your organization administrator.
            </p>
            <Link href="/">
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}