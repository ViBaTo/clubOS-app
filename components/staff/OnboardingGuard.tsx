'use client'

import { ReactNode } from 'react'

interface OnboardingGuardProps {
  children: ReactNode
  isOnboarding: boolean
  isLoading: boolean
}

/**
 * OnboardingGuard component that blocks access to content while onboarding is in progress.
 * Shows a full-screen overlay with a message to complete onboarding first.
 */
export function OnboardingGuard({ children, isOnboarding, isLoading }: OnboardingGuardProps) {
  // While loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#F1F5F9] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748B]">Loading...</p>
        </div>
      </div>
    )
  }

  // If onboarding is required, show blocking overlay
  if (isOnboarding) {
    return (
      <div className="flex h-screen bg-[#F1F5F9] items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-[#14B8A6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[#14B8A6] text-5xl">
              lock
            </span>
          </div>
          <h2 className="text-3xl font-bold text-[#0F172A] mb-3">Welcome to ClubOS!</h2>
          <p className="text-[#64748B] text-lg mb-2">
            Please complete your account setup to continue.
          </p>
          <p className="text-[#94A3B8] text-sm">
            This will only take a moment. Follow the steps in the welcome dialog.
          </p>
        </div>
      </div>
    )
  }

  // If not onboarding, show the protected content
  return <>{children}</>
}
