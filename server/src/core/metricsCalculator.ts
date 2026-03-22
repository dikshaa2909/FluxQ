import { QueueOrder, Metrics, UrgencyLevel } from './types';

/**
 * MetricsCalculator — Calculates all TeleMedQ performance metrics
 * Including median wait, patient satisfaction, and overtime
 */
export class MetricsCalculator {
  // Weight multipliers for urgency-based calculations
  private static URGENCY_WEIGHTS: Record<UrgencyLevel, number> = {
    CRITICAL: 4.0,
    HIGH: 3.0,
    STANDARD: 2.0,
    LOW: 1.0,
  };

  static calculateMetrics(
    queueOrders: QueueOrder[],
    scheduledWindowMinutes: number = 240,
    numDoctors: number = 1
  ): Metrics {
    if (queueOrders.length === 0) {
      return {
        averageWaitTime: 0,
        medianWaitTime: 0,
        maxWaitTime: 0,
        minWaitTime: 0,
        fairnessScore: 100,
        doctorUtilization: 0,
        throughput: 0,
        patientSatisfaction: 10,
        totalOvertime: 0,
      };
    }

    const waitTimes = queueOrders.map(q => q.estimatedWaitTime);
    const sorted = [...waitTimes].sort((a, b) => a - b);

    // Standard average
    const averageWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    
    // Weighted average that prioritizes clinical urgency
    // Lower wait for CRITICAL counts more than lower wait for LOW
    let totalWeight = 0;
    let weightedSum = 0;
    queueOrders.forEach(o => {
      const weight = this.URGENCY_WEIGHTS[o.patient.urgency];
      weightedSum += o.estimatedWaitTime * weight;
      totalWeight += weight;
    });
    const weightedAverageWaitTime = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    const medianWaitTime =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    const maxWaitTime = Math.max(...waitTimes);
    const minWaitTime = Math.min(...waitTimes);

    const fairnessScore = this.calculateFairnessScore(queueOrders);
    const doctorUtilization = this.calculateDoctorUtilization(queueOrders, numDoctors);
    const throughput = this.calculateThroughput(queueOrders);

    // Fairness violations count (approximate from score)
    const violationEstimate = Math.round((100 - fairnessScore) / 10);

    // Satisfaction: continuous urgency-weighted score
    // Smooth decay: score = max(0, 1 - wait/(2×threshold))
    // Rewards serving CRITICAL patients fast (high weight, tight threshold)
    // FIFO lets CRITICAL/HIGH patients wait 2-3× threshold → score=0 for those
    const threshMap: Record<string, number> = { CRITICAL: 15, HIGH: 30, STANDARD: 45, LOW: 60 };
    let satisfactionSum = 0;
    let totalUrgencyWeight = 0;
    queueOrders.forEach(o => {
      const w = this.URGENCY_WEIGHTS[o.patient.urgency];
      const thresh = threshMap[o.patient.urgency] || 45;
      const ratio = o.estimatedWaitTime / thresh;
      const score = Math.max(0, 1 - ratio / 2);
      satisfactionSum += w * score;
      totalUrgencyWeight += w;
    });
    const weightedSatisfaction = totalUrgencyWeight > 0 ? satisfactionSum / totalUrgencyWeight : 1;
    const patientSatisfaction = Math.max(
      0,
      Math.min(10, weightedSatisfaction * 10)
    );

    // Overtime: total time beyond scheduled window
    const firstStart = queueOrders[0].estimatedStartTime;
    const lastEnd = queueOrders[queueOrders.length - 1].estimatedEndTime;
    const totalSessionMinutes = (lastEnd.getTime() - firstStart.getTime()) / 60000;
    const totalOvertime = Math.max(0, totalSessionMinutes - scheduledWindowMinutes);

    return {
      averageWaitTime: this.round(averageWaitTime),
      medianWaitTime: this.round(medianWaitTime),
      maxWaitTime: this.round(maxWaitTime),
      minWaitTime: this.round(minWaitTime),
      fairnessScore: this.round(fairnessScore),
      doctorUtilization: this.round(doctorUtilization),
      throughput: this.round(throughput),
      patientSatisfaction: this.round(patientSatisfaction),
      totalOvertime: this.round(totalOvertime),
    };
  }

