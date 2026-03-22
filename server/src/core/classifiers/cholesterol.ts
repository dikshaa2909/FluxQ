import {
  CholesterolSymptoms,
  ComfortLevel,
  OnsetType,
  SeverityLevel,
} from '../types';

export interface CholesterolClassification {
  severity: SeverityLevel;
  pattern: 'secondaryPrevActive' | 'secondaryPrevStable' | 'familial' |
    'acuteCardiac' | 'highRisk' | 'moderateRisk' | 'statinSideEffect' | 'lowRisk';
  riskScore: number;
  escalationReasons: string[];
}

/**
 * Cholesterol Severity Classifier — Steps 1-5 from spec.
 */
export function classifyCholesterol(
  symptoms: CholesterolSymptoms,
  comfort: ComfortLevel,
  onset: OnsetType
): CholesterolClassification {
  const reasons: string[] = [];
  let severity: SeverityLevel = 'low';
  let pattern: CholesterolClassification['pattern'] = 'lowRisk';

  // Step 1 — Acute cardiac symptom check
  const hasAcuteCardiac = (
    symptoms.chestTightness || symptoms.breathlessOnStairs || symptoms.unusualFatigue
  ) && comfort >= 2;

  if (hasAcuteCardiac) {
    severity = 'high';
    pattern = symptoms.priorCardiacEvent ? 'secondaryPrevActive' : 'acuteCardiac';
    reasons.push('Acute cardiac symptoms + comfort ≥ 2');
  }

  if (symptoms.priorCardiacEvent && !hasAcuteCardiac) {
    severity = 'high';
    pattern = 'secondaryPrevStable';
    reasons.push('Prior cardiac event — secondary prevention minimum');
  }

  if (symptoms.statinSideEffect && !hasAcuteCardiac && !symptoms.priorCardiacEvent) {
    severity = 'standard';
    pattern = 'statinSideEffect';
    reasons.push('Statin side effect — needs medication review');
  }

  // Step 2 — Risk factor count (when no acute symptoms and no prior event)
  if (severity === 'low') {
    const riskFactors = [
      symptoms.hasDiabetes, symptoms.hasHighBP, symptoms.smokerOrExSmoker,
      symptoms.significantlyOverweight, symptoms.ageRisk,
      symptoms.familyEarlyHeartAttack, symptoms.hasKidneyDisease,
      symptoms.familialHypercholesterolaemia, symptoms.priorClotStrokeTIA,
      symptoms.inflammatoryCondition,
    ];
    const riskScore = riskFactors.filter(Boolean).length;

    if (riskScore >= 5) {
      severity = 'high';
      pattern = 'highRisk';
      reasons.push(`Risk factor count ${riskScore} ≥ 5 → high`);
    } else if (riskScore >= 3) {
      severity = 'standard';
      pattern = 'moderateRisk';
      reasons.push(`Risk factor count ${riskScore} (3-4) → standard`);
    } else {
      severity = 'low';
      pattern = 'lowRisk';
    }
  }

  // Step 3 — Reason modifier
  const riskFactors = [
    symptoms.hasDiabetes, symptoms.hasHighBP, symptoms.smokerOrExSmoker,
    symptoms.significantlyOverweight, symptoms.ageRisk,
    symptoms.familyEarlyHeartAttack, symptoms.hasKidneyDisease,
    symptoms.familialHypercholesterolaemia, symptoms.priorClotStrokeTIA,
    symptoms.inflammatoryCondition,
  ];
  const riskScore = riskFactors.filter(Boolean).length;

  if (symptoms.familyHeartAttack && riskScore >= 3) {
    severity = escalate(severity);
    reasons.push('Family heart attack + riskScore ≥ 3 → escalated');
  }
  if (symptoms.familialHypercholesterolaemia && severity === 'low') {
    severity = 'standard';
    pattern = 'familial';
    reasons.push('Familial hypercholesterolaemia → forced standard minimum');
  }
  if (symptoms.followUpBloodTest && comfort >= 2) {
    severity = escalate(severity);
    reasons.push('Follow-up blood test + comfort ≥ 2 → escalated');
  }

  // Step 4 — Onset modifier
  if (onset === 'acute' && (symptoms.chestTightness || symptoms.breathlessOnStairs)) {
    if (severity !== 'high') severity = 'high';
    reasons.push('Acute onset + chest symptoms → high');
  }

  // Step 5 — Biomarker override
  if (symptoms.ldl !== undefined) {
    if (symptoms.ldl >= 190) {
      severity = 'high';
      pattern = 'familial';
      reasons.push(`LDL ${symptoms.ldl} ≥ 190 — familial threshold`);
    } else if (symptoms.ldl >= 160 && severity === 'low') {
      severity = 'standard';
      reasons.push(`LDL ${symptoms.ldl} (160-189) → at least standard`);
    } else if (symptoms.ldl < 100 && riskScore <= 1 && !hasAcuteCardiac) {
      if (severity === 'standard') severity = 'low';
      reasons.push(`LDL ${symptoms.ldl} < 100 + low risk → confirmed low`);
    }
  }

  if (symptoms.totalCholesterol !== undefined) {
    if (symptoms.totalCholesterol > 240 && severity !== 'high') {
      severity = escalate(severity);
      reasons.push(`Total cholesterol ${symptoms.totalCholesterol} > 240 → escalated`);
    }
  }

  if (symptoms.hdl !== undefined) {
    const lowHDLThreshold = symptoms.patientGender === 'F' ? 50 : 40;
    if (symptoms.hdl < lowHDLThreshold) {
      severity = escalate(severity);
      reasons.push(`HDL ${symptoms.hdl} < ${lowHDLThreshold} → escalated (low HDL)`);
    }
  }

  if (symptoms.triglycerides !== undefined) {
    if (symptoms.triglycerides > 500) {
      severity = 'high';
      reasons.push(`Triglycerides ${symptoms.triglycerides} > 500 — pancreatitis risk`);
    } else if (symptoms.triglycerides >= 200) {
      severity = escalate(severity);
      reasons.push(`Triglycerides ${symptoms.triglycerides} (200-499) → escalated`);
    }
  }

  return { severity, pattern, riskScore, escalationReasons: reasons };
}

function escalate(severity: SeverityLevel): SeverityLevel {
  switch (severity) {
    case 'low': return 'standard';
    case 'standard': return 'high';
    case 'high': return 'high';
    case 'critical': return 'critical';
  }
}
