/**
 * TeleMedQ — COMPLETE WORKING DEMO
 * Generates synthetic telemedicine patients, runs dual-mode simulation,
 * and outputs the full structured report.
 */

import { QueueSimulator, Patient, Doctor } from '../index';

// ============================================================
// STEP 1: Synthetic patient data
// ============================================================
function createMockPatients(): Patient[] {
  const now = new Date();

  return [
    {
      id: 'P001', age: 72, gender: 'M',
      chiefComplaint: 'Chest pain, shortness of breath',
      conditionType: 'Cardiology', urgency: 'CRITICAL',
      arrivalTime: new Date(now.getTime() - 30 * 60000),
      isReturning: true, hasComplexHistory: true,
      isMultiSymptom: true, isTeleconsultFollowUp: false,
      preferredDoctorId: 'D001', waitTime: 30,
    },
    {
      id: 'P002', age: 34, gender: 'F',
      chiefComplaint: 'Persistent migraine',
      conditionType: 'Neurology', urgency: 'HIGH',
      arrivalTime: new Date(now.getTime() - 25 * 60000),
      isReturning: false, hasComplexHistory: false,
      isMultiSymptom: false, isTeleconsultFollowUp: false,
      preferredDoctorId: 'D002', waitTime: 25,
    },
    {
      id: 'P003', age: 65, gender: 'F',
      chiefComplaint: 'Diabetes follow-up, blurred vision',
      conditionType: 'Endocrinology', urgency: 'HIGH',
      arrivalTime: new Date(now.getTime() - 20 * 60000),
      isReturning: true, hasComplexHistory: true,
      isMultiSymptom: true, isTeleconsultFollowUp: true,
      waitTime: 20,
    },
    {
      id: 'P004', age: 28, gender: 'M',
      chiefComplaint: 'Sore throat, mild cough',
      conditionType: 'General', urgency: 'STANDARD',
      arrivalTime: new Date(now.getTime() - 18 * 60000),
      isReturning: false, hasComplexHistory: false,
      isMultiSymptom: true, isTeleconsultFollowUp: false,
      waitTime: 18,
    },
    {
      id: 'P005', age: 45, gender: 'F',
      chiefComplaint: 'Prescription refill — hypertension',
      conditionType: 'General', urgency: 'LOW',
      arrivalTime: new Date(now.getTime() - 15 * 60000),
      isReturning: true, hasComplexHistory: false,
      isMultiSymptom: false, isTeleconsultFollowUp: true,
      waitTime: 15,
    },
    {
      id: 'P006', age: 55, gender: 'M',
      chiefComplaint: 'Acute abdominal pain',
      conditionType: 'Gastroenterology', urgency: 'CRITICAL',
      arrivalTime: new Date(now.getTime() - 12 * 60000),
      isReturning: false, hasComplexHistory: false,
      isMultiSymptom: false, isTeleconsultFollowUp: false,
      waitTime: 12,
    },
    {
      id: 'P007', age: 38, gender: 'Other',
      chiefComplaint: 'Anxiety, insomnia',
      conditionType: 'Psychiatry', urgency: 'STANDARD',
      arrivalTime: new Date(now.getTime() - 10 * 60000),
      isReturning: true, hasComplexHistory: true,
      isMultiSymptom: true, isTeleconsultFollowUp: false,
      preferredDoctorId: 'D003', waitTime: 10,
    },
    {
      id: 'P008', age: 22, gender: 'F',
      chiefComplaint: 'Skin rash',
      conditionType: 'Dermatology', urgency: 'LOW',
      arrivalTime: new Date(now.getTime() - 5 * 60000),
      isReturning: false, hasComplexHistory: false,
      isMultiSymptom: false, isTeleconsultFollowUp: false,
      waitTime: 5,
    },
    {
      id: 'P009', age: 80, gender: 'M',
      chiefComplaint: 'Fall injury, hip pain, dizziness',
      conditionType: 'Orthopedics', urgency: 'HIGH',
      arrivalTime: new Date(now.getTime() - 8 * 60000),
      isReturning: false, hasComplexHistory: true,
      isMultiSymptom: true, isTeleconsultFollowUp: false,
      waitTime: 8,
    },
    {
      id: 'P010', age: 50, gender: 'F',
      chiefComplaint: 'Routine blood-work review',
      conditionType: 'General', urgency: 'LOW',
      arrivalTime: now,
      isReturning: true, hasComplexHistory: false,
      isMultiSymptom: false, isTeleconsultFollowUp: true,
      waitTime: 0,
    },
  ];
}

function createMockDoctors(): Doctor[] {
  return [
    { id: 'D001', name: 'Dr. Patel',  specialty: 'Cardiology',      isAvailable: true,  currentWorkload: 60, maxDailyPatients: 20, patientsServed: 8 },
    { id: 'D002', name: 'Dr. Chen',   specialty: 'Neurology',       isAvailable: true,  currentWorkload: 40, maxDailyPatients: 18, patientsServed: 5 },
    { id: 'D003', name: 'Dr. Rivera', specialty: 'General/Psych',   isAvailable: true,  currentWorkload: 30, maxDailyPatients: 22, patientsServed: 4 },
  ];
}

// ============================================================
// STEP 2: Run simulation
// ============================================================
async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         🏥 TeleMedQ — QUEUE OPTIMIZATION DEMO            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const patients = createMockPatients();
  const doctors = createMockDoctors();

  console.log('📋 INPUT PATIENTS:');
  patients.forEach(p => {
    console.log(
      `  ${p.id}: ${p.urgency.padEnd(8)} | Age ${p.age} | ${p.chiefComplaint} | Wait: ${p.waitTime} min`
    );
  });
  console.log('');

  const simulator = new QueueSimulator({}, new Date());
  const result = simulator.simulate(patients, doctors);
  console.log(simulator.formatResults(result, doctors));

  return result;
}

// ============================================================
// STEP 3: Run
// ============================================================
if (require.main === module) {
  runDemo()
    .then(() => console.log('\n✅ TeleMedQ demo completed successfully!'))
    .catch(err => { console.error('❌ Error:', err); process.exit(1); });
}

export { runDemo };
