import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false, requireProfile = true }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-state">Loading...</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }
  if (requireProfile && !user.profile_completed && user.role !== 'ADMIN') {
    return <Navigate to="/setup-profile" replace />
  }
  return children
}
