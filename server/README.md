# FluxQ Engine - Telemedicine Queue Optimizer

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)](https://expressjs.com)
[![NPM Version](https://img.shields.io/npm/v/fluxq-engine.svg?color=teal)](https://www.npmjs.com/package/fluxq-engine)

---

### ● Overview
FluxQ Engine is a high-performance REST API and core logic engine built for clinical-aware patient triage and intelligent queue management. It optimizes wait times by up to 40% using advanced clinical weight balancing and fairness enforcement.

◈ **NPM Package**: [fluxq-engine](https://www.npmjs.com/package/fluxq-engine)  
◈ **Live API Status**: [Online (Render)](https://fluxq.onrender.com/health) 

---

### ● Key Features

#### 1 ― Smart Triage Logic
› Dynamic symptom assessment and severity classification.
› Clinical priority scoring (Severity × Wait Time × Fairness).

#### 2 ― Queue Optimization
› Real-time reordering based on clinical severity and fairness thresholds.
› Starvation prevention and dynamic aging boosts.

#### 3 ― Fairness Monitoring
› Real-time identification of starvation risks.
› Fairness reports with aging boost tracking.

#### 4 ― Simulation & Metrics
› High-level KPIs: Wait time reduction, doctor utilization, and throughput.
› Full baseline vs. optimized comparison reporting.

---

### ● Quick Start

▶ **Installation**
```bash
npm install fluxq-engine
```

▶ **API Client Library Usage**
```typescript
import { QueueOptimizer } from 'fluxq-engine';

const optimizer = new QueueOptimizer();
const optimizedQueue = optimizer.optimize(patients, config);
```

▶ **Direct API Connectivity**
`GET /api/v1/config` ― Get current system optimization parameters.

`POST /api/v1/optimize` ― Submit a patient list for instant re-ordering.

`POST /api/v1/simulate` ― Run a complete FCFS vs. AI comparison.

---

### ● Developer

**Built by [Diksha](https://github.com/dikshaa2909)**
