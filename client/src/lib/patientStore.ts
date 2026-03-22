import type { Patient } from '@/api/client'

const ENQUEUED_KEY = 'enqueued-patients'
const SIMULATOR_KEY = 'simulator-patients'

// --- Enqueued patients (written by IntakePage, read by Simulator) ---

export function getEnqueuedPatients(): Patient[] {
  try {
    const data = localStorage.getItem(ENQUEUED_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addEnqueuedPatient(patient: Patient): void {
  const existing = getEnqueuedPatients()
  existing.push(patient)
  localStorage.setItem(ENQUEUED_KEY, JSON.stringify(existing))
}

export function clearEnqueuedPatients(): void {
  localStorage.removeItem(ENQUEUED_KEY)
}

// --- Simulator patient list (persisted across navigation) ---

export function getSimulatorPatients(): Patient[] {
  try {
    const data = localStorage.getItem(SIMULATOR_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveSimulatorPatients(patients: Patient[]): void {
  localStorage.setItem(SIMULATOR_KEY, JSON.stringify(patients))
}

export function clearSimulatorPatients(): void {
  localStorage.removeItem(SIMULATOR_KEY)
}
