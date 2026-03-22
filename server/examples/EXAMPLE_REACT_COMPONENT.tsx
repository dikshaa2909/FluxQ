/**
 * 📱 EXAMPLE REACT DASHBOARD COMPONENT
 * Complete working example of how to use the API client
 * 
 * Copy this into your React project and adapt as needed
 */

import React, { useState, useEffect } from 'react';
import { Patient } from '@telemedicine/queue-optimizer';

// Import the API client
import apiClient from '@telemedicine/queue-optimizer/dist/api/client';

// Example mock data
const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P001',
    arrivalTime: new Date(Date.now() - 35 * 60000),
    severity: 'high',
    waitTime: 35,
  },
  {
    id: 'P002',
    arrivalTime: new Date(Date.now() - 30 * 60000),
    severity: 'low',
    waitTime: 30,
  },
  {
    id: 'P003',
    arrivalTime: new Date(Date.now() - 25 * 60000),
    severity: 'high',
    waitTime: 25,
  },
  {
    id: 'P004',
    arrivalTime: new Date(Date.now() - 20 * 60000),
    severity: 'medium',
    waitTime: 20,
  },
  {
    id: 'P005',
    arrivalTime: new Date(Date.now() - 15 * 60000),
    severity: 'low',
    waitTime: 15,
  },
];

interface SimulationResult {
  baselineMetrics: any;
  optimizedMetrics: any;
  baselineQueue: any[];
  optimizedQueue: any[];
  improvements: any;
  recommendations: string[];
}

