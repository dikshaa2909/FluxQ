# 🏥 Smart Patient Queue Dashboard

A real-time **patient queue management and triage dashboard** built with React + TypeScript + Vite. The system integrates with a backend API to classify patients by clinical severity, optimize queue ordering using fairness-aware algorithms, simulate doctor assignments, and provide deep analytics — all from a single modern UI.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Pages & Features](#-pages--features-detail)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [State Management](#-state-management)
- [UI Components](#-ui-components)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Clinical Intake & Triage** | Multi-step symptom questionnaire for 4 specialized queues (Diabetes, Cholesterol, Blood Pressure, General) with AI-powered severity classification |
| **Smart Queue Optimization** | Priority-based scheduling with fairness constraints, starvation prevention, and aging boosts |
| **Live Doctor Simulation** | Real-time simulation of doctor-patient assignments with burnout tracking, consultation progress, and auto-redistribution |
| **Baseline vs Optimized Comparison** | Side-by-side comparison of FCFS (First-Come-First-Served) vs optimized queue ordering |
| **Deep Analytics** | Bar/Line/Radar charts, per-patient wait time breakdown, improvement metrics, and AI recommendations |
| **Configurable Scheduling** | Tunable priority weights, fairness thresholds, aging boost rules, and scheduling parameters — with real-time validation |
| **Fairness Monitoring** | Fairness score (0–100), rule violation detection (F1–F4), starvation risk alerts, and aging boost tracking |
| **Multi-Tab Sync** | Patient data persisted in `localStorage` and synced across browser tabs |
| **Error Boundary** | Graceful crash recovery with user-friendly error UI |
| **API Health Monitoring** | Real-time backend health status with uptime display, polled every 10 seconds |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Routing | React Router DOM 7 |
| Icons | Lucide React |
| UI Utilities | `class-variance-authority`, `clsx`, `tailwind-merge` |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Backend API server running on `http://localhost:3000`

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
src/
├── api/
│   └── client.ts              # API client — all backend calls + TypeScript types
├── components/
│   ├── FairnessPanel.tsx       # Fairness score, violations, starvation risks
│   ├── IntakeForm.tsx          # Multi-step clinical intake questionnaire
│   ├── Layout.tsx              # Sidebar navigation + API health bar
│   ├── MetricsGrid.tsx         # 9-metric performance grid
│   ├── PatientForm.tsx         # Manual patient entry + sample data loader
│   ├── QueueTable.tsx          # Queue display with priority scores & badges
│   └── ui/                    # Base UI primitives
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── select.tsx
├── lib/
│   ├── PatientContext.tsx      # React Context for shared patient state
│   ├── patientStore.ts         # localStorage persistence (enqueued + simulator)
│   ├── useLiveSimulation.ts    # Live simulation hook (doctor assignments)
│   └── utils.ts                # cn() utility + helpers
├── pages/
│   ├── Dashboard.tsx           # Home — system overview + health status
│   ├── IntakePage.tsx          # Clinical intake + triage workflow
│   ├── Simulator.tsx           # Queue simulation engine
│   ├── Doctors.tsx             # Live doctor assignment simulation
│   ├── Analytics.tsx           # Performance analytics & charts
│   ├── Comparison.tsx          # Baseline vs optimized comparison
│   └── Configuration.tsx       # Scheduling config editor
├── App.tsx                     # Router + ErrorBoundary + PatientProvider
├── main.tsx                    # React entry point
└── index.css                   # Global styles (Tailwind)
```

---

## 📄 Pages & Features Detail

### 1. Dashboard (`/`)

The main landing page providing a system overview.

- **API Health Status** — Shows online/offline status, environment, and server uptime
- **Quick Actions** — One-click navigation to Simulator, Comparison, Configuration, and Patient Intake
- **REST API Endpoints** — Lists all available backend endpoints for reference
- **Specialized Queues** — Overview cards for the 4 queue types (Diabetes, Cholesterol, BP, General)

### 2. Patient Intake (`/intake`)

A clinical intake and triage workflow.

- **4-Step Queue Selection** — Patient selects their primary concern:
  - 🩸 Diabetes / Blood Sugar
  - 🫀 Cholesterol / Heart Risk
  - ❤️ Blood Pressure
  - 🩺 General
- **Symptom Assessment** — Dynamic questions based on queue type (e.g., blood glucose levels for diabetes, systolic/diastolic for BP)
- **Emergency Signal Screening** — Chest pain, breathing difficulty, confusion, vision loss, fainting, etc.
- **Comfort Level** — 5-point scale (0 = routine check → 4 = extremely unwell)
- **Onset Type** — Acute (<1 hr), Today, Few days, Chronic (weeks+)
- **AI Classification** — Calls backend to get severity level, clinical multiplier, estimated duration, escalation reasons
- **Enqueue** — Adds classified patient directly to the simulation queue

### 3. Simulator (`/simulator`)

Full queue simulation engine.

- **Patient Input** — Manual entry form or load 8 sample patients
- **Simulation Results** — Runs patients through the optimization API
- **Metrics Grid** — 9 performance metrics with trend indicators
- **Queue Views** — Toggle between optimized and baseline queue ordering
- **Domain-Grouped Tables** — Separate queue views by Diabetes, Cholesterol, BP, General
- **Distribution Charts** — Pie chart (queue type distribution), Bar chart (severity distribution)
- **AI Recommendations** — Backend-generated optimization suggestions
- **Fairness Panel** — Fairness score, aging boosts, violations, starvation risks

### 4. Doctors (`/doctors`)

Live simulation of doctor-patient assignments.

- **Start/Stop Simulation** — Select 1–4 doctors
- **Doctor Cards** — Each shows:
  - Current patient with consultation progress bar
  - Utilization % and burnout level
  - Completed patient count
  - Auto-redistribution warning at high burnout (>300)
- **Waiting Queue** — Real-time waiting list with urgency badges
- **Activity Log** — Live event stream (assignments, completions, API re-optimizations)
- **Automatic Patient Generation** — New patients arrive periodically and trigger API re-optimization

### 5. Analytics (`/analytics`)

Deep performance metrics visualization.

- **Improvement Badges** — Wait time reduction %, fairness gain, utilization improvement, throughput improvement
- **Charts**:
  - Bar chart — Baseline vs Optimized metrics comparison
  - Line chart — Per-patient wait time comparison
  - Radar chart — Multi-dimensional metric overlay
- **Metric Comparison Table** — Detailed numeric comparison with color-coded deltas
- **AI Recommendations** — Actionable suggestions from the backend
- **Fairness Report** — Full fairness analysis panel

### 6. Comparison (`/comparison`)

Side-by-side queue comparison.

- **Dual Queue Tables** — FCFS baseline vs optimized ordering
- **Per-Patient Breakdown** — Visual bars comparing individual wait times
- **Key Improvements** — Wait time reduction and fairness improvement metrics
- **Metric Table** — Side-by-side numeric comparison

### 7. Configuration (`/config`)

System scheduling configuration editor.

- **Priority Weights** — Sliders for severity, wait time, and fairness weights (must sum to 1.0)
- **Fairness Thresholds** — Max wait times per urgency level:
  - HIGH priority max wait
  - STANDARD priority max wait
  - LOW priority max wait
- **Scheduling Rules** — Mandatory slot timing, interleave settings, scheduled window minutes
- **Aging Thresholds** — Dynamic priority boost rules:
  - Add/remove threshold entries
  - Each entry: minutes waited → boost amount applied
- **Real-Time Validation** — Validates config against backend rules before saving

---

## 🔌 API Reference

Base URL: `http://localhost:3000`

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health, uptime, environment |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-13T21:30:00.000Z",
  "environment": "development",
  "uptime": 3600
}
```

---

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/config` | Get current scheduling configuration |
| `POST` | `/api/v1/config/validate` | Validate a configuration object |

**GET `/api/v1/config`** — Response:
```json
{
  "success": true,
  "data": {
    "config": {
      "severityWeight": 0.5,
      "waitTimeWeight": 0.3,
      "fairnessWeight": 0.2,
      "maxWaitTimeForLowPriority": 120,
      "maxWaitTimeForMediumPriority": 60,
      "maxWaitTimeForHighPriority": 30,
      "agingThresholds": [
        { "minutes": 30, "boost": 10 },
        { "minutes": 60, "boost": 25 }
      ],
      "mandatorySlotAfter": 45,
      "interleaveAfter": 3,
      "scheduledWindowMinutes": 15
    },
    "description": {
      "severityWeight": "Weight given to clinical severity in priority calculation",
      "waitTimeWeight": "Weight given to patient wait time",
      "fairnessWeight": "Weight given to fairness across urgency levels"
    }
  }
}
```

**POST `/api/v1/config/validate`** — Request Body:
```json
{
  "config": {
    "severityWeight": 0.5,
    "waitTimeWeight": 0.3,
    "fairnessWeight": 0.2,
    "maxWaitTimeForLowPriority": 120,
    "maxWaitTimeForMediumPriority": 60,
    "maxWaitTimeForHighPriority": 30,
    "agingThresholds": [],
    "mandatorySlotAfter": 45,
    "interleaveAfter": 3,
    "scheduledWindowMinutes": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { "valid": true, "errors": [] }
}
```

---

### Intake & Triage

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/intake/classify` | Classify intake form → severity + clinical score |
| `POST` | `/api/v1/intake/enqueue` | Classify + add patient to optimized queue |
| `GET` | `/api/v1/intake/questions/:queueType` | Get intake questions for a queue type |

**POST `/api/v1/intake/classify`** — Request Body:
```json
{
  "intake": {
    "queueType": "diabetes",
    "comfort": 3,
    "onset": "acute",
    "emergencySignals": {
      "chestPain": false,
      "breathingDifficulty": true,
      "severeHeadache": false,
      "confusion": false,
      "visionLoss": false,
      "limbWeakness": false,
      "fainting": false
    },
    "diabetesSymptoms": {
      "shaking": true,
      "suddenSweating": true,
      "heartPounding": false,
      "suddenHunger": true,
      "paleSkin": false,
      "mentalFog": true,
      "tinglingLips": false,
      "suddenAnxiety": false,
      "extremeThirst": true,
      "frequentUrination": true,
      "blurredVision": false,
      "fruityBreath": false,
      "nausea": false,
      "deepFastBreathing": false,
      "extremeTiredness": true,
      "stomachPain": false,
      "slowWoundHealing": false,
      "onInsulin": true,
      "hasKidneyDisease": false,
      "isPregnant": false,
      "recentHypoEpisode": true,
      "missedInsulinDose": false,
      "routineCheck": false,
      "bloodGlucose": 310
    }
  },
  "age": 55
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classification": {
      "severity": "high",
      "clinicalMultiplier": 1.8,
      "symptomPattern": "diabetes-hypo-cluster",
      "baseSeverityScore": 65,
      "finalScore": 117,
      "starvationThreshold": 45,
      "estimatedDuration": 25,
      "escalationReasons": [
        "Active hypoglycemia symptoms",
        "On insulin with recent hypo episode"
      ],
      "queueType": "diabetes"
    },
    "urgency": "HIGH",
    "summary": "Patient presents with active hypoglycemia cluster symptoms"
  }
}
```

**POST `/api/v1/intake/enqueue`** — Request Body:
```json
{
  "intake": { "..." },
  "patient": {
    "age": 55,
    "gender": "M",
    "chiefComplaint": "Blood sugar issues"
  },
  "existingQueue": [],
  "config": {},
  "doctors": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patient": { "id": "P001", "..." },
    "queue": [
      {
        "position": 1,
        "patientId": "P001",
        "urgency": "HIGH",
        "estimatedWaitTime": 5,
        "estimatedStartTime": "2026-03-13T21:35:00.000Z",
        "estimatedEndTime": "2026-03-13T22:00:00.000Z",
        "priorityScore": 117,
        "assignedDoctor": "D1"
      }
    ]
  }
}
```

**GET `/api/v1/intake/questions/:queueType`** — Returns dynamic question set for: `diabetes`, `cholesterol`, `bloodPressure`, `general`.

---

### Simulation & Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/simulate` | Full simulation — baseline + optimized queues + metrics + fairness |
| `POST` | `/api/v1/optimize` | Optimize queue ordering only |
| `POST` | `/api/v1/compare` | Compare baseline vs optimized with improvements |
| `POST` | `/api/v1/metrics` | Calculate metrics for a patient set |

