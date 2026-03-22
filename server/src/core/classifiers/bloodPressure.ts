import {
  BloodPressureSymptoms,
  ComfortLevel,
  OnsetType,
  SeverityLevel,
  EmergencySignals,
} from '../types';

export interface BPClassification {
  severity: SeverityLevel;
  tier: 'A' | 'B';
  pattern: 'hypertensiveEmergency' | 'hypertensiveUrgency' | 'stage2Comorbid' |
    'stage2Uncomplicated' | 'stage1Comorbid' | 'stage1Uncomplicated' |
    'elevated' | 'routine';
  escalationReasons: string[];
}

/**
 * Blood Pressure Severity Classifier — Tier A (crisis) + Tier B (standard).
 */
export function classifyBloodPressure(
  symptoms: BloodPressureSymptoms,
  comfort: ComfortLevel,
  onset: OnsetType,
  emergencySignals: EmergencySignals
): BPClassification {
  const reasons: string[] = [];

  // ── TIER A — Crisis Detection ──
  const tierA = checkTierA(symptoms, comfort, emergencySignals);
  if (tierA) {
    return {
      severity: 'critical',
      tier: 'A',
      pattern: 'hypertensiveEmergency',
      escalationReasons: tierA,
    };
  }

  // ── TIER B — Standard Classification ──
  let severity: SeverityLevel = 'low';
  let pattern: BPClassification['pattern'] = 'routine';

  // Count symptoms
  const symptomList = [
    symptoms.severeHeadache, symptoms.blurredVision, symptoms.nauseaWithHeadache,
    symptoms.chestPain, symptoms.shortnessOfBreathRest, symptoms.heartbeatInEars,
    symptoms.unstoppableNosebleed, symptoms.swollenAnkles, symptoms.mildHeadache,
    symptoms.flushed, symptoms.dizziness, symptoms.palpitations,
  ];
  const symptomCount = symptomList.filter(Boolean).length;

  // Step 1 — High severity conditions
  if (symptomCount >= 3 && comfort >= 2) {
    severity = 'high';
    pattern = 'stage2Comorbid';
    reasons.push('≥ 3 symptoms + comfort ≥ 2 → high');
  }

  if (symptoms.measuredVeryHighToday && comfort >= 2 && severity !== 'high') {
    severity = 'high';
    pattern = 'hypertensiveUrgency';
    reasons.push('Measured very high today + comfort ≥ 2 → high');
  }

  if (symptoms.missedBPMedication && symptoms.priorStrokeTIA && severity !== 'high') {
    severity = 'high';
    pattern = 'stage2Comorbid';
    reasons.push('Missed BP medication + prior stroke/TIA → high');
  }

  if (symptoms.isPregnant && symptomCount >= 1 && comfort >= 2 && severity !== 'high') {
    severity = 'high';
    pattern = 'stage2Comorbid';
    reasons.push('Pregnant + symptoms + comfort ≥ 2 → high (pre-eclampsia risk)');
  }

  if (symptoms.hasHeartFailure && symptoms.swollenAnkles && severity !== 'high') {
    severity = 'high';
    pattern = 'stage2Comorbid';
    reasons.push('Heart failure + new ankle swelling → high');
  }

  // BP reading check for high
  if (symptoms.systolic !== undefined && symptoms.diastolic !== undefined) {
    if ((symptoms.systolic >= 160 || symptoms.diastolic >= 100) && severity !== 'high') {
      severity = 'high';
      pattern = 'stage2Uncomplicated';
      reasons.push(`BP ${symptoms.systolic}/${symptoms.diastolic} — Stage 2`);
    }
  }

  // Step 2 — Medium severity conditions
  if (severity === 'low') {
    if (symptomCount >= 1 && symptomCount <= 2 && comfort >= 1 && comfort <= 2) {
      severity = 'standard';
      pattern = 'stage1Comorbid';
      reasons.push('1-2 symptoms + comfort 1-2 → standard');
    }

    if (symptoms.diagnosedHighBP && severity === 'low') {
      severity = 'standard';
      pattern = 'stage1Comorbid';
      reasons.push('Diagnosed hypertension + medication review → standard');
    }

    if (symptoms.dizziness && comfort <= 2 && severity === 'low') {
      severity = 'standard';
      pattern = 'stage1Uncomplicated';
      reasons.push('Dizziness → standard');
    }

    if (symptoms.palpitations && severity === 'low') {
      severity = 'standard';
      pattern = 'stage1Uncomplicated';
      reasons.push('Palpitations → standard');
    }

    if (symptoms.missedBPMedication && !symptoms.priorStrokeTIA && comfort <= 2 && severity === 'low') {
      severity = 'standard';
      pattern = 'stage1Comorbid';
      reasons.push('Missed medication, no prior stroke → standard');
    }

    // BP reading for medium
    if (symptoms.systolic !== undefined && symptoms.diastolic !== undefined) {
      if ((symptoms.systolic >= 140 || symptoms.diastolic >= 90) && severity === 'low') {
        severity = 'standard';
        pattern = 'stage1Uncomplicated';
        reasons.push(`BP ${symptoms.systolic}/${symptoms.diastolic} — Stage 1`);
      }
    }
  }

  // Step 3 — Low: no symptoms + routine / stable / Stage 1 reading
  // Already default LOW if nothing above triggered

  // Step 4 — Onset modifier
  if (onset === 'acute') {
    if (severity === 'high') {
      // Escalate to crisis check — re-verify tier A
      reasons.push('Acute onset + high → verify crisis');
    } else if (severity === 'standard') {
      severity = 'high';
      pattern = 'stage2Uncomplicated';
      reasons.push('Acute onset: standard → high');
    } else if (severity === 'low') {
      severity = 'standard';
      pattern = 'stage1Uncomplicated';
      reasons.push('Acute onset: low → standard');
    }
  }

  // Step 5 — Context modifiers
  if (symptoms.isPregnant && severity === 'low') {
    severity = 'standard';
    reasons.push('Pregnant → always at least standard');
  }
  if (symptoms.recentMedicationChange && symptomCount >= 1) {
    severity = escalate(severity);
    reasons.push('Recent medication change + new symptoms → escalated');
  }

  // Determine pattern for non-high
  if (severity === 'low') {
    if (symptoms.systolic !== undefined && symptoms.systolic >= 120 && symptoms.systolic < 130) {
      pattern = 'elevated';
    } else {
      pattern = 'routine';
    }
  }

  return {
    severity,
    tier: 'B',
    pattern,
    escalationReasons: reasons,
  };
}

