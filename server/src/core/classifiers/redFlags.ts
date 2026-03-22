import {
  EmergencySignals,
  ComfortLevel,
  SeverityLevel,
} from '../types';

export interface RedFlagResult {
  triggered: boolean;
  level: 'critical' | 'high' | 'none';
  reasons: string[];
}

/**
 * Global Red Flag Override — runs BEFORE any queue-specific logic.
 * Detects stroke, MI, and hypertensive emergency markers from Q4 signals.
 */
export function checkRedFlags(
  signals: EmergencySignals,
  comfort: ComfortLevel
): RedFlagResult {
  const reasons: string[] = [];

  // CRISIS combinations
  if (signals.chestPain && signals.breathingDifficulty) {
    reasons.push('Chest pain + breathing difficulty → possible MI');
    return { triggered: true, level: 'critical', reasons };
  }

  if (signals.severeHeadache && (signals.confusion || signals.visionLoss || signals.limbWeakness)) {
    reasons.push('Severe headache + neurological signs → possible stroke');
    return { triggered: true, level: 'critical', reasons };
  }

  if (signals.confusion && comfort >= 3) {
    reasons.push('Confusion + comfort ≥ 3 → altered mental status');
    return { triggered: true, level: 'critical', reasons };
  }

  if (signals.visionLoss) {
    reasons.push('Sudden vision loss → possible stroke/retinal emergency');
    return { triggered: true, level: 'critical', reasons };
  }

  if (signals.limbWeakness) {
    reasons.push('One-sided limb/face weakness → possible stroke');
    return { triggered: true, level: 'critical', reasons };
  }

  // HIGH overrides (single signals)
  const highReasons: string[] = [];

  if (signals.fainting) {
    highReasons.push('Fainting → vasovagal/cardiac syncope risk');
  }
  if (signals.chestPain) {
    highReasons.push('Chest pain → cardiac evaluation needed');
  }
  if (signals.breathingDifficulty) {
    highReasons.push('Breathing difficulty at rest → respiratory compromise');
  }

  if (highReasons.length > 0) {
    return { triggered: true, level: 'high', reasons: highReasons };
  }

  return { triggered: false, level: 'none', reasons: [] };
}

/**
 * Map severity level to urgency level for backwards compatibility.
 */
export function severityToUrgency(severity: SeverityLevel): 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW' {
  switch (severity) {
    case 'critical': return 'CRITICAL';
    case 'high': return 'HIGH';
    case 'standard': return 'STANDARD';
    case 'low': return 'LOW';
  }
}

/** Base severity score mapping */
export function baseSeverityScore(severity: SeverityLevel): number {
  switch (severity) {
    case 'critical': return 9999;
    case 'high': return 150;
    case 'standard': return 75;
    case 'low': return 25;
  }
}
