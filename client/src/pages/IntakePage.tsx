import { useState, useCallback, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { IntakeForm, ClassifyResponse, ClassificationResult, Patient } from '@/api/client'
import { usePatients } from '@/lib/PatientContext'
import { IntakeFormComponent } from '@/components/IntakeForm'
// Card components replaced with glass-card pattern
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Phone,
  Clock,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'

// Error Boundary to prevent full-page crash
class IntakeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message || 'Unknown error' }
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('IntakePage error:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive space-y-3">
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm">{this.state.error}</p>
          <button onClick={() => this.setState({ hasError: false, error: '' })} className="text-sm underline">
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-severity-low/20 text-severity-low border-severity-low/30',
  standard: 'bg-severity-medium/20 text-severity-medium border-severity-medium/30',
  high: 'bg-severity-high/20 text-severity-high border-severity-high/30',
  critical: 'bg-severity-high/20 text-severity-high border-severity-high/30 animate-pulse',
}

function safeFmt(v: unknown, decimals = 1): string {
  if (typeof v === 'number' && !isNaN(v)) return v.toFixed(decimals)
  return '—'
}

export function IntakePage() {
  return (
    <IntakeErrorBoundary>
      <IntakePageInner />
    </IntakeErrorBoundary>
  )
}

function IntakePageInner() {
  const navigate = useNavigate()
  const { addPatient } = usePatients()
  const [classifyResult, setClassifyResult] = useState<ClassifyResponse | null>(null)
  const [intake, setIntake] = useState<IntakeForm | null>(null)
  const [enqueuing, setEnqueuing] = useState(false)
  const [enqueued, setEnqueued] = useState<{ patientId: string; urgency: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClassified = useCallback((result: ClassifyResponse, intakeData: IntakeForm) => {
    setClassifyResult(result)
    setIntake(intakeData)
    setEnqueued(null)
    setError(null)
  }, [])

  const handleEnqueue = async () => {
    if (!intake) return
    setEnqueuing(true)
    setError(null)
    try {
      const result = await api.enqueueIntake(intake)
      const pid = result?.patient?.id ?? `patient-${Date.now()}`
      const urg = result?.patient?.urgency ?? 'STANDARD'

      // Build a full Patient object and persist it for the Simulator
      const patient: Patient = {
        id: pid,
        age: 30,
        gender: 'Other',
        chiefComplaint: intake.queueType,
        conditionType: intake.queueType,
        urgency: urg as Patient['urgency'],
        arrivalTime: new Date().toISOString(),
        estimatedDuration: result?.patient?.estimatedDuration ?? classification?.estimatedDuration ?? 15,
        isReturning: false,
        hasComplexHistory: false,
        isMultiSymptom: false,
        isTeleconsultFollowUp: false,
        classification: result?.patient?.classification ?? classification,
        queueType: intake.queueType,
      }
      addPatient(patient)

      setEnqueued({ patientId: pid, urgency: urg })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enqueue patient')
    } finally {
      setEnqueuing(false)
    }
  }

  const classification: ClassificationResult | undefined = classifyResult?.classification

  return (
    <div className="space-y-6 relative">
      <div className="page-watermark">INTAKE</div>

      <div className="animate-fade-in-up">
        <p className="section-label flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Patient list</span>
        </p>
        <h1 className="section-heading text-3xl md:text-4xl">
          <span className="text-accent">Patient</span>{' '}
          <span className="text-stroke">Intake</span>
        </h1>
        <p className="text-xs text-muted-foreground font-light max-w-sm leading-relaxed mt-2">
          Complete the clinical assessment for automated triage and queue placement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Intake form */}
        <div className={`animate-slide-up-fade ${classifyResult ? 'lg:col-span-3' : 'lg:col-span-5'}`} style={{ animationDelay: '0.1s' }}>
          <IntakeFormComponent onClassified={handleClassified} />
        </div>

        {/* Results panel */}
        {classifyResult && classification && (
          <div className="lg:col-span-2 space-y-4">
            {/* Critical alert */}
            {classification.severity === 'critical' && (
              <div className="animate-slide-up-fade flex items-center gap-3 px-4 py-4 rounded-lg bg-severity-high/15 border-2 border-severity-high/40 animate-pulse" style={{ animationDelay: '0.15s' }}>
                <Phone className="h-6 w-6 text-severity-high shrink-0" />
                <div>
                  <p className="font-display text-xs font-bold tracking-wider uppercase text-severity-high">CRITICAL — IMMEDIATE ATTENTION</p>
                  <p className="text-[11px] text-severity-high/80 font-light mt-0.5">
                    Call emergency services immediately if patient is in immediate danger.
                  </p>
                </div>
              </div>
            )}

            {/* Severity card */}
            <div className="glass-card overflow-hidden animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
              <div className="p-5 border-b border-border/50">
                <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mb-1">[ 02 ] Classification</p>
                <h3 className="font-display text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Classification Result
                </h3>
                <p className="text-[11px] text-muted-foreground/60 font-light mt-1">
                  {typeof classifyResult.summary === 'string'
                    ? classifyResult.summary
                    : `${classification.severity?.toUpperCase() || ''} severity — ${classification.symptomPattern || 'assessed'} pattern`}
                </p>
              </div>
              <div className="p-5 space-y-4">
                {/* Severity badge */}
                <div className="flex items-center gap-3">
                  <div className={`glass-card overflow-hidden rounded-xl px-6 py-4 text-center ${SEVERITY_STYLES[classification.severity] || ''}`}>
                    <p className="counter-value text-2xl uppercase">{classification.severity || '—'}</p>
                    <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mt-1">Severity Level</p>
                  </div>
                  <div className="space-y-1">
                    <span className="tag-pill">
                      {classification.queueType || 'unknown'}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricBox
                    icon={<Zap className="h-3.5 w-3.5" />}
                    label="Multiplier"
                    value={`×${safeFmt(classification.clinicalMultiplier)}`}
                  />
                  <MetricBox
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Est. Duration"
                    value={`${classification.estimatedDuration ?? '—'}min`}
                  />
                  <MetricBox
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                    label="Final Score"
                    value={safeFmt(classification.finalScore)}
                  />
                  <MetricBox
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Starvation Threshold"
                    value={`${classification.starvationThreshold ?? '—'}min`}
                  />
                </div>

                {/* Symptom pattern */}
                {classification.symptomPattern && (
                  <div>
                    <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mb-1">Symptom Pattern</p>
                    <span className="tag-pill">
                      {classification.symptomPattern}
                    </span>
                  </div>
                )}

                {/* Escalation reasons */}
                {Array.isArray(classification.escalationReasons) && classification.escalationReasons.length > 0 && (
                  <div>
                    <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mb-2">Escalation Reasons</p>
                    <div className="space-y-1.5">
                      {classification.escalationReasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-severity-medium shrink-0 mt-0.5" />
                          <span className="text-muted-foreground font-light">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enqueue action */}
            <div className="glass-card overflow-hidden animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
              <div className="p-5 border-b border-border/50">
                <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground mb-1">[ 03 ] Queue Action</p>
                <h3 className="font-display text-xs font-bold tracking-wider uppercase">Enqueue Patient</h3>
              </div>
              <div className="p-5 space-y-4">
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    {error}
                  </div>
                )}

                {enqueued ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-severity-low text-sm">
                      <span className="live-dot" />
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-display text-xs font-bold tracking-wider uppercase">Patient added to queue</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Patient ID:</span> <span className="font-mono-space">{enqueued.patientId}</span></p>
                      <p><span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Urgency:</span> <Badge variant={enqueued.urgency as 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'}>{enqueued.urgency}</Badge></p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full glass-card"
                      onClick={() => navigate('/simulator')}
                    >
                      View in Simulator
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setClassifyResult(null)
                        setIntake(null)
                        setEnqueued(null)
                      }}
                    >
                      Start New Intake
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleEnqueue}
                    disabled={enqueuing}
                    className="w-full glow-btn"
                    size="lg"
                  >
                    {enqueuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {enqueuing ? 'Adding to Queue...' : 'Add to Queue'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricBox({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass-card overflow-hidden rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="font-mono-space text-[10px] tracking-[.14em] uppercase">{label}</span>
      </div>
      <p className="counter-value text-lg">{String(value)}</p>
    </div>
  )
}
