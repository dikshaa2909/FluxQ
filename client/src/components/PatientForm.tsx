import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Patient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Shuffle, RotateCcw, ClipboardList, ChevronDown, ChevronRight } from 'lucide-react'
import { shortPid } from '@/lib/utils'

const CONDITION_TYPES = ['General', 'Cardiology', 'Neurology', 'Endocrinology', 'Gastroenterology', 'Psychiatry', 'Dermatology', 'Orthopedics']

const QUEUE_TYPE_BADGE: Record<string, string> = {
  diabetes: 'bg-blue-500/20 text-blue-500',
  cholesterol: 'bg-orange-500/20 text-orange-500',
  bloodPressure: 'bg-red-500/20 text-red-500',
  general: 'bg-slate-400/20 text-slate-400',
}

const SAMPLE_PATIENTS: Patient[] = [
  
    {
      id: "P001",
      age: 68,
      gender: "M",
      chiefComplaint: "Chest Pain",
      conditionType: "Cardiology",
      arrivalTime: "2026-03-14T08:05:00.000Z",
      hasComplexHistory: true,
      isMultiSymptom: true,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "CRITICAL"
    },
    {
      id: "P002",
      age: 42,
      gender: "F",
      chiefComplaint: "Severe Migraine",
      conditionType: "Neurology",
      arrivalTime: "2026-03-14T08:08:00.000Z",
      hasComplexHistory: false,
      isMultiSymptom: true,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "HIGH"
    },
    {
      id: "P003",
      age: 55,
      gender: "M",
      chiefComplaint: "Acute Abdominal Pain",
      conditionType: "Gastroenterology",
      arrivalTime: "2026-03-14T08:12:00.000Z",
      hasComplexHistory: true,
      isMultiSymptom: true,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "CRITICAL"
    },
    {
      id: "P004",
      age: 30,
      gender: "F",
      chiefComplaint: "Sore Throat",
      conditionType: "General",
      arrivalTime: "2026-03-14T08:15:00.000Z",
      hasComplexHistory: false,
      isMultiSymptom: false,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "LOW"
    },
    {
      id: "P005",
      age: 75,
      gender: "F",
      chiefComplaint: "Dizziness and Fall",
      conditionType: "Neurology",
      arrivalTime: "2026-03-14T08:18:00.000Z",
      hasComplexHistory: true,
      isMultiSymptom: true,
      isReturning: true,
      isTeleconsultFollowUp: false,
      urgency: "HIGH"
    },
    {
      id: "P006",
      age: 25,
      gender: "M",
      chiefComplaint: "Prescription Refill",
      conditionType: "General",
      arrivalTime: "2026-03-14T08:22:00.000Z",
      hasComplexHistory: false,
      isMultiSymptom: false,
      isReturning: false,
      isTeleconsultFollowUp: true,
      urgency: "LOW"
    },
    {
      id: "P007",
      age: 50,
      gender: "M",
      chiefComplaint: "Anxiety and Insomnia",
      conditionType: "Psychiatry",
      arrivalTime: "2026-03-14T08:26:00.000Z",
      hasComplexHistory: false,
      isMultiSymptom: false,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "STANDARD"
    },
    {
      id: "P008",
      age: 60,
      gender: "F",
      chiefComplaint: "Shortness of Breath",
      conditionType: "Pulmonology",
      arrivalTime: "2026-03-14T08:30:00.000Z",
      hasComplexHistory: true,
      isMultiSymptom: true,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "CRITICAL"
    },
    {
      id: "P009",
      age: 35,
      gender: "F",
      chiefComplaint: "Knee Pain",
      conditionType: "Orthopedics",
      arrivalTime: "2026-03-14T08:34:00.000Z",
      hasComplexHistory: false,
      isMultiSymptom: false,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "STANDARD"
    },
    {
      id: "P010",
      age: 22,
      gender: "M",
      chiefComplaint: "Skin Rash",
      conditionType: "Dermatology",
      arrivalTime: "2026-03-14T08:38:00.000Z",
      hasComplexHistory: false,
      isMultiSymptom: false,
      isReturning: false,
      isTeleconsultFollowUp: false,
      urgency: "LOW"
    }
]

