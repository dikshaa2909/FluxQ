import { Patient, UrgencyLevel, QueueOptimizationConfig, DEFAULT_CONFIG, Doctor } from './types';
import { baseSeverityScore } from './classifiers/redFlags';

/**
 * PriorityScorer — Clinical priority formula:
 *
 * For patients WITH intake classification (new system):
 *   FinalScore = BaseSeverityScore × ClinicalMultiplier
 *                + min(waitMinutes, 60) / 60 × 100
 *                + max(0, (waitMinutes − StarvationThreshold) / 30) × BaseSeverityScore
 *   CRISIS → FinalScore = 9999
 *
 * For patients WITHOUT intake (legacy compatibility):
 *   Base = (w_s × SeverityScore) + (w_w × WaitTimeScore) + ComplexityBonus + DoctorMatchBonus
 *   If wait > threshold: FinalScore = Base × (1 + excessWait / 30)
 */
export class PriorityScorer {
  private config: QueueOptimizationConfig;

  private static SEVERITY_SCORES: Record<UrgencyLevel, number> = {
    CRITICAL: 200,
    HIGH: 150,
    STANDARD: 75,
    LOW: 25,
  };

  private static FAIRNESS_THRESHOLDS: Record<UrgencyLevel, number> = {
    CRITICAL: 15,
    HIGH: 30,
    STANDARD: 45,
    LOW: 60,
  };

