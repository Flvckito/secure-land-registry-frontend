import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/lands': 'Land Records',
  '/lands/register': 'Register New Land',
  '/transfers': 'Ownership Transfers',
  '/verify': 'Blockchain Verification',
  '/admin/users': 'User Management',
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const title =
    PAGE_TITLES[location.pathname] ||
    Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] ||
    'LandChain'

  const sidebarWidth = collapsed ? 'ml-16' : 'ml-60'

  return (
    <div className="min-h-screen bg-navy-950 bg-grid">
      <Sidebar collapsed={collapsed} />

      {/* Top bar */}
      <header
        className={`fixed top-0 right-0 h-16 bg-navy-900/80 backdrop-blur border-b border-navy-700
          z-20 flex items-center px-6 gap-4 transition-all duration-300 ${sidebarWidth}`}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-navy-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>

        <h1 className="text-sm font-semibold text-slate-300 tracking-wide flex-1">{title}</h1>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">{user?.name}</div>
            <div className="text-xs text-slate-600 font-mono uppercase">{user?.role?.replace('_', ' ')}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
            <span className="text-gold-400 text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${sidebarWidth}`}>
        <div className="p-6 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function CollapseIcon({ collapsed }) {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {collapsed ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5" />
      )}
    </svg>
  )
}