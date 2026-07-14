import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { raiseComplaint, listMyComplaints, COMPLAINT_CATEGORIES } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, StatusTag } from '../components/UI'

const STATUS_FILTERS = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed']

export default function Complaints() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [tab, setTab] = useState('raise')
  const [complaints, setComplaints] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ category: COMPLAINT_CATEGORIES[0], subject: '', description: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    const params = { property_id: selectedProperty.id }
    if (statusFilter !== 'All') params.status = statusFilter
    listMyComplaints(params).then((res) => setComplaints(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty, statusFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('property_id', selectedProperty.id)
      fd.append('category', form.category)
      fd.append('subject', form.subject)
      fd.append('description', form.description)
      if (file) fd.append('file', file)
      await raiseComplaint(fd)
      showToast('Complaint submitted')
      setForm({ category: COMPLAINT_CATEGORIES[0], subject: '', description: '' })
      setFile(null)
      setTab('track')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit complaint')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  return (
    <div>
      <div className="page-header"><div className="page-title">Complaints — {selectedProperty.name}</div></div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn ${tab === 'raise' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('raise')}>Raise Complaint</button>
        <button className={`btn ${tab === 'track' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('track')}>Track Complaints</button>
      </div>

      {tab === 'raise' ? (
        <div className="card" style={{ maxWidth: 600 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Complaint Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Attach Proof (optional — image or PDF, max 8MB)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Submitting...' : 'Submit Complaint'}</button>
          </form>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((s) => (
              <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          {loading ? <LoadingState /> : complaints.length === 0 ? (
            <EmptyState title="No complaints found" subtitle="Complaints you raise will appear here with their live status." />
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>#{c.id} — {c.subject}</div>
                    <div className="card-sub">{c.category} • Raised {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusTag status={c.status} />
                </div>
                <p style={{ fontSize: 13, marginTop: 10 }}>{c.description}</p>
                {c.attachment_url && (
                  <a href={`${import.meta.env.VITE_API_BASE_URL}${c.attachment_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    View Attachment
                  </a>
                )}
                {c.admin_response && (
                  <div className="map-address-box" style={{ marginTop: 10 }}>
                    <strong>Admin Response:</strong> {c.admin_response}
                  </div>
                )}
                <div className="card-sub" style={{ marginTop: 8 }}>Last updated: {new Date(c.updated_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
