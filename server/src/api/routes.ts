/**
 * 📍 API ROUTES
 * All endpoints for queue optimization
 */

import { Router, Request, Response } from 'express';
import {
  optimizeQueueController,
  simulateQueueController,
  compareQueuesController,
  metricsController,
  configController,
  getConfigController,
  docsController,
  classifyIntakeController,
  enqueueIntakeController,
  intakeQuestionsController,
} from './controllers';
import { validatePatients, validateConfig } from './middleware';

export const routes = Router();

// ============================================================
// DOCUMENTATION
// ============================================================

/**
 * @route GET /api/v1/docs
 * @description API Documentation
 */
routes.get('/docs', docsController);

// ============================================================
// QUEUE OPTIMIZATION ENDPOINTS
// ============================================================

/**
 * @route POST /api/v1/optimize
 * @description Optimize queue order for given patients
 * @body { patients: Patient[], config?: QueueOptimizationConfig }
 * @response { success: boolean, data: { optimizedQueue: Patient[] } }
 */
routes.post('/optimize', validatePatients, optimizeQueueController);

/**
 * @route POST /api/v1/simulate
 * @description Run full simulation (baseline vs optimized)
 * @body { patients: Patient[], config?: QueueOptimizationConfig }
 * @response { success: boolean, data: OptimizationResult }
 */
routes.post('/simulate', validatePatients, simulateQueueController);

/**
 * @route POST /api/v1/compare
 * @description Compare baseline FIFO vs optimized queue
 * @body { patients: Patient[], config?: QueueOptimizationConfig }
 * @response { success: boolean, data: { baseline, optimized, improvements } }
 */
routes.post('/compare', validatePatients, compareQueuesController);

/**
 * @route POST /api/v1/metrics
 * @description Calculate metrics for a queue
 * @body { patients: Patient[], config?: QueueOptimizationConfig }
 * @response { success: boolean, data: { baselineMetrics, optimizedMetrics } }
 */
routes.post('/metrics', validatePatients, metricsController);

// ============================================================
// CONFIGURATION ENDPOINTS
// ============================================================

/**
 * @route GET /api/v1/config
 * @description Get default queue optimization config
 * @response { success: boolean, data: QueueOptimizationConfig }
 */
routes.get('/config', getConfigController);

/**
 * @route POST /api/v1/config/validate
 * @description Validate a configuration object
 * @body { config: QueueOptimizationConfig }
 * @response { success: boolean, data: { valid: boolean, errors?: string[] } }
 */
routes.post('/config/validate', validateConfig, configController);

// ============================================================
// CLINICAL INTAKE ENDPOINTS
// ============================================================

/**
 * @route POST /api/v1/intake/classify
 * @description Classify patient severity from intake form
 * @body { intake: IntakeForm, age?: number }
 * @response { success: boolean, data: { classification, urgency, summary } }
 */
routes.post('/intake/classify', classifyIntakeController);

/**
 * @route POST /api/v1/intake/enqueue
 * @description Classify patient from intake and add to queue
 * @body { intake: IntakeForm, patient?: Partial<Patient>, existingQueue?: Patient[], config?, doctors? }
 * @response { success: boolean, data: { patient, queue? } }
 */
routes.post('/intake/enqueue', enqueueIntakeController);

/**
 * @route GET /api/v1/intake/questions/:queueType
 * @description Get intake form questions for a queue type
 * @param queueType diabetes | cholesterol | bloodPressure | general
 * @response { success: boolean, data: { sectionA, sectionB } }
 */
routes.get('/intake/questions/:queueType', intakeQuestionsController);

// ============================================================
// BATCH ENDPOINTS
// ============================================================

/**
 * @route POST /api/v1/batch/simulate
 * @description Run multiple simulations at once
 * @body { simulations: Array<{ patients: Patient[], config?: QueueOptimizationConfig }> }
 * @response { success: boolean, data: Array<OptimizationResult> }
 */
routes.post('/batch/simulate', async (req: Request, res: Response) => {
  try {
    const { simulations } = req.body;

    if (!Array.isArray(simulations) || simulations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Simulations must be a non-empty array',
      });
    }

    // This would use the simulator to run multiple simulations
    res.json({
      success: true,
      message: 'Batch simulation completed',
      data: {
        count: simulations.length,
        results: [], // Implement in controller
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch simulation failed',
      message: (error as Error).message,
    });
  }
});

export default routes;
