const API_ROOT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_BASE = `${API_ROOT}/api/v1`;

// --- Intake / Classification types ---

export type QueueType = 'diabetes' | 'cholesterol' | 'bloodPressure' | 'general';
export type ComfortLevel = 0 | 1 | 2 | 3 | 4;
export type OnsetType = 'acute' | 'today' | 'days' | 'chronic';
export type SeverityLevel = 'low' | 'standard' | 'high' | 'critical';

export interface EmergencySignals {
  chestPain: boolean;
  breathingDifficulty: boolean;
  severeHeadache: boolean;
  confusion: boolean;
  visionLoss: boolean;
  limbWeakness: boolean;
  fainting: boolean;
}

export interface DiabetesSymptoms {
  shaking: boolean;
  suddenSweating: boolean;
  heartPounding: boolean;
  suddenHunger: boolean;
  paleSkin: boolean;
  mentalFog: boolean;
  tinglingLips: boolean;
  suddenAnxiety: boolean;
  extremeThirst: boolean;
  frequentUrination: boolean;
  blurredVision: boolean;
  fruityBreath: boolean;
  nausea: boolean;
  deepFastBreathing: boolean;
  extremeTiredness: boolean;
  stomachPain: boolean;
  slowWoundHealing: boolean;
  onInsulin: boolean;
  hasKidneyDisease: boolean;
  isPregnant: boolean;
  recentHypoEpisode: boolean;
  missedInsulinDose: boolean;
  routineCheck: boolean;
  bloodGlucose?: number;
  hba1c?: number;
}

export interface CholesterolSymptoms {
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
  hasDiabetes: boolean;
  hasHighBP: boolean;
  smokerOrExSmoker: boolean;
  significantlyOverweight: boolean;
  ageRisk: boolean;
  familyEarlyHeartAttack: boolean;
  hasKidneyDisease: boolean;
  familialHypercholesterolaemia: boolean;
  priorClotStrokeTIA: boolean;
  inflammatoryCondition: boolean;
  ldl?: number;
  totalCholesterol?: number;
  hdl?: number;
  triglycerides?: number;
  patientGender?: 'M' | 'F' | 'Other';
}

export interface BloodPressureSymptoms {
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
  diagnosedHighBP: boolean;
  measuredVeryHighToday: boolean;
  missedBPMedication: boolean;
  hasDiabetes: boolean;
  hasKidneyDisease: boolean;
  priorStrokeTIA: boolean;
  hasHeartFailure: boolean;
  isPregnant: boolean;
  recentMedicationChange: boolean;
  systolic?: number;
  diastolic?: number;
}

export interface GeneralSymptoms {
  primaryComplaint: 'fever' | 'cough' | 'stomach' | 'pain' | 'skin' | 'mentalHealth' | 'urinary' | 'eyeEarDental' | 'prescription' | 'other';
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
  impactLevel: 0 | 1 | 2 | 3;
  isOver65: boolean;
  immunocompromised: boolean;
  isPregnant: boolean;
  caringForChild: boolean;
}

export interface MedicalContext {
  [key: string]: boolean;
}

export interface IntakeForm {
  queueType: QueueType;
  comfort: ComfortLevel;
  onset: OnsetType;
  emergencySignals: EmergencySignals;
  diabetesSymptoms?: DiabetesSymptoms;
  cholesterolSymptoms?: CholesterolSymptoms;
  bloodPressureSymptoms?: BloodPressureSymptoms;
  generalSymptoms?: GeneralSymptoms;
  medicalContext?: MedicalContext;
}

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

export interface ClassifyResponse {
  classification: ClassificationResult;
  urgency: string;
  summary: string | Record<string, unknown>;
}

export interface EnqueueResponse {
  patient: Patient;
  queue: QueueOrderResponse[];
}

// --- Existing types ---

