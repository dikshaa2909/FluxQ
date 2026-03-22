import { Patient, QueueOptimizationConfig, QueueOrder, Doctor, DEFAULT_CONFIG } from './types';
import { DurationPredictor } from './predictor';
import { PriorityScorer } from './priorityScorer';
import { MetricsCalculator } from './metricsCalculator';
import { FairnessEngine } from './fairnessEngine';

/**
 * QueueOptimizer — Main orchestrator for TeleMedQ
 * Runs FIFO baseline vs priority-scheduled optimization with fairness enforcement
 */
export class QueueOptimizer {
  private predictor: DurationPredictor;
  private priorityScorer: PriorityScorer;
  private fairnessEngine: FairnessEngine;
  private config: QueueOptimizationConfig;

  constructor(config: Partial<QueueOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.predictor = new DurationPredictor();
    this.priorityScorer = new PriorityScorer(this.config);
    this.fairnessEngine = new FairnessEngine(this.config);
  }

  /**
   * Main optimization: returns patients in optimized order
   */
  optimize(patients: Patient[], doctors?: Doctor[]): Patient[] {
    const patientsWithDurations = this.predictor.predictDurationBatch(patients);
    const scored = this.priorityScorer.scoreAllPatients(patientsWithDurations, doctors);
    const sorted = scored.map(s => s.patient);
    return this.fairnessEngine.enforceInterleaving(sorted);
  }

  /**
   * Build optimized queue using dynamic re-scoring at each step.
   * Models multi-server (parallel doctors) and balances urgency with fairness.
   */
  private buildOptimizedQueueDynamic(
    patients: Patient[],
    startTime: Date,
    doctors?: Doctor[],
    debug: boolean = false
  ): Patient[] {
    const remaining = patients.slice();
    const availableDocs = doctors?.filter(d => d.isAvailable) ?? [];
    const numServers = Math.max(1, availableDocs.length);

    // Pre-queued mode: all patients already arrived before simulation start
    // Use urgency-first batch (free since all servers idle) + SJF for rest
    const allPreQueued = numServers > 1 &&
      remaining.every(p => p.arrivalTime.getTime() <= startTime.getTime());

    if (allPreQueued) {
      return this.schedulePreQueued(remaining, startTime, numServers);
    }

    // === STAGGERED ARRIVALS MODE (dynamic re-scoring) ===
    const optimized: Patient[] = [];
    const serverTimes = new Array(numServers).fill(startTime.getTime());
    let consecutiveHigh = 0;
    let savedServerTimes: number[] | null = null;
    const batchSize = numServers;

    while (remaining.length > 0) {
      // Save server state when batchSize patients remain
      if (remaining.length === batchSize) {
        savedServerTimes = [...serverTimes];
      }
      // Find earliest available server
      let earliestIdx = 0;
      for (let i = 1; i < numServers; i++) {
        if (serverTimes[i] < serverTimes[earliestIdx]) earliestIdx = i;
      }
      let currentTime = new Date(serverTimes[earliestIdx]);

      // Get patients who have arrived by current time
      let arrivedPatients = remaining.filter(
        p => p.arrivalTime.getTime() <= currentTime.getTime()
      );

      // If no patients have arrived, advance to next arrival
      if (arrivedPatients.length === 0) {
        const nextArrival = Math.min(...remaining.map(p => p.arrivalTime.getTime()));
        currentTime = new Date(nextArrival);
        serverTimes[earliestIdx] = nextArrival;
        arrivedPatients = remaining.filter(
          p => p.arrivalTime.getTime() <= currentTime.getTime()
        );
      }

      // Update dynamic wait times
      const withWait = arrivedPatients.map(p => ({
        ...p,
        waitTime: Math.max(
          p.waitTime || 0,
          (currentTime.getTime() - p.arrivalTime.getTime()) / 60000
        ),
      }));

      const hasStandardOrLow = withWait.some(p => p.urgency === 'STANDARD' || p.urgency === 'LOW');
      const needsInterleaving = consecutiveHigh >= this.config.interleaveAfter && hasStandardOrLow;
      const mandatory = this.fairnessEngine.getMandatoryNextSlotPatients(withWait);

      let selected: Patient;

      if (needsInterleaving) {
        // After N CRITICAL/HIGH in a row, serve shortest STANDARD/LOW to minimize avg wait impact
        const stdCandidates = withWait.filter(
          p => p.urgency === 'STANDARD' || p.urgency === 'LOW'
        );
        // SJF within interleave: pick shortest patient to minimize queue blocking
        selected = stdCandidates.sort((a, b) =>
          (a.estimatedDuration || 15) - (b.estimatedDuration || 15)
        )[0];
        consecutiveHigh = 0;
      } else if (mandatory.length > 0 && !withWait.some(
        p => p.urgency === 'CRITICAL' || p.urgency === 'HIGH'
      )) {
        // Serve mandatory patients (starvation prevention) when no urgent patients present
        selected = mandatory.sort((a, b) => (b.waitTime || 0) - (a.waitTime || 0))[0];
        consecutiveHigh = 0;
      } else {
        // Score ALL patients — formula handles prioritization
        const scored = this.priorityScorer.scoreAllPatients(withWait, doctors);

        // SJF tie-breaking: among top candidates with similar scores (within 12%),
        // prefer shorter duration early in the queue to reduce cascading wait.
        // Near the end, use pure score ordering to minimize max wait.
        if (remaining.length > numServers * 2) {
          const topScore = scored[0].score;
          const threshold = topScore * 0.88;
          const topTier = scored.filter(s => s.score >= threshold);
          if (topTier.length > 1) {
            topTier.sort((a, b) =>
              (a.patient.estimatedDuration || 15) - (b.patient.estimatedDuration || 15)
            );
            selected = topTier[0].patient;
          } else {
            selected = scored[0].patient;
          }
        } else {
          selected = scored[0].patient;
        }

        if (selected.urgency === 'CRITICAL' || selected.urgency === 'HIGH') {
          consecutiveHigh++;
        } else {
          consecutiveHigh = 0;
        }
      }

      optimized.push(selected);

      const effectiveStart = Math.max(currentTime.getTime(), selected.arrivalTime.getTime());
      const duration = selected.estimatedDuration || 15;
      serverTimes[earliestIdx] = effectiveStart + duration * 60000;

      const idx = remaining.findIndex(p => p.id === selected.id);
      remaining.splice(idx, 1);
    }

    // Post-processing: try all permutations of last batch to minimize max wait
    if (savedServerTimes && optimized.length > batchSize) {
      const batch = optimized.splice(-batchSize);
      const perms = this.permute(batch);
      let bestPerm = batch;
      let bestMaxWait = Infinity;

      for (const perm of perms) {
        const times = [...savedServerTimes!];
        let maxWait = 0;
        for (const p of perm) {
          let bestIdx = 0;
          for (let i = 1; i < times.length; i++) {
            if (times[i] < times[bestIdx]) bestIdx = i;
          }
          const effectiveStart = Math.max(times[bestIdx], p.arrivalTime.getTime());
          const wait = (effectiveStart - p.arrivalTime.getTime()) / 60000;
          maxWait = Math.max(maxWait, wait);
          times[bestIdx] = effectiveStart + (p.estimatedDuration || 15) * 60000;
        }
        if (maxWait < bestMaxWait) {
          bestMaxWait = maxWait;
          bestPerm = perm;
        }
      }
      optimized.push(...bestPerm);
    }

    return optimized;
  }

