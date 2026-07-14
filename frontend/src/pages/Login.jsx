import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      showToast(`Welcome back, ${user.name}`)
      if (user.role === 'ADMIN') navigate('/admin')
      else navigate(user.profile_completed ? '/dashboard' : '/setup-profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">⚡ AI Electricity Bill Guardian</div>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ fontSize: 13, marginTop: 16, color: 'var(--color-text-muted)' }}>
          New here? <Link to="/register" style={{ color: 'var(--color-primary)' }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
