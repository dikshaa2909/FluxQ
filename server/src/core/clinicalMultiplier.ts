/**
 * Clinical Multiplier Calculations — Dm, Cm, Bm, Gm
 * Each queue has a base multiplier from symptom pattern + additive adjustments + cap.
 */
import {
  DiabetesSymptoms,
  CholesterolSymptoms,
  BloodPressureSymptoms,
  GeneralSymptoms,
  OnsetType,
} from './types';

// ============================================================
// DIABETES MULTIPLIER (Dm) — Cap: 3.5
// ============================================================

export function computeDiabetesMultiplier(
  symptoms: DiabetesSymptoms,
  onset: OnsetType,
  severity: string,
  age?: number
): number {
  // Determine pattern for base
  const hypoCount = [
    symptoms.shaking, symptoms.suddenSweating, symptoms.heartPounding,
    symptoms.suddenHunger, symptoms.paleSkin, symptoms.mentalFog,
    symptoms.tinglingLips, symptoms.suddenAnxiety,
  ].filter(Boolean).length;

  const hyperCount = [
    symptoms.extremeThirst, symptoms.frequentUrination, symptoms.blurredVision,
    symptoms.fruityBreath, symptoms.nausea, symptoms.deepFastBreathing,
    symptoms.extremeTiredness, symptoms.stomachPain, symptoms.slowWoundHealing,
  ].filter(Boolean).length;

  let base: number;
  if (hypoCount === 0 && hyperCount === 0) {
    base = 1.0; // routine
  } else if (hypoCount > hyperCount) {
    base = 1.8; // hypo dominant
  } else if (symptoms.fruityBreath && (symptoms.nausea || symptoms.deepFastBreathing)) {
    base = 1.7; // DKA
  } else if (hyperCount >= 4) {
    base = 1.9; // HHS
  } else if (hyperCount > hypoCount) {
    base = 1.4; // hyper dominant non-DKA
  } else {
    base = 1.3; // mixed
  }

  // Additive adjustments
  let adj = 0;
  if (severity === 'critical') adj += 0.5;
  if (onset === 'acute') adj += 0.3;
  if (symptoms.onInsulin) adj += 0.2;
  if (symptoms.isPregnant) adj += 0.2;
  if (symptoms.hasKidneyDisease) adj += 0.2;
  if (symptoms.missedInsulinDose) adj += 0.2;
  if (symptoms.recentHypoEpisode) adj += 0.1;
  if (age !== undefined && age > 65) adj += 0.1;

  return Math.min(base + adj, 3.5);
}

// ============================================================
// CHOLESTEROL MULTIPLIER (Cm) — Cap: 3.0
// ============================================================

export function computeCholesterolMultiplier(
  symptoms: CholesterolSymptoms,
  pattern: string
): number {
  let base: number;
  switch (pattern) {
    case 'secondaryPrevActive': base = 2.5; break;
    case 'secondaryPrevStable': base = 2.2; break;
    case 'familial': base = 2.0; break;
    case 'acuteCardiac': base = 1.9; break;
    case 'highRisk': base = 1.7; break;
    case 'moderateRisk': base = 1.4; break;
    case 'statinSideEffect': base = 1.3; break;
    default: base = 1.0; break;
  }

  let adj = 0;
  if (symptoms.familyEarlyHeartAttack) adj += 0.3;
  if (symptoms.hasDiabetes && (symptoms.hasHighBP || symptoms.hasKidneyDisease ||
      symptoms.smokerOrExSmoker || symptoms.significantlyOverweight)) adj += 0.2;
  if (symptoms.hasKidneyDisease) adj += 0.2;
  if (symptoms.inflammatoryCondition) adj += 0.2;
  if (symptoms.triglycerides !== undefined && symptoms.triglycerides > 500) adj += 0.1;

  // Extra risk factors beyond 5
  const riskFactors = [
    symptoms.hasDiabetes, symptoms.hasHighBP, symptoms.smokerOrExSmoker,
    symptoms.significantlyOverweight, symptoms.ageRisk,
    symptoms.familyEarlyHeartAttack, symptoms.hasKidneyDisease,
    symptoms.familialHypercholesterolaemia, symptoms.priorClotStrokeTIA,
    symptoms.inflammatoryCondition,
  ].filter(Boolean).length;
  if (riskFactors > 5) {
    adj += Math.min((riskFactors - 5) * 0.1, 0.3);
  }

  return Math.min(base + adj, 3.0);
}

// ============================================================
// BLOOD PRESSURE MULTIPLIER (Bm) — Cap: 3.0
// ============================================================

export function computeBPMultiplier(
  symptoms: BloodPressureSymptoms,
  pattern: string,
  age?: number
): number {
  let base: number;
  switch (pattern) {
    case 'hypertensiveUrgency': base = 2.6; break;
    case 'stage2Comorbid': base = 2.3; break;
    case 'stage2Uncomplicated': base = 1.9; break;
    case 'stage1Comorbid': base = 1.5; break;
    case 'stage1Uncomplicated': base = 1.1; break;
    case 'elevated': base = 0.9; break;
    case 'routine': base = 0.7; break;
    default: base = 1.5; break;
  }

  let adj = 0;
  if (symptoms.isPregnant) adj += 0.4;
  if (symptoms.priorStrokeTIA) adj += 0.3;
  if (symptoms.missedBPMedication && countBPSymptoms(symptoms) > 0) adj += 0.3;
  if (symptoms.hasHeartFailure) adj += 0.2;
  if (symptoms.hasKidneyDisease) adj += 0.2;
  if (symptoms.hasDiabetes && (symptoms.systolic === undefined || symptoms.systolic >= 140)) adj += 0.2;
  if (symptoms.recentMedicationChange && countBPSymptoms(symptoms) > 0) adj += 0.2;
  if (age !== undefined && age > 65) adj += 0.1;

  return Math.min(base + adj, 3.0);
}

function countBPSymptoms(s: BloodPressureSymptoms): number {
  return [
    s.severeHeadache, s.blurredVision, s.nauseaWithHeadache, s.chestPain,
    s.shortnessOfBreathRest, s.heartbeatInEars, s.unstoppableNosebleed,
    s.swollenAnkles, s.mildHeadache, s.flushed, s.dizziness, s.palpitations,
  ].filter(Boolean).length;
}

// ============================================================
// GENERAL MULTIPLIER (Gm) — Cap: 2.5
// ============================================================

export function computeGeneralMultiplier(
  symptoms: GeneralSymptoms,
  pattern: string,
  onset: OnsetType
): number {
  // Extract points from pattern string
  const pointsMatch = pattern.match(/points:(\d+)/);
  const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

  let base: number;
  if (symptoms.bladderBowelLoss || symptoms.rashWithSwelling) {
    base = 3.5; // pre-crisis catch
  } else if (symptoms.primaryComplaint === 'mentalHealth' && symptoms.impactLevel >= 2) {
    base = 1.4; // mental health override
  } else if (points >= 10) {
    base = 1.8;
  } else if (points >= 6) {
    base = 1.3;
  } else if (points >= 2) {
    base = 1.0;
  } else {
    base = 0.8;
  }

  let adj = 0;
  if (symptoms.immunocompromised) adj += 0.4;
  if (symptoms.isPregnant) adj += 0.3;
  if ((symptoms.isOver65) && (points >= 6)) adj += 0.2;
  if (symptoms.worseningRapidly && onset === 'acute') adj += 0.2;
  if (symptoms.gotSeriousBefore) adj += 0.2;
  if (symptoms.caringForChild) adj += 0.1;

  return Math.min(base + adj, 2.5);
}