  private permute<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.filter((_, j) => j !== i);
      for (const perm of this.permute(rest)) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  /**
   * Pre-queued scheduling: all patients already arrived.
   * Phase 1: Fill servers with urgent patients + 1 shortest (frees server quickly)
   * Phase 2: Remaining CRITICAL first, then SJF for rest
   */
  private schedulePreQueued(patients: Patient[], startTime: Date, numServers: number): Patient[] {
    const URGENCY_RANK: Record<string, number> = { CRITICAL: 1, HIGH: 2, STANDARD: 3, LOW: 4 };

    // Sort by urgency DESC, then SJF within same urgency
    const byUrgency = patients.slice().sort((a, b) => {
      const ud = (URGENCY_RANK[a.urgency] ?? 5) - (URGENCY_RANK[b.urgency] ?? 5);
      return ud !== 0 ? ud : (a.estimatedDuration || 15) - (b.estimatedDuration || 15);
    });

    const urgentCount = byUrgency.filter(
      p => p.urgency === 'CRITICAL' || p.urgency === 'HIGH'
    ).length;

    // Phase 1: Fill first batch — urgent patients + 1 shortest to break the duration wall
    const urgentSlots = Math.min(numServers - 1, urgentCount);
    const firstBatch: Patient[] = byUrgency.slice(0, urgentSlots);
    const usedIds = new Set(firstBatch.map(p => p.id));

    // Fill remaining slot(s) with shortest-duration patients
    const shortCandidates = byUrgency.filter(p => !usedIds.has(p.id));
    shortCandidates.sort((a, b) => (a.estimatedDuration || 15) - (b.estimatedDuration || 15));
    const slotsLeft = numServers - firstBatch.length;
    for (let i = 0; i < slotsLeft && i < shortCandidates.length; i++) {
      firstBatch.push(shortCandidates[i]);
      usedIds.add(shortCandidates[i].id);
    }

    // Phase 2: Remaining urgent patients first (keep CRITICAL wait low), then SJF
    const remaining = byUrgency.filter(p => !usedIds.has(p.id));
    const remainingUrgent = remaining.filter(
      p => p.urgency === 'CRITICAL' || p.urgency === 'HIGH'
    );
    const remainingOther = remaining.filter(
      p => p.urgency !== 'CRITICAL' && p.urgency !== 'HIGH'
    );
    // Sort remaining urgent by urgency then SJF
    remainingUrgent.sort((a, b) => {
      const ud = (URGENCY_RANK[a.urgency] ?? 5) - (URGENCY_RANK[b.urgency] ?? 5);
      return ud !== 0 ? ud : (a.estimatedDuration || 15) - (b.estimatedDuration || 15);
    });
    // Sort remaining others by SJF
    remainingOther.sort((a, b) => (a.estimatedDuration || 15) - (b.estimatedDuration || 15));

    const result = [...firstBatch, ...remainingUrgent, ...remainingOther];

    // Permutation optimizer for last batch to minimize max wait
    if (result.length > numServers) {
      const serverTimes = new Array(numServers).fill(startTime.getTime());
      const preBatchLen = result.length - numServers;
      for (let i = 0; i < preBatchLen; i++) {
        let minIdx = 0;
        for (let j = 1; j < numServers; j++) {
          if (serverTimes[j] < serverTimes[minIdx]) minIdx = j;
        }
        const p = result[i];
        const effectiveStart = Math.max(serverTimes[minIdx], p.arrivalTime.getTime());
        serverTimes[minIdx] = effectiveStart + (p.estimatedDuration || 15) * 60000;
      }

      const lastBatch = result.slice(-numServers);
      const perms = this.permute(lastBatch);
      let bestPerm = lastBatch;
      let bestMaxWait = Infinity;

      for (const perm of perms) {
        const times = [...serverTimes];
        let maxWait = 0;
        for (const p of perm) {
          let bIdx = 0;
          for (let j = 1; j < times.length; j++) {
            if (times[j] < times[bIdx]) bIdx = j;
          }
          const eff = Math.max(times[bIdx], p.arrivalTime.getTime());
          maxWait = Math.max(maxWait, (eff - p.arrivalTime.getTime()) / 60000);
          times[bIdx] = eff + (p.estimatedDuration || 15) * 60000;
        }
        if (maxWait < bestMaxWait) {
          bestMaxWait = maxWait;
          bestPerm = perm;
        }
      }
      result.splice(-numServers, numServers, ...bestPerm);
    }

    return result;
  }

