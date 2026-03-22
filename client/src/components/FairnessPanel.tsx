import type { FairnessReport } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Shield, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { shortPid } from '@/lib/utils'

interface FairnessPanelProps {
  report: FairnessReport
}

const RULE_COLORS: Record<string, string> = {
  F1: 'bg-severity-medium/20 text-severity-medium',
  F2: 'bg-urgency-high/20 text-urgency-high',
  F3: 'bg-severity-high/20 text-severity-high',
  F4: 'bg-severity-high/20 text-severity-high',
}

export function FairnessPanel({ report }: FairnessPanelProps) {
  const scoreColor =
    report.fairnessScore >= 80
      ? 'bg-severity-low/20 text-severity-low border-severity-low/30'
      : report.fairnessScore >= 50
        ? 'bg-severity-medium/20 text-severity-medium border-severity-medium/30'
        : 'bg-severity-high/20 text-severity-high border-severity-high/30'

  return (
    <div className="space-y-4">
      {/* Fairness Score Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Fairness Report
          </CardTitle>
          <CardDescription>Queue fairness analysis and starvation prevention. Fairness score is based on wait time distribution uniformity (lower variance = higher score).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`rounded-xl border px-6 py-4 text-center ${scoreColor}`}>
              <p className="text-3xl font-bold">{report.fairnessScore.toFixed(0)}</p>
              <p className="text-xs mt-1">/ 100</p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{report.agingBoosts.length} aging boost(s) applied</p>
              <p>{report.violations.length} rule violation(s)</p>
              <p>{report.starvationRisks.length} starvation risk(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aging Boosts */}
      {report.agingBoosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aging Boosts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Patient ID</th>
                  <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Wait (min)</th>
                  <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Boost</th>
                </tr>
              </thead>
              <tbody>
                {report.agingBoosts.map((boost) => (
                  <tr key={boost.patientId} className="border-b border-border/50">
                    <td className="py-2 px-3 font-mono" title={boost.patientId}>{shortPid(boost.patientId)}</td>
                    <td className="py-2 px-3 text-right font-mono">{boost.waitMinutes.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-severity-low/15 text-severity-low px-2 py-0.5 text-xs font-bold">
                        ×{boost.boostApplied.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Rule Violations */}
      {report.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-severity-high" />
              Rule Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.violations.map((v, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${RULE_COLORS[v.rule] || 'bg-muted text-muted-foreground'}`}>
                    {v.rule}
                  </span>
                  <div className="flex-1 text-sm">
                    <span className="font-mono font-medium" title={v.patientId}>{shortPid(v.patientId)}</span>
                    <span className="text-muted-foreground ml-2">{v.reason}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{v.waitTime.toFixed(1)}min</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Starvation Risks */}
      {report.starvationRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-severity-medium" />
              Starvation Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.starvationRisks.map((risk) => {
                const pct = Math.min(100, risk.percentToThreshold)
                const barColor = pct >= 70 ? 'bg-severity-high' : pct >= 50 ? 'bg-severity-medium' : 'bg-severity-low'
                return (
                  <div key={risk.patientId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium" title={risk.patientId}>{shortPid(risk.patientId)}</span>
                        <Badge variant={risk.urgency as 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'}>{risk.urgency}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {risk.currentWait.toFixed(0)} / {risk.threshold.toFixed(0)} min ({pct.toFixed(0)}%)
                        {pct >= 70 && ' ⚠'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
