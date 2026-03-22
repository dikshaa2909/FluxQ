import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { PatientProvider } from '@/lib/PatientContext'
import { ThemeProvider } from '@/lib/ThemeContext'
import { Layout } from '@/components/Layout'
import { DashboardPage } from '@/pages/Dashboard'
import { SimulatorPage } from '@/pages/Simulator'
import { ComparisonPage } from '@/pages/Comparison'
import { ConfigurationPage } from '@/pages/Configuration'
import { DoctorsPage } from '@/pages/Doctors'
import { IntakePage } from '@/pages/IntakePage'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message || 'Unknown error' }
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('App error boundary:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="max-w-md p-8 rounded-lg border border-destructive/30 bg-destructive/5 space-y-4 text-center">
            <h2 className="text-lg font-bold text-destructive">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/' }}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PatientProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/intake" element={<IntakePage />} />
                <Route path="/simulator" element={<SimulatorPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/config" element={<ConfigurationPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PatientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
