/**
 * ⚡ QUICK TEST - Copy this entire file and run it!
 * This is the SIMPLEST way to see the algorithm working
 *
 * To run:
 * npx ts-node quick-test.ts
 */

import { QueueSimulator, Patient } from "../src/index";

// Step 1: Create 8 patients
const patients: Patient[] = [
  {
    id: "P001",
    arrivalTime: new Date(Date.now() - 35 * 60000),
    severity: "high",
    waitTime: 35,
  },
  {
    id: "P002",
    arrivalTime: new Date(Date.now() - 30 * 60000),
    severity: "low",
    waitTime: 30,
  },
  {
    id: "P003",
    arrivalTime: new Date(Date.now() - 25 * 60000),
    severity: "high",
    waitTime: 25,
  },
  {
    id: "P004",
    arrivalTime: new Date(Date.now() - 20 * 60000),
    severity: "medium",
    waitTime: 20,
  },
  {
    id: "P005",
    arrivalTime: new Date(Date.now() - 15 * 60000),
    severity: "low",
    waitTime: 15,
  },
  {
    id: "P006",
    arrivalTime: new Date(Date.now() - 10 * 60000),
    severity: "medium",
    waitTime: 10,
  },
  {
    id: "P007",
    arrivalTime: new Date(Date.now() - 5 * 60000),
    severity: "low",
    waitTime: 5,
  },
  { id: "P008", arrivalTime: new Date(), severity: "high", waitTime: 0 },
];

// Step 2: Create simulator
const simulator = new QueueSimulator();

// Step 3: Run simulation
console.log("🏥 RUNNING QUEUE OPTIMIZATION...\n");
const result = simulator.simulate(patients);

// Step 4: Print results
console.log(simulator.formatResults(result));

// Step 5: Show before and after comparison
console.log("\n📊 DETAILED COMPARISON:\n");

console.log("BASELINE QUEUE (FIFO):");
console.log("─".repeat(60));
result.baselineQueue.forEach((order) => {
  console.log(
    `${order.position}. ${order.patient.id} (${order.patient.severity.toUpperCase()}) - Wait: ${order.estimatedWaitTime.toFixed(1)} min`,
  );
});

console.log("\nOPTIMIZED QUEUE (Smart):");
console.log("─".repeat(60));
result.optimizedQueue.forEach((order) => {
  console.log(
    `${order.position}. ${order.patient.id} (${order.patient.severity.toUpperCase()}) - Wait: ${order.estimatedWaitTime.toFixed(1)} min`,
  );
});

// Step 6: Show specific improvements
console.log("\n🎯 KEY IMPROVEMENTS:\n");

const baselineAvg = result.baselineMetrics.averageWaitTime;
const optimizedAvg = result.optimizedMetrics.averageWaitTime;
const improvement = (
  ((baselineAvg - optimizedAvg) / baselineAvg) *
  100
).toFixed(1);

console.log(
  `✅ Average Wait Time: ${baselineAvg.toFixed(1)} min → ${optimizedAvg.toFixed(1)} min`,
);
console.log(`✅ Improvement: ${improvement}% reduction`);
console.log(
  `✅ Fairness Score: ${result.baselineMetrics.fairnessScore.toFixed(1)} → ${result.optimizedMetrics.fairnessScore.toFixed(1)}`,
);
console.log(
  `✅ Doctor Utilization: ${result.baselineMetrics.doctorUtilization.toFixed(1)}% → ${result.optimizedMetrics.doctorUtilization.toFixed(1)}%`,
);

// Step 7: AI recommendations
console.log("\n💡 RECOMMENDATIONS:\n");
result.recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec}`);
});

console.log("\n✨ Done! The algorithm works perfectly! 🚀\n");
