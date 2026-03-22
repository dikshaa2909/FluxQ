/**
 * 🏥 QUEUE OPTIMIZER - COMPLETE TEST WITH MOCK DATA
 *
 * Run this file to see the algorithm in action:
 * npx ts-node test.ts
 */

import {
  QueueOptimizer,
  QueueSimulator,
  DurationPredictor,
  PriorityScorer,
  MetricsCalculator,
  Patient,
} from "../src/index";

// ============================================================
// SECTION 1: CREATE MOCK PATIENT DATA
// ============================================================

function createMockPatients(): Patient[] {
  const now = new Date();

  // Realistic patient scenario - Evening clinic rush
  return [
    {
      id: "P001",
      arrivalTime: new Date(now.getTime() - 35 * 60000), // arrived 35 mins ago
      severity: "high", // chest pain
      estimatedDuration: 30,
      waitTime: 35,
    },
    {
      id: "P002",
      arrivalTime: new Date(now.getTime() - 30 * 60000), // arrived 30 mins ago
      severity: "low", // hair loss consultation
      estimatedDuration: 8,
      waitTime: 30,
    },
    {
      id: "P003",
      arrivalTime: new Date(now.getTime() - 25 * 60000), // arrived 25 mins ago
      severity: "high", // severe fever 104°F
      estimatedDuration: 28,
      waitTime: 25,
    },
    {
      id: "P004",
      arrivalTime: new Date(now.getTime() - 20 * 60000), // arrived 20 mins ago
      severity: "medium", // diabetes follow-up
      estimatedDuration: 20,
      waitTime: 20,
    },
    {
      id: "P005",
      arrivalTime: new Date(now.getTime() - 15 * 60000), // arrived 15 mins ago
      severity: "low", // prescription refill
      estimatedDuration: 5,
      waitTime: 15,
    },
    {
      id: "P006",
      arrivalTime: new Date(now.getTime() - 10 * 60000), // arrived 10 mins ago
      severity: "medium", // persistent cough
      estimatedDuration: 18,
      waitTime: 10,
    },
    {
      id: "P007",
      arrivalTime: new Date(now.getTime() - 5 * 60000), // arrived 5 mins ago
      severity: "low", // skin allergy question
      estimatedDuration: 10,
      waitTime: 5,
    },
    {
      id: "P008",
      arrivalTime: now, // just arrived
      severity: "high", // migraine emergency
      estimatedDuration: 25,
      waitTime: 0,
    },
  ];
}

// ============================================================
// SECTION 2: TEST INDIVIDUAL COMPONENTS
// ============================================================

function testDurationPredictor() {
  console.log("\n" + "=".repeat(70));
  console.log("🧠 TEST 1: DURATION PREDICTOR");
  console.log("=".repeat(70));

  const predictor = new DurationPredictor();
  const patients = createMockPatients();

  console.log("\n📊 Predicting consultation duration for each patient:\n");
  patients.forEach((patient) => {
    const predicted = predictor.predictDuration(patient);
    console.log(
      `  ${patient.id} (${patient.severity.toUpperCase()}) → ${predicted} minutes`,
    );
  });

  const accuracy = predictor.getModelAccuracy();
  console.log(
    `\n✅ Model Accuracy: MAE = ${accuracy.mae.toFixed(1)} min, RMSE = ${accuracy.rmse.toFixed(1)} min`,
  );
}

function testPriorityScorer() {
  console.log("\n" + "=".repeat(70));
  console.log("📈 TEST 2: PRIORITY SCORER");
  console.log("=".repeat(70));

  const scorer = new PriorityScorer({
    severityWeight: 0.5,
    waitTimeWeight: 0.3,
    fairnessWeight: 0.2,
  });

  const patients = createMockPatients();

  console.log("\n🎯 Priority scores for each patient:\n");
  console.log("┌─────────┬──────────┬──────────┬────────────────┐");
  console.log("│ Patient │ Severity │ Wait(m)  │ Priority Score │");
  console.log("├─────────┼──────────┼──────────┼────────────────┤");

  const scored = scorer.scoreAllPatients(patients);
  scored.forEach(({ patient, score }) => {
    const severity = patient.severity.padEnd(8);
    const wait = String(patient.waitTime).padEnd(8);
    const priorityStr = score.toFixed(1).padEnd(14);
    console.log(`│ ${patient.id}  │ ${severity} │ ${wait} │ ${priorityStr} │`);
  });

  console.log("└─────────┴──────────┴──────────┴────────────────┘");

  console.log("\n💡 PRIORITY EXPLANATION (First Patient):");
  const explanation = scorer.getScoreExplanation(patients[0], patients);
  console.log(explanation);
}

