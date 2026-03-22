/**
 * 🎮 TeleMedQ API CONTROLLERS
 */

import { Request, Response } from "express";
import {
  QueueOptimizer,
  QueueSimulator,
  MetricsCalculator,
  Patient,
  QueueOptimizationConfig,
  QueueOrder,
  DEFAULT_CONFIG,
} from "../index";
import { classifyPatient, severityToUrgency } from "../core/classifiers/index";
import { IntakeForm, Doctor } from "../core/types";

// Default doctors used when none provided — enables multi-server scheduling
const DEFAULT_DOCTORS: Doctor[] = [
  { id: 'D001', name: 'Dr. Ananya Shah', specialty: 'General Medicine', isAvailable: true, currentWorkload: 0, maxDailyPatients: 20, patientsServed: 0 },
  { id: 'D002', name: 'Dr. Rohan Iyer', specialty: 'Cardiology', isAvailable: true, currentWorkload: 0, maxDailyPatients: 20, patientsServed: 0 },
  { id: 'D003', name: 'Dr. Priya Mehta', specialty: 'Neurology', isAvailable: true, currentWorkload: 0, maxDailyPatients: 20, patientsServed: 0 },
];

/**
 * Hydrate raw JSON patients — arrivalTime comes in as a string over the wire
 * but the domain types expect a Date. Fix it once at the boundary.
 */
const hydratePatientsFromRequest = (raw: any[]): Patient[] =>
  raw.map((p) => ({
    ...p,
    arrivalTime: p.arrivalTime instanceof Date ? p.arrivalTime : new Date(p.arrivalTime),
  }));

const serializeQueueOrder = (order: QueueOrder) => ({
  position: order.position,
  patientId: order.patient.id,
  urgency: order.patient.urgency,
  arrivalTime: order.patient.arrivalTime.toISOString(),
  estimatedDuration: order.patient.estimatedDuration ?? null,
  estimatedWaitTime: Math.round(order.estimatedWaitTime * 100) / 100,
  estimatedStartTime: order.estimatedStartTime.toISOString(),
  estimatedEndTime: order.estimatedEndTime.toISOString(),
  priorityScore: order.priorityScore ?? null,
  assignedDoctor: order.assignedDoctor?.name ?? null,
  queueType: order.patient.queueType ?? null,
  patient: {
    id: order.patient.id,
    age: order.patient.age,
    gender: order.patient.gender,
    chiefComplaint: order.patient.chiefComplaint,
    urgency: order.patient.urgency,
    arrivalTime: order.patient.arrivalTime.toISOString(),
    estimatedDuration: order.patient.estimatedDuration ?? null,
    waitTime: order.patient.waitTime ?? null,
    queueType: order.patient.queueType ?? null,
    classification: order.patient.classification ?? null,
  },
});

const serializeMetrics = (metrics: any) => ({
  averageWaitTime: Math.round(metrics.averageWaitTime * 100) / 100,
  medianWaitTime: Math.round(metrics.medianWaitTime * 100) / 100,
  maxWaitTime: Math.round(metrics.maxWaitTime * 100) / 100,
  minWaitTime: Math.round(metrics.minWaitTime * 100) / 100,
  fairnessScore: Math.round(metrics.fairnessScore * 100) / 100,
  doctorUtilization: Math.round(metrics.doctorUtilization * 100) / 100,
  throughput: Math.round(metrics.throughput * 100) / 100,
  patientSatisfaction: Math.round(metrics.patientSatisfaction * 100) / 100,
  totalOvertime: Math.round(metrics.totalOvertime * 100) / 100,
});

// ============================================================
// OPTIMIZE ENDPOINT
// ============================================================

