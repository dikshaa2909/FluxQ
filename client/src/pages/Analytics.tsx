import { useState } from 'react'
import { api } from '@/api/client'
import type { SimulateResponse } from '@/api/client'
import { usePatients } from '@/lib/PatientContext'
import { getImprovement } from '@/lib/utils'
import { PatientForm } from '@/components/PatientForm'
import { FairnessPanel } from '@/components/FairnessPanel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Loader2, PlayCircle, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

export function AnalyticsPage() {
  const { patients, setPatients } = usePatients()
  const [result, setResult] = useState<SimulateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    if (patients.length < 2) {
      setError('Add at least 2 patients')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.simulate(patients)
      setResult(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Build chart data
  const barData = result
    ? [
        {
          name: 'Avg Wait',
          baseline: result.baselineMetrics.averageWaitTime,
          optimized: result.optimizedMetrics.averageWaitTime,
        },
        {
          name: 'Median Wait',
          baseline: result.baselineMetrics.medianWaitTime,
          optimized: result.optimizedMetrics.medianWaitTime,
        },
        {
          name: 'Fairness',
          baseline: result.baselineMetrics.fairnessScore,
          optimized: result.optimizedMetrics.fairnessScore,
        },
        {
          name: 'Utilization',
          baseline: result.baselineMetrics.doctorUtilization,
          optimized: result.optimizedMetrics.doctorUtilization,
        },
        {
          name: 'Throughput',
          baseline: result.baselineMetrics.throughput,
          optimized: result.optimizedMetrics.throughput,
        },
        {
          name: 'Max Wait',
          baseline: result.baselineMetrics.maxWaitTime,
          optimized: result.optimizedMetrics.maxWaitTime,
        },
        {
          name: 'Satisfaction',
          baseline: result.baselineMetrics.patientSatisfaction * 10,
          optimized: result.optimizedMetrics.patientSatisfaction * 10,
        },
      ]
    : []

  const waitTimeComparison = result
    ? result.baselineQueue.map((item, i) => ({
        patient: item.patientId,
        baselineWait: item.estimatedWaitTime,
        optimizedWait: result.optimizedQueue[i]?.estimatedWaitTime ?? 0,
      }))
    : []

  const radarData = result
    ? [
        { metric: 'Speed', baseline: Math.max(0, 100 - result.baselineMetrics.averageWaitTime), optimized: Math.max(0, 100 - result.optimizedMetrics.averageWaitTime) },
        { metric: 'Fairness', baseline: result.baselineMetrics.fairnessScore, optimized: result.optimizedMetrics.fairnessScore },
        { metric: 'Utilization', baseline: result.baselineMetrics.doctorUtilization, optimized: result.optimizedMetrics.doctorUtilization },
        { metric: 'Throughput', baseline: Math.min(100, result.baselineMetrics.throughput * 10), optimized: Math.min(100, result.optimizedMetrics.throughput * 10) },
        { metric: 'Consistency', baseline: Math.max(0, 100 - result.baselineMetrics.maxWaitTime + result.baselineMetrics.minWaitTime), optimized: Math.max(0, 100 - result.optimizedMetrics.maxWaitTime + result.optimizedMetrics.minWaitTime) },
        { metric: 'Satisfaction', baseline: result.baselineMetrics.patientSatisfaction * 10, optimized: result.optimizedMetrics.patientSatisfaction * 10 },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Performance comparison, fairness tracking, and metrics visualization
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={loading || patients.length < 2} size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <PatientForm patients={patients} onPatientsChange={setPatients} />

      {result && (
        <>
          {/* Improvement badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Wait Reduction', value: getImprovement(result.improvements?.waitTimeReduction), suffix: '%', positive: parseFloat(getImprovement(result.improvements?.waitTimeReduction)) > 0 },
              { label: 'Fairness Gain', value: getImprovement(result.improvements?.fairnessImprovement), suffix: ' pts', positive: parseFloat(getImprovement(result.improvements?.fairnessImprovement)) > 0 },
              { label: 'Utilization', value: getImprovement(result.improvements?.utilizationImprovement), suffix: '%', positive: parseFloat(getImprovement(result.improvements?.utilizationImprovement)) >= 0 },
              { label: 'Throughput', value: getImprovement(result.improvements?.throughputImprovement), suffix: '%', positive: parseFloat(getImprovement(result.improvements?.throughputImprovement)) >= 0 },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                  <div className="flex items-center justify-center gap-1">
                    {item.positive ? (
                      <TrendingUp className="h-4 w-4 text-severity-low" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-severity-high" />
                    )}
                    <span className={`text-xl font-bold ${item.positive ? 'text-severity-low' : 'text-severity-high'}`}>
                      {item.value}{item.suffix}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bar Chart: Baseline vs Optimized */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                BASELINE VS OPTIMIZED
              </CardTitle>
              <CardDescription>Side-by-side comparison of key performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barGap={4} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0f',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="baseline" name="FCFS Baseline" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="optimized" name="Optimized" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Line Chart: Per-patient wait times */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-Patient Wait Time Comparison</CardTitle>
              <CardDescription>Wait time for each patient under baseline vs optimized scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waitTimeComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="patient" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} label={{ value: 'Wait (min)', angle: -90, position: 'insideLeft', fill: '#a1a1aa', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0f',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="baselineWait" name="Baseline Wait" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                    <Line type="monotone" dataKey="optimizedWait" name="Optimized Wait" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Radar</CardTitle>
              <CardDescription>Multi-dimensional comparison of queue performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={{ stroke: '#27272a' }} />
                    <Radar name="Baseline" dataKey="baseline" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Radar name="Optimized" dataKey="optimized" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0f',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Metric Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Metric</th>
                    <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: '#f59e0b' }}>FCFS Baseline</th>
                    <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: '#22c55e' }}>Optimized</th>
                    <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Δ Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Average Wait Time', key: 'averageWaitTime', unit: 'min', lowerBetter: true },
                    { label: 'Median Wait Time', key: 'medianWaitTime', unit: 'min', lowerBetter: true },
                    { label: 'Max Wait Time', key: 'maxWaitTime', unit: 'min', lowerBetter: true },
                    { label: 'Min Wait Time', key: 'minWaitTime', unit: 'min', lowerBetter: true },
                    { label: 'Fairness Score', key: 'fairnessScore', unit: '/100', lowerBetter: false },
                    { label: 'Doctor Utilization', key: 'doctorUtilization', unit: '%', lowerBetter: false },
                    { label: 'Throughput', key: 'throughput', unit: 'pts/hr', lowerBetter: false },
                    { label: 'Patient Satisfaction', key: 'patientSatisfaction', unit: '/10', lowerBetter: false },
                    { label: 'Total Overtime', key: 'totalOvertime', unit: 'min', lowerBetter: true },
                  ].map(({ label, key, unit, lowerBetter }) => {
                    const b = result.baselineMetrics[key as keyof typeof result.baselineMetrics] as number
                    const o = result.optimizedMetrics[key as keyof typeof result.optimizedMetrics] as number
                    const diff = o - b
                    const improved = lowerBetter ? diff < 0 : diff > 0

                    return (
                      <tr key={key} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-medium">{label}</td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: '#f59e0b' }}>
                          {b.toFixed(1)} {unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: '#22c55e' }}>
                          {o.toFixed(1)} {unit}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${improved ? 'text-severity-low' : diff === 0 ? 'text-muted-foreground' : 'text-severity-high'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Fairness Report */}
          {result.fairnessReport && (
            <FairnessPanel report={result.fairnessReport} />
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5 shrink-0">{i + 1}</Badge>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <BarChart3 className="h-8 w-8 mb-3 opacity-30" />
          <p>Add patients and run analysis to see visual comparisons</p>
        </div>
      )}
    </div>
  )
}
