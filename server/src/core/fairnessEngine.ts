import {
  Patient,
  QueueOrder,
  QueueOptimizationConfig,
  DEFAULT_CONFIG,
  FairnessReport,
  FairnessViolation,
  AgingBoost,
  StarvationRisk,
  UrgencyLevel,
} from './types';

/**
 * FairnessEngine — Enforces aging boosts, hard rules F1–F4,
 * and generates a complete fairness report for every queue state.
 */
export class FairnessEngine {
  private config: QueueOptimizationConfig;

  constructor(config: Partial<QueueOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compute aging boosts for all patients based on their current wait time.
   */
  computeAgingBoosts(patients: Patient[]): AgingBoost[] {
    const boosts: AgingBoost[] = [];
    for (const p of patients) {
      const wait = p.waitTime || 0;
      if (p.urgency === 'CRITICAL' || p.urgency === 'HIGH') continue;

      let boost = 0;
      for (const t of this.config.agingThresholds) {
        if (wait >= t.minutes) boost = t.boost;
      }
      if (boost > 0) {
        boosts.push({
          patientId: p.id,
          waitMinutes: wait,
          boostApplied: boost,
          newPriority: -1, // filled by caller after re-scoring
        });
      }
    }
    return boosts;
  }

  /**
   * Identify patients who must be assigned the next slot (wait ≥ mandatorySlotAfter).
   * This only applies to STANDARD and LOW patients to prevent starvation.
   * CRITICAL/HIGH patients get priority through the scoring system, not mandatory slots.
   */
  getMandatoryNextSlotPatients(patients: Patient[]): Patient[] {
    return patients.filter(
      p => 
        (p.urgency === 'STANDARD' || p.urgency === 'LOW') &&
        (p.waitTime || 0) >= this.config.mandatorySlotAfter
    );
  }

  /**
   * Check all hard fairness rules against a finalized queue.
   */
  checkRules(queue: QueueOrder[]): FairnessViolation[] {
    const violations: FairnessViolation[] = [];

    // Compute current average wait
    const waitTimes = queue.map(o => o.estimatedWaitTime);
    const avgWait = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;

    // F1: No STANDARD patient waits > 3× current average wait
    for (const order of queue) {
      if (order.patient.urgency === 'STANDARD' && order.estimatedWaitTime > 3 * avgWait && avgWait > 0) {
        violations.push({
          patientId: order.patient.id,
          rule: 'F1',
          reason: `STANDARD patient waited ${order.estimatedWaitTime.toFixed(1)} min (> 3× avg ${avgWait.toFixed(1)} min)`,
          waitTime: order.estimatedWaitTime,
        });
      }
    }

    // F2: No LOW priority patient waits > maxWaitTimeForLowPriority
    for (const order of queue) {
      if (order.patient.urgency === 'LOW' && order.estimatedWaitTime > this.config.maxWaitTimeForLowPriority) {
        violations.push({
          patientId: order.patient.id,
          rule: 'F2',
          reason: `LOW patient waited ${order.estimatedWaitTime.toFixed(1)} min (> ${this.config.maxWaitTimeForLowPriority} min limit)`,
          waitTime: order.estimatedWaitTime,
        });
      }
    }

    // F3: After every 3 CRITICAL/HIGH served, 1 STANDARD must be served
    let highCount = 0;
    for (const order of queue) {
      const u = order.patient.urgency;
      if (u === 'CRITICAL' || u === 'HIGH') {
        highCount++;
        if (highCount > this.config.interleaveAfter) {
          violations.push({
            patientId: order.patient.id,
            rule: 'F3',
            reason: `${highCount} consecutive CRITICAL/HIGH served without interleaving a STANDARD patient`,
            waitTime: order.estimatedWaitTime,
          });
        }
      } else {
        highCount = 0; // reset on non-high
      }
    }

    // F4: catch-all — flag any remaining extreme outliers
    for (const order of queue) {
      const limit = this.getMaxAcceptableWait(order.patient.urgency, order.patient);
      if (order.estimatedWaitTime > limit * 2) {
        const alreadyFlagged = violations.some(v => v.patientId === order.patient.id);
        if (!alreadyFlagged) {
          violations.push({
            patientId: order.patient.id,
            rule: 'F4',
            reason: `Patient waited ${order.estimatedWaitTime.toFixed(1)} min (> 2× acceptable ${limit} min)`,
            waitTime: order.estimatedWaitTime,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Identify patients approaching violation thresholds.
   */
  getStarvationRisks(queue: QueueOrder[]): StarvationRisk[] {
    const risks: StarvationRisk[] = [];
    for (const order of queue) {
      const threshold = this.getMaxAcceptableWait(order.patient.urgency, order.patient);
      const pct = (order.estimatedWaitTime / threshold) * 100;
      if (pct >= 70 && order.estimatedWaitTime < threshold) {
        risks.push({
          patientId: order.patient.id,
          urgency: order.patient.urgency,
          currentWait: order.estimatedWaitTime,
          threshold,
          percentToThreshold: Math.round(pct),
        });
      }
    }
    return risks.sort((a, b) => b.percentToThreshold - a.percentToThreshold);
  }

  /**
   * Generate the full fairness report for a queue.
   */
  generateReport(queue: QueueOrder[], patients: Patient[]): FairnessReport {
    const agingBoosts = this.computeAgingBoosts(patients);
    const violations = this.checkRules(queue);
    const starvationRisks = this.getStarvationRisks(queue);

    // Fairness score: 100 – (violations × penalty)
    const penalty = violations.length * (100 / Math.max(queue.length, 1));
    const fairnessScore = Math.max(0, Math.round(100 - penalty));

    return { agingBoosts, violations, fairnessScore, starvationRisks };
  }

  /**
   * Enforce interleaving rule: after N CRITICAL/HIGH patients, inject a STANDARD.
   */
  enforceInterleaving(sortedPatients: Patient[]): Patient[] {
    const result: Patient[] = [];
    const highPool = sortedPatients.filter(p => p.urgency === 'CRITICAL' || p.urgency === 'HIGH');
    const stdPool = sortedPatients.filter(p => p.urgency === 'STANDARD' || p.urgency === 'LOW');

    let hi = 0;
    let si = 0;
    let consecutiveHigh = 0;

    while (hi < highPool.length || si < stdPool.length) {
      if (consecutiveHigh >= this.config.interleaveAfter && si < stdPool.length) {
        result.push(stdPool[si++]);
        consecutiveHigh = 0;
      } else if (hi < highPool.length) {
        result.push(highPool[hi++]);
        consecutiveHigh++;
      } else if (si < stdPool.length) {
        result.push(stdPool[si++]);
        consecutiveHigh = 0;
      }
    }
    return result;
  }

  private getMaxAcceptableWait(urgency: UrgencyLevel, patient?: Patient): number {
    // Use queue-specific starvation threshold if classification is available
    if (patient?.classification) {
      return patient.classification.starvationThreshold;
    }
    // Legacy thresholds
    switch (urgency) {
      case 'CRITICAL': return 15;
      case 'HIGH': return 30;
      case 'STANDARD': return 45;
      case 'LOW': return 60;
    }
  }
}
