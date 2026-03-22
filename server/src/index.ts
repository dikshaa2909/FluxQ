/**
 * 🏥 TeleMedQ — MAIN EXPORTS
 */

// Core algorithm classes
export { QueueOptimizer } from "./core/queueOptimizer";
export { DurationPredictor } from "./core/predictor";
export { PriorityScorer } from "./core/priorityScorer";
export { MetricsCalculator } from "./core/metricsCalculator";
export { QueueSimulator } from "./core/simulator";
export { FairnessEngine } from "./core/fairnessEngine";

// Clinical classification system
export { classifyPatient, checkRedFlags, severityToUrgency, baseSeverityScore } from "./core/classifiers/index";
export { classifyDiabetes } from "./core/classifiers/diabetes";
export { classifyCholesterol } from "./core/classifiers/cholesterol";
export { classifyBloodPressure } from "./core/classifiers/bloodPressure";
export { classifyGeneral } from "./core/classifiers/general";
export {
  computeDiabetesMultiplier,
  computeCholesterolMultiplier,
  computeBPMultiplier,
  computeGeneralMultiplier,
} from "./core/clinicalMultiplier";
export { getStarvationThreshold, getDurationPrediction } from "./core/queueConfig";

// Types
export type {
  Patient,
  Doctor,
  UrgencyLevel,
  QueueOptimizationConfig,
  OptimizationResult,
  QueueOrder,
  Metrics,
  SimulationInput,
  FairnessReport,
  FairnessViolation,
  AgingBoost,
  StarvationRisk,
  // Clinical intake types
  QueueType,
  ComfortLevel,
  OnsetType,
  SeverityLevel,
  IntakeForm,
  ClassificationResult,
  EmergencySignals,
  MedicalContext,
  DiabetesSymptoms,
  CholesterolSymptoms,
  BloodPressureSymptoms,
  GeneralSymptoms,
} from "./core/types";

export { DEFAULT_CONFIG } from "./core/types";

// API client
export { QueueOptimizerClient, apiClient } from "./api/client";
