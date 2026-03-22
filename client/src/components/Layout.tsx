import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { useTheme } from '@/lib/ThemeContext'
import {
  LayoutDashboard,
  PlayCircle,
  GitCompareArrows,
  Settings,
  Stethoscope,
  ClipboardList,
  Sun,
  Moon,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/intake', icon: ClipboardList, label: 'Patient Intake' },
  { to: '/simulator', icon: PlayCircle, label: 'Simulator' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
  { to: '/comparison', icon: GitCompareArrows, label: 'Comparison' },
  { to: '/config', icon: Settings, label: 'Configuration' },
]

export function Layout() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [time, setTime] = useState(new Date())
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    api.health().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))
    const healthInterval = setInterval(() => {
      api.health().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))
    }, 10000)
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(healthInterval); clearInterval(clockInterval) }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Sidebar */}
      <aside className="w-64 sidebar-glass flex flex-col shrink-0 relative z-20">
        {/* Logo */}
        <div className="p-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7 L5 4 L8 7 L11 3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 11 L5 8 L8 10 L11 5" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
              </svg>
            </div>
            <div className="flex flex-col gap-0 leading-none">
              <span className="font-display text-xs font-black tracking-wider uppercase">
                Flux<span className="text-primary">Q</span>
              </span>
              <span className="font-mono-space text-[8px] tracking-[.14em] text-muted-foreground/50 uppercase mt-0.5">
                Queue Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="section-label px-3 mb-3">Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs tracking-wide transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent'
                }`
              }
            >
              <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-mono-space text-[11px] tracking-wider uppercase">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Status footer */}
        <div className="p-4 border-t border-border/60 space-y-3">
          <div className="flex items-center gap-2">
            <div className={`live-dot ${apiStatus !== 'online' ? 'opacity-30' : ''}`} 
                 style={apiStatus === 'offline' ? { background: '#FF3B3B', boxShadow: '0 0 8px #FF3B3B' } : {}} />
            <span className="font-mono-space text-[10px] tracking-wider uppercase text-muted-foreground">
              {apiStatus === 'online' && 'System Online'}
              {apiStatus === 'offline' && 'Disconnected'}
              {apiStatus === 'checking' && 'Connecting...'}
            </span>
          </div>
          <div className="font-mono-space text-[9px] text-muted-foreground/40 tracking-wider">
            localhost:3000
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="h-11 border-b border-border/60 nav-glass flex items-center justify-between px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            {apiStatus === 'online' ? (
              <div className="flex items-center gap-2">
                <div className="live-dot" />
                <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-primary">
                  System Normal
                </span>
              </div>
            ) : (
              <span className="font-mono-space text-[10px] tracking-[.14em] uppercase text-severity-high">
                ● API Disconnected
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div
              className="flex items-center rounded-full border border-border p-0.5 gap-0.5 cursor-pointer hover:border-primary transition-all duration-300"
            >
              <button
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex items-center justify-center h-7 w-7 rounded-full transition-all duration-250 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Light mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex items-center justify-center h-7 w-7 rounded-full transition-all duration-250 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dark mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="font-mono-space text-[10px] tracking-wider text-muted-foreground/60">
              {time.toLocaleTimeString()}
            </span>
            {apiStatus === 'online' && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="font-mono-space text-[10px] tracking-[.14em] text-primary font-bold uppercase">Live</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <div className="p-8 max-w-6xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