export const optimizeQueueController = async (req: Request, res: Response) => {
  try {
    const { patients: rawPatients, config, doctors: reqDoctors } = req.body;
    const patients = hydratePatientsFromRequest(rawPatients);
    const doctors = reqDoctors?.length ? reqDoctors : DEFAULT_DOCTORS;
    const optimizer = new QueueOptimizer(config);
    const optimizedQueue = optimizer.optimize(patients, doctors);
    const queueOrders = optimizer.generateQueueOrder(optimizedQueue, new Date(), doctors);

    res.json({
      success: true,
      message: "Queue optimized successfully",
      data: { optimizedQueue: queueOrders.map(serializeQueueOrder) },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false, error: "Optimization failed",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================================
// SIMULATE ENDPOINT
// ============================================================

export const simulateQueueController = async (req: Request, res: Response) => {
  try {
    const { patients: rawPatients, config, doctors: reqDoctors } = req.body;
    const patients = hydratePatientsFromRequest(rawPatients);
    const doctors = reqDoctors?.length ? reqDoctors : DEFAULT_DOCTORS;
    const simulator = new QueueSimulator(config);
    const result = simulator.simulate(patients, doctors);

    res.json({
      success: true,
      message: "Queue simulation completed",
      data: {
        baselineQueue: result.baselineQueue.map(serializeQueueOrder),
        optimizedQueue: result.optimizedQueue.map(serializeQueueOrder),
        baselineMetrics: serializeMetrics(result.baselineMetrics),
        optimizedMetrics: serializeMetrics(result.optimizedMetrics),
        fairnessReport: result.fairnessReport,
        recommendations: result.recommendations,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false, error: "Simulation failed",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================================
// COMPARE ENDPOINT
// ============================================================

export const compareQueuesController = async (req: Request, res: Response) => {
  try {
    const { patients: rawPatients, config, doctors: reqDoctors } = req.body;
    const patients = hydratePatientsFromRequest(rawPatients);
    const doctors = reqDoctors?.length ? reqDoctors : DEFAULT_DOCTORS;
    const optimizer = new QueueOptimizer(config);
    const { baseline, optimized } = optimizer.compareQueues(patients, new Date(), doctors);

    const numDocs = doctors.filter((d: Doctor) => d.isAvailable).length;
    const baselineMetrics = MetricsCalculator.calculateMetrics(baseline, 240, numDocs);
    const optimizedMetrics = MetricsCalculator.calculateMetrics(optimized, 240, numDocs);

    res.json({
      success: true,
      message: "Queue comparison completed",
      data: {
        baseline: { queue: baseline.map(serializeQueueOrder), metrics: serializeMetrics(baselineMetrics) },
        optimized: { queue: optimized.map(serializeQueueOrder), metrics: serializeMetrics(optimizedMetrics) },
        improvements: MetricsCalculator.compareMetrics(baselineMetrics, optimizedMetrics).improvements,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false, error: "Comparison failed",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================================
// METRICS ENDPOINT
// ============================================================

export const metricsController = async (req: Request, res: Response) => {
  try {
    const { patients: rawPatients, config } = req.body;
    const patients = hydratePatientsFromRequest(rawPatients);
    const optimizer = new QueueOptimizer(config);
    const queueOrders = optimizer.generateQueueOrder(patients);
    const metrics = MetricsCalculator.calculateMetrics(queueOrders);

    res.json({
      success: true,
      message: "Metrics calculated",
      data: { metrics: serializeMetrics(metrics), queue: queueOrders.map(serializeQueueOrder) },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false, error: "Metrics calculation failed",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================================
// CONFIGURATION ENDPOINTS
// ============================================================

export const getConfigController = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Default TeleMedQ configuration",
    data: { config: DEFAULT_CONFIG },
    timestamp: new Date().toISOString(),
  });
};

export const configController = (req: Request, res: Response) => {
  const { config } = req.body;
  const weightSum = config.severityWeight + config.waitTimeWeight + config.fairnessWeight;
  const isValid = Math.abs(weightSum - 1.0) < 0.01;

  res.json({
    success: isValid,
    message: isValid ? "Configuration is valid" : "Configuration is invalid",
    data: { valid: isValid, weightSum: weightSum.toFixed(2), errors: isValid ? [] : [`Weights must sum to 1.0 (currently ${weightSum.toFixed(2)})`] },
    timestamp: new Date().toISOString(),
  });
};

// ============================================================
// DOCUMENTATION ENDPOINT
// ============================================================

export const docsController = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: "TeleMedQ Queue Optimizer REST API",
      version: "2.0.0",
      baseUrl: "/api/v1",
      patientSchema: {
        id: "string", age: "number", gender: "M | F | Other",
        chiefComplaint: "string", conditionType: "string",
        urgency: "CRITICAL | HIGH | STANDARD | LOW",
        arrivalTime: "ISO 8601 datetime",
        isReturning: "boolean", hasComplexHistory: "boolean",
        isMultiSymptom: "boolean", isTeleconsultFollowUp: "boolean",
        preferredDoctorId: "string (optional)",
      },
      endpoints: [
        { method: "POST", path: "/optimize", description: "Optimize queue order" },
        { method: "POST", path: "/simulate", description: "Run full dual-mode simulation" },
        { method: "POST", path: "/compare", description: "Compare baseline FIFO vs optimized" },
        { method: "POST", path: "/metrics", description: "Calculate metrics for a queue" },
        { method: "GET",  path: "/config",  description: "Get default configuration" },
        { method: "POST", path: "/config/validate", description: "Validate configuration" },
        { method: "POST", path: "/intake/classify", description: "Classify patient from intake form" },
        { method: "POST", path: "/intake/enqueue", description: "Classify + enqueue patient" },
        { method: "GET",  path: "/intake/questions/:queueType", description: "Get intake questions for queue" },
      ],
    },
    timestamp: new Date().toISOString(),
  });
};

// ============================================================
// INTAKE / CLINICAL CLASSIFICATION ENDPOINTS
// ============================================================

/**
 * POST /intake/classify — Classify a patient from their intake form.
 * Returns severity, clinical multiplier, estimated duration, etc.
 */
export const classifyIntakeController = async (req: Request, res: Response) => {
  try {
    const { intake, age } = req.body;
    if (!intake || !intake.queueType) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "intake object with queueType is required",
        timestamp: new Date().toISOString(),
      });
    }

    const classification = classifyPatient(intake as IntakeForm, age);

    res.json({
      success: true,
      message: "Patient classified successfully",
      data: {
        classification,
        urgency: severityToUrgency(classification.severity),
        summary: {
          severity: classification.severity,
          clinicalMultiplier: classification.clinicalMultiplier,
          symptomPattern: classification.symptomPattern,
          estimatedDuration: classification.estimatedDuration,
          starvationThreshold: classification.starvationThreshold,
          queueType: classification.queueType,
          escalationReasons: classification.escalationReasons,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Classification failed",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * POST /intake/enqueue — Classify patient from intake form, then enqueue.
 * Accepts intake + patient metadata, returns classified patient with queue position.
 */
export const enqueueIntakeController = async (req: Request, res: Response) => {
  try {
    const { intake, patient: patientData, existingQueue, config, doctors: reqDoctors } = req.body;
    const doctors = reqDoctors?.length ? reqDoctors : DEFAULT_DOCTORS;

    if (!intake || !intake.queueType) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "intake object with queueType is required",
        timestamp: new Date().toISOString(),
      });
    }

    const classification = classifyPatient(intake as IntakeForm, patientData?.age);
    const urgency = severityToUrgency(classification.severity);

    // Build patient object
    const patient: Patient = {
      id: patientData?.id || `patient-${Date.now()}`,
      age: patientData?.age ?? 30,
      gender: patientData?.gender ?? "Other",
      chiefComplaint: patientData?.chiefComplaint ?? intake.queueType,
      conditionType: intake.queueType,
      urgency,
      arrivalTime: new Date(),
      estimatedDuration: classification.estimatedDuration,
      isReturning: patientData?.isReturning ?? false,
      hasComplexHistory: patientData?.hasComplexHistory ?? false,
      isMultiSymptom: patientData?.isMultiSymptom ?? false,
      isTeleconsultFollowUp: patientData?.isTeleconsultFollowUp ?? false,
      intake: intake as IntakeForm,
      classification,
      queueType: intake.queueType,
    };

    // If existing queue provided, re-optimize with new patient
    let queueResult = null;
    if (existingQueue && Array.isArray(existingQueue)) {
      const allPatients = [
        ...hydratePatientsFromRequest(existingQueue),
        patient,
      ];
      const optimizer = new QueueOptimizer(config);
      const optimized = optimizer.optimize(allPatients, doctors);
      const queueOrders = optimizer.generateQueueOrder(optimized, new Date(), doctors);
      queueResult = queueOrders.map(serializeQueueOrder);
    }

    res.json({
      success: true,
      message: `Patient classified as ${classification.severity.toUpperCase()} and enqueued`,
      data: {
        patient: {
          id: patient.id,
          urgency: patient.urgency,
          classification: patient.classification,
          estimatedDuration: patient.estimatedDuration,
          queueType: patient.queueType,
        },
        queue: queueResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Enqueue failed",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /intake/questions/:queueType — Get intake questions for a specific queue.
 */
export const intakeQuestionsController = (req: Request, res: Response) => {
  const queueType = req.params.queueType as string;
  const validQueues = ["diabetes", "cholesterol", "bloodPressure", "general"];

  if (!validQueues.includes(queueType)) {
    return res.status(400).json({
      success: false,
      error: "Invalid queue type",
      message: `Queue type must be one of: ${validQueues.join(", ")}`,
      timestamp: new Date().toISOString(),
    });
  }

  const universalQuestions = {
    sectionA: {
      comfort: {
        question: "How are you feeling RIGHT NOW overall?",
        options: [
          { value: 0, label: "Fine — came for a routine check" },
          { value: 1, label: "Uncomfortable but managing" },
          { value: 2, label: "Quite unwell, hard to ignore" },
          { value: 3, label: "Very unwell, struggling to function" },
          { value: 4, label: "Extremely unwell or frightened" },
        ],
      },
      onset: {
        question: "How long has this been happening?",
        options: [
          { value: "acute", label: "Just started — less than 1 hour" },
          { value: "today", label: "Started today" },
          { value: "days", label: "Few days" },
          { value: "chronic", label: "Weeks or longer" },
        ],
      },
      emergencySignals: {
        question: "Are you experiencing ANY of these right now?",
        multiSelect: true,
        options: [
          { key: "chestPain", label: "Chest pain or heaviness" },
          { key: "breathingDifficulty", label: "Difficulty breathing at rest" },
          { key: "severeHeadache", label: "Sudden, severe, 'worst ever' headache" },
          { key: "confusion", label: "Confusion — can't think or speak clearly" },
          { key: "visionLoss", label: "Blurred or lost vision (sudden)" },
          { key: "limbWeakness", label: "Weakness or numbness in face, arm, or leg (one side)" },
          { key: "fainting", label: "Feeling like you might faint or pass out" },
        ],
      },
    },
  };

  const queueQuestions: Record<string, any> = {
    diabetes: {
      sectionB: {
        hypoSymptoms: {
          title: "Low Blood Sugar Symptoms",
          multiSelect: true,
          options: [
            { key: "shaking", label: "Shaking or trembling" },
            { key: "suddenSweating", label: "Sudden sweating (not from heat/exercise)" },
            { key: "heartPounding", label: "Heart pounding or racing" },
            { key: "suddenHunger", label: "Sudden intense hunger" },
            { key: "paleSkin", label: "Pale or clammy skin" },
            { key: "mentalFog", label: "Mental fog — hard to concentrate or speak" },
            { key: "tinglingLips", label: "Tingling around lips or fingertips" },
            { key: "suddenAnxiety", label: "Feeling very anxious or irritable suddenly" },
          ],
        },
        hyperSymptoms: {
          title: "High Blood Sugar Symptoms",
          multiSelect: true,
          options: [
            { key: "extremeThirst", label: "Extremely thirsty — can't drink enough water" },
            { key: "frequentUrination", label: "Urinating much more than usual" },
            { key: "blurredVision", label: "Blurred vision (new or suddenly worse)" },
            { key: "fruityBreath", label: "Fruity or strange smell on breath" },
            { key: "nausea", label: "Nausea or vomiting" },
            { key: "deepFastBreathing", label: "Deep, fast breathing or feeling breathless" },
            { key: "extremeTiredness", label: "Extreme tiredness — heavy, hard to move" },
            { key: "stomachPain", label: "Stomach pain (new or severe)" },
            { key: "slowWoundHealing", label: "Wounds or cuts healing very slowly" },
          ],
        },
        context: {
          title: "Context",
          multiSelect: true,
          options: [
            { key: "onInsulin", label: "I am on insulin" },
            { key: "hasKidneyDisease", label: "I have kidney disease" },
            { key: "isPregnant", label: "I am pregnant" },
            { key: "recentHypoEpisode", label: "I had a low blood sugar episode in the last 24 hours" },
            { key: "missedInsulinDose", label: "I ran out of insulin or missed a dose" },
            { key: "routineCheck", label: "None of the above — routine check / HbA1c review" },
          ],
        },
        optionalReadings: {
          bloodGlucose: { label: "Current blood sugar reading (mg/dL)", type: "number", optional: true },
          hba1c: { label: "Recent HbA1c (%)", type: "number", optional: true },
        },
      },
    },
    cholesterol: {
      sectionB: {
        reasonForVisit: {
          title: "Why are you visiting today?",
          multiSelect: true,
          options: [
            { key: "followUpBloodTest", label: "Follow-up on a recent blood test" },
            { key: "doctorReferred", label: "Doctor referred me for cholesterol check" },
            { key: "chestTightness", label: "I have chest tightness or pressure during activity" },
            { key: "breathlessOnStairs", label: "I get unusually breathless going up stairs or walking" },
            { key: "unusualFatigue", label: "I feel exhausted doing things that used to be easy" },
            { key: "familyHeartAttack", label: "I am worried — family member had a heart attack" },
            { key: "priorCardiacEvent", label: "I had a heart attack, stroke, or blocked artery before" },
            { key: "medicationReview", label: "I want to start or review cholesterol medication" },
            { key: "statinSideEffect", label: "I'm having muscle pain or weakness (possible statin side effect)" },
            { key: "generalAssessment", label: "General heart risk assessment" },
          ],
        },
        riskFactors: {
          title: "Risk Factors",
          multiSelect: true,
          options: [
            { key: "hasDiabetes", label: "I have diabetes" },
            { key: "hasHighBP", label: "I have high blood pressure" },
            { key: "smokerOrExSmoker", label: "I smoke or used to smoke" },
            { key: "significantlyOverweight", label: "I am significantly overweight" },
            { key: "ageRisk", label: "I am a man over 55, or a woman over 65" },
            { key: "familyEarlyHeartAttack", label: "A close family member had a heart attack before age 60" },
            { key: "hasKidneyDisease", label: "I have kidney disease" },
            { key: "familialHypercholesterolaemia", label: "I have been told I have a very high cholesterol (familial or genetic)" },
            { key: "priorClotStrokeTIA", label: "I have had a blood clot, stroke, or TIA (mini-stroke)" },
            { key: "inflammatoryCondition", label: "I have an inflammatory condition (RA, lupus, psoriasis)" },
          ],
        },
        optionalReadings: {
          ldl: { label: "LDL cholesterol (mg/dL)", type: "number", optional: true },
          totalCholesterol: { label: "Total cholesterol (mg/dL)", type: "number", optional: true },
          hdl: { label: "HDL cholesterol (mg/dL)", type: "number", optional: true },
          triglycerides: { label: "Triglycerides (mg/dL)", type: "number", optional: true },
        },
      },
    },
    bloodPressure: {
      sectionB: {
        symptoms: {
          title: "What are you experiencing right now?",
          multiSelect: true,
          options: [
            { key: "severeHeadache", label: "Severe pounding headache — worst I've had" },
            { key: "blurredVision", label: "Blurred vision or sudden change in vision" },
            { key: "nauseaWithHeadache", label: "Nausea or vomiting alongside headache" },
            { key: "chestPain", label: "Chest pain or pressure" },
            { key: "shortnessOfBreathRest", label: "Shortness of breath even at rest" },
            { key: "heartbeatInEars", label: "Feeling my heartbeat in my ears or neck" },
            { key: "unstoppableNosebleed", label: "Nosebleed that won't stop" },
            { key: "swollenAnkles", label: "Swollen ankles or legs (new or suddenly worse)" },
            { key: "mildHeadache", label: "Mild dull headache — pressure feeling" },
            { key: "flushed", label: "Feeling flushed or hot in the face" },
            { key: "dizziness", label: "Dizziness or lightheadedness" },
            { key: "palpitations", label: "Palpitations — irregular or fast heartbeat" },
            { key: "noSymptoms", label: "None of the above — routine / medication check" },
          ],
        },
        context: {
          title: "Context",
          multiSelect: true,
          options: [
            { key: "diagnosedHighBP", label: "I know I have high blood pressure (diagnosed)" },
            { key: "measuredVeryHighToday", label: "I measured my BP today and it was very high" },
            { key: "missedBPMedication", label: "I've been unable to take my BP medication (missed doses)" },
            { key: "hasDiabetes", label: "I have diabetes" },
            { key: "hasKidneyDisease", label: "I have kidney disease" },
            { key: "priorStrokeTIA", label: "I have had a stroke or TIA (mini-stroke) before" },
            { key: "hasHeartFailure", label: "I have heart failure" },
            { key: "isPregnant", label: "I am pregnant or gave birth in the last 6 weeks" },
            { key: "recentMedicationChange", label: "My doctor increased / changed my BP medication recently" },
          ],
        },
        optionalReadings: {
          systolic: { label: "Systolic (top number) mmHg", type: "number", optional: true },
          diastolic: { label: "Diastolic (bottom number) mmHg", type: "number", optional: true },
        },
      },
    },
    general: {
      sectionB: {
        primaryComplaint: {
          question: "What is your main concern today?",
          singleSelect: true,
          options: [
            { value: "fever", label: "Fever / flu / infection" },
            { value: "cough", label: "Cough, cold, or sore throat" },
            { value: "stomach", label: "Stomach or digestive problem" },
            { value: "pain", label: "Pain — back, joint, muscle, or headache" },
            { value: "skin", label: "Skin problem — rash, wound, or bite" },
            { value: "mentalHealth", label: "Feeling very low, anxious, or overwhelmed" },
            { value: "urinary", label: "Urinary / kidney symptoms" },
            { value: "eyeEarDental", label: "Eye, ear, or dental problem" },
            { value: "prescription", label: "Prescription refill or medication review" },
            { value: "other", label: "Something else" },
          ],
        },
        situationFlags: {
          title: "Which of these describe your situation?",
          multiSelect: true,
          options: [
            { key: "highFever", label: "I have a high temperature / fever (> 38.5°C / 101°F)" },
            { key: "worseningRapidly", label: "My symptoms have been getting worse quickly (hours, not days)" },
            { key: "bladderBowelLoss", label: "I have lost control of bladder or bowel (new — not normal for me)" },
            { key: "rashWithSwelling", label: "I have a rash AND swelling in my face, lips, or throat" },
            { key: "selfHarmThoughts", label: "I have thought about harming myself" },
            { key: "vomitingOver5Times", label: "I vomited or had diarrhoea more than 5 times today" },
            { key: "nothingStaysDown", label: "I cannot eat or drink anything — everything comes back up" },
            { key: "worstPainEver", label: "The pain is severe — worst I have felt" },
            { key: "gotSeriousBefore", label: "I had this before and it became very serious / needed hospital" },
            { key: "confusedNotSelf", label: "I feel confused or not quite myself" },
          ],
        },
        impactLevel: {
          question: "How much is this affecting your day?",
          singleSelect: true,
          options: [
            { value: 0, label: "Not much — I can function normally" },
            { value: 1, label: "Somewhat — some discomfort but managing" },
            { value: 2, label: "Significantly — hard to do normal things" },
            { value: 3, label: "Completely — I cannot get up or function" },
          ],
        },
        additionalContext: {
          title: "Additional Context",
          multiSelect: true,
          options: [
            { key: "isOver65", label: "I am over 65 years old" },
            { key: "immunocompromised", label: "I have a weakened immune system (chemo, HIV, steroids)" },
            { key: "isPregnant", label: "I am pregnant or recently gave birth" },
            { key: "caringForChild", label: "I am caring for a young child with these symptoms" },
          ],
        },
      },
    },
  };

  res.json({
    success: true,
    message: `Intake questions for ${queueType} queue`,
    data: {
      ...universalQuestions,
      ...queueQuestions[queueType as keyof typeof queueQuestions],
    },
    timestamp: new Date().toISOString(),
  });
};