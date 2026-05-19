import { Link, useNavigate } from 'react-router-dom'
import { Shield, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth() ?? {}

  const handleLogout = () => {
    logout?.()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-brand-600 font-bold text-xl">
          <Shield className="w-6 h-6" />
          <span>VaultApp</span>
        </Link>

        <div className="flex items-center space-x-6 text-sm font-medium">
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-brand-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/settings" className="text-slate-600 hover:text-brand-600 transition-colors">
                Settings
              </Link>
              <Link to="/profile" className="text-slate-600 hover:text-brand-600 transition-colors">
                Profile
              </Link>
              <div className="h-6 w-px bg-slate-200 mx-2" />
              <span className="text-slate-700 font-medium">{user?.name ?? user?.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/login"
              className="bg-brand-50 text-brand-600 px-4 py-2 rounded-lg hover:bg-brand-100 transition-all font-semibold"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