**POST `/api/v1/simulate`** — Request Body:
```json
{
  "patients": [
    {
      "id": "P001",
      "age": 45,
      "gender": "M",
      "chiefComplaint": "severe chest pain",
      "conditionType": "Cardiology",
      "urgency": "CRITICAL",
      "arrivalTime": "2026-03-13T21:00:00.000Z",
      "estimatedDuration": 30,
      "isReturning": false,
      "hasComplexHistory": true,
      "isMultiSymptom": false,
      "isTeleconsultFollowUp": false
    }
  ],
  "config": {},
  "doctors": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "baselineQueue": [ { "position": 1, "patientId": "P001", "..." } ],
    "optimizedQueue": [ { "position": 1, "patientId": "P001", "..." } ],
    "baselineMetrics": {
      "averageWaitTime": 22.5,
      "medianWaitTime": 18.0,
      "maxWaitTime": 45.0,
      "minWaitTime": 5.0,
      "fairnessScore": 72.0,
      "doctorUtilization": 85.0,
      "throughput": 12.0,
      "patientSatisfaction": 78.0,
      "totalOvertime": 15.0
    },
    "optimizedMetrics": { "..." },
    "fairnessReport": {
      "fairnessScore": 92.0,
      "agingBoosts": [
        { "patientId": "P005", "waitMinutes": 35, "boostApplied": 10, "newPriority": 85 }
      ],
      "violations": [
        { "patientId": "P008", "rule": "F2", "reason": "Low-priority patient exceeded max wait", "waitTime": 125 }
      ],
      "starvationRisks": [
        { "patientId": "P010", "urgency": "LOW", "currentWait": 90, "threshold": 120, "percentToThreshold": 75 }
      ]
    },
    "improvements": {
      "waitTimeReduction": "32%",
      "fairnessImprovement": "28%",
      "utilizationImprovement": "12%",
      "throughputImprovement": "8%",
      "satisfactionImprovement": "15%",
      "overtimeReduction": "22%"
    },
    "recommendations": [
      "Consider adding one more doctor during peak hours",
      "High-priority patients are being seen 40% faster with optimization"
    ]
  }
}
```

