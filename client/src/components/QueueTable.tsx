import type { QueueOrderResponse } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const WAIT_THRESHOLDS: Record<string, number> = {
  CRITICAL: 15,
  HIGH: 30,
  STANDARD: 45,
  LOW: 60,
}

const QUEUE_TYPE_COLORS: Record<string, string> = {
  diabetes: 'bg-blue-500/20 text-blue-500',
  cholesterol: 'bg-orange-500/20 text-orange-500',
  bloodPressure: 'bg-red-500/20 text-red-500',
  general: 'bg-slate-400/20 text-slate-400',
}

function waitTimeColor(urgency: string, waitTime: number): string {
  const threshold = WAIT_THRESHOLDS[urgency] ?? 60
  const ratio = waitTime / threshold
  if (ratio >= 1) return 'text-severity-high'
  if (ratio >= 0.7) return 'text-severity-medium'
  return ''
}

interface QueueTableProps {
  title: string
  queue: QueueOrderResponse[]
  variant?: 'baseline' | 'optimized'
}

export function QueueTable({ title, queue, variant = 'optimized' }: QueueTableProps) {
  const maxScore = Math.max(...queue.map(q => q.priorityScore ?? 0), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              variant === 'optimized' ? 'bg-primary' : 'bg-muted-foreground'
            }`}
          />
          {title}
          <span className="text-xs text-muted-foreground font-normal">({queue.length} patients)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">#</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Patient</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Urgency</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Queue Type</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Priority Score</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Multiplier</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Doctor</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Wait (min)</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Start Time</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((order) => {
                const score = order.priorityScore
                const barPct = score != null ? Math.min(100, (score / maxScore) * 100) : 0
                const wtColor = waitTimeColor(order.urgency, order.estimatedWaitTime)
                const patient = order.patient as Record<string, unknown> | undefined
                const classification = patient?.classification as Record<string, unknown> | undefined
                const severity = classification?.severity as string | undefined
                const queueType = ((order as unknown as Record<string, unknown>).queueType ?? patient?.queueType ?? classification?.queueType) as string | undefined
                const multiplier = classification?.clinicalMultiplier as number | undefined
                const symptomPattern = classification?.symptomPattern as string | undefined

                return (
                  <tr
                    key={order.patientId}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      severity === 'critical' ? 'border-l-2 border-l-severity-high animate-pulse' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-muted-foreground">{order.position}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-medium">{order.patientId}</span>
                      {symptomPattern && (
                        <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{symptomPattern}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={order.urgency as 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'}>{order.urgency}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {queueType ? (
                        <Badge className={`text-[10px] ${QUEUE_TYPE_COLORS[queueType] || 'bg-muted text-muted-foreground'}`}>
                          {queueType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {score != null ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${barPct}%` }} />
                          </div>
                          <span className="font-mono text-muted-foreground w-14 text-right">{score.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                      {multiplier != null ? `×${multiplier.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {order.assignedDoctor || '—'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${wtColor}`}>
                      {order.estimatedWaitTime.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground text-xs">
                      {new Date(order.estimatedStartTime).toLocaleTimeString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
