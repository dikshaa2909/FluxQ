import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/api/client'
import type { Patient, QueueOrderResponse, Doctor, QueueType, IntakeForm, EmergencySignals, ComfortLevel, OnsetType, DiabetesSymptoms, CholesterolSymptoms, BloodPressureSymptoms, GeneralSymptoms } from '@/api/client'

export interface LiveDoctor {
  id: string
  name: string
  specialty: string
  isAvailable: boolean
  currentPatient: (QueueOrderResponse & { _name?: string; _symptom?: string }) | null
  assignedPatients: QueueOrderResponse[]
  completedCount: number
  utilization: number
  burnout: number
  consultProgress: number
  maxDailyPatients: number
  patientsServed: number
}

interface LiveState {
  doctors: LiveDoctor[]
  waitingQueue: QueueOrderResponse[]
  isRunning: boolean
  clock: number
  logs: string[]
  totalProcessed: number
}

const DOCTOR_NAMES = [
  { name: 'Dr. Ananya Shah', specialty: 'General Medicine' },
  { name: 'Dr. Rohan Iyer', specialty: 'Pulmonology' },
  { name: 'Dr. Priya Mehta', specialty: 'Cardiology' },
  { name: 'Dr. Arjun Patel', specialty: 'Emergency Medicine' },
]

const PATIENT_NAMES = [
  'Aisha Khan', 'Ravi Kumar', 'Sneha Joshi', 'Vikram Singh',
  'Diya Bose', 'Naina Joshi', 'Arjun Reddy', 'Meera Nair',
  'Karan Malhotra', 'Pooja Sharma', 'Rahul Gupta', 'Anita Desai',
  'Suresh Pillai', 'Kavita Rao', 'Manish Tiwari', 'Divya Menon',
]

const SYMPTOMS: Record<string, string[]> = {
  CRITICAL: ['severe chest pain', 'difficulty breathing', 'high fever with seizures', 'acute abdominal pain', 'stroke symptoms'],
  HIGH: ['persistent migraine', 'moderate fever 3 days', 'chronic back pain flare-up', 'anxiety with palpitations'],
  STANDARD: ['mild cough and throat pain', 'seasonal allergies', 'routine follow-up', 'minor skin rash'],
  LOW: ['general check-up', 'prescription refill', 'routine follow-up'],
}

const CONDITION_TYPES = ['General', 'Cardiology', 'Neurology', 'Endocrinology', 'Gastroenterology', 'Psychiatry', 'Dermatology', 'Orthopedics']

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeRealisticDiabetesSymptoms(urgency: string): DiabetesSymptoms {
  const isCritical = urgency === 'CRITICAL'
  const isHigh = urgency === 'HIGH'
  return {
    shaking: isCritical || (isHigh && Math.random() > 0.4),
    suddenSweating: isCritical || (isHigh && Math.random() > 0.5),
    heartPounding: isCritical && Math.random() > 0.3,
    suddenHunger: isHigh || isCritical,
    paleSkin: isCritical && Math.random() > 0.4,
    mentalFog: isCritical || (isHigh && Math.random() > 0.6),
    tinglingLips: isCritical && Math.random() > 0.5,
    suddenAnxiety: isHigh && Math.random() > 0.5,
    extremeThirst: isHigh || isCritical,
    frequentUrination: isHigh || Math.random() > 0.5,
    blurredVision: isCritical && Math.random() > 0.5,
    fruityBreath: isCritical && Math.random() > 0.6,
    nausea: isCritical && Math.random() > 0.4,
    deepFastBreathing: isCritical && Math.random() > 0.7,
    extremeTiredness: isHigh || isCritical,
    stomachPain: isCritical && Math.random() > 0.5,
    slowWoundHealing: Math.random() > 0.6,
    onInsulin: Math.random() > 0.5,
    hasKidneyDisease: Math.random() > 0.8,
    isPregnant: false,
    recentHypoEpisode: isCritical && Math.random() > 0.5,
    missedInsulinDose: isCritical && Math.random() > 0.4,
    routineCheck: urgency === 'LOW',
    bloodGlucose: urgency === 'LOW' ? 90 + Math.random() * 30 : isCritical ? 300 + Math.random() * 150 : 150 + Math.random() * 100,
  }
}

