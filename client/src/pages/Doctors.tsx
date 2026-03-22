import { useState, useCallback } from 'react'
import { useLiveSimulation } from '@/lib/useLiveSimulation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
  Stethoscope,
  Play,
  Square,
  User,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react'

export function DoctorsPage() {
  const sim = useLiveSimulation()
  const [doctorCount, setDoctorCount] = useState(2)

  const handleStart = useCallback(() => {
    sim.start(doctorCount)
  }, [sim, doctorCount])

  return (
    <div className="relative space-y-6">
      <div className="page-watermark">DOC</div>

      {/* Header with live indicator */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="section-label flex items-center gap-2 mb-3">
            <span className="live-dot" />
            Live Simulation
          </p>
          <h1 className="section-heading text-3xl md:text-4xl">
            <span className="text-accent">Doctor</span>{' '}
            <span className="text-stroke">Assignment</span>
          </h1>
          <p className="text-xs text-muted-foreground font-light max-w-sm leading-relaxed mt-2">
            {sim.isRunning
              ? `${sim.doctors.length} physicians on duty`
              : 'Start a live simulation to see doctor assignments'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!sim.isRunning ? (
            <>
              <Select
                value={String(doctorCount)}
                onChange={(e) => setDoctorCount(Number(e.target.value))}
                className="w-32"
              >
                <option value="1">1 Doctor</option>
                <option value="2">2 Doctors</option>
                <option value="3">3 Doctors</option>
                <option value="4">4 Doctors</option>
              </Select>
              <Button onClick={handleStart} size="lg" className="font-display tracking-wider uppercase text-xs">
                <Play className="h-4 w-4" />
                Start Live
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="live-dot" />
                <span className="text-severity-high font-display tracking-wider uppercase text-xs font-medium">LIVE</span>
              </div>
              <Button variant="destructive" onClick={sim.stop} className="font-display tracking-wider uppercase text-xs">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* System status bar */}
      {sim.isRunning && (
        <div className="glass-card animate-slide-up-fade flex items-center gap-4 px-5 py-3 text-sm" style={{ animationDelay: '0.1s' }}>
          <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Queue:</span>
          <span className="font-mono font-bold">{sim.waitingQueue.length}</span>
          <span className="text-border">|</span>
          <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Tick:</span>
          <span className="font-mono">{sim.clock}</span>
          <span className="text-border">|</span>
          <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Processed:</span>
          <span className="font-mono">{sim.totalProcessed}</span>
          <span className="text-border">|</span>
          {sim.waitingQueue.filter(p => p.urgency === 'CRITICAL').length > 0 && (
            <Badge variant="CRITICAL">
              {sim.waitingQueue.filter(p => p.urgency === 'CRITICAL').length} critical waiting
            </Badge>
          )}
        </div>
      )}

      {/* Doctor cards */}
      {sim.isRunning && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sim.doctors.map((doc, idx) => (
            <div key={doc.id} className="glass-card hover-lift relative overflow-hidden animate-slide-up-fade" style={{ animationDelay: `${0.15 + idx * 0.1}s` }}>
              {/* Burnout glow */}
              {doc.burnout > 300 && (
                <div className="absolute inset-0 border-2 border-severity-high/30 rounded-lg pointer-events-none" />
              )}

              <div className="p-5 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm tracking-wide">{doc.name}</h3>
                      <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">{doc.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.currentPatient && <span className="live-dot" />}
                    <Badge variant={doc.burnout > 300 ? 'CRITICAL' : doc.burnout > 150 ? 'HIGH' : 'LOW'}>
                      {doc.burnout > 300 ? 'HIGH' : doc.burnout > 150 ? 'MODERATE' : 'NORMAL'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Current patient */}
                {doc.currentPatient ? (
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="font-display text-xs tracking-wider uppercase">Consulting</span>
                    </div>
                    <p className="font-display text-sm tracking-wide">
                      {doc.currentPatient._name || doc.currentPatient.patientId}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 font-light mt-1">
                      {doc.currentPatient._symptom || `${doc.currentPatient.urgency} priority`}
                    </p>
                    {doc.currentPatient.assignedDoctor && (
                      <p className="text-xs text-primary mt-0.5">
                        <span className="tag-pill">{doc.currentPatient.assignedDoctor}</span>
                      </p>
                    )}
                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="progress-enhanced flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, doc.consultProgress)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {Math.round(doc.consultProgress)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-3 text-center text-sm text-muted-foreground border border-dashed border-border/50">
                    <Clock className="h-4 w-4 mx-auto mb-1 opacity-50" />
                    <span className="font-light text-xs">Waiting for next patient</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Utilization</p>
                    <p className="text-lg font-bold font-display">{Math.round(doc.utilization)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Assigned</p>
                    <p className="text-lg font-bold font-display">{doc.assignedPatients.length}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Completed</p>
                    <p className="text-lg font-bold font-display">{doc.completedCount}</p>
                  </div>
                </div>

                {/* Utilization bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Utilization</span>
                    <span className="font-mono">{Math.round(doc.utilization)}%</span>
                  </div>
                  <div className="progress-enhanced h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        doc.utilization > 80 ? 'bg-severity-high' : doc.utilization > 50 ? 'bg-severity-medium' : 'bg-severity-low'
                      }`}
                      style={{ width: `${doc.utilization}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground">Burnout</span>
                    <span className="font-mono">{Math.round(doc.burnout)}</span>
                  </div>
                  <div className="progress-enhanced h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        doc.burnout > 300 ? 'bg-severity-high' : doc.burnout > 150 ? 'bg-severity-medium' : 'bg-severity-low'
                      }`}
                      style={{ width: `${Math.min(100, (doc.burnout / 500) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Auto-redistribution warning */}
                {doc.burnout > 300 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-severity-high/10 border border-severity-high/20 text-xs text-severity-high">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-display tracking-wider uppercase">Auto-redistribution active</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waiting queue */}
      {sim.isRunning && sim.waitingQueue.length > 0 && (
        <div className="glass-card overflow-hidden animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground/60">[ 01 ]</span>
              <Activity className="h-4 w-4 text-accent" />
              <h3 className="font-display text-xs font-bold tracking-wider uppercase">Waiting Queue</h3>
              <Badge variant="outline">{sim.waitingQueue.length} patients</Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {sim.waitingQueue.map((p, i) => (
                <div key={p.patientId + i} className="queue-row flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground w-5">#{i + 1}</span>
                    <span className="font-display text-sm tracking-wide">{(p as any)._name || p.patientId}</span>
                    <Badge variant={p.urgency as 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'}>{p.urgency}</Badge>
                  </div>
                  <span className="font-mono-space text-[10px] tracking-[.14em] text-muted-foreground">wait: {p.estimatedWaitTime.toFixed(1)}min</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live logs */}
      {sim.isRunning && (
        <div className="glass-card overflow-hidden animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-muted-foreground/60">[ 02 ]</span>
              <CheckCircle className="h-4 w-4 text-accent" />
              <h3 className="font-display text-xs font-bold tracking-wider uppercase">Activity Log</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1 max-h-[200px] overflow-y-auto font-mono text-xs">
              {sim.logs.map((log, i) => (
                <div key={i} className="text-muted-foreground py-0.5">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!sim.isRunning && (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-muted-foreground text-sm animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
          <Stethoscope className="h-8 w-8 mb-3 opacity-30" />
          <p className="font-display tracking-wide text-sm">Select number of doctors and start the live simulation</p>
          <p className="text-xs text-muted-foreground/60 font-light mt-1">Patients will be automatically generated and assigned</p>
        </div>
      )}
    </div>
  )
}
