# FluxQ Engine ― Telemedicine Queue Optimizer

◆ **Overview**  
FluxQ Engine is a high-performance REST API and core logic engine built for clinical-aware patient triage and intelligent queue management. It optimizes wait times by up to 40% using advanced clinical weight balancing and fairness enforcement.

◈ **NPM Package**: [fluxq-engine](https://www.npmjs.com/package/fluxq-engine)  
◈ **Live API Status**: [fluxq.onrender.com](https://fluxq.onrender.com/health) 

---

◆ **Features**

• **Smart Triage Logic**: Dynamic symptom assessment and severity classification.
• **Queue Optimization**: Real-time reordering based on clinical severity and fairness thresholds.
• **Fairness Monitoring**: Dynamic aging boosts and starvation risk tracking.
• **Comprehensive Metrics**: Provides full baseline vs. optimized comparisons with 9+ performance KPIs.

◆ **Quick Start**

▶ **Installation**
```bash
npm install fluxq-engine
```

▶ **Usage**  
```typescript
import { QueueOptimizer } from 'fluxq-engine';

const optimizer = new QueueOptimizer();
const optimizedQueue = optimizer.optimize(patients, config);
```

◆ **API Connectivity**
◈ `GET /api/v1/config` ― Get current system optimization parameters.
◈ `POST /api/v1/optimize` ― Submit a patient list for instant re-ordering.
◈ `POST /api/v1/simulate` ― Run a complete FCFS vs. AI comparison.

---
◆ **Development**
◈ **Developed by [Diksha](https://github.com/dikshaa2909)**  
◈ Built using Node.js, TypeScript, and Express.

---
◈ **FluxQ Engine ― 2026**