function makeRealisticCholesterolSymptoms(urgency: string): CholesterolSymptoms {
  const isCritical = urgency === 'CRITICAL'
  const isHigh = urgency === 'HIGH'
  return {
    followUpBloodTest: urgency === 'STANDARD' || urgency === 'LOW',
    doctorReferred: isHigh,
    chestTightness: isCritical || (isHigh && Math.random() > 0.5),
    breathlessOnStairs: isCritical || (isHigh && Math.random() > 0.5),
    unusualFatigue: isHigh || isCritical,
    familyHeartAttack: Math.random() > 0.5,
    priorCardiacEvent: isCritical && Math.random() > 0.5,
    medicationReview: urgency === 'STANDARD',
    statinSideEffect: Math.random() > 0.7,
    generalAssessment: urgency === 'LOW',
    hasDiabetes: Math.random() > 0.6,
    hasHighBP: isHigh || isCritical,
    smokerOrExSmoker: Math.random() > 0.5,
    significantlyOverweight: Math.random() > 0.5,
    ageRisk: Math.random() > 0.5,
    familyEarlyHeartAttack: Math.random() > 0.6,
    hasKidneyDisease: Math.random() > 0.8,
    familialHypercholesterolaemia: Math.random() > 0.8,
    priorClotStrokeTIA: isCritical && Math.random() > 0.6,
    inflammatoryCondition: Math.random() > 0.7,
    ldl: isCritical ? 180 + Math.random() * 80 : 100 + Math.random() * 60,
    totalCholesterol: isCritical ? 280 + Math.random() * 80 : 180 + Math.random() * 60,
    hdl: 40 + Math.random() * 20,
    triglycerides: isCritical ? 250 + Math.random() * 150 : 120 + Math.random() * 80,
  }
}

function makeRealisticBPSymptoms(urgency: string): BloodPressureSymptoms {
  const isCritical = urgency === 'CRITICAL'
  const isHigh = urgency === 'HIGH'
  return {
    severeHeadache: isCritical || (isHigh && Math.random() > 0.4),
    blurredVision: isCritical && Math.random() > 0.4,
    nauseaWithHeadache: isCritical && Math.random() > 0.5,
    chestPain: isCritical && Math.random() > 0.4,
    shortnessOfBreathRest: isCritical && Math.random() > 0.5,
    heartbeatInEars: isHigh && Math.random() > 0.5,
    unstoppableNosebleed: isCritical && Math.random() > 0.6,
    swollenAnkles: isHigh && Math.random() > 0.6,
    mildHeadache: isHigh,
    flushed: isHigh && Math.random() > 0.5,
    dizziness: isHigh || isCritical,
    palpitations: isCritical && Math.random() > 0.4,
    noSymptoms: urgency === 'LOW',
    diagnosedHighBP: isHigh || isCritical,
    measuredVeryHighToday: isCritical,
    missedBPMedication: isCritical && Math.random() > 0.4,
    hasDiabetes: Math.random() > 0.6,
    hasKidneyDisease: Math.random() > 0.8,
    priorStrokeTIA: isCritical && Math.random() > 0.6,
    hasHeartFailure: isCritical && Math.random() > 0.7,
    isPregnant: false,
    recentMedicationChange: Math.random() > 0.7,
    systolic: isCritical ? 170 + Math.floor(Math.random() * 40) : isHigh ? 150 + Math.floor(Math.random() * 20) : 120 + Math.floor(Math.random() * 20),
    diastolic: isCritical ? 110 + Math.floor(Math.random() * 20) : isHigh ? 95 + Math.floor(Math.random() * 15) : 75 + Math.floor(Math.random() * 15),
  }
}

function makeRealisticGeneralSymptoms(urgency: string): GeneralSymptoms {
  const isCritical = urgency === 'CRITICAL'
  const isHigh = urgency === 'HIGH'
  const complaints: GeneralSymptoms['primaryComplaint'][] = ['fever', 'cough', 'stomach', 'pain', 'skin', 'mentalHealth', 'urinary', 'eyeEarDental', 'prescription', 'other']
  return {
    primaryComplaint: isCritical ? 'pain' : isHigh ? randomPick(['fever', 'stomach', 'pain'] as GeneralSymptoms['primaryComplaint'][]) : randomPick(complaints),
    highFever: isCritical || (isHigh && Math.random() > 0.4),
    worseningRapidly: isCritical,
    bladderBowelLoss: isCritical && Math.random() > 0.7,
    rashWithSwelling: isHigh && Math.random() > 0.6,
    selfHarmThoughts: false,
    vomitingOver5Times: isCritical && Math.random() > 0.5,
    nothingStaysDown: isCritical && Math.random() > 0.6,
    worstPainEver: isCritical && Math.random() > 0.4,
    gotSeriousBefore: isHigh && Math.random() > 0.5,
    confusedNotSelf: isCritical && Math.random() > 0.5,
    impactLevel: isCritical ? 3 : isHigh ? 2 : urgency === 'STANDARD' ? 1 : 0,
    isOver65: Math.random() > 0.7,
    immunocompromised: Math.random() > 0.8,
    isPregnant: false,
    caringForChild: Math.random() > 0.8,
  }
}

