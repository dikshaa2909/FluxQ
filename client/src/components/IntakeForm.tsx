import { useState, useCallback } from 'react'
import { api } from '@/api/client'
import type {
  IntakeForm as IntakeFormType,
  QueueType,
  ComfortLevel,
  OnsetType,
  EmergencySignals,
  DiabetesSymptoms,
  CholesterolSymptoms,
  BloodPressureSymptoms,
  GeneralSymptoms,
  ClassifyResponse,
} from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Droplets,
  Heart,
  Activity,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Loader2,
  Phone,
} from 'lucide-react'

const QUEUE_OPTIONS: { type: QueueType; label: string; desc: string; icon: typeof Droplets; color: string }[] = [
  { type: 'diabetes', label: 'Diabetes / Blood Sugar', desc: 'Blood glucose concerns, insulin issues, hypo/hyper symptoms', icon: Droplets, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { type: 'cholesterol', label: 'Cholesterol / Heart Risk', desc: 'Lipid levels, cardiovascular risk factors', icon: Heart, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
  { type: 'bloodPressure', label: 'Blood Pressure', desc: 'High/low blood pressure, hypertension symptoms', icon: Activity, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
  { type: 'general', label: 'General', desc: 'General health concerns, multiple symptoms, other conditions', icon: Stethoscope, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
]

const COMFORT_OPTIONS: { value: ComfortLevel; label: string }[] = [
  { value: 0, label: 'Fine — came for a routine check' },
  { value: 1, label: 'Uncomfortable but managing' },
  { value: 2, label: 'Quite unwell, hard to ignore' },
  { value: 3, label: 'Very unwell, struggling to function' },
  { value: 4, label: 'Extremely unwell or frightened' },
]

const ONSET_OPTIONS: { value: OnsetType; label: string }[] = [
  { value: 'acute', label: 'Just started — less than 1 hour' },
  { value: 'today', label: 'Started today' },
  { value: 'days', label: 'Few days' },
  { value: 'chronic', label: 'Weeks or longer' },
]

const EMERGENCY_SIGNAL_LABELS: { key: keyof EmergencySignals; label: string }[] = [
  { key: 'chestPain', label: 'Chest pain or heaviness' },
  { key: 'breathingDifficulty', label: 'Difficulty breathing at rest' },
  { key: 'severeHeadache', label: 'Sudden, severe, "worst ever" headache' },
  { key: 'confusion', label: 'Confusion — can\'t think or speak clearly' },
  { key: 'visionLoss', label: 'Blurred or lost vision (sudden)' },
  { key: 'limbWeakness', label: 'Weakness or numbness in face, arm, or leg (one side)' },
  { key: 'fainting', label: 'Feeling like you might faint or pass out' },
]

const DEFAULT_EMERGENCY: EmergencySignals = {
  chestPain: false, breathingDifficulty: false, severeHeadache: false,
  confusion: false, visionLoss: false, limbWeakness: false, fainting: false,
}

const DEFAULT_DIABETES: DiabetesSymptoms = {
  shaking: false, suddenSweating: false, heartPounding: false, suddenHunger: false,
  paleSkin: false, mentalFog: false, tinglingLips: false, suddenAnxiety: false,
  extremeThirst: false, frequentUrination: false, blurredVision: false, fruityBreath: false,
  nausea: false, deepFastBreathing: false, extremeTiredness: false, stomachPain: false,
  slowWoundHealing: false, onInsulin: false, hasKidneyDisease: false, isPregnant: false,
  recentHypoEpisode: false, missedInsulinDose: false, routineCheck: false,
}

const DEFAULT_CHOLESTEROL: CholesterolSymptoms = {
  followUpBloodTest: false, doctorReferred: false, chestTightness: false,
  breathlessOnStairs: false, unusualFatigue: false, familyHeartAttack: false,
  priorCardiacEvent: false, medicationReview: false, statinSideEffect: false,
  generalAssessment: false, hasDiabetes: false, hasHighBP: false,
  smokerOrExSmoker: false, significantlyOverweight: false, ageRisk: false,
  familyEarlyHeartAttack: false, hasKidneyDisease: false, familialHypercholesterolaemia: false,
  priorClotStrokeTIA: false, inflammatoryCondition: false,
}

const DEFAULT_BP: BloodPressureSymptoms = {
  severeHeadache: false, blurredVision: false, nauseaWithHeadache: false,
  chestPain: false, shortnessOfBreathRest: false, heartbeatInEars: false,
  unstoppableNosebleed: false, swollenAnkles: false, mildHeadache: false,
  flushed: false, dizziness: false, palpitations: false, noSymptoms: false,
  diagnosedHighBP: false, measuredVeryHighToday: false, missedBPMedication: false,
  hasDiabetes: false, hasKidneyDisease: false, priorStrokeTIA: false,
  hasHeartFailure: false, isPregnant: false, recentMedicationChange: false,
}

const DEFAULT_GENERAL: GeneralSymptoms = {
  primaryComplaint: 'other',
  highFever: false, worseningRapidly: false, bladderBowelLoss: false,
  rashWithSwelling: false, selfHarmThoughts: false, vomitingOver5Times: false,
  nothingStaysDown: false, worstPainEver: false, gotSeriousBefore: false,
  confusedNotSelf: false, impactLevel: 0,
  isOver65: false, immunocompromised: false, isPregnant: false, caringForChild: false,
}

interface IntakeFormProps {
  onClassified: (result: ClassifyResponse, intake: IntakeFormType) => void
}

// Checkbox row component
function CheckRow({ checked, onChange, label, danger }: { checked: boolean; onChange: (v: boolean) => void; label: string; danger?: boolean }) {
  return (
    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
      checked
        ? danger ? 'border-severity-high/50 bg-severity-high/10 text-severity-high' : 'border-primary/50 bg-primary/10'
        : 'border-border/50 bg-muted/20 hover:bg-muted/40'
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className={`h-4 w-4 ${danger ? 'accent-red-500' : 'accent-primary'}`} />
      <span className="text-sm">{label}</span>
    </label>
  )
}

// Radio option row component
function RadioRow({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer ${
      selected ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/20 hover:bg-muted/40'
    }`}>
      <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary' : 'border-muted-foreground'}`}>
        {selected && <span className="h-2 w-2 rounded-full bg-primary block" />}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

export function IntakeFormComponent({ onClassified }: IntakeFormProps) {
  const [step, setStep] = useState(0)
  const [queueType, setQueueType] = useState<QueueType | null>(null)
  const [comfort, setComfort] = useState<ComfortLevel>(0)
  const [onset, setOnset] = useState<OnsetType>('today')
  const [emergency, setEmergency] = useState<EmergencySignals>({ ...DEFAULT_EMERGENCY })
  const [age, setAge] = useState<number>(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Queue-specific symptom states
  const [diabetes, setDiabetes] = useState<DiabetesSymptoms>({ ...DEFAULT_DIABETES })
  const [cholesterol, setCholesterol] = useState<CholesterolSymptoms>({ ...DEFAULT_CHOLESTEROL })
  const [bp, setBp] = useState<BloodPressureSymptoms>({ ...DEFAULT_BP })
  const [general, setGeneral] = useState<GeneralSymptoms>({ ...DEFAULT_GENERAL })

  const hasEmergency = Object.values(emergency).some(Boolean)
  const canAdvance = step === 0 ? !!queueType : true

  const setD = (k: keyof DiabetesSymptoms, v: unknown) => setDiabetes(prev => ({ ...prev, [k]: v }))
  const setC = (k: keyof CholesterolSymptoms, v: unknown) => setCholesterol(prev => ({ ...prev, [k]: v }))
  const setB = (k: keyof BloodPressureSymptoms, v: unknown) => setBp(prev => ({ ...prev, [k]: v }))
  const setG = (k: keyof GeneralSymptoms, v: unknown) => setGeneral(prev => ({ ...prev, [k]: v }))

  const handleSubmit = useCallback(async () => {
    if (!queueType) return
    setLoading(true)
    setError(null)

    const intake: IntakeFormType = { queueType, comfort, onset, emergencySignals: emergency }

    if (queueType === 'diabetes') intake.diabetesSymptoms = diabetes
    else if (queueType === 'cholesterol') intake.cholesterolSymptoms = cholesterol
    else if (queueType === 'bloodPressure') intake.bloodPressureSymptoms = bp
    else if (queueType === 'general') intake.generalSymptoms = general

    try {
      const result = await api.classifyIntake(intake, age)
      onClassified(result, intake)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [queueType, comfort, onset, emergency, diabetes, cholesterol, bp, general, age, onClassified])

  // --- Queue-specific symptom renderers ---

  const renderDiabetes = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Group 1 — Low Blood Sugar Symptoms</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['shaking', 'Shaking or trembling'],
            ['suddenSweating', 'Sudden sweating (not from heat/exercise)'],
            ['heartPounding', 'Heart pounding or racing'],
            ['suddenHunger', 'Sudden intense hunger'],
            ['paleSkin', 'Pale or clammy skin'],
            ['mentalFog', 'Mental fog — hard to concentrate or speak'],
            ['tinglingLips', 'Tingling around lips or fingertips'],
            ['suddenAnxiety', 'Feeling very anxious or irritable suddenly'],
          ] as [keyof DiabetesSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={diabetes[k] as boolean} onChange={v => setD(k, v)} label={label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">Group 2 — High Blood Sugar Symptoms</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['extremeThirst', "Extremely thirsty — can't drink enough water"],
            ['frequentUrination', 'Urinating much more than usual'],
            ['blurredVision', 'Blurred vision (new or suddenly worse)'],
            ['fruityBreath', 'Fruity or strange smell on breath'],
            ['nausea', 'Nausea or vomiting'],
            ['deepFastBreathing', 'Deep, fast breathing or feeling breathless'],
            ['extremeTiredness', 'Extreme tiredness — heavy, hard to move'],
            ['stomachPain', 'Stomach pain (new or severe)'],
            ['slowWoundHealing', 'Wounds or cuts healing very slowly'],
          ] as [keyof DiabetesSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={diabetes[k] as boolean} onChange={v => setD(k, v)} label={label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Group 3 — Context</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['onInsulin', 'I am on insulin'],
            ['hasKidneyDisease', 'I have kidney disease'],
            ['isPregnant', 'I am pregnant'],
            ['recentHypoEpisode', 'I had a low blood sugar episode in the last 24 hours'],
            ['missedInsulinDose', 'I ran out of insulin or missed a dose'],
            ['routineCheck', 'None of the above — routine check / HbA1c review'],
          ] as [keyof DiabetesSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={diabetes[k] as boolean} onChange={v => setD(k, v)} label={label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Optional Readings (skip if unknown)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Blood sugar (mg/dL or mmol/L)</label>
            <Input type="number" min={0} value={diabetes.bloodGlucose ?? ''} onChange={e => setD('bloodGlucose', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 120" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Recent HbA1c (%)</label>
            <Input type="number" min={0} max={20} step={0.1} value={diabetes.hba1c ?? ''} onChange={e => setD('hba1c', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 7.2" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderCholesterol = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">Reason for Visit</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['followUpBloodTest', 'Follow-up on a recent blood test'],
            ['doctorReferred', 'Doctor referred me for cholesterol check'],
            ['chestTightness', 'I have chest tightness or pressure during activity'],
            ['breathlessOnStairs', 'I get unusually breathless going up stairs or walking'],
            ['unusualFatigue', 'I feel exhausted doing things that used to be easy'],
            ['familyHeartAttack', 'I am worried — family member had a heart attack'],
            ['priorCardiacEvent', 'I had a heart attack, stroke, or blocked artery before'],
            ['medicationReview', 'I want to start or review cholesterol medication'],
            ['statinSideEffect', "I'm having muscle pain or weakness (possible statin side effect)"],
            ['generalAssessment', 'General heart risk assessment'],
          ] as [keyof CholesterolSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={cholesterol[k] as boolean} onChange={v => setC(k, v)} label={label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Risk Factors</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['hasDiabetes', 'I have diabetes'],
            ['hasHighBP', 'I have high blood pressure'],
            ['smokerOrExSmoker', 'I smoke or used to smoke'],
            ['significantlyOverweight', 'I am significantly overweight'],
            ['ageRisk', 'I am a man over 55, or a woman over 65'],
            ['familyEarlyHeartAttack', 'A close family member had a heart attack before age 60'],
            ['hasKidneyDisease', 'I have kidney disease'],
            ['familialHypercholesterolaemia', 'I have been told I have a very high cholesterol (familial or genetic)'],
            ['priorClotStrokeTIA', 'I have had a blood clot, stroke, or TIA (mini-stroke)'],
            ['inflammatoryCondition', 'I have an inflammatory condition (RA, lupus, psoriasis)'],
          ] as [keyof CholesterolSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={cholesterol[k] as boolean} onChange={v => setC(k, v)} label={label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Optional Readings (skip if unknown)</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['ldl', 'LDL cholesterol (mg/dL)'],
            ['totalCholesterol', 'Total cholesterol (mg/dL)'],
            ['hdl', 'HDL cholesterol (mg/dL)'],
            ['triglycerides', 'Triglycerides (mg/dL)'],
          ] as [keyof CholesterolSymptoms, string][]).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <Input type="number" min={0} value={(cholesterol[k] as number | undefined) ?? ''} onChange={e => setC(k, e.target.value ? Number(e.target.value) : undefined)} placeholder="optional" />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground mb-1 block">Biological sex (for HDL thresholds)</label>
          <div className="flex gap-2">
            {(['M', 'F', 'Other'] as const).map(g => (
              <button key={g} type="button" onClick={() => setC('patientGender', g)} className={`px-4 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${cholesterol.patientGender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>{g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderBloodPressure = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">Symptoms Right Now</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['severeHeadache', "Severe pounding headache — worst I've had"],
            ['blurredVision', 'Blurred vision or sudden change in vision'],
            ['nauseaWithHeadache', 'Nausea or vomiting alongside headache'],
            ['chestPain', 'Chest pain or pressure'],
            ['shortnessOfBreathRest', 'Shortness of breath even at rest'],
            ['heartbeatInEars', 'Feeling my heartbeat in my ears or neck'],
            ['unstoppableNosebleed', "Nosebleed that won't stop"],
            ['swollenAnkles', 'Swollen ankles or legs (new or suddenly worse)'],
            ['mildHeadache', 'Mild dull headache — pressure feeling'],
            ['flushed', 'Feeling flushed or hot in the face'],
            ['dizziness', 'Dizziness or lightheadedness'],
            ['palpitations', 'Palpitations — irregular or fast heartbeat'],
            ['noSymptoms', 'None of the above — routine / medication check'],
          ] as [keyof BloodPressureSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={bp[k] as boolean} onChange={v => setB(k, v)} label={label} danger={['severeHeadache', 'chestPain', 'shortnessOfBreathRest'].includes(k)} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Context</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['diagnosedHighBP', 'I know I have high blood pressure (diagnosed)'],
            ['measuredVeryHighToday', 'I measured my BP today and it was very high'],
            ['missedBPMedication', "I've been unable to take my BP medication (missed doses)"],
            ['hasDiabetes', 'I have diabetes'],
            ['hasKidneyDisease', 'I have kidney disease'],
            ['priorStrokeTIA', 'I have had a stroke or TIA (mini-stroke) before'],
            ['hasHeartFailure', 'I have heart failure'],
            ['isPregnant', 'I am pregnant or gave birth in the last 6 weeks'],
            ['recentMedicationChange', 'My doctor increased / changed my BP medication recently'],
          ] as [keyof BloodPressureSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={bp[k] as boolean} onChange={v => setB(k, v)} label={label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Optional BP Reading</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Systolic (top number, mmHg)</label>
            <Input type="number" min={0} value={bp.systolic ?? ''} onChange={e => setB('systolic', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 140" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Diastolic (bottom number, mmHg)</label>
            <Input type="number" min={0} value={bp.diastolic ?? ''} onChange={e => setB('diastolic', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 90" />
          </div>
        </div>
      </div>
    </div>
  )

  const GENERAL_COMPLAINTS: { value: GeneralSymptoms['primaryComplaint']; label: string }[] = [
    { value: 'fever', label: 'Fever / flu / infection' },
    { value: 'cough', label: 'Cough, cold, or sore throat' },
    { value: 'stomach', label: 'Stomach or digestive problem' },
    { value: 'pain', label: 'Pain — back, joint, muscle, or headache' },
    { value: 'skin', label: 'Skin problem — rash, wound, or bite' },
    { value: 'mentalHealth', label: 'Feeling very low, anxious, or overwhelmed' },
    { value: 'urinary', label: 'Urinary / kidney symptoms' },
    { value: 'eyeEarDental', label: 'Eye, ear, or dental problem' },
    { value: 'prescription', label: 'Prescription refill or medication review' },
    { value: 'other', label: 'Something else' },
  ]

  const IMPACT_OPTIONS: { value: 0 | 1 | 2 | 3; label: string }[] = [
    { value: 0, label: 'Not much — I can function normally' },
    { value: 1, label: 'Somewhat — some discomfort but managing' },
    { value: 2, label: 'Significantly — hard to do normal things' },
    { value: 3, label: 'Completely — I cannot get up or function' },
  ]

  const renderGeneral = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What is your main concern today?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GENERAL_COMPLAINTS.map(opt => (
            <RadioRow key={opt.value} selected={general.primaryComplaint === opt.value} onClick={() => setG('primaryComplaint', opt.value)} label={opt.label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Which of these describe your situation? (check all that apply)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['highFever', 'I have a high temperature / fever (> 38.5°C / 101°F)'],
            ['worseningRapidly', 'My symptoms have been getting worse quickly (hours, not days)'],
            ['bladderBowelLoss', 'I have lost control of bladder or bowel (new — not normal for me)'],
            ['rashWithSwelling', 'I have a rash AND swelling in my face, lips, or throat'],
            ['selfHarmThoughts', 'I have thought about harming myself'],
            ['vomitingOver5Times', 'I vomited or had diarrhoea more than 5 times today'],
            ['nothingStaysDown', 'I cannot eat or drink anything — everything comes back up'],
            ['worstPainEver', 'The pain is severe — worst I have felt'],
            ['gotSeriousBefore', 'I had this before and it became very serious / needed hospital'],
            ['confusedNotSelf', 'I feel confused or not quite myself'],
          ] as [keyof GeneralSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={general[k] as boolean} onChange={v => setG(k, v)} label={label} danger={k === 'selfHarmThoughts' || k === 'rashWithSwelling' || k === 'bladderBowelLoss'} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">How much is this affecting your day?</p>
        <div className="space-y-2">
          {IMPACT_OPTIONS.map(opt => (
            <RadioRow key={opt.value} selected={general.impactLevel === opt.value} onClick={() => setG('impactLevel', opt.value)} label={opt.label} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Additional Context</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ['isOver65', 'I am over 65 years old'],
            ['immunocompromised', 'I have a weakened immune system (chemo, HIV, steroids)'],
            ['isPregnant', 'I am pregnant or recently gave birth'],
            ['caringForChild', 'I am caring for a young child with these symptoms'],
          ] as [keyof GeneralSymptoms, string][]).map(([k, label]) => (
            <CheckRow key={k} checked={general[k] as boolean} onChange={v => setG(k, v)} label={label} />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clinical Intake Assessment</CardTitle>
        <CardDescription>
          Step {step + 1} of 4 — {['Select Queue', 'General Assessment', 'Specific Symptoms', 'Review & Submit'][step]}
        </CardDescription>
        <div className="flex gap-1 mt-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 0: Queue selection */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your age</label>
              <Input type="number" min={0} max={120} value={age} onChange={e => setAge(Number(e.target.value))} className="w-32" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Which category best describes your visit?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUEUE_OPTIONS.map(opt => (
                  <button key={opt.type} type="button" onClick={() => setQueueType(opt.type)}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all cursor-pointer ${queueType === opt.type ? `${opt.color} border-2` : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${queueType === opt.type ? opt.color : 'bg-muted text-muted-foreground'}`}>
                      <opt.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Universal questions */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">How are you feeling RIGHT NOW overall?</label>
              <div className="space-y-2">
                {COMFORT_OPTIONS.map(opt => (
                  <RadioRow key={opt.value} selected={comfort === opt.value} onClick={() => setComfort(opt.value)} label={opt.label} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">How long has this been happening?</label>
              <div className="grid grid-cols-2 gap-2">
                {ONSET_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setOnset(opt.value)}
                    className={`px-4 py-3 rounded-lg border text-sm text-left transition-colors cursor-pointer ${onset === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-severity-high" />
                Are you experiencing ANY of these right now? (Emergency signals)
              </label>
              <div className="space-y-2">
                {EMERGENCY_SIGNAL_LABELS.map(({ key, label }) => (
                  <label key={key} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                    emergency[key] ? 'border-severity-high/50 bg-severity-high/10 text-severity-high' : 'border-border/50 bg-muted/20 hover:bg-muted/40'
                  }`}>
                    <input type="checkbox" checked={emergency[key]} onChange={e => setEmergency({ ...emergency, [key]: e.target.checked })} className="accent-red-500 h-4 w-4" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              {hasEmergency && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-severity-high/10 border border-severity-high/30 animate-pulse">
                  <Phone className="h-5 w-5 text-severity-high shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-severity-high">If this is a medical emergency, call emergency services immediately</p>
                    <p className="text-xs text-severity-high/80 mt-0.5">Continue this form only if you can safely wait for a telemedicine consultation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Queue-specific symptoms */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please answer these questions specific to your {QUEUE_OPTIONS.find(q => q.type === queueType)?.label} concern.
            </p>
            {queueType === 'diabetes' && renderDiabetes()}
            {queueType === 'cholesterol' && renderCholesterol()}
            {queueType === 'bloodPressure' && renderBloodPressure()}
            {queueType === 'general' && renderGeneral()}
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="bg-muted/20">
              <CardContent className="p-4 space-y-2">
                <h4 className="text-sm font-medium">Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Queue:</span> <span className="font-medium capitalize">{queueType}</span></div>
                  <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{age}</span></div>
                  <div><span className="text-muted-foreground">Comfort:</span> <span className="font-medium">{COMFORT_OPTIONS[comfort]?.label}</span></div>
                  <div><span className="text-muted-foreground">Onset:</span> <span className="font-medium capitalize">{onset}</span></div>
                  {hasEmergency && (
                    <div className="col-span-2 text-severity-high font-medium">Emergency signals reported</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              {loading ? 'Classifying...' : 'Submit & Classify'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
