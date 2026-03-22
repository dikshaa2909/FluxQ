import { useState } from 'react'
import { api } from '@/api/client'
import type { Patient, QueueOrderResponse, MetricsResponse, Improvements } from '@/api/client'
import { usePatients } from '@/lib/PatientContext'
import { getImprovement, shortPid, resetPidMap } from '@/lib/utils'
import { PatientForm } from '@/components/PatientForm'
import { QueueTable } from '@/components/QueueTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GitCompareArrows, Loader2, TrendingUp, TrendingDown, Equal, Droplets, Heart, Activity, Stethoscope } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const DOMAIN_ORDER = ['diabetes', 'cholesterol', 'bloodPressure', 'general'] as const

const DOMAIN_LABELS: Record<string, string> = {
  diabetes: 'Diabetes',
  cholesterol: 'Cholesterol',
  bloodPressure: 'Blood Pressure',
  general: 'General',
}

const DOMAIN_ICONS: Record<string, typeof Droplets> = {
  diabetes: Droplets,
  cholesterol: Heart,
  bloodPressure: Activity,
  general: Stethoscope,
}

const DOMAIN_BORDER: Record<string, string> = {
  diabetes: 'border-l-blue-500/40',
  cholesterol: 'border-l-orange-500/40',
  bloodPressure: 'border-l-red-500/40',
  general: 'border-l-slate-400/40',
}

function getPatientQueueType(p: Patient): string {
  return p.queueType ?? p.classification?.queueType ?? 'general'
}

function groupPatientsByQueue(patients: Patient[]): Record<string, Patient[]> {
  const groups: Record<string, Patient[]> = {}
  for (const p of patients) {
    const qt = getPatientQueueType(p)
    if (!groups[qt]) groups[qt] = []
    groups[qt].push(p)
  }
  return groups
}

interface PerQueueCompareResult {
  domain: string
  baseline: { queue: QueueOrderResponse[]; metrics: MetricsResponse }
  optimized: { queue: QueueOrderResponse[]; metrics: MetricsResponse }
  improvements: Improvements | null
}

