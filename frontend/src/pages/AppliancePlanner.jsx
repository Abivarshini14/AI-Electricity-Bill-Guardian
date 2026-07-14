import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listAppliances, createSchedule, listSchedules } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState } from '../components/UI'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AppliancePlanner() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [appliances, setAppliances] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ appliance_id: '', start_time: '18:00', end_time: '22:00', days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    Promise.all([listAppliances(selectedProperty.id), listSchedules(selectedProperty.id)])
      .then(([a, s]) => { setAppliances(a.data); setSchedules(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day) ? f.days_of_week.filter((d) => d !== day) : [...f.days_of_week, day],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.appliance_id) { setError('Select an appliance'); return }
    try {
      const res = await createSchedule(form)
      setPreview(res.data)
      showToast('Schedule saved')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create schedule')
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  return (
    <div>
      <div className="page-header"><div className="page-title">Appliance On-Time Planner — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Create Schedule</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Appliance</label>
              <select value={form.appliance_id} onChange={(e) => setForm({ ...form, appliance_id: Number(e.target.value) })} required>
                <option value="">Select appliance</option>
                {appliances.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label>Start Time</label>
                <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="form-row">
                <label>End Time</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <label>Days of Week</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAYS.map((d) => (
                  <button type="button" key={d}
                    className={`btn btn-sm ${form.days_of_week.includes(d) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => toggleDay(d)}>{d}</button>
                ))}
              </div>
            </div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block">Save Schedule</button>
          </form>
          {preview && (
            <div className="map-address-box" style={{ marginTop: 14 }}>
              Expected: {preview.expected_daily_units} units/day ({preview.hours_per_day}h/day) ≈ {preview.expected_weekly_units} units/week
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Existing Schedules</div>
          {loading ? <LoadingState /> : schedules.length === 0 ? <EmptyState title="No schedules yet" /> : (
            <table className="table">
              <thead><tr><th>Time</th><th>Days</th><th>Daily Units</th></tr></thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{s.start_time} - {s.end_time}</td>
                    <td>{s.days_of_week.join(', ')}</td>
                    <td>{s.expected_daily_units}</td>
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