function makePatient(counter: number): Patient {
  const urgency = randomPick(['LOW', 'STANDARD', 'HIGH', 'CRITICAL'] as const)
  const durations: Record<string, number> = { LOW: 8 + Math.random() * 8, STANDARD: 15 + Math.random() * 10, HIGH: 20 + Math.random() * 10, CRITICAL: 25 + Math.random() * 10 }
  const patient: Patient = {
    id: `P${String(counter).padStart(3, '0')}`,
    age: 18 + Math.floor(Math.random() * 70),
    gender: randomPick(['M', 'F', 'Other'] as const),
    chiefComplaint: randomPick(SYMPTOMS[urgency] || SYMPTOMS.STANDARD),
    conditionType: randomPick(CONDITION_TYPES),
    urgency,
    arrivalTime: new Date(Date.now() - Math.random() * 60 * 60000).toISOString(),
    estimatedDuration: Math.round(durations[urgency]),
    isReturning: Math.random() > 0.7,
    hasComplexHistory: Math.random() > 0.7,
    isMultiSymptom: Math.random() > 0.6,
    isTeleconsultFollowUp: Math.random() > 0.8,
  }

  // 40% chance of having intake data with realistic symptoms
  if (Math.random() > 0.6) {
    const queueType = randomPick(['diabetes', 'cholesterol', 'bloodPressure', 'general'] as QueueType[])
    const isCrisis = urgency === 'CRITICAL' && Math.random() > 0.6
    const emergency: EmergencySignals = {
      chestPain: isCrisis && Math.random() > 0.5,
      breathingDifficulty: isCrisis && Math.random() > 0.6,
      severeHeadache: isCrisis && Math.random() > 0.6,
      confusion: isCrisis && Math.random() > 0.7,
      visionLoss: false,
      limbWeakness: false,
      fainting: isCrisis && Math.random() > 0.8,
    }
    const intake: IntakeForm = {
      queueType,
      comfort: randomPick([0, 1, 2, 3, 4] as ComfortLevel[]),
      onset: randomPick(['acute', 'today', 'days', 'chronic'] as OnsetType[]),
      emergencySignals: emergency,
    }

    // Attach realistic queue-specific symptoms
    if (queueType === 'diabetes') {
      intake.diabetesSymptoms = makeRealisticDiabetesSymptoms(urgency)
    } else if (queueType === 'cholesterol') {
      intake.cholesterolSymptoms = makeRealisticCholesterolSymptoms(urgency)
    } else if (queueType === 'bloodPressure') {
      intake.bloodPressureSymptoms = makeRealisticBPSymptoms(urgency)
    } else if (queueType === 'general') {
      intake.generalSymptoms = makeRealisticGeneralSymptoms(urgency)
    }

    patient.intake = intake
    patient.queueType = queueType
  }

  return patient
}

// Asynchronously classify a patient with intake data, mutating the patient object in place
async function classifyPatientIfNeeded(patient: Patient): Promise<Patient> {
  if (!patient.intake) return patient
  try {
    const result = await api.classifyIntake(patient.intake, patient.age)
    const cls = result.classification
    return {
      ...patient,
      classification: cls,
      queueType: cls.queueType,
      estimatedDuration: cls.estimatedDuration,
      urgency: cls.severity === 'critical' ? 'CRITICAL' : cls.severity === 'high' ? 'HIGH' : cls.severity === 'standard' ? 'STANDARD' : 'LOW',
    }
  } catch {
    return patient
  }
}

