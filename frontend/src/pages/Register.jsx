import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const user = await register(form)
      showToast('Account created successfully')
      navigate(user.profile_completed ? '/dashboard' : '/setup-profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">⚡ AI Electricity Bill Guardian</div>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={{ fontSize: 13, marginTop: 16, color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}
