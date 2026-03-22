import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/lib/ThemeContext'
import { Github, Linkedin, Mail, Globe } from 'lucide-react'
import { Logo } from '@/components/Logo'
import './styles.css'

interface Patient {
  name: string
  sym: string
  sev: number
  score: number
}

const INITIAL_PATIENTS: Patient[] = [
  { name: 'Ramesh, 71M', sym: 'Chest tightness', sev: 5, score: 94.2 },
  { name: 'Kavya, 3F', sym: 'Fever 104°F', sev: 4, score: 81.5 },
  { name: 'Meena, 67F', sym: 'Breathlessness', sev: 4, score: 76.3 },
  { name: 'Arjun, 45M', sym: 'Chest pressure', sev: 4, score: 71.8 },
  { name: 'Priya, 29F', sym: 'Fever 101°F', sev: 3, score: 58.2 },
]

export function LandingPage() {
  const { theme, setTheme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS)
  const scoringInterval = useRef<any>(null)

  // Starfield Animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let W = window.innerWidth
    let H = window.innerHeight
    let cx = W / 2
    let cy = H / 2

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      cx = W / 2
      cy = H / 2
    }
    window.addEventListener('resize', resize)
    resize()

    const COLORS = ['#00C9A7', '#0095FF', '#B400FF', '#FF2D78', '#FFFFFF', '#FFB84D']
    const N = 600
    const stars = Array.from({ length: N }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      pz: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }))

    let mx = 0, my = 0
    const handleMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / W - 0.5) * 0.015
      my = (e.clientY / H - 0.5) * 0.008
    }
    document.addEventListener('mousemove', handleMouseMove)

    const frame = () => {
      ctx.fillStyle = theme === 'dark' ? 'rgba(8,8,8,.18)' : 'rgba(247,243,236,.35)'
      ctx.fillRect(0, 0, W, H)

      for (let i = 0; i < N; i++) {
        const s = stars[i]
        s.pz = s.z
        s.z -= 0.012
        if (s.z <= 0) {
          s.x = (Math.random() - 0.5) * 2
          s.y = (Math.random() - 0.5) * 2
          s.z = 1
          s.pz = 1
        }
        const scale = 1 / s.z
        const sx = (s.x + mx) * scale * cx + cx
        const sy = (s.y + my) * scale * cy + cy
        const ps = 1 / s.pz
        const px = (s.x + mx) * ps * cx + cx
        const py = (s.y + my) * ps * cy + cy
        const size = Math.max(0, (1 - s.z) * 2.5)
        const alpha = Math.min(1, (1 - s.z) * 1.4)

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = s.color
        ctx.lineWidth = size
        ctx.globalAlpha = alpha * 0.7
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      animationFrameId = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme])

  // Live Queue Logic
  useEffect(() => {
    scoringInterval.current = setInterval(() => {
      setPatients(prev => {
        const next = [...prev].map(p => ({
          ...p,
          score: parseFloat((p.score + (Math.random() - 0.5)).toFixed(1))
        }))
        return next.sort((a, b) => b.score - a.score)
      })
    }, 3000)
    return () => { if (scoringInterval.current) clearInterval(scoringInterval.current) }
  }, [])

  const copyNpm = () => {
    navigator.clipboard.writeText('npm install fluxq-engine')
  }

  return (
    <div className="lp-root" data-theme={theme}>
      <canvas ref={canvasRef} className="lp-canvas" />
      <div className="lp-grain" />

      <div className="lp-page">
        {/* NAV */}
        <nav className="lp-nav">
          <Link to="/" className="lp-logo">
            <Logo size={32} />
          </Link>
          <div className="lp-nav-mid">
            <a href="#specialties">Specialties</a>
            <Link to="/dashboard">Simulation</Link>
          </div>
          <div className="lp-theme-toggle">
            <button
              className={`lp-tt-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            </button>
            <button
              className={`lp-tt-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-ticker-wrap">
            <div className="lp-ticker">
              <span>STOP THE WAIT&nbsp;&nbsp;&nbsp;&nbsp;STOP THE WAIT&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <span>STOP THE WAIT&nbsp;&nbsp;&nbsp;&nbsp;STOP THE WAIT&nbsp;&nbsp;&nbsp;&nbsp;</span>
            </div>
          </div>
          <div className="lp-hero-content">
            <div className="lp-hero-left">
              <div className="lp-hero-kicker">
                <span className="lp-kicker-dot"></span>
                Developed by Diksha — production engine + npm
              </div>
              <h1 className="lp-h1">
                <span>Telemedicine</span><br />
                <span className="accent">Queue</span><br />
                <span className="stroke">Intelligence</span>
              </h1>
              <p className="lp-hero-sub">
                Drop-in smart queue for any telemedicine platform. One API call.
                Medical urgency decides order & not who clicked first.
                Full simulation engine, real-time metrics, and standalone NPM Package.
              </p>
            </div>
            <div className="lp-hero-right">
              <div className="lp-live-widget">
                <div className="lp-lw-header">
                  <span className="lp-lw-title">Optimized Queue</span>
                  <span className="lp-lw-live">FluxQ ON</span>
                </div>
                <div className="lp-lw-body">
                  {patients.map((p, i) => (
                    <div key={p.name} className={`lp-lw-row ${i === 0 ? 'top' : ''}`}>
                      <span className="lp-lw-pos">{i + 1}</span>
                      <span className={`lp-lw-dot s${p.sev}`}></span>
                      <div className="lp-lw-info">
                        <div className="lp-lw-name">{p.name}</div>
                        <div className="lp-lw-symptom">{p.sym}</div>
                      </div>
                      <span className="lp-lw-score">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-hero-cta">
                <Link to="/dashboard" className="lp-btn-main">Simulation Dashboard</Link>
                <a href="#specialties" className="lp-btn-out">Explore Specialities</a>
              </div>
            </div>
          </div>
        </section>

        {/* SPECIALTIES */}
        <section className="lp-specialties" id="specialties">
          <h2 className="lp-section-h">Every specialty.<br /><span className="stroke">Its own queue.</span></h2>
          <div className="lp-sq-grid">
            {[
              { name: 'Diabetic', info: 'Urgency: 0.85 / Wait: 0.15', color: '#00C9A7' },
              { name: 'Cholesterol', info: 'Fairness: 0.70 / Urgency: 0.30', color: '#FFB84D' },
              { name: 'Blood Pressure', info: 'Critical: 0.95 / Wait: 0.05', color: '#7DD4FF' },
              { name: 'General Physician', info: 'Wait: 0.50 / Fairness: 0.50', color: '#9D8CFF' }
            ].map(sq => (
              <div key={sq.name} className="lp-sq-card">
                <div className="lp-sq-icon" style={{ background: `${sq.color}15` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sq.color }} />
                </div>
                <div className="lp-sq-name">{sq.name}</div>
                <div className="lp-sq-doc">{sq.info}</div>
              </div>
            ))}
          </div>
        </section>


        {/* CTA / INTEGRATE */}
        <section className="lp-cta-group">
          <div className="lp-cta-bg">ENGINE</div>
          <div className="lp-cta-content">
            <h2 className="lp-cta-h"><span className="stroke">Integrate</span><br /><span className="teal">The Engine</span></h2>

            <div className="lp-integrate-grid">
              <div className="lp-int-box text-left">
                <div className="lp-int-label">▶ Installation</div>
                <div className="lp-npm-pill mb-6" onClick={copyNpm}>
                  <span className="lp-npm-dollar">$</span> npm install fluxq-engine
                </div>

                <div className="lp-int-label">▶ API Client Library Usage</div>
                <pre className="lp-code-block">
                  {`import { QueueOptimizer } from 'fluxq-engine';

const optimizer = new QueueOptimizer();
const optimizedQueue = optimizer.optimize(patients, config);`}
                </pre>
              </div>

              <div className="lp-int-box text-left">
                <div className="lp-int-label">▶ Direct API Connectivity</div>
                <div className="lp-api-docs">
                  <div className="lp-api-item">
                    <span className="lp-api-meth">GET</span>
                    <span className="lp-api-path">/api/v1/config</span>
                    <p>Get current system optimization parameters.</p>
                  </div>
                  <div className="lp-api-item">
                    <span className="lp-api-meth">POST</span>
                    <span className="lp-api-path">/api/v1/optimize</span>
                    <p>Submit a patient list for instant re-ordering.</p>
                  </div>
                  <div className="lp-api-item">
                    <span className="lp-api-meth">POST</span>
                    <span className="lp-api-path">/api/v1/simulate</span>
                    <p>Run a complete FCFS vs. AI comparison.</p>
                  </div>
                </div>

                <div className="lp-int-label mt-6">Links</div>
                <div className="flex gap-4">
                  <a href="https://github.com/dikshaa2909/FluxQ" target="_blank" className="lp-int-link">
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                  <a href="https://www.npmjs.com/package/fluxq-engine" target="_blank" className="lp-int-link">
                    <Globe className="w-4 h-4" /> NPM Package
                  </a>
                  <a href="https://fluxq.onrender.com/health" target="_blank" className="lp-int-link">
                    <Globe className="w-4 h-4" /> Live API
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-f-logo">FluxQ</div>
          <div className="lp-f-socials">
            <a href="https://github.com/dikshaa2909" target="_blank" className="lp-fs-link" title="GitHub"><Github /></a>
            <a href="https://x.com/dikshatwt" target="_blank" className="lp-fs-link" title="X">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/diksha-deware/" target="_blank" className="lp-fs-link" title="LinkedIn"><Linkedin /></a>
            <a href="mailto:dikshadeware@gmail.com" className="lp-fs-link" title="Email"><Mail /></a>
          </div>
          <div className="lp-f-meta">Developed by Diksha</div>
        </footer>
      </div>
    </div>
  )
}