function buildDoctorsPayload(docs: LiveDoctor[]): Doctor[] {
  return docs.map(d => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    isAvailable: d.isAvailable,
    currentWorkload: d.assignedPatients.length,
    maxDailyPatients: d.maxDailyPatients,
    patientsServed: d.patientsServed,
  }))
}

// Call the real API to get optimized queue order, with fallback
async function fetchOptimizedQueue(patients: Patient[], doctors?: Doctor[]): Promise<QueueOrderResponse[]> {
  try {
    const data = await api.optimize(patients, undefined, doctors)
    return data.optimizedQueue.map(q => ({
      ...q,
      _name: randomPick(PATIENT_NAMES),
      _symptom: randomPick(SYMPTOMS[q.urgency] || SYMPTOMS.STANDARD),
    }))
  } catch {
    // Fallback: create a basic queue from patients sorted by urgency
    const urgencyOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, STANDARD: 2, LOW: 3 }
    const sorted = [...patients].sort((a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3))
    return sorted.map((p, i) => ({
      position: i + 1,
      patientId: p.id,
      urgency: p.urgency,
      estimatedWaitTime: (i + 1) * (p.estimatedDuration ?? 15) * 0.5,
      estimatedStartTime: new Date(Date.now() + i * 10 * 60000).toISOString(),
      estimatedEndTime: new Date(Date.now() + (i + 1) * 10 * 60000).toISOString(),
      priorityScore: 100 - i * 10,
      assignedDoctor: null,
      patient: {
        id: p.id,
        age: p.age,
        gender: p.gender,
        chiefComplaint: p.chiefComplaint,
        urgency: p.urgency,
        arrivalTime: p.arrivalTime,
        estimatedDuration: p.estimatedDuration ?? 15,
        waitTime: null,
      },
      _name: randomPick(PATIENT_NAMES),
      _symptom: randomPick(SYMPTOMS[p.urgency] || SYMPTOMS.STANDARD),
    }))
  }
}

