import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { logOutage, listOutages } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState } from '../components/UI'

export default function OutageLog() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [data, setData] = useState({ total_outage_hours: 0, outages: [] })
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ start_time: '', end_time: '', notes: '' })
  const [error, setError] = useState('')

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    listOutages(selectedProperty.id).then((res) => setData(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await logOutage({
        property_id: selectedProperty.id,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        notes: form.notes,
      })
      showToast('Outage logged')
      setForm({ start_time: '', end_time: '', notes: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not log outage')
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Power Cut / Outage Log — {selectedProperty.name}</div></div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Total Recorded Outage Hours</div>
        <div className="card-value">{data.total_outage_hours} hrs</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Log an Outage</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-row"><label>Start Date & Time</label><input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required /></div>
              <div className="form-row"><label>End Date & Time</label><input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required /></div>
            </div>
            <div className="form-row"><label>Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block">Log Outage</button>
          </form>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Outage History</div>
          {data.outages.length === 0 ? <EmptyState title="No outages recorded" /> : (
            <table className="table">
              <thead><tr><th>Start</th><th>End</th><th>Duration</th></tr></thead>
              <tbody>
                {data.outages.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.start_time).toLocaleString()}</td>
                    <td>{new Date(o.end_time).toLocaleString()}</td>
                    <td>{o.duration_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
