import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, uploadProfilePhoto } from '../services/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function SetupProfile() {
  const { markProfileCompleted } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', address: '', city: '', state: '', country: 'India', pincode: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.address || !form.city || !form.state || !form.pincode) {
      setError('Address, city, state and pincode are required to complete your profile')
      return
    }
    setLoading(true)
    try {
      if (photoFile) {
        const fd = new FormData()
        fd.append('file', photoFile)
        await uploadProfilePhoto(fd)
      }
      await updateProfile(form)
      markProfileCompleted()
      showToast('Profile completed!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">⚡ Complete Your Profile</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          A few details before you start managing your electricity usage.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Profile Photo (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Country</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Pincode</label>
              <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
            </div>
          </div>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
