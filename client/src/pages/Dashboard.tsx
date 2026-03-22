import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { HealthResponse } from '@/api/client'
import {
  Activity,
  Server,
  Clock,
  Zap,
  ArrowRight,
  ClipboardList,
  Droplets,
  Heart,
  Stethoscope,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setError(e.message))
  }, [])

  const features = [
    {
      title: 'Run Simulation',
      description: 'Compare FIFO baseline vs ML-optimized queue ordering with full metrics breakdown.',
      icon: Activity,
      action: () => navigate('/simulator'),
      tag: 'Core',
    },
    {
      title: 'Queue Comparison',
      description: 'Side-by-side visualization of baseline vs optimized queues with improvement analysis.',
      icon: Zap,
      action: () => navigate('/comparison'),
      tag: 'Analytics',
    },
    {
      title: 'Configuration',
      description: 'View and validate optimization weights — severity, wait time, and fairness parameters.',
      icon: Server,
      action: () => navigate('/config'),
      tag: 'Settings',
    },
    {
      title: 'Patient Intake',
      description: 'Symptom-driven clinical triage — automated classification into specialized queues.',
      icon: ClipboardList,
      action: () => navigate('/intake'),
      tag: 'Clinical',
    },
  ]

  return (
    <div className="space-y-10 relative">
      {/* Background watermark */}
      <div className="page-watermark">FluxQ</div>

      {/* Hero header */}
      <div className="relative animate-fade-in-up">
        <p className="section-label flex items-center gap-2 mb-4">
          <span className="live-dot" />
          Dashboard Overview
        </p>
        <h1 className="section-heading text-4xl md:text-5xl mb-3">
          <span className="text-accent">Queue</span>{' '}
          <span className="text-stroke">Intelligence</span>
        </h1>
        <p className="text-sm font-light text-muted-foreground max-w-md leading-relaxed">
          Telemedicine Queue Optimization System — real-time monitoring, ML-driven prioritization, and fairness enforcement.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-1">
        <div className="glass-card metric-card p-5 hover-lift">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">API Status</p>
              <div className="flex items-center gap-2">
                {health ? (
                  <>
                    <div className="live-dot" />
                    <span className="font-display text-sm font-bold text-primary">Online</span>
                  </>
                ) : error ? (
                  <span className="font-display text-sm font-bold text-severity-high">Offline</span>
                ) : (
                  <span className="font-display text-sm font-bold text-severity-medium">Checking...</span>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="glass-card metric-card p-5 hover-lift">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Uptime</p>
              <p className="counter-value text-2xl">
                {health ? `${Math.floor(health.uptime / 60)}m ${Math.floor(health.uptime % 60)}s` : '—'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="glass-card metric-card p-5 hover-lift">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Environment</p>
              <p className="font-display text-lg font-bold capitalize">{health?.environment || '—'}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-severity-medium/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-severity-medium" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="animate-fade-in-up delay-2">
        <p className="section-label mb-5">[ 01 ] — Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] rounded-xl overflow-hidden border border-border/50 bg-border/20">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              onClick={feature.action}
              className={`group bg-card p-6 cursor-pointer transition-all duration-300 hover:bg-accent relative accent-bar-top animate-slide-up-fade delay-${i + 2}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
              </div>
              <h3 className="font-display text-xs font-bold tracking-wider uppercase mb-2">{feature.title}</h3>
              <p className="text-xs text-muted-foreground font-light leading-relaxed mb-3">{feature.description}</p>
              <span className="tag-pill">{feature.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="animate-fade-in-up delay-4">
        <p className="section-label mb-5">[ 02 ] — API Endpoints</p>
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="font-display text-xs font-bold tracking-wider uppercase">REST API</h3>
            <p className="text-xs text-muted-foreground mt-1">Available endpoints for queue optimization</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border/10">
            {[
              { method: 'GET', path: '/health', desc: 'Health check' },
              { method: 'GET', path: '/api/v1/config', desc: 'Get default config' },
              { method: 'POST', path: '/api/v1/simulate', desc: 'Run full simulation' },
              { method: 'POST', path: '/api/v1/optimize', desc: 'Optimize queue' },
              { method: 'POST', path: '/api/v1/compare', desc: 'Compare queues' },
              { method: 'POST', path: '/api/v1/metrics', desc: 'Calculate metrics' },
              { method: 'POST', path: '/api/v1/intake/classify', desc: 'Classify intake' },
              { method: 'POST', path: '/api/v1/intake/enqueue', desc: 'Enqueue patient' },
              { method: 'GET', path: '/api/v1/intake/questions/:type', desc: 'Intake questions' },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 px-5 py-3 bg-card transition-colors hover:bg-accent">
                <span className={`font-mono-space text-[10px] tracking-wider font-bold ${ep.method === 'GET' ? 'text-primary' : 'text-severity-medium'}`}>
                  {ep.method}
                </span>
                <code className="font-mono-space text-[11px] text-muted-foreground flex-1">{ep.path}</code>
                <span className="text-[10px] text-muted-foreground/60">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specialized Queues */}
      <div className="animate-fade-in-up delay-5">
        <p className="section-label mb-5">[ 03 ] — Specialized Queues</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] rounded-xl overflow-hidden border border-border/50 bg-border/20">
          {[
            { type: 'Diabetes', desc: 'Blood glucose, insulin, hypo/hyper symptoms', icon: Droplets, color: '#3b82f6' },
            { type: 'Cholesterol', desc: 'Lipid levels, cardiovascular risk factors', icon: Heart, color: '#f97316' },
            { type: 'Blood Pressure', desc: 'Hypertension, BP monitoring, symptoms', icon: Activity, color: '#ef4444' },
            { type: 'General', desc: 'General health, multi-symptom, other', icon: Stethoscope, color: '#94a3b8' },
          ].map((q, i) => (
            <div key={q.type} className={`bg-card p-6 transition-all duration-300 hover:bg-accent accent-bar-top animate-slide-up-fade delay-${i + 5}`}>
              <div style={{ height: 2, background: q.color, marginBottom: 16, borderRadius: 1 }} />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${q.color}15` }}>
                  <q.icon className="h-4 w-4" style={{ color: q.color }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-space text-[10px] tracking-wider font-bold uppercase" style={{ color: q.color }}>
                    Active
                  </span>
                  <span className="animate-blink h-1 w-1 rounded-full" style={{ background: q.color }} />
                </div>
              </div>
              <h3 className="font-display text-xs font-bold tracking-wider uppercase mb-1">{q.type}</h3>
              <p className="text-[11px] text-muted-foreground font-light leading-relaxed">{q.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