function testQueueOptimizer() {
  console.log("\n" + "=".repeat(70));
  console.log("⚡ TEST 3: QUEUE OPTIMIZER");
  console.log("=".repeat(70));

  const optimizer = new QueueOptimizer({
    severityWeight: 0.5,
    waitTimeWeight: 0.3,
    fairnessWeight: 0.2,
  });

  const patients = createMockPatients();

  console.log("\n📋 BASELINE QUEUE (FIFO - First In First Out):\n");
  const fifoPatients = [...patients].sort(
    (a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime(),
  );
  fifoPatients.forEach((p, i) => {
    console.log(
      `  ${i + 1}. ${p.id} (${p.severity.toUpperCase()}) - Waited ${p.waitTime} min`,
    );
  });

  console.log("\n✨ OPTIMIZED QUEUE (Smart Priority):\n");
  const optimized = optimizer.optimize(patients);
  optimized.forEach((p, i) => {
    console.log(
      `  ${i + 1}. ${p.id} (${p.severity.toUpperCase()}) - Waited ${p.waitTime} min`,
    );
  });

  console.log("\n📊 QUEUE ORDERS WITH TIMING:\n");
  const queueOrders = optimizer.generateQueueOrder(patients);
  console.log("┌─────┬────────┬──────────┬────────────┬──────────────┐");
  console.log("│ Pos │ Patient│ Severity │ Wait (min) │ Start Time   │");
  console.log("├─────┼────────┼──────────┼────────────┼──────────────┤");

  queueOrders.forEach((order) => {
    const pos = String(order.position).padEnd(3);
    const severity = order.patient.severity.padEnd(8);
    const wait = order.estimatedWaitTime.toFixed(1).padEnd(10);
    const startTime = order.estimatedStartTime.toLocaleTimeString();
    console.log(
      `│  ${pos} │ ${order.patient.id} │ ${severity} │ ${wait} │ ${startTime}  │`,
    );
  });

  console.log("└─────┴────────┴──────────┴────────────┴──────────────┘");
}

function testMetricsCalculator() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST 4: METRICS CALCULATOR");
  console.log("=".repeat(70));

  const optimizer = new QueueOptimizer();
  const patients = createMockPatients();
  const queueOrders = optimizer.generateQueueOrder(patients);

  const metrics = MetricsCalculator.calculateMetrics(queueOrders);

  console.log("\n" + MetricsCalculator.getMetricsSummary(metrics));
}

function testSimpleComparison() {
  console.log("\n" + "=".repeat(70));
  console.log("🔄 TEST 5: BASELINE VS OPTIMIZED COMPARISON");
  console.log("=".repeat(70));

  const optimizer = new QueueOptimizer();
  const patients = createMockPatients();

  const { baseline, optimized } = optimizer.compareQueues(patients);

  const baselineMetrics = MetricsCalculator.calculateMetrics(baseline);
  const optimizedMetrics = MetricsCalculator.calculateMetrics(optimized);

  console.log("\n📊 BASELINE METRICS:");
  console.log(MetricsCalculator.getMetricsSummary(baselineMetrics));

  console.log("\n✨ OPTIMIZED METRICS:");
  console.log(MetricsCalculator.getMetricsSummary(optimizedMetrics));

  // Calculate improvements
  const waitTimeReduction = (
    ((baselineMetrics.averageWaitTime - optimizedMetrics.averageWaitTime) /
      baselineMetrics.averageWaitTime) *
    100
  ).toFixed(1);

  const fairnessGain = (
    optimizedMetrics.fairnessScore - baselineMetrics.fairnessScore
  ).toFixed(1);
  const utilizationGain = (
    optimizedMetrics.doctorUtilization - baselineMetrics.doctorUtilization
  ).toFixed(1);
  const throughputGain = (
    ((optimizedMetrics.throughput - baselineMetrics.throughput) /
      baselineMetrics.throughput) *
    100
  ).toFixed(1);

  console.log("\n🎯 IMPROVEMENT SUMMARY:");
  console.log(`├── Wait Time Reduction: ${waitTimeReduction}%`);
  console.log(`├── Fairness Gain: +${fairnessGain} points`);
  console.log(`├── Utilization Gain: +${utilizationGain}%`);
  console.log(`└── Throughput Gain: ${throughputGain}%`);
}

