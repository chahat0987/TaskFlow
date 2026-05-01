import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, CheckSquare, User, LogOut,
  ChevronRight, Plus, Menu, X, FolderOpen
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { projectsApi } from '../../api/client'
import Avatar from '../ui/Avatar'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data.results || r.data),
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-ink-900 border-r border-ink-800
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-ink-950 font-display font-bold text-xs">T</span>
            </div>
            <span className="font-display text-lg text-ink-100">TaskFlow</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden btn-ghost p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5 mb-6">
            <NavItem to="/" icon={<LayoutDashboard size={15} />} label="Dashboard" />
            <NavItem to="/my-tasks" icon={<CheckSquare size={15} />} label="My Tasks" />
            <NavItem to="/profile" icon={<User size={15} />} label="Profile" />
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Projects</span>
              <button
                onClick={() => navigate('/')}
                className="text-ink-500 hover:text-amber-400 transition-colors"
                title="New project"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects?.map(p => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 group
                    ${isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800'
                    }`
                  }
                >
                  <FolderOpen size={13} className="shrink-0" />
                  <span className="truncate">{p.name}</span>
                  {p.my_role === 'owner' && (
                    <span className="ml-auto text-[10px] text-ink-600 shrink-0">owner</span>
                  )}
                </NavLink>
              ))}
              {projects?.length === 0 && (
                <p className="text-xs text-ink-600 px-3 py-2">No projects yet</p>
              )}
            </div>
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-ink-800 px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-200 truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs text-ink-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost p-1" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-ink-800 bg-ink-900">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-1">
            <Menu size={18} />
          </button>
          <span className="font-display text-ink-100">TaskFlow</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150
        ${isActive
          ? 'bg-amber-500/10 text-amber-400'
          : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}