export function useLiveSimulation() {
  const [state, setState] = useState<LiveState>({
    doctors: [],
    waitingQueue: [],
    isRunning: false,
    clock: 0,
    logs: [],
    totalProcessed: 0,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const patientCounter = useRef(0)
  const tickRef = useRef(0)

  const initDoctors = useCallback((count: number): LiveDoctor[] => {
    return DOCTOR_NAMES.slice(0, count).map((d, i) => ({
      id: `D${i + 1}`,
      name: d.name,
      specialty: d.specialty,
      isAvailable: true,
      currentPatient: null,
      assignedPatients: [],
      completedCount: 0,
      utilization: 0,
      burnout: 0,
      consultProgress: 0,
      maxDailyPatients: 20,
      patientsServed: 0,
    }))
  }, [])

  const start = useCallback(async (doctorCount: number) => {
    patientCounter.current = 0
    tickRef.current = 0
    const docs = initDoctors(doctorCount)

    // Generate initial patients
    const initialCount = 5 + Math.floor(Math.random() * 4)
    const rawPatients: Patient[] = Array.from({ length: initialCount }, () => {
      patientCounter.current++
      return makePatient(patientCounter.current)
    })

    const startLog = `[${new Date().toLocaleTimeString()}] Classifying ${rawPatients.filter(p => p.intake).length} patients with intake, then calling /api/v1/optimize...`

    setState(prev => ({
      ...prev,
      doctors: docs,
      isRunning: true,
      clock: 0,
      logs: [startLog],
    }))

    try {
      // Async classify all patients that have intake data
      const patients = await Promise.all(rawPatients.map(p => classifyPatientIfNeeded(p)))

      const classifiedCount = patients.filter(p => p.classification).length
      if (classifiedCount > 0) {
        setState(prev => ({
          ...prev,
          logs: [
            `[${new Date().toLocaleTimeString()}] Classified ${classifiedCount} patients via /api/v1/intake/classify`,
            ...prev.logs,
          ],
        }))
      }

      // Call the REAL API to get optimized queue
      const optimizedQueue = await fetchOptimizedQueue(patients, buildDoctorsPayload(docs))

      setState(prev => ({
        ...prev,
        waitingQueue: optimizedQueue,
        logs: [
          `[${new Date().toLocaleTimeString()}] API returned optimized queue: ${optimizedQueue.map(q => q.patientId).join(' > ')}`,
          ...prev.logs,
        ],
      }))
    } catch (err) {
      // Fallback: still start but with locally generated queue
      const fallbackQueue = await fetchOptimizedQueue(rawPatients, buildDoctorsPayload(docs))
      setState(prev => ({
        ...prev,
        waitingQueue: fallbackQueue,
        logs: [
          `[${new Date().toLocaleTimeString()}] API unavailable, using local fallback queue`,
          ...prev.logs,
        ],
      }))
    }
  }, [initDoctors])

  // Main tick loop — assigns patients from API-optimized queue to doctors
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      tickRef.current++

      setState(prev => {
        const doctors = prev.doctors.map(d => ({ ...d }))
        const queue = [...prev.waitingQueue]
        const newLogs: string[] = []
        const clock = prev.clock + 1
        let totalProcessed = prev.totalProcessed

        // Progress current consultations
        doctors.forEach(doc => {
          if (doc.currentPatient) {
            doc.consultProgress += 6 + Math.random() * 4
            doc.burnout = Math.min(500, doc.burnout + 0.5)

            if (doc.consultProgress >= 100) {
              newLogs.push(`[Done] ${doc.name} completed consultation with ${doc.currentPatient._name || doc.currentPatient.patientId}`)
              doc.completedCount++
              doc.patientsServed++
              totalProcessed++
              doc.currentPatient = null
              doc.consultProgress = 0
              doc.isAvailable = true
            }
          } else {
            doc.burnout = Math.max(0, doc.burnout - 0.3)
          }
        })

        // Assign waiting patients to available doctors (in API-optimized order)
        const availableDocs = doctors.filter(d => d.isAvailable && !d.currentPatient)
        for (const doc of availableDocs) {
          if (queue.length === 0) break
          const patient = queue.shift()!
          doc.currentPatient = patient
          doc.isAvailable = false
          doc.consultProgress = 0
          doc.assignedPatients = [...doc.assignedPatients, patient]
          newLogs.push(`[Assign] ${(patient as any)._name || patient.patientId} (${patient.urgency}) > ${doc.name}`)
        }

        // Every few ticks, generate new patients and call API to re-optimize
        if (tickRef.current % 4 === 0 && Math.random() > 0.4) {
          const newCount = 1 + Math.floor(Math.random() * 2)
          const newRawPatients: Patient[] = Array.from({ length: newCount }, () => {
            patientCounter.current++
            return makePatient(patientCounter.current)
          })

          newLogs.push(`[New] ${newCount} new patient(s) arrived — classifying intake & calling /api/v1/optimize...`)

          // Build full pending queue as Patient[] for API call
          const pendingAsPatients: Patient[] = queue.map(q => ({
            id: q.patientId,
            age: q.patient?.age ?? 30,
            gender: (q.patient?.gender as Patient['gender']) ?? 'M',
            chiefComplaint: q.patient?.chiefComplaint ?? 'Pending consultation',
            conditionType: 'General',
            urgency: q.urgency as Patient['urgency'],
            arrivalTime: q.estimatedStartTime,
            estimatedDuration: 15,
            isReturning: false,
            hasComplexHistory: false,
            isMultiSymptom: false,
            isTeleconsultFollowUp: false,
          }))

          // Classify new patients with intake before re-optimizing
          Promise.all(newRawPatients.map(p => classifyPatientIfNeeded(p))).then(classifiedNew => {
            const allPending = [...pendingAsPatients, ...classifiedNew]
            return fetchOptimizedQueue(allPending, buildDoctorsPayload(doctors))
          }).then(reoptimized => {
            setState(prev2 => ({
              ...prev2,
              waitingQueue: reoptimized,
              logs: [
                `[${new Date().toLocaleTimeString()}] [Reopt] API re-optimized queue: ${reoptimized.map(q => q.patientId).join(' > ')}`,
                ...prev2.logs,
              ].slice(0, 50),
            }))
          }).catch(() => {
            // silently ignore re-optimize failures
          })
        }

        // Update utilization
        doctors.forEach(doc => {
          if (doc.completedCount > 0 || doc.currentPatient) {
            doc.utilization = Math.min(100, (doc.currentPatient ? 70 : 30) + doc.completedCount * 5)
          }
        })

        return {
          ...prev,
          doctors,
          waitingQueue: queue,
          clock,
          totalProcessed,
          logs: [...newLogs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`), ...prev.logs].slice(0, 50),
        }
      })
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning])

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }))
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  return { ...state, start, stop }
}
