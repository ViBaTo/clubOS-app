import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150",
        "flex h-auto w-full min-w-0 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "file:text-foreground selection:bg-primary selection:text-primary-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
