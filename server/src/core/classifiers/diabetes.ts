import {
  DiabetesSymptoms,
  ComfortLevel,
  OnsetType,
  SeverityLevel,
} from '../types';

export interface DiabetesClassification {
  severity: SeverityLevel;
  pattern: 'hypo' | 'hyper' | 'dka' | 'hhs' | 'mixed' | 'routine';
  escalationReasons: string[];
}

/**
 * Diabetes Severity Classifier — Steps 1-6 from spec.
 */
export function classifyDiabetes(
  symptoms: DiabetesSymptoms,
  comfort: ComfortLevel,
  onset: OnsetType
): DiabetesClassification {
  const reasons: string[] = [];

  // Step 1 — Count hypo symptoms (Group 1)
  const hypoSymptoms = [
    symptoms.shaking, symptoms.suddenSweating, symptoms.heartPounding,
    symptoms.suddenHunger, symptoms.paleSkin, symptoms.mentalFog,
    symptoms.tinglingLips, symptoms.suddenAnxiety,
  ];
  const hypoCount = hypoSymptoms.filter(Boolean).length;

  // Step 2 — Count hyper symptoms (Group 2)
  const hyperSymptoms = [
    symptoms.extremeThirst, symptoms.frequentUrination, symptoms.blurredVision,
    symptoms.fruityBreath, symptoms.nausea, symptoms.deepFastBreathing,
    symptoms.extremeTiredness, symptoms.stomachPain, symptoms.slowWoundHealing,
  ];
  const hyperCount = hyperSymptoms.filter(Boolean).length;

  // Step 3 — Pattern classification
  let severity: SeverityLevel = 'low';
  let pattern: DiabetesClassification['pattern'] = 'routine';

  if (hypoCount === 0 && hyperCount === 0) {
    // No symptoms — routine
    severity = 'low';
    pattern = 'routine';
  } else if (hypoCount > hyperCount || (hypoCount >= 2 && hypoCount === hyperCount)) {
    // HYPO DOMINANT
    pattern = 'hypo';
    if (hypoCount >= 3 && comfort >= 3) {
      severity = 'high';
      reasons.push('Severe hypoglycaemia — imminent LOC risk');
    } else if (hypoCount >= 2 && comfort >= 2) {
      severity = 'high';
      reasons.push('Significant hypo symptoms with distress');
    } else if (hypoCount >= 2 && comfort === 1) {
      severity = 'standard';
    } else if (hypoCount === 1 && comfort >= 2) {
      severity = 'standard';
    } else {
      severity = 'low';
    }
  } else if (hyperCount > hypoCount || (hyperCount >= 2 && hyperCount === hypoCount)) {
    // HYPER DOMINANT
    // Check DKA pattern
    if (symptoms.fruityBreath && (symptoms.nausea || symptoms.deepFastBreathing) && comfort >= 3) {
      severity = 'high';
      pattern = 'dka';
      reasons.push('DKA pattern — fruity breath + nausea/deep breathing');
    }
    // Check HHS pattern
    else if (hyperCount >= 4 && comfort >= 3) {
      severity = 'high';
      pattern = 'hhs';
      reasons.push('HHS pattern — very high symptom load');
    }
    // Standard hyper
    else if (hyperCount >= 3 && comfort >= 2) {
      severity = 'high';
      pattern = 'hyper';
      reasons.push('Multiple hyper symptoms with significant discomfort');
    } else if (hyperCount >= 2 && comfort >= 1 && comfort <= 2) {
      severity = 'standard';
      pattern = 'hyper';
    } else {
      severity = 'low';
      pattern = 'hyper';
    }
  } else if (hypoCount > 0 && hyperCount > 0) {
    // MIXED
    severity = 'standard';
    pattern = 'mixed';
    reasons.push('Mixed hypo/hyper signals — caution');
  }

  // Step 4 — Onset modifier
  if (severity === 'standard' && onset === 'acute') {
    severity = 'high';
    reasons.push('Acute onset escalation: standard → high');
  } else if (severity === 'low' && onset === 'acute') {
    severity = 'standard';
    reasons.push('Acute onset escalation: low → standard');
  }

  // Step 5 — Context flags
  if (symptoms.missedInsulinDose && hypoCount >= 1) {
    severity = escalate(severity);
    reasons.push('Missed insulin dose + hypo symptoms → escalated');
  }
  if (symptoms.recentHypoEpisode && onset === 'today') {
    if (severity === 'standard') {
      severity = 'high';
      reasons.push('Recent hypo episode + today onset → escalated to high');
    }
  }
  if (symptoms.isPregnant) {
    if (severity === 'low') severity = 'standard';
    else if (severity === 'standard') severity = 'high';
    reasons.push('Pregnant — escalated one level (max high)');
  }

  // Step 6 — Optional biomarker override
  if (symptoms.bloodGlucose !== undefined) {
    const bg = symptoms.bloodGlucose;
    if (bg < 54) {
      severity = 'high';
      reasons.push(`Glucose ${bg} mg/dL < 54 — severe hypo, immediate risk`);
    } else if (bg >= 54 && bg <= 70) {
      if (severity !== 'high' && severity !== 'critical') {
        severity = 'high';
        reasons.push(`Glucose ${bg} mg/dL (54-70) — danger zone`);
      }
    } else if (bg >= 141 && bg <= 180) {
      if (severity === 'low') {
        severity = 'standard';
        reasons.push(`Glucose ${bg} mg/dL (141-180) — mildly elevated`);
      }
    } else if (bg >= 181 && bg <= 300) {
      if (severity === 'low') severity = 'standard';
      if (hyperCount > 0 && severity === 'standard') severity = 'high';
      reasons.push(`Glucose ${bg} mg/dL (181-300) — elevated`);
    } else if (bg > 300) {
      severity = 'high';
      reasons.push(`Glucose ${bg} mg/dL > 300 — DKA/HHS territory`);
    }
  }

  if (symptoms.hba1c !== undefined) {
    const a1c = symptoms.hba1c;
    if (a1c < 7.0 && hypoCount === 0 && hyperCount === 0 && severity === 'standard') {
      severity = 'low';
      reasons.push(`HbA1c ${a1c}% < 7.0 — well controlled, downgraded`);
    } else if (a1c >= 9.0 && a1c <= 10.0 && severity === 'low') {
      severity = 'standard';
      reasons.push(`HbA1c ${a1c}% (9-10) — poor control`);
    } else if (a1c > 10.0) {
      severity = escalate(severity);
      reasons.push(`HbA1c ${a1c}% > 10 — chronic poor control, escalated`);
    }
  }

  return { severity, pattern, escalationReasons: reasons };
}

function escalate(severity: SeverityLevel): SeverityLevel {
  switch (severity) {
    case 'low': return 'standard';
    case 'standard': return 'high';
    case 'high': return 'high';
    case 'critical': return 'critical';
  }
}
