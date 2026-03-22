// TeleMedQ — Data Types for Queue Optimization System

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW';

// ============================================================
// CLINICAL INTAKE TYPES
// ============================================================

export type QueueType = 'diabetes' | 'cholesterol' | 'bloodPressure' | 'general';
export type ComfortLevel = 0 | 1 | 2 | 3 | 4;
export type OnsetType = 'acute' | 'today' | 'days' | 'chronic';
export type SeverityLevel = 'low' | 'standard' | 'high' | 'critical';

// Q4 — Universal emergency signals
export interface EmergencySignals {
  chestPain: boolean;
  breathingDifficulty: boolean;
  severeHeadache: boolean;
  confusion: boolean;
  visionLoss: boolean;
  limbWeakness: boolean;
  fainting: boolean;
}

// Section C — Optional medical context
export interface MedicalContext {
  hasDiabetes?: boolean;
  hasHeartDisease?: boolean;
  hasKidneyDisease?: boolean;
  hasHighBP?: boolean;
  hasHighCholesterol?: boolean;
  onMedication?: boolean;
  isPregnant?: boolean;
}

// Diabetes-specific symptoms (Section B)
export interface DiabetesSymptoms {
  // Group 1 — Hypo
  shaking: boolean;
  suddenSweating: boolean;
  heartPounding: boolean;
  suddenHunger: boolean;
  paleSkin: boolean;
  mentalFog: boolean;
  tinglingLips: boolean;
  suddenAnxiety: boolean;
  // Group 2 — Hyper
  extremeThirst: boolean;
  frequentUrination: boolean;
  blurredVision: boolean;
  fruityBreath: boolean;
  nausea: boolean;
  deepFastBreathing: boolean;
  extremeTiredness: boolean;
  stomachPain: boolean;
  slowWoundHealing: boolean;
  // Group 3 — Context
  onInsulin: boolean;
  hasKidneyDisease: boolean;
  isPregnant: boolean;
  recentHypoEpisode: boolean;
  missedInsulinDose: boolean;
  routineCheck: boolean;
  // Optional biomarkers
  bloodGlucose?: number;  // mg/dL
  hba1c?: number;         // %
}

// Cholesterol-specific symptoms (Section B)
export interface CholesterolSymptoms {
  // Reason for visit
  followUpBloodTest: boolean;
  doctorReferred: boolean;
  chestTightness: boolean;
  breathlessOnStairs: boolean;
  unusualFatigue: boolean;
  familyHeartAttack: boolean;
  priorCardiacEvent: boolean;
  medicationReview: boolean;
  statinSideEffect: boolean;
  generalAssessment: boolean;
  // Risk factors
  hasDiabetes: boolean;
  hasHighBP: boolean;
  smokerOrExSmoker: boolean;
  significantlyOverweight: boolean;
  ageRisk: boolean;            // men >55, women >65
  familyEarlyHeartAttack: boolean;  // before 60
  hasKidneyDisease: boolean;
  familialHypercholesterolaemia: boolean;
  priorClotStrokeTIA: boolean;
  inflammatoryCondition: boolean;
  // Optional biomarkers
  ldl?: number;           // mg/dL
  totalCholesterol?: number;
  hdl?: number;
  triglycerides?: number;
  patientGender?: 'M' | 'F' | 'Other';
}

// Blood Pressure-specific symptoms (Section B)
export interface BloodPressureSymptoms {
  // Symptoms
  severeHeadache: boolean;
  blurredVision: boolean;
  nauseaWithHeadache: boolean;
  chestPain: boolean;
  shortnessOfBreathRest: boolean;
  heartbeatInEars: boolean;
  unstoppableNosebleed: boolean;
  swollenAnkles: boolean;
  mildHeadache: boolean;
  flushed: boolean;
  dizziness: boolean;
  palpitations: boolean;
  noSymptoms: boolean;
  // Context
  diagnosedHighBP: boolean;
  measuredVeryHighToday: boolean;
  missedBPMedication: boolean;
  hasDiabetes: boolean;
  hasKidneyDisease: boolean;
  priorStrokeTIA: boolean;
  hasHeartFailure: boolean;
  isPregnant: boolean;
  recentMedicationChange: boolean;
  // Optional readings
  systolic?: number;   // mmHg
  diastolic?: number;
}

// General queue symptoms (Section B)
export interface GeneralSymptoms {
  // Q_G1 — Main concern
  primaryComplaint: 'fever' | 'cough' | 'stomach' | 'pain' | 'skin' |
    'mentalHealth' | 'urinary' | 'eyeEarDental' | 'prescription' | 'other';
  // Q_G2 — Situation flags
  highFever: boolean;
  worseningRapidly: boolean;
  bladderBowelLoss: boolean;
  rashWithSwelling: boolean;
  selfHarmThoughts: boolean;
  vomitingOver5Times: boolean;
  nothingStaysDown: boolean;
  worstPainEver: boolean;
  gotSeriousBefore: boolean;
  confusedNotSelf: boolean;
  // Q_G3 — Impact
  impactLevel: 0 | 1 | 2 | 3;
  // Additional context
  isOver65: boolean;
  immunocompromised: boolean;
  isPregnant: boolean;
  caringForChild: boolean;
}

