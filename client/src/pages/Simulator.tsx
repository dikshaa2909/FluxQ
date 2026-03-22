import { useState } from 'react'
import { api } from '@/api/client'
import type { SimulateResponse, Patient } from '@/api/client'
import { usePatients } from '@/lib/PatientContext'
import { resetPidMap } from '@/lib/utils'
import { PatientForm } from '@/components/PatientForm'
import { QueueTable } from '@/components/QueueTable'
import { MetricsGrid } from '@/components/MetricsGrid'
import { FairnessPanel } from '@/components/FairnessPanel'
import { Button } from '@/components/ui/button'
import { PlayCircle, Loader2, Lightbulb, BarChart3, Droplets, Heart, Activity, Stethoscope } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

interface PerQueueResult {
  domain: string
  data: SimulateResponse
}

export function SimulatorPage() {
  const { patients, setPatients } = usePatients()
  const [perQueueResults, setPerQueueResults] = useState<PerQueueResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'optimized' | 'baseline'>('optimized')

  const runSimulation = async () => {
    if (patients.length < 2) {
      setError('Add at least 2 patients to run simulation')
      return
    }
    setLoading(true)
    setError(null)

    // Reset PID map so IDs are consistent
    resetPidMap(patients.map(p => p.id))

    try {
      const grouped = groupPatientsByQueue(patients)
      const results: PerQueueResult[] = []

      // Run separate API call for each queue type
      for (const domain of DOMAIN_ORDER) {
        const domainPatients = grouped[domain]
        if (!domainPatients || domainPatients.length < 2) continue
        const data = await api.simulate(domainPatients)
        results.push({ domain, data })
      }

      // For queues with only 1 patient, still run if we have no results at all
      if (results.length === 0) {
        // Fall back to combined simulation
        const data = await api.simulate(patients)
        results.push({ domain: 'all', data })
      }

      setPerQueueResults(results)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const grouped = groupPatientsByQueue(patients)
  const activeDomains = DOMAIN_ORDER.filter(d => grouped[d]?.length)

  return (
    <div className="space-y-8 relative">
      {/* Background watermark */}
      <div className="page-watermark">SIM</div>

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="section-label flex items-center gap-2 mb-3">
            <span className="live-dot" />
            Simulation Engine
          </p>
          <h1 className="section-heading text-3xl md:text-4xl">
            <span className="text-accent">Queue</span>{' '}
            <span className="text-stroke">Simulator</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2 font-light max-w-sm leading-relaxed">
            Run per-queue simulation comparing FIFO vs ML-optimized ordering
          </p>
        </div>
        <Button onClick={runSimulation} disabled={loading || patients.length < 2} size="lg" className="animate-scale-in">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          {loading ? 'Simulating...' : 'Run Simulation'}
        </Button>
      </div>

      {error && (
        <div className="px-5 py-4 rounded-xl glass-card border-severity-high/30 text-severity-high text-sm animate-fade-in-up flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-severity-high animate-blink" />
          {error}
        </div>
      )}

      {/* Patient input - full width on top */}
      <div className="animate-slide-in-left">
        <PatientForm patients={patients} onPatientsChange={setPatients} />
      </div>

      {/* Results - full width below */}
      <div className="space-y-6 animate-slide-in-right">
          {perQueueResults.length > 0 ? (
            <>
              {/* Tab toggle */}
              <div className="glass-card p-1.5 rounded-xl w-fit flex gap-1 animate-scale-in">
                <button
                  onClick={() => setActiveTab('optimized')}
                  className={`px-5 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer font-mono-space tracking-wider uppercase ${
                    activeTab === 'optimized'
                      ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(0,201,167,.2)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Optimized
                </button>
                <button
                  onClick={() => setActiveTab('baseline')}
                  className={`px-5 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer font-mono-space tracking-wider uppercase ${
                    activeTab === 'baseline'
                      ? 'bg-accent text-accent-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Baseline (FIFO)
                </button>
              </div>

              {/* Per-queue sections */}
              {perQueueResults.map(({ domain, data }, qIdx) => {
                const queue = activeTab === 'optimized' ? data.optimizedQueue : data.baselineQueue
                const metrics = activeTab === 'optimized' ? data.optimizedMetrics : data.baselineMetrics
                const label = DOMAIN_LABELS[domain] ?? domain
                const DomainIcon = DOMAIN_ICONS[domain] ?? Stethoscope
                const variant = activeTab === 'optimized' ? 'optimized' : 'baseline'

                return (
                  <div key={domain} className={`space-y-5 border-l-4 ${DOMAIN_BORDER[domain] ?? 'border-l-border'} pl-5 animate-slide-up-fade`} style={{ animationDelay: `${qIdx * 0.15}s` }}>
                    <div className="flex items-center gap-3">
                      <DomainIcon className="h-4 w-4 text-muted-foreground" />
                      <h2 className="font-display text-sm font-bold tracking-wider uppercase">{label}</h2>
                      <span className="font-mono-space text-[10px] text-muted-foreground/50 tracking-wider">{queue.length} patients</span>
                    </div>

                    {/* Metrics */}
                    <MetricsGrid
                      metrics={metrics}
                      fairnessScoreOverride={activeTab === 'optimized' && data.fairnessReport ? data.fairnessReport.fairnessScore : undefined}
                      improvements={activeTab === 'optimized' ? data.improvements : null}
                    />

                    {/* Queue table */}
                    <QueueTable
                      title={`${activeTab === 'optimized' ? 'Optimized' : 'FIFO'} — ${label}`}
                      queue={queue}
                      variant={variant}
                    />

                    {/* Fairness */}
                    {activeTab === 'optimized' && data.fairnessReport && (
                      <FairnessPanel report={data.fairnessReport} />
                    )}

                    {/* Recommendations */}
                    {activeTab === 'optimized' && data.recommendations.length > 0 && (
                      <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border/50 flex items-center gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-severity-medium" />
                          <span className="font-display text-[10px] font-bold tracking-wider uppercase">Recommendations — {label}</span>
                        </div>
                        <div className="p-4 space-y-2">
                          {data.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs">
                              <span className="font-mono-space text-[10px] text-muted-foreground/40 mt-0.5 w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                              <span className="text-muted-foreground font-light leading-relaxed">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Queues with < 2 patients */}
              {activeDomains.filter(d => (grouped[d]?.length ?? 0) === 1).map(domain => (
                <div key={domain} className={`border-l-4 ${DOMAIN_BORDER[domain] ?? 'border-l-border'} pl-5 py-3`}>
                  <p className="text-xs text-muted-foreground font-light">
                    <span className="font-display font-bold tracking-wider uppercase">{DOMAIN_LABELS[domain]}</span>{' '}
                    — 1 patient (need ≥ 2 to simulate)
                  </p>
                </div>
              ))}

              {/* Clinical Breakdown */}
              {(() => {
                const patientsWithClassification = patients.filter(p => p.queueType || p.classification)
                if (patientsWithClassification.length === 0) return null

                const queueDist = DOMAIN_ORDER.map(qt => ({
                  name: qt,
                  value: patientsWithClassification.filter(p => getPatientQueueType(p) === qt).length,
                })).filter(d => d.value > 0)

                const QUEUE_COLORS: Record<string, string> = {
                  diabetes: '#3b82f6',
                  cholesterol: '#f97316',
                  bloodPressure: '#ef4444',
                  general: '#94a3b8',
                }

                const severityDist = ['low', 'standard', 'high', 'critical'].map(s => ({
                  name: s,
                  count: patientsWithClassification.filter(p => p.classification?.severity === s).length,
                })).filter(d => d.count > 0)

                const SEVERITY_COLORS: Record<string, string> = {
                  low: '#00C9A7',
                  standard: '#FFB84D',
                  high: '#ef4444',
                  critical: '#dc2626',
                }

                return (
                  <div className="chart-glass animate-fade-in-up">
                    <div className="p-5 border-b border-border/50 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="font-display text-xs font-bold tracking-wider uppercase">Clinical Breakdown</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {queueDist.length > 0 && (
                          <div>
                            <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mb-3">Queue Distribution</p>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={queueDist}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    stroke="var(--chart-grid)"
                                    strokeWidth={1}
                                  >
                                    {queueDist.map(entry => (
                                      <Cell key={entry.name} fill={QUEUE_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'var(--chart-tooltip-bg)',
                                      border: '1px solid var(--chart-tooltip-border)',
                                      borderRadius: '10px',
                                      fontSize: 11,
                                      fontFamily: "'Space Mono', monospace",
                                      color: 'var(--chart-tooltip-color)',
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {severityDist.length > 0 && (
                          <div>
                            <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mb-3">Severity Distribution</p>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={severityDist}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                  <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: "'Space Mono', monospace" }} axisLine={{ stroke: 'var(--chart-axis)' }} />
                                  <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: "'Space Mono', monospace" }} axisLine={{ stroke: 'var(--chart-axis)' }} allowDecimals={false} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'var(--chart-tooltip-bg)',
                                      border: '1px solid var(--chart-tooltip-border)',
                                      borderRadius: '10px',
                                      fontSize: 11,
                                      fontFamily: "'Space Mono', monospace",
                                      color: 'var(--chart-tooltip-color)',
                                    }}
                                  />
                                  <Bar dataKey="count" name="Patients" radius={[4, 4, 0, 0]}>
                                    {severityDist.map(entry => (
                                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center h-64 text-center animate-fade-in">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <PlayCircle className="h-6 w-6 text-primary/40" />
              </div>
              <p className="font-display text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">No Simulation Data</p>
              <p className="text-[11px] text-muted-foreground/50 font-light">
                Add patients and click "Run Simulation" to see results
              </p>
            </div>
          )}
        </div>
    </div>
  )
}
