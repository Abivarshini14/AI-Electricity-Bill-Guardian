import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminListComplaints, adminComplaintStats, updateComplaintStatus,
  COMPLAINT_CATEGORIES, COMPLAINT_STATUS_FLOW,
} from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, StatusTag } from '../components/UI'
import { API_BASE_URL } from '../services/api'

const STATUS_FILTERS = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed']

export default function AdminComplaints() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    const params = {}
    if (statusFilter !== 'All') params.status = statusFilter
    if (categoryFilter !== 'All') params.category = categoryFilter
    if (search.trim()) params.search = search.trim()
    Promise.all([adminListComplaints(params), adminComplaintStats()])
      .then(([c, s]) => { setComplaints(c.data); setStats(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [statusFilter, categoryFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    load()
  }

  const openComplaint = (c) => {
    setActive(c)
    setResponseText(c.admin_response || '')
    const options = COMPLAINT_STATUS_FLOW[c.status] || []
    setNextStatus(options[0] || c.status)
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await updateComplaintStatus(active.id, { status: nextStatus, admin_response: responseText })
      showToast('Complaint updated and user notified')
      setActive(null)
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not update complaint', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !stats) return <LoadingState label="Loading complaints..." />

  const allowedNextStatuses = active ? (COMPLAINT_STATUS_FLOW[active.status] || []) : []

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Admin Complaint Management</div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin')}>← Back to Admin Dashboard</button>
      </div>

      {stats && (
        <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
          <div className="card"><div className="card-title">Total</div><div className="card-value">{stats.total}</div></div>
          <div className="card"><div className="card-title">Submitted</div><div className="card-value">{stats.Submitted || 0}</div></div>
          <div className="card"><div className="card-title">In Progress</div><div className="card-value">{(stats['Under Review'] || 0) + (stats['In Progress'] || 0)}</div></div>
          <div className="card"><div className="card-title">Resolved / Closed</div><div className="card-value">{(stats.Resolved || 0) + (stats.Closed || 0)}</div></div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label>Search subject or description</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search complaints..." />
          </div>
          <div style={{ minWidth: 160 }}>
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 160 }}>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      {complaints.length === 0 ? (
        <EmptyState title="No complaints found for these filters" />
      ) : (
        <table className="table">
          <thead><tr><th>ID</th><th>Subject</th><th>Category</th><th>User ID</th><th>Status</th><th>Raised</th><th></th></tr></thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td>{c.subject}</td>
                <td>{c.category}</td>
                <td>{c.user_id}</td>
                <td><StatusTag status={c.status} /></td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td><button className="btn btn-outline btn-sm" onClick={() => openComplaint(c)}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Complaint #{active.id} — {active.subject}</h3>
            <div className="card-sub" style={{ marginBottom: 10 }}>
              Category: {active.category} • Property ID: {active.property_id} • User ID: {active.user_id}
            </div>
            <p style={{ fontSize: 14 }}>{active.description}</p>
            {active.attachment_url && (
              <a href={`${API_BASE_URL}${active.attachment_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginBottom: 14, display: 'inline-block' }}>
                View Uploaded Proof
              </a>
            )}

            <div className="form-row">
              <label>Current Status: <StatusTag status={active.status} /></label>
            </div>

            {allowedNextStatuses.length > 0 ? (
              <div className="form-row">
                <label>Update Status To</label>
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  <option value={active.status}>Keep as {active.status}</option>
                  {allowedNextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div className="card-sub" style={{ marginBottom: 14 }}>This complaint is closed and cannot be updated further.</div>
            )}

            <div className="form-row">
              <label>Admin Response</label>
              <textarea rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Write a response visible to the user..." />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setActive(null)}>Close</button>
              {allowedNextStatuses.length > 0 && (
                <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Notify User'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
