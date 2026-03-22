import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { ConfigResponse } from '@/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Zap,
  Server,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const STORAGE_KEY = 'fluxq-config'

const PRESETS = [
  {
    name: 'Standard (Balanced)',
    icon: <Zap className="h-4 w-4" />,
    config: {
      severityWeight: 0.5,
      waitTimeWeight: 0.3,
      fairnessWeight: 0.2,
      maxWaitTimeForLowPriority: 60,
      maxWaitTimeForMediumPriority: 45,
      maxWaitTimeForHighPriority: 30,
      mandatorySlotAfter: 60,
      interleaveAfter: 3,
      scheduledWindowMinutes: 240,
    }
  },
  {
    name: 'Emergency Focused',
    icon: <ShieldCheck className="h-4 w-4 text-severity-high" />,
    config: {
      severityWeight: 0.8,
      waitTimeWeight: 0.1,
      fairnessWeight: 0.1,
      maxWaitTimeForLowPriority: 120,
      maxWaitTimeForMediumPriority: 60,
      maxWaitTimeForHighPriority: 15,
      mandatorySlotAfter: 90,
      interleaveAfter: 5,
      scheduledWindowMinutes: 240,
    }
  },
  {
    name: 'Fairness First',
    icon: <Clock className="h-4 w-4 text-blue-500" />,
    config: {
      severityWeight: 0.3,
      waitTimeWeight: 0.4,
      fairnessWeight: 0.3,
      maxWaitTimeForLowPriority: 45,
      maxWaitTimeForMediumPriority: 30,
      maxWaitTimeForHighPriority: 20,
      mandatorySlotAfter: 30,
      interleaveAfter: 2,
      scheduledWindowMinutes: 240,
    }
  }
]

