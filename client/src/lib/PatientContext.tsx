import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Patient } from '@/api/client'

const STORAGE_KEY = 'shared-patients'

function loadPatients(): Patient[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function persistPatients(patients: Patient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))
}

interface PatientContextValue {
  patients: Patient[]
  setPatients: (patients: Patient[]) => void
  addPatient: (patient: Patient) => void
}

const PatientContext = createContext<PatientContextValue | null>(null)

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatientsState] = useState<Patient[]>(loadPatients)

  // Listen for storage events from other tabs (optional but nice)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setPatientsState(JSON.parse(e.newValue)) } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const setPatients = useCallback((newPatients: Patient[]) => {
    setPatientsState(newPatients)
    persistPatients(newPatients)
  }, [])

  const addPatient = useCallback((patient: Patient) => {
    setPatientsState(prev => {
      const updated = [...prev, patient]
      persistPatients(updated)
      return updated
    })
  }, [])

  return (
    <PatientContext.Provider value={{ patients, setPatients, addPatient }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatients(): PatientContextValue {
  const ctx = useContext(PatientContext)
  if (!ctx) throw new Error('usePatients must be used within PatientProvider')
  return ctx
}
