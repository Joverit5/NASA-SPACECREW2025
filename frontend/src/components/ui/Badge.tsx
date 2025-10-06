import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-blue-500/50 bg-blue-950/50 text-blue-400 hover:bg-blue-950/70",
        secondary: "border-gray-500/50 bg-gray-950/50 text-gray-400 hover:bg-gray-950/70",
        success: "border-green-500/50 bg-green-950/50 text-green-400 hover:bg-green-950/70",
        warning: "border-yellow-500/50 bg-yellow-950/50 text-yellow-400 hover:bg-yellow-950/70",
        error: "border-red-500/50 bg-red-950/50 text-red-400 hover:bg-red-950/70",
        cyan: "border-cyan-500/50 bg-cyan-950/50 text-cyan-400 hover:bg-cyan-950/70",
        purple: "border-purple-500/50 bg-purple-950/50 text-purple-400 hover:bg-purple-950/70",
        outline: "border-blue-500/50 text-blue-400 hover:bg-blue-950/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