// Complete intake form
export interface IntakeForm {
  // Section A — Universal
  queueType: QueueType;
  comfort: ComfortLevel;
  onset: OnsetType;
  emergencySignals: EmergencySignals;
  // Section B — Queue-specific
  diabetesSymptoms?: DiabetesSymptoms;
  cholesterolSymptoms?: CholesterolSymptoms;
  bloodPressureSymptoms?: BloodPressureSymptoms;
  generalSymptoms?: GeneralSymptoms;
  // Section C — Optional context
  medicalContext?: MedicalContext;
}

// Classification result from the triage engine
export interface ClassificationResult {
  severity: SeverityLevel;
  clinicalMultiplier: number;
  symptomPattern: string;
  baseSeverityScore: number;
  finalScore: number;
  starvationThreshold: number;
  estimatedDuration: number;
  escalationReasons: string[];
  queueType: QueueType;
}

export interface Patient {
  id: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  chiefComplaint: string;
  conditionType: string;
  urgency: UrgencyLevel;
  arrivalTime: Date;
  estimatedDuration?: number;
  waitTime?: number;
  consultationTime?: number;
  isReturning: boolean;
  hasComplexHistory: boolean;
  isMultiSymptom: boolean;
  isTeleconsultFollowUp: boolean;
  preferredDoctorId?: string;
  // Clinical intake data
  intake?: IntakeForm;
  classification?: ClassificationResult;
  queueType?: QueueType;
  // Legacy compat
  severity?: 'low' | 'medium' | 'high';
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  isAvailable: boolean;
  currentWorkload: number;
  maxDailyPatients: number;
  patientsServed: number;
}

export interface QueueOptimizationConfig {
  severityWeight: number;
  waitTimeWeight: number;
  fairnessWeight: number;
  maxWaitTimeForLowPriority: number;
  maxWaitTimeForMediumPriority: number;
  maxWaitTimeForHighPriority: number;
  // Fairness aging thresholds (minutes)
  agingThresholds: { minutes: number; boost: number }[];
  mandatorySlotAfter: number; // minutes — force next-slot
  interleaveAfter: number; // after N CRITICAL/HIGH, serve 1 STANDARD
  scheduledWindowMinutes: number; // for overtime calculation
}

export interface OptimizationResult {
  baselineQueue: QueueOrder[];
  optimizedQueue: QueueOrder[];
  baselineMetrics: Metrics;
  optimizedMetrics: Metrics;
  fairnessReport: FairnessReport;
  recommendations: string[];
}

export interface QueueOrder {
  patient: Patient;
  position: number;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  estimatedWaitTime: number;
  assignedDoctor?: Doctor;
  priorityScore?: number;
}

export interface Metrics {
  averageWaitTime: number;
  medianWaitTime: number;
  maxWaitTime: number;
  minWaitTime: number;
  fairnessScore: number;
  doctorUtilization: number;
  throughput: number;
  patientSatisfaction: number;
  totalOvertime: number;
  waitTimeReduction?: number;
}

export interface FairnessViolation {
  patientId: string;
  rule: 'F1' | 'F2' | 'F3' | 'F4';
  reason: string;
  waitTime: number;
}

export interface AgingBoost {
  patientId: string;
  waitMinutes: number;
  boostApplied: number;
  newPriority: number;
}

export interface StarvationRisk {
  patientId: string;
  urgency: UrgencyLevel;
  currentWait: number;
  threshold: number;
  percentToThreshold: number;
}

export interface FairnessReport {
  agingBoosts: AgingBoost[];
  violations: FairnessViolation[];
  fairnessScore: number;
  starvationRisks: StarvationRisk[];
}

export interface SimulationInput {
  patients: Patient[];
  doctors?: Doctor[];
  config?: Partial<QueueOptimizationConfig>;
}

export const DEFAULT_CONFIG: QueueOptimizationConfig = {
  severityWeight: 0.5,
  waitTimeWeight: 0.3,
  fairnessWeight: 0.2,
  maxWaitTimeForLowPriority: 60,
  maxWaitTimeForMediumPriority: 45,
  maxWaitTimeForHighPriority: 30,
  agingThresholds: [
    { minutes: 15, boost: 10 },
    { minutes: 30, boost: 25 },
    { minutes: 45, boost: 45 },
  ],
  mandatorySlotAfter: 60,
  interleaveAfter: 3,
  scheduledWindowMinutes: 240,
};
