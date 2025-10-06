import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // BOTÓN PRIMARIO Apple style
        default:
          "bg-[#1E40AF] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white font-medium px-6 py-3 rounded-lg shadow-sm hover:shadow-md",
        // BOTÓN DESTRUCTIVO Apple style
        destructive:
          "bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-150",
        // BOTÓN SECUNDARIO Apple style
        outline:
          "border border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white font-medium px-6 py-3 rounded-lg transition-all duration-150",
        secondary:
          "border border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white font-medium px-6 py-3 rounded-lg transition-all duration-150",
        // BOTÓN TERCIARIO/GHOST Apple style
        ghost: "text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium px-4 py-2 rounded-lg transition-all duration-150",
        link: "text-[#1E40AF] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