  constructor(config: Partial<QueueOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Complexity bonus (0–15 points) from patient history + symptoms (legacy)
   */
  private complexityBonus(patient: Patient): number {
    let score = 0;
    if (patient.hasComplexHistory) score += 6;
    if (patient.isMultiSymptom) score += 5;
    if (patient.isReturning) score += 2;
    if (patient.age > 60) score += 2;
    return Math.min(score, 15);
  }

  /**
   * Calculate priority score.
   * Uses clinical formula when classification data is present, falls back to legacy.
   */
  calculatePriorityScore(
    patient: Patient,
    _allPatients: Patient[],
    availableDoctors?: Doctor[]
  ): number {
    // New clinical scoring path
    if (patient.classification) {
      return this.calculateClinicalScore(patient);
    }
    // Legacy scoring path
    return this.calculateLegacyScore(patient, _allPatients, availableDoctors);
  }

  /**
   * New clinical priority formula from spec:
   *   FinalScore = BaseSeverityScore × ClinicalMultiplier
   *                + min(waitMinutes, 60) / 60 × 100
   *                + max(0, (waitMinutes − StarvationThreshold) / 30) × BaseSeverityScore
   */
  private calculateClinicalScore(patient: Patient): number {
    const cls = patient.classification!;

    // CRISIS bypass
    if (cls.severity === 'critical') return 9999;

    const baseScore = cls.baseSeverityScore;
    const multiplier = cls.clinicalMultiplier;
    const wait = patient.waitTime || 0;

    // Clinical score
    const clinicalScore = baseScore * multiplier;

    // Wait time score: clamped at 60 min
    const waitScore = Math.min(wait, 60) / 60 * 100;

    // Fairness boost: additive, prevents starvation
    const threshold = cls.starvationThreshold;
    const fairnessBoost = Math.max(0, (wait - threshold) / 25) * baseScore;

    // SJF bonus: shorter consultations clear queue faster
    const duration = patient.estimatedDuration || 15;
    const durationBonus = Math.max(0, (30 - duration) / 30) * (baseScore * 0.12);

    return clinicalScore + waitScore + fairnessBoost + durationBonus;
  }

  /**
   * Legacy weighted formula (backwards compatible)
   */
  private calculateLegacyScore(
    patient: Patient,
    _allPatients: Patient[],
    availableDoctors?: Doctor[]
  ): number {
    const severityScore = PriorityScorer.SEVERITY_SCORES[patient.urgency];
    const wait = patient.waitTime || 0;
    const waitTimeScore = (wait / 60) * 100;
    const complexity = this.complexityBonus(patient);

    let doctorMatchBonus = 5;
    if (patient.preferredDoctorId && availableDoctors) {
      const match = availableDoctors.find(
        d => d.id === patient.preferredDoctorId && d.isAvailable
      );
      if (match) doctorMatchBonus = 10;
    }

    // SJF bonus: shorter consultations clear queue faster → lower avg wait
    const duration = patient.estimatedDuration || 15;
    const durationBonus = Math.max(0, (30 - duration) / 30) * 18;

    const base =
      this.config.severityWeight * severityScore +
      this.config.waitTimeWeight * waitTimeScore +
      complexity +
      doctorMatchBonus +
      durationBonus;

    const threshold = PriorityScorer.FAIRNESS_THRESHOLDS[patient.urgency];
    if (wait > threshold) {
      const excess = wait - threshold;
      const boostFactor = 1 + excess / 25;
      return base * boostFactor;
    }

    return base;
  }

  scoreAllPatients(
    patients: Patient[],
    availableDoctors?: Doctor[]
  ): Array<{ patient: Patient; score: number }> {
    return patients
      .map(patient => ({
        patient,
        score: this.calculatePriorityScore(patient, patients, availableDoctors),
      }))
      .sort((a, b) => b.score - a.score);
  }

  getScoreExplanation(
    patient: Patient,
    allPatients: Patient[],
    availableDoctors?: Doctor[]
  ): string {
    const final = this.calculatePriorityScore(patient, allPatients, availableDoctors);

    // Clinical explanation
    if (patient.classification) {
      const cls = patient.classification;
      const wait = patient.waitTime || 0;
      const waitScore = Math.min(wait, 60) / 60 * 100;
      const fairnessBoost = Math.max(0, (wait - cls.starvationThreshold) / 25) * cls.baseSeverityScore;
      const duration = patient.estimatedDuration || 15;
      const durationBonus = Math.max(0, (30 - duration) / 30) * (cls.baseSeverityScore * 0.12);

      return `
  Priority Score: ${final.toFixed(1)} [${cls.queueType} queue]
├── Severity: ${cls.severity.toUpperCase()} (base: ${cls.baseSeverityScore})
├── Clinical Multiplier: ×${cls.clinicalMultiplier.toFixed(2)} (pattern: ${cls.symptomPattern})
├── Clinical Score: ${(cls.baseSeverityScore * cls.clinicalMultiplier).toFixed(1)}
├── Wait Score: ${waitScore.toFixed(1)} (${wait.toFixed(0)} min waited)
├── Fairness Boost: ${fairnessBoost.toFixed(1)} (threshold: ${cls.starvationThreshold} min)
├── Duration Bonus: ${durationBonus.toFixed(1)} (${duration} min consult)
└── Severity: ${cls.severity === 'critical' ? 'CRITICAL' : cls.severity.toUpperCase()}
      `.trim();
    }

    // Legacy explanation
    const severity = PriorityScorer.SEVERITY_SCORES[patient.urgency];
    const wait = patient.waitTime || 0;
    const waitScore = (wait / 60) * 100;
    const complexity = this.complexityBonus(patient);
    const threshold = PriorityScorer.FAIRNESS_THRESHOLDS[patient.urgency];
    const excess = Math.max(0, wait - threshold);
    const boostFactor = excess > 0 ? 1 + excess / 25 : 1;
    const duration = patient.estimatedDuration || 15;
    const durationBonus = Math.max(0, (30 - duration) / 30) * 18;

    return `
  Priority Score: ${final.toFixed(1)}
├── Severity (${patient.urgency}): ${severity} × ${this.config.severityWeight} = ${(severity * this.config.severityWeight).toFixed(1)}
├── Wait Score: ${waitScore.toFixed(1)} × ${this.config.waitTimeWeight} = ${(waitScore * this.config.waitTimeWeight).toFixed(1)} (${wait.toFixed(0)} min waited)
├── Complexity Bonus: ${complexity}
├── Doctor Match Bonus: scored
├── Duration Bonus: ${durationBonus.toFixed(1)} (${duration} min consult)
└── Fairness Boost: ×${boostFactor.toFixed(2)} (threshold: ${threshold} min)
    `.trim();
  }
}
