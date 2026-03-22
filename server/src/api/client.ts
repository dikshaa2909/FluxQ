/**
 * 📡 QUEUE OPTIMIZER API CLIENT - FIXED
 * Use this in your React dashboard to call the API
 */

import { Patient, QueueOptimizationConfig } from "../index";

export class QueueOptimizerClient {
  private baseUrl: string;
  private timeout: number;

  constructor(
    baseUrl: string = "http://localhost:3000/api/v1",
    timeout: number = 30000,
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Make HTTP request with timeout
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
  ): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData?.message || `HTTP ${response.status}`);
      }

      return (await response.json()) as {
        success: boolean;
        data?: T;
        error?: string;
        message?: string;
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  /**
   * Optimize queue order
   */
  async optimize(
    patients: Patient[],
    config?: Partial<QueueOptimizationConfig>,
  ): Promise<{
    success: boolean;
    data?: {
      optimizedQueue: any[];
    };
    error?: string;
    message?: string;
  }> {
    return this.request("POST", "/optimize", { patients, config });
  }

  /**
   * Run full simulation (baseline vs optimized)
   */
  async simulate(
    patients: Patient[],
    config?: Partial<QueueOptimizationConfig>,
  ): Promise<{
    success: boolean;
    data?: {
      baselineQueue: any[];
      optimizedQueue: any[];
      baselineMetrics: any;
      optimizedMetrics: any;
      improvements: any;
      recommendations: string[];
    };
    error?: string;
    message?: string;
  }> {
    return this.request("POST", "/simulate", { patients, config });
  }

  /**
   * Compare baseline FIFO vs optimized
   */
  async compare(
    patients: Patient[],
    config?: Partial<QueueOptimizationConfig>,
  ): Promise<{
    success: boolean;
    data?: {
      baseline: any;
      optimized: any;
      improvements: any;
    };
    error?: string;
    message?: string;
  }> {
    return this.request("POST", "/compare", { patients, config });
  }

  /**
   * Calculate metrics for a queue
   */
  async metrics(
    patients: Patient[],
    config?: Partial<QueueOptimizationConfig>,
  ): Promise<{
    success: boolean;
    data?: {
      metrics: any;
    };
    error?: string;
    message?: string;
  }> {
    return this.request("POST", "/metrics", { patients, config });
  }

  /**
   * Get default configuration
   */
  async getConfig(): Promise<{
    success: boolean;
    data?: {
      config: QueueOptimizationConfig;
      description: any;
    };
    error?: string;
    message?: string;
  }> {
    return this.request("GET", "/config");
  }

  /**
   * Validate a configuration
   */
  async validateConfig(config: QueueOptimizationConfig): Promise<{
    success: boolean;
    data?: {
      valid: boolean;
      weightSum: string;
      errors: string[];
    };
    error?: string;
    message?: string;
  }> {
    return this.request("POST", "/config/validate", { config });
  }

  /**
   * Get API documentation
   */
  async getDocs(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }> {
    return this.request("GET", "/docs");
  }

  /**
   * Check health status
   */
  async health(): Promise<{
    status: string;
    timestamp: string;
    environment: string;
    uptime: number;
  }> {
    const response = await fetch(
      `${this.baseUrl.replace("/api/v1", "")}/health`,
    );
    return (await response.json()) as {
      status: string;
      timestamp: string;
      environment: string;
      uptime: number;
    };
  }

  /**
   * Update base URL (useful for changing between dev/prod)
   */
  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Update timeout
   */
  setTimeout(timeout: number) {
    this.timeout = timeout;
  }
}

// Create a default client instance
export const apiClient = new QueueOptimizerClient();

// Export for use in React
export default apiClient;
