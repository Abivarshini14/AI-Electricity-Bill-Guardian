import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { addMeterReading, listMeterReadings } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState } from '../components/UI'

export default function MeterReadings() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ previous_reading: '', current_reading: '', reading_date: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    listMeterReadings(selectedProperty.id).then((res) => setReadings(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [selectedProperty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addMeterReading({
        property_id: selectedProperty.id,
        previous_reading: Number(form.previous_reading),
        current_reading: Number(form.current_reading),
        reading_date: form.reading_date,
      })
      showToast('Meter reading added')
      setForm({ previous_reading: '', current_reading: '', reading_date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add reading')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Meter Readings — {selectedProperty.name}</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Add New Reading</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Previous Reading</label>
              <input type="number" step="0.01" value={form.previous_reading} onChange={(e) => setForm({ ...form, previous_reading: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Current Reading</label>
              <input type="number" step="0.01" value={form.current_reading} onChange={(e) => setForm({ ...form, current_reading: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Reading Date</label>
              <input type="date" value={form.reading_date} onChange={(e) => setForm({ ...form, reading_date: e.target.value })} required />
            </div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving...' : 'Add Reading'}</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Reading History</div>
          {loading ? <LoadingState /> : readings.length === 0 ? (
            <EmptyState title="No readings recorded yet" />
          ) : (
            <table className="table">
              <thead><tr><th>Date</th><th>Previous</th><th>Current</th><th>Units</th></tr></thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td>{r.reading_date}</td>
                    <td>{r.previous_reading}</td>
                    <td>{r.current_reading}</td>
                    <td>{r.units_consumed}</td>
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
