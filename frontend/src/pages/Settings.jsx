import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { LoadingState } from '../components/UI'

export default function Settings() {
  const { showToast } = useToast()
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile().then((res) => setLanguage(res.data.language || 'en')).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    await updateProfile({ language })
    showToast('Preferences saved')
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Settings</div></div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Language Preference</div>
        <div className="form-row">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>
        </div>
        <p className="card-sub" style={{ marginBottom: 16 }}>
          This sets your preferred language for the AI Assistant and general application labels.
        </p>
        <button className="btn btn-primary" onClick={handleSave}>Save Preferences</button>
      </div>
    </div>
  )
}
