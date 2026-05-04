import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Optionally enforces role requirements.
 *
 * Usage:
 *   <ProtectedRoute>                        → any logged-in user
 *   <ProtectedRoute roles={['admin']}>      → admin only
 *   <ProtectedRoute roles={['admin', 'land_officer']}>
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    // Preserve intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}