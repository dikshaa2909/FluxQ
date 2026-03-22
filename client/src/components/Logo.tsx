import type { FC } from 'react'
import { Zap } from 'lucide-react'

interface LogoProps {
  className?: string
  size?: number | string
  iconSize?: number | string
  hideText?: boolean
}

export const Logo: FC<LogoProps> = ({ 
  className = '', 
  size = 32, 
  iconSize,
  hideText = false 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,201,167,0.2)]"
        style={{ width: size, height: size }}
      >
        <Zap 
          size={iconSize || (typeof size === 'number' ? size * 0.55 : '60%')} 
          className="text-primary-foreground fill-current" 
          strokeWidth={2.5}
        />
      </div>
      {!hideText && (
        <div className="flex flex-col gap-0 leading-none">
          <span className="font-display text-[0.75rem] font-black tracking-[0.05em] uppercase text-foreground">
            Flux<span className="text-primary">Q</span>
          </span>
          <span className="font-mono-space text-[0.42rem] tracking-[0.14em] text-muted-foreground/60 uppercase mt-[2px]">
            Queue Intelligence
          </span>
        </div>
      )}
    </div>
  )
}