  private static calculateFairnessScore(queueOrders: QueueOrder[]): number {
    // Thresholds per urgency level (max acceptable wait in minutes)
    const thresholds: Record<string, number> = {
      CRITICAL: 15,
      HIGH: 30,
      STANDARD: 45,
      LOW: 60,
    };

    const total = queueOrders.length;
    if (total === 0) return 100;

    // Count patients within their acceptable threshold
    const withinThreshold = queueOrders.filter(order => {
      const threshold = thresholds[order.patient.urgency] || 45;
      return order.estimatedWaitTime <= threshold;
    }).length;

    // Calculate overage penalty
    let overagePenalty = 0;
    queueOrders.forEach(order => {
      const threshold = thresholds[order.patient.urgency] || 45;
      if (order.estimatedWaitTime > threshold) {
        const overageRatio = Math.min((order.estimatedWaitTime - threshold) / threshold, 1);
        overagePenalty += overageRatio;
      }
    });
    overagePenalty = overagePenalty / total;

    // Fairness = 70% on-time ratio + 30% overage penalty
    const onTimeRatio = withinThreshold / total;
    return onTimeRatio * 70 + (1 - overagePenalty) * 30;
  }

  private static calculateDoctorUtilization(queueOrders: QueueOrder[], numDoctors: number = 1): number {
    if (queueOrders.length === 0) return 0;
    const firstStart = queueOrders[0].estimatedStartTime;
    const lastEnd = queueOrders[queueOrders.length - 1].estimatedEndTime;
    const totalTime = (lastEnd.getTime() - firstStart.getTime()) / 60000;
    const consultationTime = queueOrders.reduce((sum, order) => {
      return sum + (order.estimatedEndTime.getTime() - order.estimatedStartTime.getTime()) / 60000;
    }, 0);
    const effectiveDoctors = Math.max(1, numDoctors);
    return totalTime === 0 ? 0 : Math.min(100, (consultationTime / (totalTime * effectiveDoctors)) * 100);
  }

  private static calculateThroughput(queueOrders: QueueOrder[]): number {
    if (queueOrders.length === 0) return 0;
    const firstStart = queueOrders[0].estimatedStartTime;
    const lastEnd = queueOrders[queueOrders.length - 1].estimatedEndTime;
    const totalTime = (lastEnd.getTime() - firstStart.getTime()) / 60000;
    if (totalTime === 0) return 0;
    return (queueOrders.length / totalTime) * 60;
  }

  private static round(n: number): number {
    return Math.round(n * 100) / 100;
  }

  static compareMetrics(
    baseline: Metrics,
    optimized: Metrics
  ): {
    baseline: Metrics;
    optimized: Metrics;
    improvements: {
      waitTimeReduction: number;
      fairnessImprovement: number;
      utilizationImprovement: number;
      throughputImprovement: number;
      satisfactionImprovement: number;
      overtimeReduction: number;
    };
  } {
    return {
      baseline,
      optimized,
      improvements: {
        waitTimeReduction:
          baseline.averageWaitTime === 0
            ? 0
            : ((baseline.averageWaitTime - optimized.averageWaitTime) / baseline.averageWaitTime) * 100,
        fairnessImprovement: optimized.fairnessScore - baseline.fairnessScore,
        utilizationImprovement: optimized.doctorUtilization - baseline.doctorUtilization,
        throughputImprovement:
          baseline.throughput === 0
            ? 0
            : ((optimized.throughput - baseline.throughput) / baseline.throughput) * 100,
        satisfactionImprovement: optimized.patientSatisfaction - baseline.patientSatisfaction,
        overtimeReduction: baseline.totalOvertime - optimized.totalOvertime,
      },
    };
  }

  static getMetricsSummary(metrics: Metrics): string {
    return `
Queue Performance Metrics:
├── Average Wait Time: ${metrics.averageWaitTime.toFixed(1)} minutes
├── Median Wait Time: ${metrics.medianWaitTime.toFixed(1)} minutes
├── Max Wait Time: ${metrics.maxWaitTime.toFixed(1)} minutes
├── Min Wait Time: ${metrics.minWaitTime.toFixed(1)} minutes
├── Fairness Score: ${metrics.fairnessScore.toFixed(1)}/100
├── Doctor Utilization: ${metrics.doctorUtilization.toFixed(1)}%
├── Throughput: ${metrics.throughput.toFixed(1)} patients/hour
├── Patient Satisfaction: ${metrics.patientSatisfaction.toFixed(1)}/10
└── Total Overtime: ${metrics.totalOvertime.toFixed(1)} minutes
    `.trim();
  }
}