**POST `/api/v1/optimize`** — Same request body as simulate. Response:
```json
{
  "success": true,
  "data": {
    "optimizedQueue": [ { "position": 1, "patientId": "P001", "..." } ]
  }
}
```

**POST `/api/v1/compare`** — Same request body. Response:
```json
{
  "success": true,
  "data": {
    "baseline": {
      "queue": [],
      "metrics": { "..." }
    },
    "optimized": {
      "queue": [],
      "metrics": { "..." }
    },
    "improvements": {
      "waitTimeReduction": "32%",
      "fairnessImprovement": "28%"
    }
  }
}
```

**POST `/api/v1/metrics`** — Request:
```json
{
  "patients": [],
  "config": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "averageWaitTime": 22.5,
      "medianWaitTime": 18.0,
      "maxWaitTime": 45.0,
      "minWaitTime": 5.0,
      "fairnessScore": 85.0,
      "doctorUtilization": 90.0,
      "throughput": 14.0,
      "patientSatisfaction": 82.0,
      "totalOvertime": 10.0
    }
  }
}
```

---

## 📊 Data Models

### Patient

```typescript
interface Patient {
  id: string                    // e.g. "P001"
  age: number                   // 18–88
  gender: 'M' | 'F' | 'Other'
  chiefComplaint: string        // e.g. "severe chest pain"
  conditionType: string         // e.g. "Cardiology", "General"
  urgency: 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW'
  arrivalTime: string           // ISO 8601 timestamp
  estimatedDuration?: number    // minutes
  waitTime?: number             // minutes
  isReturning: boolean          // returning patient flag
  hasComplexHistory: boolean    // complex medical history
  isMultiSymptom: boolean       // multiple symptoms
  isTeleconsultFollowUp: boolean
  preferredDoctorId?: string
  intake?: IntakeForm           // clinical intake data
  classification?: ClassificationResult
  queueType?: QueueType         // 'diabetes' | 'cholesterol' | 'bloodPressure' | 'general'
}
```

