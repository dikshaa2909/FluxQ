/**
 * 🔥 QUEUE OPTIMIZER - QUICK API REFERENCE
 * Copy-paste these examples to use the algorithm
 */

// ============================================================
// 1. IMPORT EVERYTHING YOU NEED
// ============================================================

import {
  QueueOptimizer,
  QueueSimulator,
  DurationPredictor,
  PriorityScorer,
  MetricsCalculator,
  Patient,
} from './src/index';

// ============================================================
// 2. CREATE MOCK PATIENT DATA
// ============================================================

const mockPatients: Patient[] = [
  {
    id: 'P001',
    arrivalTime: new Date(Date.now() - 25 * 60000),
    severity: 'high',
    estimatedDuration: 30,
    waitTime: 25,
  },
  {
    id: 'P002',
    arrivalTime: new Date(Date.now() - 20 * 60000),
    severity: 'low',
    estimatedDuration: 10,
    waitTime: 20,
  },
  {
    id: 'P003',
    arrivalTime: new Date(Date.now() - 15 * 60000),
    severity: 'medium',
    estimatedDuration: 20,
    waitTime: 15,
  },
];

// ============================================================
// 3. API CALLS - ORGANIZED BY USE CASE
// ============================================================

// ─────────────────────────────────────────────────────────
// USE CASE 1: Simple Optimization (Just reorder)
// ─────────────────────────────────────────────────────────

const optimizer = new QueueOptimizer();
const optimizedQueue = optimizer.optimize(mockPatients);

console.log('Optimized order:', optimizedQueue.map(p => p.id));
// Output: ['P002', 'P001', 'P003'] or similar based on priority

// ─────────────────────────────────────────────────────────
// USE CASE 2: Get Queue Orders with Timing
// ─────────────────────────────────────────────────────────

const queueOrders = optimizer.generateQueueOrder(mockPatients);

queueOrders.forEach(order => {
  console.log(`
    Patient: ${order.patient.id}
    Position: ${order.position}
    Start Time: ${order.estimatedStartTime}
    End Time: ${order.estimatedEndTime}
    Wait Time: ${order.estimatedWaitTime} minutes
  `);
});

// ─────────────────────────────────────────────────────────
// USE CASE 3: Compare Baseline vs Optimized
// ─────────────────────────────────────────────────────────

const { baseline, optimized } = optimizer.compareQueues(mockPatients);

baseline.forEach(order => {
  console.log(`Baseline: ${order.patient.id} waits ${order.estimatedWaitTime} min`);
});

optimized.forEach(order => {
  console.log(`Optimized: ${order.patient.id} waits ${order.estimatedWaitTime} min`);
});

// ─────────────────────────────────────────────────────────
// USE CASE 4: Get Metrics for a Queue
// ─────────────────────────────────────────────────────────

const metrics = MetricsCalculator.calculateMetrics(queueOrders);

console.log(`Average Wait: ${metrics.averageWaitTime} min`);
console.log(`Max Wait: ${metrics.maxWaitTime} min`);
console.log(`Fairness Score: ${metrics.fairnessScore}/100`);
console.log(`Doctor Utilization: ${metrics.doctorUtilization}%`);
console.log(`Throughput: ${metrics.throughput} patients/hour`);

// ─────────────────────────────────────────────────────────
// USE CASE 5: Compare Metrics (Baseline vs Optimized)
// ─────────────────────────────────────────────────────────

const baselineMetrics = MetricsCalculator.calculateMetrics(baseline);
const optimizedMetrics = MetricsCalculator.calculateMetrics(optimized);

const comparison = MetricsCalculator.compareMetrics(baselineMetrics, optimizedMetrics);

console.log(`
  Wait Time Reduction: ${comparison.improvements.waitTimeReduction.toFixed(1)}%
  Fairness Improvement: ${comparison.improvements.fairnessImprovement.toFixed(1)}
  Utilization Improvement: ${comparison.improvements.utilizationImprovement.toFixed(1)}%
  Throughput Improvement: ${comparison.improvements.throughputImprovement.toFixed(1)}%
`);

// ─────────────────────────────────────────────────────────
// USE CASE 6: Full Simulation (Everything Together)
// ─────────────────────────────────────────────────────────

const simulator = new QueueSimulator({
  severityWeight: 0.5,
  waitTimeWeight: 0.3,
  fairnessWeight: 0.2,
  maxWaitTimeForLowPriority: 60,
  maxWaitTimeForMediumPriority: 45,
  maxWaitTimeForHighPriority: 30,
});

const result = simulator.simulate(mockPatients);

console.log(result.baselineQueue);    // FIFO queue orders
console.log(result.optimizedQueue);   // Smart queue orders
console.log(result.baselineMetrics);  // FIFO metrics
console.log(result.optimizedMetrics); // Smart metrics
console.log(result.recommendations);  // AI suggestions

// Print nicely formatted results
console.log(simulator.formatResults(result));

// ─────────────────────────────────────────────────────────
// USE CASE 7: Duration Prediction
// ─────────────────────────────────────────────────────────

const predictor = new DurationPredictor();

const predictedDuration = predictor.predictDuration(mockPatients[0]);
console.log(`Patient will take ${predictedDuration} minutes`);

const allPredicted = predictor.predictDurationBatch(mockPatients);
console.log('All durations predicted');

const accuracy = predictor.getModelAccuracy();
console.log(`Model MAE: ${accuracy.mae}, RMSE: ${accuracy.rmse}`);

