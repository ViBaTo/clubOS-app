'use client'

import { ReactNode } from 'react'
import { OnboardingGuard } from '@/components/staff/OnboardingGuard'
import { WelcomeModal } from '@/components/staff/WelcomeModal'
import { useNewStaffWelcome } from '@/hooks/useNewStaffWelcome'

interface OnboardingLayoutProps {
  children: ReactNode
}

/**
 * OnboardingLayout wraps the entire app and ensures that staff members
 * complete their onboarding before accessing any content.
 */
export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const {
    shouldShowWelcome,
    staffInfo,
    loading,
    markWelcomeCompleted,
    requiresPasswordSetup,
    submitPassword
  } = useNewStaffWelcome()

  const handleWelcomeClose = async () => {
    // Only allow closing if password is set (or not required)
    if (requiresPasswordSetup) {
      console.warn('Cannot close onboarding without setting password')
      return
    }

    try {
      await markWelcomeCompleted()
      // Force a hard refresh to ensure UI updates correctly
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to complete welcome flow:', error)
    }
  }

  const isOnboarding = shouldShowWelcome && !!staffInfo

  return (
    <>
      <OnboardingGuard isOnboarding={isOnboarding} isLoading={loading}>
        {children}
      </OnboardingGuard>

      {/* Welcome Modal for new staff members - rendered at top level */}
      {isOnboarding && (
        <WelcomeModal
          open={shouldShowWelcome}
          onOpenChange={handleWelcomeClose}
          userInfo={{
            name: staffInfo.full_name,
            role: staffInfo.role,
            organizationName: staffInfo.organization_name,
            specialties: staffInfo.specialties
          }}
          requiresPasswordSetup={requiresPasswordSetup}
          onPasswordSubmit={submitPassword}
        />
      )}
    </>
  )
}
