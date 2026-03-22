import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'low' | 'standard' | 'medium' | 'high' | 'critical' | 'outline' | 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-primary/20 text-primary': variant === 'default',
          'bg-severity-low/20 text-severity-low': variant === 'low',
          'bg-severity-medium/20 text-severity-medium': variant === 'medium' || variant === 'standard',
          'bg-severity-high/20 text-severity-high': variant === 'high' || variant === 'critical',
          'border border-border text-muted-foreground': variant === 'outline',
          'bg-urgency-critical/20 text-urgency-critical': variant === 'CRITICAL',
          'bg-urgency-high/20 text-urgency-high': variant === 'HIGH',
          'bg-urgency-standard/20 text-urgency-standard': variant === 'STANDARD',
          'bg-urgency-low/20 text-urgency-low': variant === 'LOW',
        },
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
