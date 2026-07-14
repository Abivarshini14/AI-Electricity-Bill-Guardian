import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listAppliances, addAppliance, deleteAppliance, getDefaultAppliances } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, ConfirmDialog } from '../components/UI'

const emptyForm = { name: '', quantity: 1, wattage: '', daily_usage_hours: '', standby_wattage: 0, standby_hours: 0 }

export default function Appliances() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [appliances, setAppliances] = useState([])
  const [defaults, setDefaults] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    listAppliances(selectedProperty.id).then((res) => setAppliances(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [selectedProperty])
  useEffect(() => { getDefaultAppliances().then((res) => setDefaults(res.data.appliances)) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addAppliance({
        property_id: selectedProperty.id,
        name: form.name,
        quantity: Number(form.quantity) || 1,
        wattage: Number(form.wattage),
        daily_usage_hours: Number(form.daily_usage_hours) || 0,
        standby_wattage: Number(form.standby_wattage) || 0,
        standby_hours: Number(form.standby_hours) || 0,
      })
      showToast('Appliance added')
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add appliance')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAppliance(toDelete.id)
      showToast('Appliance removed')
      load()
    } finally {
      setToDelete(null)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Appliances — {selectedProperty.name}</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Add Appliance</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Appliance Name</label>
              <input list="default-appliances" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <datalist id="default-appliances">
                {defaults.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label>Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Wattage (W)</label>
                <input type="number" value={form.wattage} onChange={(e) => setForm({ ...form, wattage: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <label>Daily Usage Hours</label>
              <input type="number" step="0.1" value={form.daily_usage_hours} onChange={(e) => setForm({ ...form, daily_usage_hours: e.target.value })} required />
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label>Standby Wattage (W)</label>
                <input type="number" value={form.standby_wattage} onChange={(e) => setForm({ ...form, standby_wattage: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Standby Hours/Day</label>
                <input type="number" step="0.1" value={form.standby_hours} onChange={(e) => setForm({ ...form, standby_hours: e.target.value })} />
              </div>
            </div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Adding...' : 'Add Appliance'}</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Highest Consuming Appliances</div>
          {loading ? <LoadingState /> : appliances.length === 0 ? (
            <EmptyState title="No appliances added yet" />
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Two-Month Units</th><th>Est. Cost</th><th></th></tr></thead>
              <tbody>
                {appliances.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name} ({a.quantity}x)</td>
                    <td>{a.two_month_units} kWh</td>
                    <td>₹{a.estimated_cost}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setToDelete(a)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Remove Appliance"
        message={`Remove "${toDelete?.name}" from this property?`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        confirmLabel="Remove"
      />
    </div>
  )
}