// ─────────────────────────────────────────────────────────
// USE CASE 8: Priority Scoring
// ─────────────────────────────────────────────────────────

const scorer = new PriorityScorer({
  severityWeight: 0.5,
  waitTimeWeight: 0.3,
  fairnessWeight: 0.2,
});

// Score all patients and get sorted by priority
const scoredPatients = scorer.scoreAllPatients(mockPatients);

scoredPatients.forEach(({ patient, score }) => {
  console.log(`${patient.id}: Priority Score = ${score.toFixed(1)}`);
});

// Get explanation for a single patient
const explanation = scorer.getScoreExplanation(mockPatients[0], mockPatients);
console.log(explanation);

// ─────────────────────────────────────────────────────────
// USE CASE 9: Update Configuration
// ─────────────────────────────────────────────────────────

// Change priority weights
optimizer.setConfig({
  severityWeight: 0.6,        // More weight on urgency
  waitTimeWeight: 0.2,        // Less weight on fairness
  fairnessWeight: 0.2,
});

// Get current config
const currentConfig = optimizer.getConfig();
console.log('Current configuration:', currentConfig);

// ─────────────────────────────────────────────────────────
// USE CASE 10: Debug Scores
// ─────────────────────────────────────────────────────────

const debugInfo = optimizer.debugScores(mockPatients);

debugInfo.forEach(({ patient, explanation }) => {
  console.log(`${patient.id}:`);
  console.log(explanation);
});

// ============================================================
// 4. REAL-WORLD EXAMPLE: FOR YOUR DASHBOARD/API
// ============================================================

function handleOptimizeQueueRequest(patients: Patient[]) {
  try {
    // Initialize simulator
    const simulator = new QueueSimulator();

    // Run simulation
    const result = simulator.simulate(patients);

    // Return as JSON (for API/dashboard)
    return {
      success: true,
      data: {
        baselineQueue: result.baselineQueue.map(q => ({
          position: q.position,
          patientId: q.patient.id,
          severity: q.patient.severity,
          estimatedWaitTime: q.estimatedWaitTime,
          estimatedStartTime: q.estimatedStartTime,
        })),
        optimizedQueue: result.optimizedQueue.map(q => ({
          position: q.position,
          patientId: q.patient.id,
          severity: q.patient.severity,
          estimatedWaitTime: q.estimatedWaitTime,
          estimatedStartTime: q.estimatedStartTime,
        })),
        baselineMetrics: {
          averageWaitTime: result.baselineMetrics.averageWaitTime,
          maxWaitTime: result.baselineMetrics.maxWaitTime,
          fairnessScore: result.baselineMetrics.fairnessScore,
          doctorUtilization: result.baselineMetrics.doctorUtilization,
          throughput: result.baselineMetrics.throughput,
        },
        optimizedMetrics: {
          averageWaitTime: result.optimizedMetrics.averageWaitTime,
          maxWaitTime: result.optimizedMetrics.maxWaitTime,
          fairnessScore: result.optimizedMetrics.fairnessScore,
          doctorUtilization: result.optimizedMetrics.doctorUtilization,
          throughput: result.optimizedMetrics.throughput,
        },
        improvements: {
          waitTimeReduction: (
            ((result.baselineMetrics.averageWaitTime - result.optimizedMetrics.averageWaitTime) /
              result.baselineMetrics.averageWaitTime) *
            100
          ).toFixed(1),
          fairnessImprovement: (
            result.optimizedMetrics.fairnessScore - result.baselineMetrics.fairnessScore
          ).toFixed(1),
        },
        recommendations: result.recommendations,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Test the function
const response = handleOptimizeQueueRequest(mockPatients);
console.log(JSON.stringify(response, null, 2));

// ============================================================
// 5. FOR REST API (Express.js Example)
// ============================================================

/*
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/v1/optimize-queue', (req, res) => {
  const { patients, config } = req.body;

  const simulator = new QueueSimulator(config);
  const result = simulator.simulate(patients);

  res.json({
    baselineMetrics: result.baselineMetrics,
    optimizedMetrics: result.optimizedMetrics,
    baselineQueue: result.baselineQueue,
    optimizedQueue: result.optimizedQueue,
    recommendations: result.recommendations,
  });
});

app.listen(3000, () => {
  console.log('Queue Optimizer API running on port 3000');
});
*/

// ============================================================
// 6. CHEAT SHEET - MOST COMMON CALLS
// ============================================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║              MOST COMMON API CALLS (CHEAT SHEET)           ║
╚════════════════════════════════════════════════════════════╝

1️⃣  JUST OPTIMIZE:
    const optimized = optimizer.optimize(patients);

2️⃣  FULL SIMULATION:
    const result = simulator.simulate(patients);

3️⃣  GET METRICS:
    const metrics = MetricsCalculator.calculateMetrics(queueOrders);

4️⃣  COMPARE BASELINE VS OPTIMIZED:
    const { baseline, optimized } = optimizer.compareQueues(patients);

5️⃣  GET QUEUE WITH TIMING:
    const queueOrders = optimizer.generateQueueOrder(patients);

6️⃣  FORMATTED OUTPUT:
    console.log(simulator.formatResults(result));

7️⃣  PRIORITY SCORES:
    const scored = scorer.scoreAllPatients(patients);

8️⃣  DURATION PREDICTION:
    const duration = predictor.predictDuration(patient);

✅ That's it! Mix and match as needed.
`);