function checkTierA(
  symptoms: BloodPressureSymptoms,
  comfort: ComfortLevel,
  emergencySignals: EmergencySignals
): string[] | null {
  const reasons: string[] = [];

  if (symptoms.severeHeadache && symptoms.blurredVision) {
    reasons.push('Severe headache + blurred vision → hypertensive emergency');
  }
  if (symptoms.severeHeadache && symptoms.chestPain) {
    reasons.push('Severe headache + chest pain → hypertensive emergency');
  }
  if (symptoms.severeHeadache && emergencySignals.confusion) {
    reasons.push('Severe headache + confusion → hypertensive emergency');
  }
  if (symptoms.severeHeadache && symptoms.nauseaWithHeadache && comfort >= 3) {
    reasons.push('Severe headache + nausea + comfort ≥ 3 → hypertensive emergency');
  }
  if (symptoms.chestPain && symptoms.shortnessOfBreathRest) {
    reasons.push('Chest pain + SOB at rest → hypertensive emergency');
  }
  if (symptoms.shortnessOfBreathRest && symptoms.palpitations) {
    reasons.push('SOB at rest + palpitations → hypertensive emergency');
  }
  if (emergencySignals.limbWeakness) {
    reasons.push('Limb weakness → stroke in BP context');
  }
  if (emergencySignals.visionLoss) {
    reasons.push('Sudden vision loss → hypertensive emergency');
  }
  if (symptoms.isPregnant && symptoms.severeHeadache && comfort >= 3) {
    reasons.push('Pregnant + severe headache + comfort ≥ 3 → eclampsia risk');
  }
  if (symptoms.isPregnant && symptoms.blurredVision && comfort >= 2) {
    reasons.push('Pregnant + blurred vision + comfort ≥ 2 → eclampsia risk');
  }

  // BP reading crisis
  if (symptoms.systolic !== undefined && symptoms.diastolic !== undefined) {
    if (symptoms.systolic >= 200 || symptoms.diastolic >= 120) {
      reasons.push(`BP ${symptoms.systolic}/${symptoms.diastolic} ≥ 200/120 → crisis`);
    } else if ((symptoms.systolic >= 180 || symptoms.diastolic >= 120) && comfort >= 3) {
      reasons.push(`BP ${symptoms.systolic}/${symptoms.diastolic} ≥ 180/120 + comfort ≥ 3 → crisis`);
    }
  }

  return reasons.length > 0 ? reasons : null;
}

function escalate(severity: SeverityLevel): SeverityLevel {
  switch (severity) {
    case 'low': return 'standard';
    case 'standard': return 'high';
    case 'high': return 'high';
    case 'critical': return 'critical';
  }
}