### IntakeForm

```typescript
interface IntakeForm {
  queueType: 'diabetes' | 'cholesterol' | 'bloodPressure' | 'general'
  comfort: 0 | 1 | 2 | 3 | 4     // 0=routine → 4=extremely unwell
  onset: 'acute' | 'today' | 'days' | 'chronic'
  emergencySignals: EmergencySignals
  diabetesSymptoms?: DiabetesSymptoms
  cholesterolSymptoms?: CholesterolSymptoms
  bloodPressureSymptoms?: BloodPressureSymptoms
  generalSymptoms?: GeneralSymptoms
  medicalContext?: MedicalContext
}
```

### ClassificationResult

```typescript
interface ClassificationResult {
  severity: 'low' | 'standard' | 'high' | 'critical'
  clinicalMultiplier: number
  symptomPattern: string
  baseSeverityScore: number
  finalScore: number
  starvationThreshold: number
  estimatedDuration: number      // minutes
  escalationReasons: string[]
  queueType: QueueType
}
```

### Doctor

```typescript
interface Doctor {
  id: string
  name: string
  specialty: string
  isAvailable: boolean
  currentWorkload: number
  maxDailyPatients: number
  patientsServed: number
}
```

### MetricsResponse

```typescript
interface MetricsResponse {
  averageWaitTime: number       // minutes
  medianWaitTime: number
  maxWaitTime: number
  minWaitTime: number
  fairnessScore: number         // 0–100
  doctorUtilization: number     // percentage
  throughput: number            // patients/hour
  patientSatisfaction: number   // 0–100
  totalOvertime: number         // minutes
}
```

