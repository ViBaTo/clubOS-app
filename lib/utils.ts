import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the application URL from environment variable or request headers
 * This function prioritizes NEXT_PUBLIC_APP_URL, then tries to detect from request headers
 * (useful for Railway and other platforms that provide X-Forwarded-Host)
 */
export function getAppUrl(request?: Request | { url?: string; headers?: Headers } | null): string {
  // First, try environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // If we have a request, try to detect from headers
  if (request) {
    try {
      const url = new URL(request.url)
      const host = request.headers.get('x-forwarded-host') || 
                   request.headers.get('host') || 
                   url.host
      const protocol = request.headers.get('x-forwarded-proto') || 
                      (url.protocol === 'https:' ? 'https' : 'http')
      
      // Only use detected URL if it's not localhost (to avoid issues in development)
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${protocol}://${host}`
      }
    } catch (e) {
      // If URL parsing fails, continue to fallback
    }
  }

  // Fallback to localhost for development
  return process.env.NODE_ENV === 'production' 
    ? 'https://app.clubos.com' // Fallback for production if nothing else works
    : 'http://localhost:3000'
}
