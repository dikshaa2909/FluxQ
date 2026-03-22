# 🏥 FluxQ Engine — Telemedicine Queue Optimizer

**FluxQ Engine** is a high-performance REST API for intelligent patient triage and queue optimization. It reduces wait times by up to 40%, improves fairness, and optimizes doctor utilization using ML-based priority scoring.

---

### 🌐 Live API Usage
**Base URL**: `https://fluxq.onrender.com`  
**Health Check**: [Online](https://fluxq.onrender.com/health)

---

### ✨ Features
- **Smart Triage Engine**: Dynamic symptom assessment and severity classification.
- **Queue Optimization**: Real-time reordering based on clinical severity and fairness thresholds.
- **Fairness Monitoring**: Aging boosts and starvation risk alerts.
- **Simulate & Metrics**: Full baseline vs. optimized comparison with 9+ performance KPIs.

### 🔌 API Integration
You can use this API in any project:
- **Get Config**: `GET /api/v1/config`
- **Optimize Queue**: `POST /api/v1/optimize`
- **Run Simulation**: `POST /api/v1/simulate`

### 🚀 Local Setup
```bash
git clone <repo-url>
cd server
npm install
npm start
```

---

**Developed by Diksha** 🏆