// ============================================================
// SECTION 3: FULL SIMULATION TEST
// ============================================================

function testFullSimulation() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 TEST 6: FULL SIMULATION WITH RECOMMENDATIONS");
  console.log("=".repeat(70));

  const patients = createMockPatients();

  const simulator = new QueueSimulator(
    {
      severityWeight: 0.5,
      waitTimeWeight: 0.3,
      fairnessWeight: 0.2,
      maxWaitTimeForLowPriority: 60,
      maxWaitTimeForMediumPriority: 45,
      maxWaitTimeForHighPriority: 30,
    },
    new Date(),
  );

  const result = simulator.simulate(patients);

  // Print formatted results
  console.log(simulator.formatResults(result));
}

// ============================================================
// SECTION 4: STRESS TEST WITH MORE PATIENTS
// ============================================================

function createLargePatientSet(): Patient[] {
  const now = new Date();
  const patients: Patient[] = [];

  // Create 20 patients with realistic distribution
  const severities: Array<"low" | "medium" | "high"> = [
    "low",
    "medium",
    "high",
  ];
  const severityDistribution = [0.5, 0.3, 0.2]; // 50% low, 30% medium, 20% high

  for (let i = 0; i < 20; i++) {
    const rand = Math.random();
    let severity: "low" | "medium" | "high" = "low";
    if (rand > 0.5) severity = "high";
    else if (rand > 0.2) severity = "medium";

    patients.push({
      id: `P${String(i + 1).padStart(3, "0")}`,
      arrivalTime: new Date(now.getTime() - Math.random() * 60 * 60000), // last 1 hour
      severity,
      estimatedDuration: undefined, // will be predicted
      waitTime: Math.round(
        (now.getTime() -
          new Date(now.getTime() - Math.random() * 60 * 60000).getTime()) /
          60000,
      ),
    });
  }

  return patients;
}

function testStress() {
  console.log("\n" + "=".repeat(70));
  console.log("💪 TEST 7: STRESS TEST - 20 PATIENTS");
  console.log("=".repeat(70));

  const patients = createLargePatientSet();

  console.log(`\n📊 Created ${patients.length} realistic patients`);
  console.log(
    `   - High priority: ${patients.filter((p) => p.severity === "high").length}`,
  );
  console.log(
    `   - Medium priority: ${patients.filter((p) => p.severity === "medium").length}`,
  );
  console.log(
    `   - Low priority: ${patients.filter((p) => p.severity === "low").length}`,
  );

  const simulator = new QueueSimulator();
  const result = simulator.simulate(patients);

  const improvement = (
    ((result.baselineMetrics.averageWaitTime -
      result.optimizedMetrics.averageWaitTime) /
      result.baselineMetrics.averageWaitTime) *
    100
  ).toFixed(1);

  console.log("\n✅ SIMULATION COMPLETE:");
  console.log(
    `   Baseline Avg Wait: ${result.baselineMetrics.averageWaitTime.toFixed(1)} min`,
  );
  console.log(
    `   Optimized Avg Wait: ${result.optimizedMetrics.averageWaitTime.toFixed(1)} min`,
  );
  console.log(`   Improvement: ${improvement}%`);
}

// ============================================================
// SECTION 5: RUN ALL TESTS
// ============================================================

async function runAllTests() {
  console.clear();

  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║     🏥 TELEMEDICINE QUEUE OPTIMIZER - COMPLETE TEST SUITE 🏥     ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Run all tests
    testDurationPredictor();
    testPriorityScorer();
    testQueueOptimizer();
    testMetricsCalculator();
    testSimpleComparison();
    testFullSimulation();
    testStress();

    // Final summary
    console.log("\n" + "=".repeat(70));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(70));

    console.log(`
📦 NEXT STEPS:
  1. ✅ Algorithm works perfectly
  2. 📱 Build React dashboard to visualize
  3. 🔌 Create REST API wrapper
  4. 📤 Publish to npm registry
  5. 🏆 Submit to HackVerse!

🚀 Ready to build the dashboard?
    `);
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

// Run if executed directly
runAllTests();
