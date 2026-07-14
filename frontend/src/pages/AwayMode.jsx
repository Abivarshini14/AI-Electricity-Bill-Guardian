import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { createAwayMode, listAwayMode } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState } from '../components/UI'

export default function AwayMode() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ start_date: '', end_date: '' })

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    listAwayMode(selectedProperty.id).then((res) => setPeriods(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createAwayMode({ property_id: selectedProperty.id, start_date: form.start_date, end_date: form.end_date })
      showToast('Away mode period created')
      setForm({ start_date: '', end_date: '' })
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not create away mode period', 'error')
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Vacation / Away Mode — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Plan an Away Period</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-row"><label>Away Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
              <div className="form-row"><label>Away End Date</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></div>
            </div>
            <button className="btn btn-primary btn-block">Create Away Period</button>
          </form>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Away Periods & Checklist</div>
          {periods.length === 0 ? <EmptyState title="No away periods planned" /> : periods.map((p) => (
            <div key={p.id} className="list-item" style={{ display: 'block' }}>
              <div style={{ fontWeight: 600 }}>{p.start_date} → {p.end_date}</div>
              <div style={{ marginTop: 8 }}>
                {p.checklist.map((item) => (
                  <div key={item} className="checklist-item"><input type="checkbox" /> {item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