export function ComparisonPage() {
  const { patients, setPatients } = usePatients()
  const [perQueueResults, setPerQueueResults] = useState<PerQueueCompareResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runComparison = async () => {
    if (patients.length < 2) {
      setError('Add at least 2 patients to compare')
      return
    }
    setLoading(true)
    setError(null)
    resetPidMap(patients.map(p => p.id))

    try {
      const grouped = groupPatientsByQueue(patients)
      const results: PerQueueCompareResult[] = []

      for (const domain of DOMAIN_ORDER) {
        const domainPatients = grouped[domain]
        if (!domainPatients || domainPatients.length < 2) continue
        const data = await api.compare(domainPatients)
        results.push({ domain, ...data })
      }

      if (results.length === 0) {
        const data = await api.compare(patients)
        results.push({ domain: 'all', ...data })
      }

      setPerQueueResults(results)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const grouped = groupPatientsByQueue(patients)

  return (
    <div className="space-y-10 relative">
      {/* Background watermark */}
      <div className="page-watermark">VS</div>

      {/* Hero header */}
      <div className="relative animate-fade-in-up">
        <p className="section-label flex items-center gap-2 mb-3">
          <span className="live-dot" />
          Comparison Engine
        </p>
        <h1 className="section-heading text-3xl md:text-4xl">
          <span className="text-accent">Queue</span>{' '}
          <span className="text-stroke">Comparison</span>
        </h1>
        <p className="text-xs text-muted-foreground font-light max-w-sm leading-relaxed mt-2">
          Per-queue FIFO vs optimized comparison — side-by-side analysis with fairness metrics.
        </p>
        <div className="mt-4">
          <Button onClick={runComparison} disabled={loading || patients.length < 2} size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
            {loading ? 'Comparing...' : 'Compare Queues'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="glass-card border-severity-high/30 text-severity-high px-4 py-3 text-sm flex items-center gap-2">
          <span className="live-dot" style={{ background: 'var(--severity-high, #ef4444)' }} />
          {error}
        </div>
      )}

      <div className="animate-slide-in-left">
        <PatientForm patients={patients} onPatientsChange={setPatients} />
      </div>

      {perQueueResults.length > 0 && perQueueResults.map(({ domain, baseline, optimized, improvements }, idx) => {
        const label = DOMAIN_LABELS[domain] ?? domain
        const waitReduction = parseFloat(getImprovement(improvements?.waitTimeReduction))
        // Compute fairness gain directly from displayed scores (not improvements object)
        const fairnessGain = parseFloat((optimized.metrics.fairnessScore - baseline.metrics.fairnessScore).toFixed(2))

        const timeBarData = [
          { name: 'Avg Wait', baseline: parseFloat(baseline.metrics.averageWaitTime.toFixed(1)), optimized: parseFloat(optimized.metrics.averageWaitTime.toFixed(1)) },
          { name: 'Median', baseline: parseFloat(baseline.metrics.medianWaitTime.toFixed(1)), optimized: parseFloat(optimized.metrics.medianWaitTime.toFixed(1)) },
          { name: 'Max Wait', baseline: parseFloat(baseline.metrics.maxWaitTime.toFixed(1)), optimized: parseFloat(optimized.metrics.maxWaitTime.toFixed(1)) },
        ]

        const scoreBarData = [
          { name: 'Fairness', baseline: parseFloat(baseline.metrics.fairnessScore.toFixed(1)), optimized: parseFloat(optimized.metrics.fairnessScore.toFixed(1)) },
          { name: 'Utilization', baseline: parseFloat(baseline.metrics.doctorUtilization.toFixed(1)), optimized: parseFloat(optimized.metrics.doctorUtilization.toFixed(1)) },
          { name: 'Throughput', baseline: parseFloat(baseline.metrics.throughput.toFixed(1)), optimized: parseFloat(optimized.metrics.throughput.toFixed(1)) },
        ]

        const waitPerPatient = baseline.queue.map((bItem) => {
          const oItem = optimized.queue.find(o => o.patientId === bItem.patientId)
          return {
            patient: bItem.patientId,
            urgency: bItem.urgency,
            baseline: bItem.estimatedWaitTime,
            optimized: oItem?.estimatedWaitTime ?? 0,
            saved: bItem.estimatedWaitTime - (oItem?.estimatedWaitTime ?? 0),
          }
        })
        const maxWait = Math.max(...waitPerPatient.map(x => Math.max(x.baseline, x.optimized)), 1)

        return (
          <div key={domain} className={`space-y-5 border-l-4 ${DOMAIN_BORDER[domain] ?? 'border-l-border'} pl-5 pb-6 animate-slide-up-fade delay-${idx + 1}`}>
            {/* Domain header */}
            <div className="flex items-center gap-3">
              {(() => { const DIcon = DOMAIN_ICONS[domain] ?? Stethoscope; return <DIcon className="h-4 w-4 text-muted-foreground" /> })()}
              <h2 className="font-display text-sm font-bold tracking-wider uppercase">{label}</h2>
              <Badge className="text-xs">{baseline.queue.length} patients</Badge>
            </div>

            {/* Improvement cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`glass-card metric-card p-5 hover-lift ${waitReduction > 0 ? 'border-severity-low/20' : 'border-severity-high/20'}`}>
                <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">[ 01 ] Wait Reduction</p>
                <div className="flex items-center gap-2 mt-1">
                  {waitReduction > 0 ? <TrendingUp className="h-4 w-4 text-severity-low" /> : <TrendingDown className="h-4 w-4 text-severity-high" />}
                  <span className="counter-value text-2xl">{Math.abs(waitReduction).toFixed(2)}%</span>
                </div>
              </div>
              <div className={`glass-card metric-card p-5 hover-lift ${fairnessGain > 0 ? 'border-severity-low/20' : 'border-primary/20'}`}>
                <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">[ 02 ] Fairness</p>
                <div className="flex items-center gap-2 mt-1">
                  {fairnessGain > 0 ? <TrendingUp className="h-4 w-4 text-severity-low" /> : fairnessGain < 0 ? <TrendingDown className="h-4 w-4 text-severity-high" /> : <Equal className="h-4 w-4 text-muted-foreground" />}
                  <span className="counter-value text-2xl">{fairnessGain >= 0 ? '+' : ''}{fairnessGain.toFixed(2)} pts</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {baseline.metrics.fairnessScore.toFixed(1)} → {optimized.metrics.fairnessScore.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="chart-glass">
                <div className="px-5 pt-4 pb-2">
                  <p className="font-display text-[10px] font-bold tracking-wider uppercase text-muted-foreground">[ 03 ] Wait Times</p>
                </div>
                <div className="px-5 pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeBarData} barGap={6} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontFamily: "'Space Mono', monospace" }} axisLine={{ stroke: 'var(--chart-axis)' }} />
                        <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontFamily: "'Space Mono', monospace" }} axisLine={{ stroke: 'var(--chart-axis)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', fontSize: 11, fontFamily: "'Space Mono', monospace", color: 'var(--chart-tooltip-color)', backdropFilter: 'blur(12px)' }} formatter={(v: unknown) => [`${Number(v).toFixed(1)} min`]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="baseline" name="FIFO" fill="var(--chart-baseline)" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                        <Bar dataKey="optimized" name="Optimized" fill="var(--chart-optimized)" radius={[6, 6, 0, 0]} fillOpacity={0.9} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="chart-glass">
                <div className="px-5 pt-4 pb-2">
                  <p className="font-display text-[10px] font-bold tracking-wider uppercase text-muted-foreground">[ 04 ] Scores</p>
                </div>
                <div className="px-5 pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreBarData} barGap={6} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontFamily: "'Space Mono', monospace" }} axisLine={{ stroke: 'var(--chart-axis)' }} />
                        <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontFamily: "'Space Mono', monospace" }} axisLine={{ stroke: 'var(--chart-axis)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', fontSize: 11, fontFamily: "'Space Mono', monospace", color: 'var(--chart-tooltip-color)', backdropFilter: 'blur(12px)' }} formatter={(v: unknown) => [Number(v).toFixed(1)]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="baseline" name="FIFO" fill="var(--chart-baseline)" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                        <Bar dataKey="optimized" name="Optimized" fill="var(--chart-optimized)" radius={[6, 6, 0, 0]} fillOpacity={0.9} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-patient wait breakdown */}
            <div className="chart-glass">
              <div className="px-5 pt-4 pb-2">
                <p className="font-display text-[10px] font-bold tracking-wider uppercase text-muted-foreground">[ 05 ] Per-Patient Wait Time</p>
              </div>
              <div className="px-5 pb-4">
                <div className="space-y-0">
                  {waitPerPatient.map((p) => (
                    <div key={p.patient} className="queue-row flex items-start gap-3 py-1.5">
                      <div className="w-28 shrink-0">
                        <span className="text-xs font-mono font-medium block" title={p.patient}>{shortPid(p.patient)}</span>
                        <Badge variant={p.urgency as 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'} className="text-[10px] px-1.5 py-0 mt-0.5">
                          {p.urgency}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 bg-muted/30 rounded-full overflow-hidden">
                            <div className="glass-bar h-full" style={{ width: `${(p.baseline / maxWait) * 100}%`, background: `linear-gradient(90deg, rgba(var(--chart-baseline-rgb),.7), rgba(var(--chart-baseline-rgb),1))`, minWidth: 4, transition: 'width 0.8s cubic-bezier(.16,1,.3,1)' }} />
                          </div>
                          <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground shrink-0 w-12 text-right">{p.baseline.toFixed(1)}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 bg-muted/30 rounded-full overflow-hidden">
                            <div className="glass-bar h-full" style={{ width: `${(p.optimized / maxWait) * 100}%`, background: `linear-gradient(90deg, rgba(var(--chart-optimized-rgb),.7), rgba(var(--chart-optimized-rgb),1))`, minWidth: 4, transition: 'width 0.8s cubic-bezier(.16,1,.3,1)' }} />
                          </div>
                          <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground shrink-0 w-12 text-right">{p.optimized.toFixed(1)}m</span>
                        </div>
                      </div>
                      <div className={`text-xs font-mono font-bold shrink-0 w-14 text-right pt-0.5 ${p.saved > 0 ? 'text-severity-low' : p.saved < 0 ? 'text-severity-high' : 'text-muted-foreground'}`}>
                        {p.saved > 0 ? `−${p.saved.toFixed(1)}m` : p.saved < 0 ? `+${Math.abs(p.saved).toFixed(1)}m` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--chart-baseline)' }} /> FIFO</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--chart-optimized)' }} /> Optimized</span>
                </div>
              </div>
            </div>

            {/* Side-by-side queue tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <QueueTable title={`Baseline (FIFO)`} queue={baseline.queue} variant="baseline" />
              <QueueTable title={`Optimized`} queue={optimized.queue} variant="optimized" />
            </div>

            {/* Metric comparison table */}
            <div className="chart-glass">
              <div className="px-5 pt-4 pb-2">
                <p className="font-display text-[10px] font-bold tracking-wider uppercase text-muted-foreground">[ 06 ] Metrics</p>
              </div>
              <div className="px-5 pb-4">
                <table className="table-enhanced w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 px-2 font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground font-medium">Metric</th>
                      <th className="text-right py-1.5 px-2 font-mono-space text-[10px] tracking-[.14em] uppercase font-medium" style={{ color: 'var(--chart-baseline)' }}>FIFO</th>
                      <th className="text-right py-1.5 px-2 font-mono-space text-[10px] tracking-[.14em] uppercase font-medium" style={{ color: 'var(--chart-optimized)' }}>Optimized</th>
                      <th className="text-right py-1.5 px-2 font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ['Avg Wait', 'averageWaitTime', 'min', true],
                      ['Median Wait', 'medianWaitTime', 'min', true],
                      ['Max Wait', 'maxWaitTime', 'min', true],
                      ['Fairness', 'fairnessScore', '/100', false],
                      ['Utilization', 'doctorUtilization', '%', false],
                      ['Throughput', 'throughput', 'pts/hr', false],
                      ['Satisfaction', 'patientSatisfaction', '/10', false],
                    ] as const).map(([lbl, key, unit, lowerBetter]) => {
                      const b = baseline.metrics[key as keyof MetricsResponse]
                      const o = optimized.metrics[key as keyof MetricsResponse]
                      const d = o - b
                      const good = lowerBetter ? d < 0 : d > 0
                      return (
                        <tr key={key} className="border-b border-border/50">
                          <td className="py-1.5 px-2 text-xs">{lbl}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-xs" style={{ color: 'var(--chart-baseline)' }}>{b.toFixed(1)} {unit}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-xs" style={{ color: 'var(--chart-optimized)' }}>{o.toFixed(1)} {unit}</td>
                          <td className={`py-1.5 px-2 text-right font-mono text-xs font-bold ${good ? 'text-severity-low' : d === 0 ? 'text-muted-foreground' : 'text-severity-high'}`}>
                            {d > 0 ? '+' : ''}{d.toFixed(1)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      {/* Queues with < 2 patients */}
      {perQueueResults.length > 0 && DOMAIN_ORDER.filter(d => (grouped[d]?.length ?? 0) === 1).map(domain => (
        <div key={domain} className={`border-l-4 ${DOMAIN_BORDER[domain] ?? 'border-l-border'} pl-5 py-3`}>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{DOMAIN_LABELS[domain]}</span> — 1 patient (need ≥ 2 to compare)
          </p>
        </div>
      ))}
    </div>
  )
}