export interface Patient {
  id: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  chiefComplaint: string;
  conditionType: string;
  urgency: 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW';
  arrivalTime: string;
  estimatedDuration?: number;
  waitTime?: number;
  isReturning: boolean;
  hasComplexHistory: boolean;
  isMultiSymptom: boolean;
  isTeleconsultFollowUp: boolean;
  preferredDoctorId?: string;
  intake?: IntakeForm;
  classification?: ClassificationResult;
  queueType?: QueueType;
}

export interface QueueOrderResponse {
  position: number;
  patientId: string;
  urgency: string;
  estimatedWaitTime: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  priorityScore: number | null;
  assignedDoctor: string | null;
  patient: {
    id: string;
    age: number;
    gender: string;
    chiefComplaint: string;
    urgency: string;
    arrivalTime: string;
    estimatedDuration: number | null;
    waitTime: number | null;
  };
}

export interface MetricsResponse {
  averageWaitTime: number;
  medianWaitTime: number;
  maxWaitTime: number;
  minWaitTime: number;
  fairnessScore: number;
  doctorUtilization: number;
  throughput: number;
  patientSatisfaction: number;
  totalOvertime: number;
}

export interface FairnessReport {
  agingBoosts: Array<{
    patientId: string;
    waitMinutes: number;
    boostApplied: number;
    newPriority: number;
  }>;
  violations: Array<{
    patientId: string;
    rule: 'F1' | 'F2' | 'F3' | 'F4';
    reason: string;
    waitTime: number;
  }>;
  fairnessScore: number;
  starvationRisks: Array<{
    patientId: string;
    urgency: string;
    currentWait: number;
    threshold: number;
    percentToThreshold: number;
  }>;
}

export interface Improvements {
  waitTimeReduction: string | number;
  fairnessImprovement: string | number;
  utilizationImprovement?: string | number;
  throughputImprovement?: string | number;
  satisfactionImprovement?: string | number;
  overtimeReduction?: string | number;
}

export interface SimulateResponse {
  baselineQueue: QueueOrderResponse[];
  optimizedQueue: QueueOrderResponse[];
  baselineMetrics: MetricsResponse;
  optimizedMetrics: MetricsResponse;
  fairnessReport: FairnessReport;
  improvements: Improvements | null;
  recommendations: string[];
}

export interface OptimizeResponse {
  optimizedQueue: QueueOrderResponse[];
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

export interface ConfigResponse {
  config: {
    severityWeight: number;
    waitTimeWeight: number;
    fairnessWeight: number;
    maxWaitTimeForLowPriority: number;
    maxWaitTimeForMediumPriority: number;
    maxWaitTimeForHighPriority: number;
    agingThresholds: Array<{ minutes: number; boost: number }>;
    mandatorySlotAfter: number;
    interleaveAfter: number;
    scheduledWindowMinutes: number;
  };
  description: Record<string, string>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  environment: string;
  uptime: number;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (e) {
    throw new Error(`Cannot reach API at ${API_BASE}${endpoint}. Is the server running?`);
  }
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`API returned non-JSON response (status ${res.status})`);
  }
  if (!json.success && res.status >= 400) {
    throw new Error((json.message as string) || `API request failed (status ${res.status})`);
  }
  return json.data as T;
}

// Ensure metrics have sensible defaults
function sanitizeMetrics(m: MetricsResponse): MetricsResponse {
  return {
    averageWaitTime: m.averageWaitTime ?? 0,
    medianWaitTime: m.medianWaitTime ?? 0,
    maxWaitTime: m.maxWaitTime ?? 0,
    minWaitTime: m.minWaitTime ?? 0,
    fairnessScore: m.fairnessScore ?? 0,
    doctorUtilization: m.doctorUtilization ?? 0,
    throughput: m.throughput ?? 0,
    patientSatisfaction: m.patientSatisfaction ?? 0,
    totalOvertime: m.totalOvertime ?? 0,
  }
}

