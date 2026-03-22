import {
  GeneralSymptoms,
  ComfortLevel,
  OnsetType,
  SeverityLevel,
} from '../types';

export interface GeneralClassification {
  severity: SeverityLevel;
  points: number;
  escalationReasons: string[];
}

/**
 * General Queue Severity Classifier — Point-based system, Steps 1-5 from spec.
 */
export function classifyGeneral(
  symptoms: GeneralSymptoms,
  comfort: ComfortLevel,
  onset: OnsetType
): GeneralClassification {
  const reasons: string[] = [];

  // Step 1 — Immediate escalations
  if (symptoms.bladderBowelLoss) {
    reasons.push('Loss of bladder/bowel control → cauda equina emergency');
    return { severity: 'critical', points: 99, escalationReasons: reasons };
  }
  if (symptoms.rashWithSwelling) {
    reasons.push('Rash + facial/throat swelling → anaphylaxis');
    return { severity: 'critical', points: 99, escalationReasons: reasons };
  }
  if (symptoms.selfHarmThoughts) {
    reasons.push('Self-harm thoughts → mental health emergency');
    return { severity: 'critical', points: 99, escalationReasons: reasons };
  }
  if (symptoms.confusedNotSelf && comfort >= 3) {
    reasons.push('Confused/not self + comfort ≥ 3 → altered mental status');
    return { severity: 'critical', points: 99, escalationReasons: reasons };
  }

  // Step 2 — Point accumulation
  let points = 0;

  // Comfort and impact
  points += comfort;
  points += symptoms.impactLevel;

  // Situation flags
  if (symptoms.highFever) points += 2;
  if (symptoms.worseningRapidly) points += 2;
  if (symptoms.vomitingOver5Times) points += 2;
  if (symptoms.nothingStaysDown) points += 2;
  if (symptoms.worstPainEver) points += 2;
  if (symptoms.gotSeriousBefore) points += 1;
  if (onset === 'acute') points += 1;
  if (symptoms.isOver65) points += 1;
  if (symptoms.immunocompromised) points += 2;
  if (symptoms.isPregnant) points += 1;
  if (symptoms.confusedNotSelf) points += 2; // mild confusion (not crisis)

  // Primary complaint base points
  const complaintPoints: Record<GeneralSymptoms['primaryComplaint'], number> = {
    fever: 2,
    cough: 1,
    stomach: 1,
    pain: 2,
    skin: 1,
    mentalHealth: 1,
    urinary: 1,
    eyeEarDental: 1,
    prescription: 0,
    other: 1,
  };
  points += complaintPoints[symptoms.primaryComplaint] || 0;

  // Step 3 — Severity mapping
  let severity: SeverityLevel;
  if (points >= 10) {
    severity = 'high';
  } else if (points >= 6) {
    severity = 'standard';
  } else {
    severity = 'low';
  }

  // Step 4 — Mental health special rules
  if (symptoms.primaryComplaint === 'mentalHealth' && comfort >= 3 && severity === 'low') {
    severity = 'standard';
    reasons.push('Mental health + comfort ≥ 3 → minimum standard');
  }

  // Step 5 — Elderly / immunocompromised modifier
  if ((symptoms.isOver65 || symptoms.immunocompromised) && severity === 'low') {
    severity = 'standard';
    reasons.push('Elderly/immunocompromised + low → escalated to standard');
  }
  if (symptoms.highFever && symptoms.isOver65 && severity === 'low') {
    severity = 'standard';
    reasons.push('Fever + elderly → at least standard');
  }

  return { severity, points, escalationReasons: reasons };
}
