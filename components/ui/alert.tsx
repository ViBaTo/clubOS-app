import * as React from 'react'
import { cn } from '@/lib/utils'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Alert({ className, ...props }: DivProps) {
  return (
    <div
      role="alert"
      className={cn(
        'w-full rounded-lg border p-4 bg-background text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function AlertDescription({ className, ...props }: DivProps) {
  return <div className={cn('text-sm text-muted-foreground', className)} {...props} />
}


