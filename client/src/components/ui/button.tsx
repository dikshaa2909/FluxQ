import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          'font-display text-xs tracking-wider uppercase',
          {
            'bg-primary text-primary-foreground hover:shadow-[0_4px_16px_rgba(0,201,167,.28)] hover:-translate-y-0.5': variant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border border-border bg-card hover:border-foreground/30': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_4px_16px_rgba(255,59,59,.2)]': variant === 'destructive',
          },
          {
            'h-10 px-5 py-2': size === 'default',
            'h-8 px-3 text-[10px]': size === 'sm',
            'h-12 px-8 text-sm': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
