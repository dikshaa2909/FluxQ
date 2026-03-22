import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safely extract a numeric improvement value (API returns string | number | null) */
export function getImprovement(val: string | number | undefined | null): string {
  if (val == null) return '0.00'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

// Global counter for short patient IDs — maps long IDs to PID-1, PID-2, etc.
const pidMap = new Map<string, string>()
let pidCounter = 0

/** Convert any patient ID to a short consistent PID-N format */
export function shortPid(id: string): string {
  if (!pidMap.has(id)) {
    pidCounter++
    pidMap.set(id, `PID-${pidCounter}`)
  }
  return pidMap.get(id)!
}

/** Reset the PID counter (call when patient list changes) */
export function resetPidMap(patientIds: string[]) {
  pidMap.clear()
  pidCounter = 0
  for (const id of patientIds) {
    pidCounter++
    pidMap.set(id, `PID-${pidCounter}`)
  }
}
