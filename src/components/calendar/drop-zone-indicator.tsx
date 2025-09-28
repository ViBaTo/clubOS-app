"use client"

import { cn } from "@/lib/utils"

interface DropZoneIndicatorProps {
  isActive: boolean
  isValid: boolean
  className?: string
}

export function DropZoneIndicator({ isActive, isValid, className }: DropZoneIndicatorProps) {
  if (!isActive) return null

  return (
    <div
      className={cn(
        "absolute inset-0 border-2 border-dashed rounded-lg transition-all duration-200 pointer-events-none",
        isValid ? "border-green-400 bg-green-50/50" : "border-red-400 bg-red-50/50",
        className,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            isValid
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200",
          )}
        >
          {isValid ? "Soltar aquí" : "Conflicto"}
        </div>
      </div>
    </div>
  )
}