export function QueueOptimizerDashboard() {
  // State
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('http://localhost:3000/api/v1');
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');

  // Initialize API client
  useEffect(() => {
    apiClient.setBaseUrl(apiUrl);
  }, [apiUrl]);

  // Handle optimization
  const handleOptimize = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.simulate(patients);

      if (response.success && response.data) {
        setResult(response.data);
        setActiveTab('results');
      } else {
        setError(response.message || 'Optimization failed');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle add patient
  const handleAddPatient = () => {
    const newPatient: Patient = {
      id: `P${String(patients.length + 1).padStart(3, '0')}`,
      arrivalTime: new Date(),
      severity: 'low',
      waitTime: 0,
    };
    setPatients([...patients, newPatient]);
  };

  // Handle reset
  const handleReset = () => {
    setPatients(MOCK_PATIENTS);
    setResult(null);
    setError(null);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1>🏥 Telemedicine Queue Optimizer</h1>
        <p>Intelligent queue optimization for doctor consultations</p>
      </header>

      {/* API URL Configuration */}
      <div style={styles.configPanel}>
        <label>API URL:</label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={styles.input}
          placeholder="http://localhost:3000/api/v1"
        />
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('input')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'input' ? styles.tabButtonActive : {}),
          }}
        >
          📋 Input
        </button>
        <button
          onClick={() => setActiveTab('results')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'results' ? styles.tabButtonActive : {}),
          }}
        >
          📊 Results
        </button>
      </div>

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div style={styles.tabContent}>
          <section style={styles.section}>
            <h2>Patients in Queue</h2>

            <div style={styles.patientsList}>
              {patients.map((patient, index) => (
                <div key={patient.id} style={styles.patientCard}>
                  <div style={styles.patientRow}>
                    <span>ID: {patient.id}</span>
                    <span className={`severity-${patient.severity}`}>
                      {patient.severity.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.patientRow}>
                    <small>Waited: {patient.waitTime || 0} min</small>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button onClick={handleAddPatient} style={styles.secondaryButton}>
                ➕ Add Patient
              </button>
              <button onClick={handleReset} style={styles.secondaryButton}>
                🔄 Reset to Default
              </button>
            </div>
          </section>

          {error && (
            <div style={styles.errorBox}>
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          <section style={styles.section}>
            <button
              onClick={handleOptimize}
              disabled={loading || patients.length === 0}
              style={{
                ...styles.primaryButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? '⏳ Optimizing...' : '🚀 Optimize Queue'}
            </button>
          </section>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && result && (
        <div style={styles.tabContent}>
          {/* Improvements Summary */}
          <section style={styles.section}>
            <h2>⭐ Key Improvements</h2>
            <div style={styles.metricsGrid}>
              <div style={styles.metricBox}>
                <div style={styles.metricLabel}>Wait Time Reduction</div>
                <div style={styles.metricValue}>
                  {result.improvements.waitTimeReduction}%
                </div>
              </div>
              <div style={styles.metricBox}>
                <div style={styles.metricLabel}>Fairness Improvement</div>
                <div style={styles.metricValue}>
                  +{result.improvements.fairnessImprovement}
                </div>
              </div>
              <div style={styles.metricBox}>
                <div style={styles.metricLabel}>Utilization Gain</div>
                <div style={styles.metricValue}>
                  +{result.improvements.utilizationImprovement}%
                </div>
              </div>
              <div style={styles.metricBox}>
                <div style={styles.metricLabel}>Throughput Gain</div>
                <div style={styles.metricValue}>
                  {result.improvements.throughputImprovement}%
                </div>
              </div>
            </div>
          </section>

          {/* Metrics Comparison */}
          <section style={styles.section}>
            <h2>📊 Metrics Comparison</h2>
            <div style={styles.comparisonTable}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>Metric</th>
                    <th style={styles.tableHeader}>Baseline (FIFO)</th>
                    <th style={styles.tableHeader}>Optimized</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={styles.tableRow}>
                    <td style={styles.tableCell}>Avg Wait Time (min)</td>
                    <td style={styles.tableCell}>
                      {result.baselineMetrics.averageWaitTime.toFixed(1)}
                    </td>
                    <td style={styles.tableCell}>
                      {result.optimizedMetrics.averageWaitTime.toFixed(1)}
                    </td>
                  </tr>
                  <tr style={styles.tableRow}>
                    <td style={styles.tableCell}>Max Wait Time (min)</td>
                    <td style={styles.tableCell}>
                      {result.baselineMetrics.maxWaitTime.toFixed(1)}
                    </td>
                    <td style={styles.tableCell}>
                      {result.optimizedMetrics.maxWaitTime.toFixed(1)}
                    </td>
                  </tr>
                  <tr style={styles.tableRow}>
                    <td style={styles.tableCell}>Fairness Score</td>
                    <td style={styles.tableCell}>
                      {result.baselineMetrics.fairnessScore.toFixed(1)}/100
                    </td>
                    <td style={styles.tableCell}>
                      {result.optimizedMetrics.fairnessScore.toFixed(1)}/100
                    </td>
                  </tr>
                  <tr style={styles.tableRow}>
                    <td style={styles.tableCell}>Doctor Utilization</td>
                    <td style={styles.tableCell}>
                      {result.baselineMetrics.doctorUtilization.toFixed(1)}%
                    </td>
                    <td style={styles.tableCell}>
                      {result.optimizedMetrics.doctorUtilization.toFixed(1)}%
                    </td>
                  </tr>
                  <tr style={styles.tableRow}>
                    <td style={styles.tableCell}>Throughput (patients/hr)</td>
                    <td style={styles.tableCell}>
                      {result.baselineMetrics.throughput.toFixed(1)}
                    </td>
                    <td style={styles.tableCell}>
                      {result.optimizedMetrics.throughput.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Queue Comparison */}
          <section style={styles.section}>
            <h2>📋 Queue Ordering</h2>
            <div style={styles.queueComparison}>
              <div style={styles.queueColumn}>
                <h3>Baseline (FIFO)</h3>
                {result.baselineQueue.map((order, idx) => (
                  <div key={idx} style={styles.queueItem}>
                    <strong>{order.position}.</strong> {order.patientId} ({order.severity})
                    <br />
                    <small>Wait: {order.estimatedWaitTime.toFixed(1)} min</small>
                  </div>
                ))}
              </div>
              <div style={styles.queueColumn}>
                <h3>Optimized (Smart)</h3>
                {result.optimizedQueue.map((order, idx) => (
                  <div key={idx} style={styles.queueItem}>
                    <strong>{order.position}.</strong> {order.patientId} ({order.severity})
                    <br />
                    <small>Wait: {order.estimatedWaitTime.toFixed(1)} min</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <section style={styles.section}>
              <h2>💡 AI Recommendations</h2>
              <ul style={styles.recommendationsList}>
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} style={styles.recommendationItem}>
                    {rec}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button onClick={() => setActiveTab('input')} style={styles.primaryButton}>
            ← Back to Input
          </button>
        </div>
      )}
    </div>
  );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #ddd',
  },
  configPanel: {
    backgroundColor: 'white',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '8px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tabButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  tabButtonActive: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  tabContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
  },
  section: {
    marginBottom: '30px',
  },
  patientsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
  },
  patientCard: {
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  patientRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: '10px 16px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  metricBox: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    border: '2px solid #4CAF50',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  comparisonTable: {
    overflowX: 'auto',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    backgroundColor: '#f0f0f0',
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  tableCell: {
    padding: '12px',
  },
  queueComparison: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  queueColumn: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
  },
  queueItem: {
    backgroundColor: 'white',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  recommendationsList: {
    listStyle: 'none',
    padding: 0,
  },
  recommendationItem: {
    backgroundColor: '#e8f5e9',
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '4px',
    borderLeft: '4px solid #4CAF50',
  },
};

export default QueueOptimizerDashboard;