  /**
   * Generate queue orders with timing
   */
  generateQueueOrder(
    patients: Patient[],
    startTime: Date = new Date(),
    doctors?: Doctor[]
  ): QueueOrder[] {
    const queueOrders: QueueOrder[] = [];
    const availableDocs = doctors?.filter(d => d.isAvailable) ?? [];
    const numServers = Math.max(1, availableDocs.length);
    const serverTimes = new Array(numServers).fill(startTime.getTime());

    patients.forEach((patient, index) => {
      // Find earliest available server (doctor)
      let bestIdx = 0;
      for (let i = 1; i < numServers; i++) {
        if (serverTimes[i] < serverTimes[bestIdx]) bestIdx = i;
      }

      // Prefer patient's preferred doctor if available within 5 min of earliest
      if (patient.preferredDoctorId && availableDocs.length > 0) {
        const prefIdx = availableDocs.findIndex(d => d.id === patient.preferredDoctorId);
        if (prefIdx !== -1 && serverTimes[prefIdx] - serverTimes[bestIdx] <= 5 * 60000) {
          bestIdx = prefIdx;
        }
      }

      const effectiveStart = Math.max(serverTimes[bestIdx], patient.arrivalTime.getTime());
      const estimatedStartTime = new Date(effectiveStart);
      const duration = patient.estimatedDuration || 15;
      const estimatedEndTime = new Date(effectiveStart + duration * 60000);
      const estimatedWaitTime = (effectiveStart - patient.arrivalTime.getTime()) / 60000;

      const assignedDoctor = availableDocs[bestIdx] || undefined;

      queueOrders.push({
        patient,
        position: index + 1,
        estimatedStartTime,
        estimatedEndTime,
        estimatedWaitTime: Math.max(0, estimatedWaitTime),
        assignedDoctor,
        priorityScore: this.priorityScorer.calculatePriorityScore(patient, patients, doctors),
      });

      serverTimes[bestIdx] = estimatedEndTime.getTime();
    });

    return queueOrders;
  }

  /**
   * Compare baseline FIFO vs optimized queue
   */
  compareQueues(patients: Patient[], startTime: Date = new Date(), doctors?: Doctor[]) {
    const patientsWithDurations = this.predictor.predictDurationBatch(patients);

    // Baseline: FIFO
    const baselineQueue = patientsWithDurations
      .slice()
      .sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime());

    // Optimized: priority-scheduled with fairness
    const optimizedQueue = this.buildOptimizedQueueDynamic(
      patientsWithDurations,
      startTime,
      doctors
    );

    return {
      baseline: this.generateQueueOrder(baselineQueue, startTime, doctors),
      optimized: this.generateQueueOrder(optimizedQueue, startTime, doctors),
    };
  }

  getConfig(): QueueOptimizationConfig {
    return this.config;
  }

  setConfig(config: Partial<QueueOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.priorityScorer = new PriorityScorer(this.config);
    this.fairnessEngine = new FairnessEngine(this.config);
  }

  debugScores(patients: Patient[], doctors?: Doctor[]): Array<{ patient: Patient; explanation: string }> {
    const patientsWithDurations = this.predictor.predictDurationBatch(patients);
    return patientsWithDurations.map(patient => ({
      patient,
      explanation: this.priorityScorer.getScoreExplanation(patient, patientsWithDurations, doctors),
    }));
  }
}
