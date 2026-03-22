/**
 * 🛡️ API MIDDLEWARE
 * Error handling, validation, logging
 */

import { Request, Response, NextFunction } from 'express';

// ============================================================
// REQUEST LOGGER
// ============================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

// ============================================================
// PATIENT VALIDATION MIDDLEWARE
// ============================================================

const VALID_URGENCIES = ['CRITICAL', 'HIGH', 'STANDARD', 'LOW'];

export const validatePatients = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patients } = req.body;

    if (!patients) {
      return res.status(400).json({
        success: false, error: 'Validation Error',
        message: 'Patients array is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({
        success: false, error: 'Validation Error',
        message: 'Patients must be a non-empty array',
        timestamp: new Date().toISOString(),
      });
    }

    const errors: string[] = [];

    patients.forEach((p: any, i: number) => {
      if (!p.id) errors.push(`Patient ${i}: missing 'id'`);
      if (!p.arrivalTime) errors.push(`Patient ${i}: missing 'arrivalTime'`);
      if (!p.urgency) errors.push(`Patient ${i}: missing 'urgency'`);
      if (p.urgency && !VALID_URGENCIES.includes(p.urgency)) {
        errors.push(`Patient ${i}: urgency must be one of ${VALID_URGENCIES.join(', ')}`);
      }
      if (p.arrivalTime) {
        const d = p.arrivalTime instanceof Date ? p.arrivalTime : new Date(p.arrivalTime);
        if (Number.isNaN(d.getTime())) errors.push(`Patient ${i}: invalid arrivalTime`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false, error: 'Validation Error',
        message: 'Patients contain validation errors',
        details: { errors },
        timestamp: new Date().toISOString(),
      });
    }

    // Normalize
    req.body.patients = patients.map((p: any) => ({
      age: p.age ?? 30,
      gender: p.gender ?? 'Other',
      chiefComplaint: p.chiefComplaint ?? '',
      conditionType: p.conditionType ?? 'General',
      isReturning: p.isReturning ?? false,
      hasComplexHistory: p.hasComplexHistory ?? false,
      isMultiSymptom: p.isMultiSymptom ?? false,
      isTeleconsultFollowUp: p.isTeleconsultFollowUp ?? false,
      ...p,
      arrivalTime: typeof p.arrivalTime === 'string' ? new Date(p.arrivalTime) : p.arrivalTime,
    }));

    next();
  } catch (error) {
    res.status(400).json({
      success: false, error: 'Validation Error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================================
// CONFIG VALIDATION MIDDLEWARE
// ============================================================

export const validateConfig = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false, error: 'Validation Error',
        message: 'Config object is required',
        timestamp: new Date().toISOString(),
      });
    }

    const errors: string[] = [];

    if (typeof config.severityWeight !== 'number') errors.push('severityWeight must be a number');
    if (typeof config.waitTimeWeight !== 'number') errors.push('waitTimeWeight must be a number');
    if (typeof config.fairnessWeight !== 'number') errors.push('fairnessWeight must be a number');

    const weightSum = (config.severityWeight || 0) + (config.waitTimeWeight || 0) + (config.fairnessWeight || 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      errors.push(`Weights must sum to 1.0 (currently ${weightSum.toFixed(2)})`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false, error: 'Validation Error',
        details: { errors },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false, error: 'Validation Error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================================
// ERROR HANDLER (MUST BE LAST MIDDLEWARE)
// ============================================================

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);
  const status = error.status || 500;
  res.status(status).json({
    success: false, error: 'Server Error',
    message: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
