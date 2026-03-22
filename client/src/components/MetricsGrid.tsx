import type { MetricsResponse } from '@/api/client'
import {
  Clock,
  Shield,
  UserCheck,
  TrendingUp,
  Timer,
  ArrowDown,
  BarChart3,
} from 'lucide-react'
import type { ReactNode } from 'react'

interface MetricItemProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  trend?: string
  trendPositive?: boolean
  tooltip?: string
  delay?: number
}

function MetricItem({ icon, label, value, unit, trend, trendPositive, tooltip, delay = 0 }: MetricItemProps) {
  return (
    <div className={`glass-card metric-card p-4 hover-lift animate-slide-up-fade`} style={{ animationDelay: `${delay * 0.08}s` }}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-bold tracking-tight">
            {value}
            {unit && <span className="text-[11px] font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          {tooltip && <p className="text-[9px] text-muted-foreground/50 leading-tight max-w-[160px]">{tooltip}</p>}
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-3 pt-2 border-t border-border/50 text-[10px] flex items-center gap-1 font-mono-space tracking-wider ${trendPositive ? 'text-primary' : 'text-severity-high'}`}>
          {trendPositive ? <TrendingUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {trend}
        </div>
      )}
    </div>
  )
}

interface MetricsGridProps {
  metrics: MetricsResponse
  fairnessScoreOverride?: number
  improvements?: {
    waitTimeReduction: string | number
    fairnessImprovement: string | number
    utilizationImprovement?: string | number
    throughputImprovement?: string | number
  } | null
}

export function MetricsGrid({ metrics, fairnessScoreOverride, improvements }: MetricsGridProps) {
  const fairness = fairnessScoreOverride ?? metrics.fairnessScore
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <MetricItem
        icon={<Clock className="h-4 w-4" />}
        label="Avg Wait Time"
        value={metrics.averageWaitTime.toFixed(1)}
        unit="min"
        trend={improvements ? `${improvements.waitTimeReduction}% reduction` : undefined}
        trendPositive={improvements ? parseFloat(String(improvements.waitTimeReduction)) > 0 : undefined}
        delay={0}
      />
      <MetricItem
        icon={<BarChart3 className="h-4 w-4" />}
        label="Median Wait Time"
        value={metrics.medianWaitTime.toFixed(1)}
        unit="min"
        delay={1}
      />
      <MetricItem
        icon={<Timer className="h-4 w-4" />}
        label="Max Wait Time"
        value={metrics.maxWaitTime.toFixed(1)}
        unit="min"
        delay={2}
      />
      <MetricItem
        icon={<Shield className="h-4 w-4" />}
        label="Fairness Score"
        value={fairness.toFixed(1)}
        unit="/100"
        trend={improvements ? `+${improvements.fairnessImprovement} points` : undefined}
        trendPositive={improvements ? parseFloat(String(improvements.fairnessImprovement)) > 0 : undefined}
        tooltip="Based on wait time distribution uniformity"
        delay={3}
      />
      <MetricItem
        icon={<UserCheck className="h-4 w-4" />}
        label="Doctor Utilization"
        value={metrics.doctorUtilization.toFixed(1)}
        unit="%"
        trend={improvements?.utilizationImprovement ? `+${improvements.utilizationImprovement}%` : undefined}
        trendPositive={improvements?.utilizationImprovement ? parseFloat(String(improvements.utilizationImprovement)) > 0 : undefined}
        delay={4}
      />
      <MetricItem
        icon={<TrendingUp className="h-4 w-4" />}
        label="Throughput"
        value={metrics.throughput.toFixed(1)}
        unit="pts/hr"
        trend={improvements?.throughputImprovement ? `${improvements.throughputImprovement}% increase` : undefined}
        trendPositive={improvements?.throughputImprovement ? parseFloat(String(improvements.throughputImprovement)) > 0 : undefined}
        delay={5}
      />
      <MetricItem
        icon={<Clock className="h-4 w-4" />}
        label="Min Wait Time"
        value={metrics.minWaitTime.toFixed(1)}
        unit="min"
        delay={6}
      />
    </div>
  )
}
