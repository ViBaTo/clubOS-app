'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'processing' | 'success' | 'error'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('processing')
  const [error, setError] = useState<string | null>(null)

  const hashParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams()
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash
    return new URLSearchParams(hash)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const code = searchParams.get('code')
    const urlError =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error')

    if (urlError) {
      setError(urlError)
      setStatus('error')
      return
    }

    if (code) {
      // OAuth/code flow – hand off to API route which will manage cookies and redirect back.
      window.location.replace(`/api/auth/callback${window.location.search}`)
      return
    }

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      setError('Missing session tokens in callback response. Please request a new link.')
      setStatus('error')
      return
    }

    const finishSignIn = async () => {
      try {
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken
          })
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to establish session')
        }

        setStatus('success')

        // Clean up URL to remove tokens
        window.history.replaceState(null, '', '/auth/callback')

        const type = hashParams.get('type')
        const nextPath = type === 'invite' ? '/' : '/'
        router.replace(nextPath)
      } catch (err: any) {
        setError(err.message || 'Unexpected error during authentication callback')
        setStatus('error')
      }
    }

    finishSignIn()
  }, [hashParams, router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">
        {status === 'processing' && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Finishing sign-in…</h1>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we confirm your invitation and prepare your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">All set!</h1>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting to your dashboard…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-red-600">We couldn’t finish signing you in</h1>
            <p className="mt-2 text-sm text-gray-700">{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              The invitation link may have expired or already been used. Request a new invitation or try logging in.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

