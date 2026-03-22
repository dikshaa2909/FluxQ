/**
 * Classifier Orchestrator — routes intake to correct queue classifier,
 * applies red flag override, and returns unified ClassificationResult.
 */
import {
  IntakeForm,
  ClassificationResult,
  SeverityLevel,
  QueueType,
} from '../types';
import { checkRedFlags, severityToUrgency, baseSeverityScore } from './redFlags';
import { classifyDiabetes } from './diabetes';
import { classifyCholesterol } from './cholesterol';
import { classifyBloodPressure } from './bloodPressure';
import { classifyGeneral } from './general';
import {
  computeDiabetesMultiplier,
  computeCholesterolMultiplier,
  computeBPMultiplier,
  computeGeneralMultiplier,
} from '../clinicalMultiplier';
import {
  getStarvationThreshold,
  getDurationPrediction,
} from '../queueConfig';

/**
 * Master classification: intake form → ClassificationResult.
 * 1. Check red flags (Q4)
 * 2. Run queue-specific classifier
 * 3. Compute clinical multiplier
 * 4. Compute final score
 */
export function classifyPatient(intake: IntakeForm, age?: number): ClassificationResult {
  const { queueType, comfort, onset, emergencySignals } = intake;

  // Step 1 — Red flag override (runs BEFORE queue logic)
  const redFlag = checkRedFlags(emergencySignals, comfort);

  if (redFlag.triggered && redFlag.level === 'critical') {
    return buildCrisisResult(queueType, redFlag.reasons);
  }

  // Step 2 — Queue-specific classification
  let severity: SeverityLevel;
  let symptomPattern = 'unknown';
  let escalationReasons: string[] = [];

  switch (queueType) {
    case 'diabetes': {
      if (!intake.diabetesSymptoms) throw new Error('Diabetes symptoms required for diabetes queue');
      const result = classifyDiabetes(intake.diabetesSymptoms, comfort, onset);
      severity = result.severity;
      symptomPattern = result.pattern;
      escalationReasons = result.escalationReasons;
      break;
    }
    case 'cholesterol': {
      if (!intake.cholesterolSymptoms) throw new Error('Cholesterol symptoms required for cholesterol queue');
      const result = classifyCholesterol(intake.cholesterolSymptoms, comfort, onset);
      severity = result.severity;
      symptomPattern = result.pattern;
      escalationReasons = result.escalationReasons;
      break;
    }
    case 'bloodPressure': {
      if (!intake.bloodPressureSymptoms) throw new Error('BP symptoms required for blood pressure queue');
      const result = classifyBloodPressure(intake.bloodPressureSymptoms, comfort, onset, emergencySignals);
      severity = result.severity;
      symptomPattern = result.pattern;
      escalationReasons = result.escalationReasons;
      break;
    }
    case 'general': {
      if (!intake.generalSymptoms) throw new Error('General symptoms required for general queue');
      const result = classifyGeneral(intake.generalSymptoms, comfort, onset);
      severity = result.severity;
      symptomPattern = `points:${result.points}`;
      escalationReasons = result.escalationReasons;
      break;
    }
  }

  // Apply red flag HIGH override (fainting, chest pain alone, breathing alone)
  if (redFlag.triggered && redFlag.level === 'high') {
    if (severity === 'low' || severity === 'standard') {
      severity = 'high';
      escalationReasons.push(...redFlag.reasons);
    }
  }

  if (severity === 'critical') {
    return buildCrisisResult(queueType, escalationReasons);
  }

  // Step 3 — Compute clinical multiplier
  const multiplier = computeMultiplier(queueType, intake, symptomPattern, severity, age);

  // Step 4 — Compute scores
  const base = baseSeverityScore(severity);
  const clinicalScore = base * multiplier;
  const threshold = getStarvationThreshold(queueType, severity, symptomPattern);
  const duration = getDurationPrediction(queueType, severity, symptomPattern);

  return {
    severity,
    clinicalMultiplier: multiplier,
    symptomPattern,
    baseSeverityScore: base,
    finalScore: clinicalScore, // WaitScore + FairnessBoost added at queue time
    starvationThreshold: threshold,
    estimatedDuration: duration,
    escalationReasons,
    queueType,
  };
}

function buildCrisisResult(queueType: QueueType, reasons: string[]): ClassificationResult {
  return {
    severity: 'critical',
    clinicalMultiplier: 1,
    symptomPattern: 'crisis',
    baseSeverityScore: 9999,
    finalScore: 9999,
    starvationThreshold: 0,
    estimatedDuration: 30,
    escalationReasons: reasons,
    queueType,
  };
}

function computeMultiplier(
  queueType: QueueType,
  intake: IntakeForm,
  pattern: string,
  severity: string,
  age?: number
): number {
  switch (queueType) {
    case 'diabetes':
      return computeDiabetesMultiplier(intake.diabetesSymptoms!, intake.onset, severity, age);
    case 'cholesterol':
      return computeCholesterolMultiplier(intake.cholesterolSymptoms!, pattern);
    case 'bloodPressure':
      return computeBPMultiplier(intake.bloodPressureSymptoms!, pattern, age);
    case 'general':
      return computeGeneralMultiplier(intake.generalSymptoms!, pattern, intake.onset);
  }
}

export { checkRedFlags, severityToUrgency, baseSeverityScore };
