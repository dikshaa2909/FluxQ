/**
 * Queue-specific starvation thresholds and duration predictions.
 */
import { QueueType, SeverityLevel } from './types';

// ============================================================
// STARVATION THRESHOLDS (minutes)
// ============================================================

export function getStarvationThreshold(
  queueType: QueueType,
  severity: SeverityLevel,
  pattern: string
): number {
  if (severity === 'critical') return 0;

  switch (queueType) {
    case 'diabetes':
      if (severity === 'high') return 25;
      if (severity === 'standard') return 45;
      return 70;

    case 'cholesterol':
      if (severity === 'high') {
        if (pattern === 'secondaryPrevActive') return 35;
        if (pattern === 'secondaryPrevStable') return 50;
        return 55;
      }
      if (severity === 'standard') return 70;
      return 90;

    case 'bloodPressure':
      if (severity === 'high') {
        // Check comorbidity pattern
        if (pattern === 'stage2Comorbid' || pattern === 'hypertensiveUrgency') return 15;
        return 28;
      }
      if (severity === 'standard') return 45;
      return 65;

    case 'general':
      if (severity === 'high') return 30;
      if (severity === 'standard') return 50;
      if (severity === 'low') {
        // Check if routine (0-1 points)
        const pointsMatch = pattern.match(/points:(\d+)/);
        const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 3;
        if (points <= 1) return 100;
        return 75;
      }
      return 75;

    default:
      return 60;
  }
}

// ============================================================
// DURATION PREDICTIONS (minutes)
// ============================================================

export function getDurationPrediction(
  queueType: QueueType,
  severity: SeverityLevel,
  pattern: string
): number {
  const variance = (Math.random() * 2 - 1); // ±1 scaled by queue

  switch (queueType) {
    case 'diabetes': {
      let base: number;
      if (severity === 'high') base = 24;
      else if (severity === 'standard') base = 18;
      else base = 12;
      return Math.max(8, Math.round(base + variance * 4));
    }

    case 'cholesterol': {
      let base: number;
      if (pattern === 'secondaryPrevActive') base = 30;
      else if (pattern === 'secondaryPrevStable') base = 24;
      else if (pattern === 'familial') base = 22;
      else if (severity === 'standard') base = 18;
      else base = 12;
      return Math.max(8, Math.round(base + variance * 4));
    }

    case 'bloodPressure': {
      let base: number;
      if (severity === 'critical') base = 35;
      else if (severity === 'high' && (pattern === 'stage2Comorbid' || pattern === 'hypertensiveUrgency')) base = 28;
      else if (severity === 'high') base = 22;
      else if (severity === 'standard') base = 18;
      else base = 12;
      return Math.max(8, Math.round(base + variance * 5));
    }

    case 'general': {
      let base: number;
      if (severity === 'high') base = 25;
      else if (severity === 'standard') base = 18;
      else if (severity === 'low') {
        const pointsMatch = pattern.match(/points:(\d+)/);
        const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 3;
        base = points <= 1 ? 10 : 14;
      } else base = 14;
      // Mental health add-on
      if (pattern.includes('mentalHealth')) base += 5;
      return Math.max(8, Math.round(base + variance * 4));
    }

    default:
      return 15;
  }
}
