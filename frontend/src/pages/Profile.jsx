import { useEffect, useState } from 'react'
import { getProfile, updateProfile, uploadProfilePhoto } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { LoadingState } from '../components/UI'
import { API_BASE_URL } from '../services/api'

export default function Profile() {
  const { showToast } = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getProfile().then((res) => setProfile(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (photoFile) {
        const fd = new FormData()
        fd.append('file', photoFile)
        await uploadProfilePhoto(fd)
        setPhotoFile(null)
      }
      await updateProfile(profile)
      showToast('Profile updated')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Profile</div></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
            {profile.photo_url ? (
              <img src={`${API_BASE_URL}${profile.photo_url}`} alt="profile" />
            ) : (profile.name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row"><label>Full Name</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
            <div className="form-row"><label>Email</label><input value={profile.email} disabled /></div>
          </div>
          <div className="form-row"><label>Phone</label><input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
          <div className="form-row"><label>Address</label><input value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
          <div className="form-grid">
            <div className="form-row"><label>City</label><input value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
            <div className="form-row"><label>State</label><input value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} /></div>
          </div>
          <div className="form-grid">
            <div className="form-row"><label>Country</label><input value={profile.country || ''} onChange={(e) => setProfile({ ...profile, country: e.target.value })} /></div>
            <div className="form-row"><label>Pincode</label><input value={profile.pincode || ''} onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} /></div>
          </div>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  )
}
