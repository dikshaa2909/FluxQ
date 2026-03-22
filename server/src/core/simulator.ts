import {
  Patient,
  Doctor,
  QueueOptimizationConfig,
  OptimizationResult,
  QueueOrder,
  DEFAULT_CONFIG,
  FairnessReport,
} from './types';
import { QueueOptimizer } from './queueOptimizer';
import { MetricsCalculator } from './metricsCalculator';
import { FairnessEngine } from './fairnessEngine';

/**
 * QueueSimulator — Runs full TeleMedQ dual-mode simulation
 * Compares Baseline (FIFO) vs Optimized (Priority-Scheduled)
 * and produces structured output with fairness report
 */
export class QueueSimulator {
  private optimizer: QueueOptimizer;
  private fairnessEngine: FairnessEngine;
  private config: QueueOptimizationConfig;
  private startTime: Date;

  constructor(config: Partial<QueueOptimizationConfig> = {}, startTime: Date = new Date()) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.optimizer = new QueueOptimizer(this.config);
    this.fairnessEngine = new FairnessEngine(this.config);
    this.startTime = startTime;
  }

  simulate(patients: Patient[], doctors?: Doctor[]): OptimizationResult {
    if (patients.length === 0) {
      const emptyMetrics = MetricsCalculator.calculateMetrics([], this.config.scheduledWindowMinutes);
      return {
        baselineQueue: [],
        optimizedQueue: [],
        baselineMetrics: emptyMetrics,
        optimizedMetrics: emptyMetrics,
        fairnessReport: { agingBoosts: [], violations: [], fairnessScore: 100, starvationRisks: [] },
        recommendations: ['No patients to optimize'],
      };
    }

    // Hydrate wait times
    const patientsWithWait = patients.map(p => ({
      ...p,
      waitTime: Math.max(
        p.waitTime || 0,
        (this.startTime.getTime() - p.arrivalTime.getTime()) / 60000
      ),
    }));

    const { baseline, optimized } = this.optimizer.compareQueues(
      patientsWithWait,
      this.startTime,
      doctors
    );

    const numDocs = doctors?.filter(d => d.isAvailable).length ?? 1;
    const baselineMetrics = MetricsCalculator.calculateMetrics(baseline, this.config.scheduledWindowMinutes, numDocs);
    const optimizedMetrics = MetricsCalculator.calculateMetrics(optimized, this.config.scheduledWindowMinutes, numDocs);

    const fairnessReport = this.fairnessEngine.generateReport(optimized, patientsWithWait);

    const recommendations = this.generateRecommendations(
      baselineMetrics,
      optimizedMetrics,
      baseline,
      optimized,
      fairnessReport
    );

    return {
      baselineQueue: baseline,
      optimizedQueue: optimized,
      baselineMetrics,
      optimizedMetrics,
      fairnessReport,
      recommendations,
    };
  }

  private generateRecommendations(
    baselineMetrics: any,
    optimizedMetrics: any,
    baselineQueue: QueueOrder[],
    optimizedQueue: QueueOrder[],
    fairnessReport: FairnessReport
  ): string[] {
    const recs: string[] = [];

    const waitReduction =
      baselineMetrics.averageWaitTime === 0
        ? 0
        : ((baselineMetrics.averageWaitTime - optimizedMetrics.averageWaitTime) /
            baselineMetrics.averageWaitTime) *
          100;

    recs.push(
      `✅ Priority scheduling reduces avg wait by ${waitReduction.toFixed(1)}% ` +
        `(${baselineMetrics.averageWaitTime.toFixed(1)} → ${optimizedMetrics.averageWaitTime.toFixed(1)} min)`
    );

    // Per-urgency clinical benefit
    const urgencyAvg = (queue: QueueOrder[], urgency: string) => {
      const matched = queue.filter(o => o.patient.urgency === urgency);
      if (matched.length === 0) return 0;
      return matched.reduce((s, o) => s + o.estimatedWaitTime, 0) / matched.length;
    };
    const critBase = urgencyAvg(baselineQueue, 'CRITICAL');
    const critOpt = urgencyAvg(optimizedQueue, 'CRITICAL');
    if (critBase > 0 && critOpt < critBase) {
      const pct = ((critBase - critOpt) / critBase) * 100;
      recs.push(
        `🏥 CRITICAL patient avg wait reduced ${pct.toFixed(0)}% ` +
          `(${critBase.toFixed(1)} → ${critOpt.toFixed(1)} min)`
      );
    }
    const highBase = urgencyAvg(baselineQueue, 'HIGH');
    const highOpt = urgencyAvg(optimizedQueue, 'HIGH');
    if (highBase > 0 && highOpt < highBase) {
      const pct = ((highBase - highOpt) / highBase) * 100;
      recs.push(
        `📋 HIGH-urgency patient avg wait reduced ${pct.toFixed(0)}% ` +
          `(${highBase.toFixed(1)} → ${highOpt.toFixed(1)} min)`
      );
    }

    if (fairnessReport.violations.length > 0) {
      recs.push(
        `⚠️ ${fairnessReport.violations.length} fairness violation(s) detected — ` +
          `consider adding another provider or adjusting interleave ratio`
      );
    } else {
      recs.push('✅ Zero fairness violations — all rules F1–F4 passed');
    }

    if (optimizedMetrics.doctorUtilization < 85) {
      recs.push(
        `📈 Doctor utilization at ${optimizedMetrics.doctorUtilization.toFixed(1)}% — ` +
          `reduce idle gaps by pre-assigning next patient during consultations`
      );
    }

    if (optimizedMetrics.totalOvertime > 0) {
      recs.push(
        `⏱️ ${optimizedMetrics.totalOvertime.toFixed(0)} min overtime — ` +
          `cap intake 30 min before window end or add express lane for LOW urgency`
      );
    }

    if (fairnessReport.starvationRisks.length > 0) {
      recs.push(
        `🔍 ${fairnessReport.starvationRisks.length} patient(s) approaching starvation threshold — ` +
          `monitor and consider early promotion`
      );
    }

    return recs;
  }

  /**
   * Format results using the TeleMedQ structured output format
   */
  formatResults(result: OptimizationResult, doctors?: Doctor[]): string {
    const totalPatients = result.optimizedQueue.length;
    const windowMin = this.config.scheduledWindowMinutes;

    // ── SIMULATION SUMMARY ──
    let out = `
## 🏥 SIMULATION SUMMARY
Window: ${windowMin} min | Patients: ${totalPatients} | Doctors: ${doctors?.length ?? 1}
Specialties: ${doctors?.map(d => d.specialty).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'General'}

## 📋 PATIENT QUEUE TABLE (Optimized Order)
┌──────┬──────────┬────────┬───────────┬─────────┬─────────┬──────────┐
│  #   │ ID       │Urgency │ Entry     │ Est Dur │ PriScore│ Doctor   │
├──────┼──────────┼────────┼───────────┼─────────┼─────────┼──────────┤`;

    for (const o of result.optimizedQueue) {
      const entry = o.patient.arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dur = `${o.patient.estimatedDuration || '?'} min`;
      const pri = (o.priorityScore ?? 0).toFixed(1);
      const doc = o.assignedDoctor?.name || 'Auto';
      out += `\n│ ${String(o.position).padStart(4)} │ ${o.patient.id.padEnd(8)} │${o.patient.urgency.padEnd(8)}│ ${entry.padEnd(9)} │ ${dur.padEnd(7)} │ ${pri.padStart(7)} │ ${doc.padEnd(8)} │`;
    }

    out += `\n└──────┴──────────┴────────┴───────────┴─────────┴─────────┴──────────┘`;

    // ── BASELINE vs OPTIMIZED ──
    const b = result.baselineMetrics;
    const o = result.optimizedMetrics;
    const d = (bv: number, ov: number) => {
      const diff = ov - bv;
      return (diff >= 0 ? '+' : '') + diff.toFixed(1);
    };
    const dPct = (bv: number, ov: number) => {
      if (bv === 0) return '+0.0%';
      const pct = ((ov - bv) / Math.abs(bv)) * 100;
      return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
    };

    out += `

## 📊 BASELINE vs OPTIMIZED COMPARISON
┌─────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Metric                  │  Baseline    │  Optimized   │  Δ Change    │
├─────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Avg Wait Time (min)     │ ${String(b.averageWaitTime.toFixed(1)).padStart(12)} │ ${String(o.averageWaitTime.toFixed(1)).padStart(12)} │ ${String(d(b.averageWaitTime, o.averageWaitTime)).padStart(12)} │
│ Median Wait Time (min)  │ ${String(b.medianWaitTime.toFixed(1)).padStart(12)} │ ${String(o.medianWaitTime.toFixed(1)).padStart(12)} │ ${String(d(b.medianWaitTime, o.medianWaitTime)).padStart(12)} │
│ Max Wait Time (min)     │ ${String(b.maxWaitTime.toFixed(1)).padStart(12)} │ ${String(o.maxWaitTime.toFixed(1)).padStart(12)} │ ${String(d(b.maxWaitTime, o.maxWaitTime)).padStart(12)} │
│ Provider Utilization %  │ ${String(b.doctorUtilization.toFixed(1)).padStart(12)} │ ${String(o.doctorUtilization.toFixed(1)).padStart(12)} │ ${String(d(b.doctorUtilization, o.doctorUtilization)).padStart(12)} │
│ Throughput (pts/hr)     │ ${String(b.throughput.toFixed(1)).padStart(12)} │ ${String(o.throughput.toFixed(1)).padStart(12)} │ ${String(dPct(b.throughput, o.throughput)).padStart(12)} │
│ Patient Satisfaction    │ ${String(b.patientSatisfaction.toFixed(1)).padStart(12)} │ ${String(o.patientSatisfaction.toFixed(1)).padStart(12)} │ ${String(d(b.patientSatisfaction, o.patientSatisfaction)).padStart(12)} │
│ Total Overtime (min)    │ ${String(b.totalOvertime.toFixed(1)).padStart(12)} │ ${String(o.totalOvertime.toFixed(1)).padStart(12)} │ ${String(d(b.totalOvertime, o.totalOvertime)).padStart(12)} │
└─────────────────────────┴──────────────┴──────────────┴──────────────┘`;

    // ── FAIRNESS REPORT ──
    const fr = result.fairnessReport;
    out += `

## ⚖️ FAIRNESS REPORT
Fairness Score: ${fr.fairnessScore}/100`;

    if (fr.agingBoosts.length > 0) {
      out += `\n\nAging Boosts Applied:`;
      for (const ab of fr.agingBoosts) {
        out += `\n  • ${ab.patientId}: waited ${ab.waitMinutes.toFixed(0)} min → +${ab.boostApplied} priority boost`;
      }
    } else {
      out += `\nNo aging boosts needed.`;
    }

    if (fr.violations.length > 0) {
      out += `\n\nRule Violations:`;
      for (const v of fr.violations) {
        out += `\n  ❌ [${v.rule}] ${v.patientId}: ${v.reason}`;
      }
    } else {
      out += `\nNo rule violations (F1–F4 all passed). ✅`;
    }

    if (fr.starvationRisks.length > 0) {
      out += `\n\nStarvation Risk List:`;
      for (const sr of fr.starvationRisks) {
        out += `\n  ⚠️ ${sr.patientId} (${sr.urgency}): ${sr.currentWait.toFixed(0)} min / ${sr.threshold} min threshold (${sr.percentToThreshold}%)`;
      }
    }

    // ── RECOMMENDATIONS ──
    out += `

## 💡 RECOMMENDATIONS`;
    result.recommendations.forEach((rec, i) => {
      out += `\n${i + 1}. ${rec}`;
    });

    return out;
  }
}