### FairnessReport

```typescript
interface FairnessReport {
  fairnessScore: number          // 0–100
  agingBoosts: Array<{
    patientId: string
    waitMinutes: number
    boostApplied: number
    newPriority: number
  }>
  violations: Array<{
    patientId: string
    rule: 'F1' | 'F2' | 'F3' | 'F4'   // fairness rules
    reason: string
    waitTime: number
  }>
  starvationRisks: Array<{
    patientId: string
    urgency: string
    currentWait: number
    threshold: number
    percentToThreshold: number
  }>
}
```

---

## 🧠 State Management

| Mechanism | Purpose |
|-----------|---------|
| **PatientContext** (`React Context`) | Shared patient list across all pages. Wraps the entire app. |
| **localStorage** (`shared-patients`) | Persists the shared patient list across page refreshes |
| **localStorage** (`enqueued-patients`) | Patients added via Intake → available in Simulator |
| **localStorage** (`simulator-patients`) | Simulator's working patient list, persisted across navigation |
| **Cross-tab sync** | `StorageEvent` listener keeps patient data in sync across browser tabs |

---

## 🎨 UI Components

### Base Primitives (`src/components/ui/`)

| Component | Variants |
|-----------|----------|
| **Badge** | `default`, `low`, `standard`, `medium`, `high`, `critical`, `outline`, `CRITICAL`, `HIGH`, `STANDARD`, `LOW` |
| **Button** | `default`, `secondary`, `outline`, `ghost`, `destructive` · Sizes: `default`, `sm`, `lg`, `icon` |
| **Card** | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| **Input** | Standard text input with validation styling |
| **Select** | Dropdown select element |

### Feature Components

| Component | Description |
|-----------|-------------|
| **IntakeForm** | Multi-step clinical questionnaire with 4 queue types, emergency screening, and real-time API classification |
| **PatientForm** | Manual patient entry form with sample data loader and queue-grouped patient list |
| **QueueTable** | Queue display with position, urgency badges, priority score bars, clinical multiplier, wait time coloring |
| **MetricsGrid** | 9-metric performance grid with icons and optional trend indicators |
| **FairnessPanel** | Fairness score badge, aging boosts table, F1–F4 violations, starvation risk progress bars |
| **Layout** | Sidebar navigation (7 pages) + top bar with API health status and live clock |

---

## 🔒 Fairness Rules

The system enforces 4 fairness rules to prevent patient starvation:

| Rule | Description |
|------|-------------|
| **F1** | No patient should wait beyond their urgency-level threshold |
| **F2** | Low-priority patients get mandatory slots after configured time |
| **F3** | Queue interleaving ensures mixed urgency processing |
| **F4** | Aging boosts gradually increase priority for long-waiting patients |

---

## 📝 License

Private project — not for redistribution.