export function ConfigurationPage() {
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [editedConfig, setEditedConfig] = useState<ConfigResponse['config'] | null>(null)
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'weights' | 'thresholds' | 'rules' | 'aging'>('weights')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      let baseConfig: ConfigResponse;

      if (saved) {
        baseConfig = JSON.parse(saved)
      } else {
        const data = await api.getConfig()
        baseConfig = {
          ...data,
          config: {
            ...data.config,
            agingThresholds: data.config.agingThresholds ?? [],
            mandatorySlotAfter: data.config.mandatorySlotAfter ?? 45,
            interleaveAfter: data.config.interleaveAfter ?? 3,
            scheduledWindowMinutes: data.config.scheduledWindowMinutes ?? 240,
          },
        }
      }

      setConfig(baseConfig)
      setEditedConfig({ ...baseConfig.config })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveToStorage = async () => {
    if (!editedConfig || !config) return
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      const newConfig = { ...config, config: editedConfig }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      setConfig(newConfig)
      setValidation({ valid: true, errors: [] })
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    if (!editedConfig) return
    setEditedConfig({ ...editedConfig, ...preset.config })
    setValidation(null)
  }

  const validateConfig = async () => {
    if (!editedConfig) return
    setValidating(true)
    setValidation(null)
    try {
      const data = await api.validateConfig(editedConfig)
      setValidation(data)
    } catch (e) {
      setValidation({ valid: false, errors: [(e as Error).message] })
    } finally {
      setValidating(false)
    }
  }

  const updateField = (field: keyof ConfigResponse['config'], value: number) => {
    if (!editedConfig) return
    setEditedConfig({ ...editedConfig, [field]: value })
    setValidation(null)
  }

  const resetConfig = () => {
    localStorage.removeItem(STORAGE_KEY)
    loadConfig()
    setValidation(null)
  }

  const addAgingThreshold = () => {
    if (!editedConfig) return
    setEditedConfig({
      ...editedConfig,
      agingThresholds: [...editedConfig.agingThresholds, { minutes: 30, boost: 5 }],
    })
  }

  const removeAgingThreshold = (index: number) => {
    if (!editedConfig) return
    setEditedConfig({
      ...editedConfig,
      agingThresholds: editedConfig.agingThresholds.filter((_, i) => i !== index),
    })
  }

  const updateAgingThreshold = (index: number, field: 'minutes' | 'boost', value: number) => {
    if (!editedConfig) return
    const thresholds = [...editedConfig.agingThresholds]
    thresholds[index] = { ...thresholds[index], [field]: value }
    setEditedConfig({ ...editedConfig, agingThresholds: thresholds })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const weightSum = editedConfig
    ? editedConfig.severityWeight + editedConfig.waitTimeWeight + editedConfig.fairnessWeight
    : 0

  const chartData = editedConfig ? [
    { name: 'Severity', value: editedConfig.severityWeight, color: 'var(--color-severity-high)' },
    { name: 'Wait Time', value: editedConfig.waitTimeWeight, color: 'var(--color-urgency-standard)' },
    { name: 'Fairness', value: editedConfig.fairnessWeight, color: 'var(--color-primary)' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-10 relative pb-20">
      {/* Background watermark matching system style */}
      <div className="page-watermark">CFG</div>

      {/* Hero header - Matches Comparison/Dashboard style */}
      <div className="relative animate-fade-in-up">
        <p className="section-label flex items-center gap-2 mb-3">
          <span className="live-dot" />
          Configuration Engine
        </p>
        <h1 className="section-heading text-3xl md:text-5xl">
          <span className="text-accent">System</span>{' '}
          <span className="text-stroke">Configuration</span>
        </h1>
        <p className="text-xs text-muted-foreground font-light max-w-sm leading-relaxed mt-2 uppercase tracking-tight">
          Optimize the triage engine and fairness scheduling parameters for real-time patient prioritization.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button 
            onClick={saveToStorage} 
            disabled={saving || !validation?.valid} 
            size="lg"
            className="bg-primary hover:bg-teal shadow-xl shadow-primary/10 font-display text-[10px] font-bold uppercase tracking-widest px-6"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Configuration
          </Button>
          <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={validateConfig} 
                disabled={validating}
                className="glass-card hover:bg-primary/5 font-display text-[9px] font-bold uppercase tracking-widest px-4 h-11"
            >
                {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" />}
                Validate
            </Button>
            <Button 
                variant="outline" 
                onClick={resetConfig} 
                className="glass-card hover:bg-destructive/5 font-display text-[9px] font-bold uppercase tracking-widest px-4 h-11"
            >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Persistence Feedback */}
      {validation && (
        <div className={`glass-card border-none overflow-hidden animate-fade-in-up delay-1`}>
          <div className={`px-4 py-2 flex items-center justify-between text-[10px] font-mono-space tracking-wider uppercase ${
            validation.valid ? 'text-primary bg-primary/5' : 'text-severity-high bg-severity-high/5'
          }`}>
             <div className="flex items-center gap-3">
              {validation.valid ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              <span>{validation.valid ? 'Configuration Validated' : 'Validation Error Found'}</span>
             </div>
             {validation.valid && <span>Sum: {weightSum.toFixed(2)}</span>}
          </div>
          {!validation.valid && (
            <div className="p-4 text-xs text-severity-high font-light">
              {validation.errors.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Quick Presets Section */}
      <div className="animate-fade-in-up delay-2">
        <p className="section-label mb-5 uppercase tracking-widest">[ 01 ] — Optimization Presets</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className="glass-card metric-card p-6 hover-lift text-left group overflow-hidden relative"
            >
               <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center transition-transform group-hover:scale-110">
                    {preset.icon}
                  </div>
                  <div className="tag-pill uppercase text-[8px]">Active Mode</div>
               </div>
               <p className="font-display text-[11px] font-bold tracking-widest uppercase mb-1">{preset.name}</p>
               <p className="font-mono-space text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">Apply optimization strategy</p>
               <div className="absolute bottom-0 left-0 h-[1px] bg-primary w-0 group-hover:w-full transition-all duration-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Configuration Interface */}
      <div className="space-y-6 relative z-10">
        <div className="flex flex-wrap gap-8 group/tabs animate-fade-in delay-3 border-b border-border/10 pb-4">
          {[
            { id: 'weights', label: 'Weights', icon: <Layers className="h-4 w-4" />, num: '01' },
            { id: 'thresholds', label: 'Fairness', icon: <ShieldCheck className="h-4 w-4" />, num: '02' },
            { id: 'rules', label: 'Scheduling', icon: <Settings className="h-4 w-4" />, num: '03' },
            { id: 'aging', label: 'Aging', icon: <Clock className="h-4 w-4" />, num: '04' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 transition-all ${
                activeTab === tab.id ? 'text-primary scale-105' : 'text-muted-foreground opacity-50 hover:opacity-100'
              }`}
            >
              <span className="font-mono-space text-[10px] font-bold opacity-30">{tab.num}</span>
              <span className="font-display text-[11px] font-bold uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && <div className="h-1 w-1 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        <div className="pt-4 transition-all duration-500">
          {activeTab === 'weights' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-6 animate-slide-in-left">
                <p className="section-label uppercase tracking-widest opacity-40">[ 02 ] — Weight Parameters</p>
                <div className="chart-glass p-10 space-y-10">
                  <WeightSlider 
                    label="Clinical Severity" 
                    value={editedConfig?.severityWeight || 0}
                    onChange={(v: number) => updateField('severityWeight', v)}
                    color="var(--color-severity-high)"
                  />
                  <WeightSlider 
                    label="Wait Duration" 
                    value={editedConfig?.waitTimeWeight || 0}
                    onChange={(v: number) => updateField('waitTimeWeight', v)}
                    color="var(--color-urgency-standard)"
                  />
                  <WeightSlider 
                    label="Fairness Threshold" 
                    value={editedConfig?.fairnessWeight || 0}
                    onChange={(v: number) => updateField('fairnessWeight', v)}
                    color="var(--color-primary)"
                  />
                  
                  <div className="pt-8 border-t border-border/50 flex items-center justify-between">
                    <p className="text-[10px] font-mono-space text-muted-foreground/60 uppercase tracking-widest leading-none">
                      Total weights must equal 1.00
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="tag-pill uppercase scale-90">Current Sum</div>
                      <span className={`font-mono-space text-sm font-bold ${Math.abs(weightSum - 1.0) < 0.01 ? 'text-primary' : 'text-severity-high'}`}>
                        {weightSum.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6 animate-slide-in-right">
                <p className="section-label uppercase tracking-widest opacity-40">[ 03 ] — Balance Overview</p>
                <div className="chart-glass h-[400px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%" cy="50%"
                        innerRadius={80}
                        outerRadius={115}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1000}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--chart-tooltip-bg)', 
                          borderColor: 'var(--chart-tooltip-border)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontFamily: 'Space Mono',
                          textTransform: 'uppercase'
                        }}
                      />
                      <Legend 
                        iconType="circle" 
                        iconSize={8}
                        wrapperStyle={{ 
                          fontSize: '10px', 
                          fontFamily: 'Space Mono', 
                          textTransform: 'uppercase',
                          opacity: 0.6,
                          letterSpacing: '0.15em',
                          paddingTop: '20px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-6 animate-scale-in">
              <p className="section-label uppercase tracking-widest opacity-40">[ 04 ] — Criticality Limits</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <ThresholdCard 
                    label="Emergency"
                    value={editedConfig?.maxWaitTimeForHighPriority || 0}
                    onChange={(v: number) => updateField('maxWaitTimeForHighPriority', v)}
                    desc="High priority wait limit"
                    variant="high"
                 />
                 <ThresholdCard 
                    label="Routine"
                    value={editedConfig?.maxWaitTimeForMediumPriority || 0}
                    onChange={(v: number) => updateField('maxWaitTimeForMediumPriority', v)}
                    desc="Standard consultation limit"
                    variant="standard"
                 />
                 <ThresholdCard 
                    label="Baseline"
                    value={editedConfig?.maxWaitTimeForLowPriority || 0}
                    onChange={(v: number) => updateField('maxWaitTimeForLowPriority', v)}
                    desc="Global fairness threshold"
                    variant="low"
                 />
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
               <div className="space-y-6">
                  <p className="section-label uppercase tracking-widest opacity-40">[ 05 ] — Dynamic Allocation</p>
                  <div className="chart-glass p-10 space-y-12">
                    <RuleInput 
                      label="Mandatory Slot After"
                      value={editedConfig?.mandatorySlotAfter || 0}
                      onChange={(v: number) => updateField('mandatorySlotAfter', v)}
                      unit="MIN"
                    />
                    <RuleInput 
                      label="Interleave Ratio"
                      value={editedConfig?.interleaveAfter || 0}
                      onChange={(v: number) => updateField('interleaveAfter', v)}
                      unit="PTS"
                    />
                  </div>
               </div>
               <div className="space-y-6 ">
                  <p className="section-label uppercase tracking-widest opacity-40">[ 06 ] — Engine Safety</p>
                  <div className="glass-card p-10 flex flex-col justify-center h-full relative overflow-hidden group border-primary/10">
                     <div className="absolute top-0 right-0 p-10 opacity-[0.05] transform translate-x-10 -translate-y-10 group-hover:translate-x-5 group-hover:-translate-y-5 transition-transform duration-700">
                        <Settings className="h-48 w-48" />
                     </div>
                     <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8">
                        <Zap className="h-6 w-6 text-primary" />
                     </div>
                     <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-4">Integrity Enforcement</h3>
                     <p className="text-xs text-muted-foreground font-light leading-relaxed mb-8">
                        Safety rules prevent patient starvation by overriding clinical urgency boosts when wait thresholds are exceeded.
                     </p>
                     <div className="flex items-center gap-3">
                        <span className="live-dot" />
                        <span className="font-mono-space text-[10px] uppercase tracking-widest opacity-60">System Online</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'aging' && (
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="section-label uppercase tracking-widest opacity-40">[ 07 ] — Starvation Boosts</p>
                   <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addAgingThreshold}
                      className="glass-card font-display text-[10px] font-bold uppercase tracking-widest px-4 h-9"
                   >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Add Tier
                   </Button>
                </div>
                {editedConfig && editedConfig.agingThresholds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
                    {editedConfig.agingThresholds.map((t, i) => (
                      <div key={i} className="glass-card p-6 relative group overflow-hidden animate-slide-up-fade" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-6">
                           <span className="font-mono-space text-[11px] font-bold text-primary tracking-widest">TIER {String(i + 1).padStart(2, '0')}</span>
                           <button onClick={() => removeAgingThreshold(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-4 w-4 text-severity-high hover:scale-110 transition-transform" />
                           </button>
                        </div>
                        <div className="space-y-5">
                           <div className="space-y-1.5">
                              <p className="font-mono-space text-[9px] uppercase tracking-widest opacity-40">Wait limit (Min)</p>
                              <Input 
                                type="number" 
                                value={t.minutes}
                                onChange={(e) => updateAgingThreshold(i, 'minutes', Number(e.target.value))}
                                className="border-none bg-primary/5 font-display font-black text-lg h-10 p-0 rounded-none border-b border-primary/20 focus-visible:ring-0"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <p className="font-mono-space text-[9px] uppercase tracking-widest opacity-40">Priority boost (Pts)</p>
                              <Input 
                                type="number" 
                                value={t.boost}
                                onChange={(e) => updateAgingThreshold(i, 'boost', Number(e.target.value))}
                                className="border-none bg-primary/5 font-display font-black text-lg h-10 p-0 rounded-none border-b border-primary/20 focus-visible:ring-0 text-primary"
                              />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="chart-glass py-24 text-center animate-fade-in">
                    <p className="text-muted-foreground opacity-40 text-sm mb-6 uppercase tracking-widest">Static prioritization active (no aging)</p>
                    <Button onClick={addAgingThreshold} size="lg" variant="outline" className="glass-card font-display text-[11px] font-bold uppercase tracking-widest px-8">
                       Initialize Aging Engine
                    </Button>
                  </div>
                )}
             </div>
          )}
        </div>
      </div>

      {/* Persistence Policy Footer */}
      <div className="p-6 glass-card border-none bg-primary/5 flex items-center justify-center gap-4 animate-fade-in-up delay-6 mt-10">
        <Server className="h-4 w-4 text-primary opacity-40" />
        <p className="text-[10px] font-mono-space tracking-widest uppercase text-primary/40 text-center">
          Changes persist in local session. Production deployment requires <code>DEFAULT_CONFIG</code> sync.
        </p>
      </div>
    </div>
  )
}

function WeightSlider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void, color: string }) {
  return (
    <div className="space-y-6 group">
      <div className="flex items-center justify-between">
        <label className="font-display text-[12px] font-bold uppercase tracking-[0.2em] flex items-center gap-4">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          {label}
        </label>
        <span className="font-mono-space text-sm font-bold transition-transform group-hover:scale-110" style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="relative h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-700" 
          style={{ width: `${value * 100}%`, background: color }} 
        />
        <input 
          type="range" min="0" max="1" step="0.01" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

function ThresholdCard({ label, value, onChange, desc, variant }: { label: string, value: number, onChange: (v: number) => void, desc: string, variant: 'high' | 'standard' | 'low' }) {
  return (
    <div className="glass-card p-8 flex flex-col items-center text-center group hover:bg-card hover:border-primary/20 transition-all transform hover:-translate-y-1">
       <Badge variant={variant} className="mb-6 font-display text-[9px] tracking-[0.3em] uppercase rounded-full px-5 py-1">{variant}</Badge>
       <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] mb-1">{label}</h3>
       <p className="font-mono-space text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-8">{desc}</p>
       <div className="flex items-baseline gap-2">
          <Input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="border-none bg-transparent font-display font-black text-5xl h-14 w-28 p-0 text-center focus-visible:ring-0"
          />
          <span className="font-mono-space text-xs opacity-30">MIN</span>
       </div>
    </div>
  )
}

function RuleInput({ label, value, onChange, unit }: { label: string, value: number, onChange: (v: number) => void, unit: string }) {
  return (
    <div className="flex items-center justify-between group">
       <div className="space-y-1.5">
          <label className="font-display text-[11px] font-bold uppercase tracking-widest">{label}</label>
          <p className="font-mono-space text-[9px] uppercase tracking-widest text-muted-foreground/30">System Integrity Threshold</p>
       </div>
       <div className="flex items-center gap-5">
          <Input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="border-none bg-primary/5 font-display font-black text-2xl h-12 w-24 text-center rounded-xl focus:bg-primary/10 transition-all focus-visible:ring-0"
          />
          <span className="font-mono-space text-[11px] font-bold opacity-30">{unit}</span>
       </div>
    </div>
  )
}