export const api = {
  health: async (): Promise<HealthResponse> => {
    const res = await fetch(`${API_ROOT}/health`);
    return res.json();
  },

  getConfig: () => apiCall<ConfigResponse>('/config'),

  validateConfig: (config: ConfigResponse['config']) =>
    apiCall<{ valid: boolean; errors: string[] }>('/config/validate', {
      method: 'POST',
      body: JSON.stringify({ config }),
    }),

  simulate: async (patients: Patient[], config?: Partial<ConfigResponse['config']>, doctors?: Doctor[]): Promise<SimulateResponse> => {
    const data = await apiCall<SimulateResponse>('/simulate', {
      method: 'POST',
      body: JSON.stringify({ patients, config, doctors }),
    })
    data.baselineMetrics = sanitizeMetrics(data.baselineMetrics)
    data.optimizedMetrics = sanitizeMetrics(data.optimizedMetrics)
    // Use fairnessReport score as the single source of truth
    if (data.fairnessReport) {
      data.optimizedMetrics.fairnessScore = data.fairnessReport.fairnessScore
    }
    // Recalculate improvements from actual displayed metrics
    if (data.improvements) {
      const fairnessDelta = data.optimizedMetrics.fairnessScore - data.baselineMetrics.fairnessScore
      data.improvements = { ...data.improvements, fairnessImprovement: parseFloat(fairnessDelta.toFixed(2)) }
    }
    return data
  },

  optimize: (patients: Patient[], config?: Partial<ConfigResponse['config']>, doctors?: Doctor[]) =>
    apiCall<OptimizeResponse>('/optimize', {
      method: 'POST',
      body: JSON.stringify({ patients, config, doctors }),
    }),

  compare: async (patients: Patient[], config?: Partial<ConfigResponse['config']>, doctors?: Doctor[]) => {
    // Use /simulate which returns fairnessReport for consistent scores across pages
    const simData = await apiCall<SimulateResponse>('/simulate', {
      method: 'POST',
      body: JSON.stringify({ patients, config, doctors }),
    })
    const baseline = { queue: simData.baselineQueue, metrics: sanitizeMetrics(simData.baselineMetrics) }
    const optimized = { queue: simData.optimizedQueue, metrics: sanitizeMetrics(simData.optimizedMetrics) }
    // Sync fairness from fairnessReport (single source of truth)
    if (simData.fairnessReport) {
      optimized.metrics.fairnessScore = simData.fairnessReport.fairnessScore
    }
    // Recalculate improvements from actual displayed metrics
    const improvements = simData.improvements ? { ...simData.improvements } : null
    if (improvements) {
      const fairnessDelta = optimized.metrics.fairnessScore - baseline.metrics.fairnessScore
      improvements.fairnessImprovement = parseFloat(fairnessDelta.toFixed(2))
    }
    return { baseline, optimized, improvements }
  },

  metrics: (patients: Patient[], config?: Partial<ConfigResponse['config']>) =>
    apiCall<{ metrics: MetricsResponse }>('/metrics', {
      method: 'POST',
      body: JSON.stringify({ patients, config }),
    }),

  classifyIntake: (intake: IntakeForm, age?: number) =>
    apiCall<ClassifyResponse>('/intake/classify', {
      method: 'POST',
      body: JSON.stringify({ intake, age }),
    }),

  enqueueIntake: (
    intake: IntakeForm,
    patient?: Partial<Patient>,
    existingQueue?: QueueOrderResponse[],
    config?: Partial<ConfigResponse['config']>,
    doctors?: Doctor[],
  ) =>
    apiCall<EnqueueResponse>('/intake/enqueue', {
      method: 'POST',
      body: JSON.stringify({ intake, patient, existingQueue, config, doctors }),
    }),

  getIntakeQuestions: (queueType: QueueType) =>
    apiCall<Record<string, unknown>>(`/intake/questions/${queueType}`),
};