interface PatientFormProps {
  patients: Patient[]
  onPatientsChange: (patients: Patient[]) => void
}

export function PatientForm({ patients, onPatientsChange }: PatientFormProps) {
  const navigate = useNavigate()
  const [showManualForm, setShowManualForm] = useState(false)
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    urgency: 'STANDARD',
    estimatedDuration: 15,
    age: 30,
    gender: 'M',
    chiefComplaint: '',
    conditionType: 'General',
    isReturning: false,
    hasComplexHistory: false,
    isMultiSymptom: false,
    isTeleconsultFollowUp: false,
  })

  const addPatient = () => {
    const patient: Patient = {
      id: `P${String(patients.length + 1).padStart(3, '0')}`,
      age: newPatient.age || 30,
      gender: (newPatient.gender as Patient['gender']) || 'M',
      chiefComplaint: newPatient.chiefComplaint || 'General consultation',
      conditionType: newPatient.conditionType || 'General',
      urgency: (newPatient.urgency as Patient['urgency']) || 'STANDARD',
      arrivalTime: new Date().toISOString(),
      estimatedDuration: newPatient.estimatedDuration || 15,
      isReturning: newPatient.isReturning || false,
      hasComplexHistory: newPatient.hasComplexHistory || false,
      isMultiSymptom: newPatient.isMultiSymptom || false,
      isTeleconsultFollowUp: newPatient.isTeleconsultFollowUp || false,
      preferredDoctorId: newPatient.preferredDoctorId,
    }
    onPatientsChange([...patients, patient])
    setNewPatient({
      urgency: 'STANDARD',
      estimatedDuration: 15,
      age: 30,
      gender: 'M',
      chiefComplaint: '',
      conditionType: 'General',
      isReturning: false,
      hasComplexHistory: false,
      isMultiSymptom: false,
      isTeleconsultFollowUp: false,
    })
  }

  const removePatient = (id: string) => {
    onPatientsChange(patients.filter((p) => p.id !== id))
  }

  const loadSample = () => {
    const sampled: Patient[] = SAMPLE_PATIENTS.map((p) => ({
      ...p,
      arrivalTime: new Date(Date.now() - Math.random() * 60 * 60000).toISOString(),
    }))
    onPatientsChange(sampled)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Patient Queue</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSample}>
              <Shuffle className="h-3.5 w-3.5" />
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPatientsChange([])}>
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clinical Intake CTA */}
        <button
          onClick={() => navigate('/intake')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-left"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">Clinical Intake Assessment</p>
            <p className="text-xs text-muted-foreground">Symptom-driven triage with automated classification</p>
          </div>
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>

        {/* Manual form toggle */}
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
        >
          {showManualForm ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Quick Add (Manual)
        </button>

        {/* Add patient form */}
        {showManualForm && (
        <div className="space-y-3 border border-border/50 rounded-lg p-3">
          <div className="flex gap-2 items-end">
            <div className="w-20">
              <label className="text-xs text-muted-foreground mb-1 block">Age</label>
              <Input
                type="number"
                min={1}
                max={120}
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
              />
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
              <Select
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as Patient['gender'] })}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Chief Complaint</label>
              <Input
                type="text"
                placeholder="e.g. chest pain"
                value={newPatient.chiefComplaint}
                onChange={(e) => setNewPatient({ ...newPatient, chiefComplaint: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Condition Type</label>
              <Select
                value={newPatient.conditionType}
                onChange={(e) => setNewPatient({ ...newPatient, conditionType: e.target.value })}
              >
                {CONDITION_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Urgency</label>
              <Select
                value={newPatient.urgency}
                onChange={(e) => setNewPatient({ ...newPatient, urgency: e.target.value as Patient['urgency'] })}
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="STANDARD">Standard</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
              <Input
                type="number"
                min={5}
                max={60}
                value={newPatient.estimatedDuration}
                onChange={(e) => setNewPatient({ ...newPatient, estimatedDuration: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap items-center text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newPatient.isReturning || false} onChange={(e) => setNewPatient({ ...newPatient, isReturning: e.target.checked })} className="accent-primary" />
              Returning
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newPatient.hasComplexHistory || false} onChange={(e) => setNewPatient({ ...newPatient, hasComplexHistory: e.target.checked })} className="accent-primary" />
              Complex History
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newPatient.isMultiSymptom || false} onChange={(e) => setNewPatient({ ...newPatient, isMultiSymptom: e.target.checked })} className="accent-primary" />
              Multi-Symptom
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newPatient.isTeleconsultFollowUp || false} onChange={(e) => setNewPatient({ ...newPatient, isTeleconsultFollowUp: e.target.checked })} className="accent-primary" />
              Teleconsult Follow-Up
            </label>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Preferred Doctor (optional)</label>
              <Select
                value={newPatient.preferredDoctorId || ''}
                onChange={(e) => setNewPatient({ ...newPatient, preferredDoctorId: e.target.value || undefined })}
              >
                <option value="">None</option>
                <option value="D001">D001 — Dr. Ananya Shah</option>
                <option value="D002">D002 — Dr. Rohan Iyer</option>
                <option value="D003">D003 — Dr. Priya Mehta</option>
                <option value="D004">D004 — Dr. Arjun Patel</option>
              </Select>
            </div>
            <Button onClick={addPatient} size="default">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
        )}

        {/* Patient list — grouped by queue type */}
        {patients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No patients in queue. Add patients or load sample data.
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {(['diabetes', 'cholesterol', 'bloodPressure', 'general'] as const).map(qt => {
              const grouped = patients.filter(p => (p.queueType || 'general') === qt)
              if (grouped.length === 0) return null
              return (
                <div key={qt}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className={`text-[10px] ${QUEUE_TYPE_BADGE[qt] || ''}`}>{qt}</Badge>
                    <span className="text-[10px] text-muted-foreground">{grouped.length} patient{grouped.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5">
                    {grouped.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/50 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium" title={p.id}>{shortPid(p.id)}</span>
                          <Badge variant={p.urgency}>{p.urgency}</Badge>
                          {p.classification?.severity === 'critical' && (
                            <span className="text-severity-high text-[10px] font-bold">CRITICAL</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {p.classification && (
                            <span className="text-[10px] font-mono text-muted-foreground">×{p.classification.clinicalMultiplier.toFixed(1)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{p.estimatedDuration ?? '—'}min</span>
                          <button
                            onClick={() => removePatient(p.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Patients without a queueType (manual adds without classification) */}
            {(() => {
              const ungrouped = patients.filter(p => !p.queueType || !['diabetes', 'cholesterol', 'bloodPressure', 'general'].includes(p.queueType))
              if (ungrouped.length === 0) return null
              return (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className="bg-muted text-muted-foreground text-[10px]">unclassified</Badge>
                    <span className="text-[10px] text-muted-foreground">{ungrouped.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {ungrouped.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/50 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium" title={p.id}>{shortPid(p.id)}</span>
                          <Badge variant={p.urgency}>{p.urgency}</Badge>
                          <span className="text-xs text-muted-foreground">{p.conditionType}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{p.estimatedDuration ?? '—'}min</span>
                          <button
                            onClick={() => removePatient(p.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t border-border flex flex-wrap gap-3">
          <span>{patients.length} patient{patients.length !== 1 ? 's' : ''} total</span>
          {(['diabetes', 'cholesterol', 'bloodPressure', 'general'] as const).map(qt => {
            const count = patients.filter(p => (p.queueType || 'general') === qt).length
            if (count === 0) return null
            return <span key={qt} className="text-[10px]">• {qt}: {count}</span>
          })}
        </div>
      </CardContent>
    </Card>
  )
}