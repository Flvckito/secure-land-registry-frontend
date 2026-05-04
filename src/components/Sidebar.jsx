import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: GridIcon,
    roles: ['admin', 'land_officer', 'citizen'],
  },
  {
    label: 'Land Records',
    path: '/lands',
    icon: MapIcon,
    roles: ['admin', 'land_officer', 'citizen'],
  },
  {
    label: 'Register Land',
    path: '/lands/register',
    icon: PlusIcon,
    roles: ['admin', 'land_officer'],
  },
  {
    label: 'Transfers',
    path: '/transfers',
    icon: ArrowsIcon,
    roles: ['admin', 'land_officer', 'citizen'],
  },
  {
    label: 'Verification',
    path: '/verify',
    icon: ShieldIcon,
    roles: ['admin', 'land_officer', 'citizen'],
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: UsersIcon,
    roles: ['admin'],
  },
]

export default function Sidebar({ collapsed }) {
  const { user, logout, hasRole } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.info('Signed out successfully')
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter((item) => hasRole(...item.roles))

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-navy-900 border-r border-navy-700 z-30
        flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700 min-h-[64px]">
        <div className="w-8 h-8 bg-gold-500 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-navy-950 font-bold text-xs font-mono">LC</span>
        </div>
        {!collapsed && (
          <div>
            <div className="font-display italic text-slate-100 text-lg leading-tight">LandChain</div>
            <div className="text-xs text-slate-500 tracking-wide">Land Registry</div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Signed in as</div>
          <div className="text-sm text-slate-200 font-medium truncate">{user.name}</div>
          <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded mt-1 inline-block
            ${user.role === 'admin' ? 'bg-gold-500/20 text-gold-400' :
              user.role === 'land_officer' ? 'bg-blue-900/60 text-blue-400' :
              'bg-navy-800 text-slate-400'}`}>
            {user.role?.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm transition-all duration-150
              ${isActive
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-navy-700">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm
            text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150`}
        >
          <LogoutIcon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}

// Inline SVG icon components — avoids an icon library dependency
function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}
function MapIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  )
}
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function ArrowsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}
function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}
function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}