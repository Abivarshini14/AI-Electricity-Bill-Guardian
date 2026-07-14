import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProperty, updateProperty, getProperty } from '../services/endpoints'
import { useProperty } from '../context/PropertyContext'
import { useToast } from '../context/ToastContext'
import MapAddressSelector from '../components/MapAddressSelector'

const PROPERTY_TYPES = ['House', 'Shop', 'Office']
const PROPERTY_CATEGORIES = ['Own', 'Rental', 'Apartment', 'Other']
const AREA_CATEGORIES = ['City', 'Town', 'Village', 'Commercial Area', 'Other']

export default function PropertyForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { refreshProperties, selectProperty } = useProperty()
  const { showToast } = useToast()

  const [form, setForm] = useState({
    name: '', property_type: 'House', property_category: 'Own', area_category: 'City',
    formatted_address: '', consumer_number: '', meter_number: '', electricity_board: '',
    occupancy_count: 1, cycle_length_days: 60,
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      getProperty(id).then((res) => setForm((f) => ({ ...f, ...res.data }))).finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.formatted_address) {
      setError('Please confirm a property address using the map before saving')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateProperty(id, form)
        showToast('Property updated')
      } else {
        const res = await createProperty(form)
        showToast('Property created')
        await refreshProperties()
        selectProperty(res.data.id)
      }
      if (!isEdit) await refreshProperties()
      navigate('/properties')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save property')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-state">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{isEdit ? 'Edit Property' : 'Add Property'}</div>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Property Name (e.g. My House, Parents House, My Shop)</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Property Type</label>
              <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Property Category</label>
              <select value={form.property_category} onChange={(e) => setForm({ ...form, property_category: e.target.value })}>
                {PROPERTY_CATEGORIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Area Category</label>
              <select value={form.area_category} onChange={(e) => setForm({ ...form, area_category: e.target.value })}>
                {AREA_CATEGORIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Occupancy / Family Members</label>
              <input type="number" min="1" value={form.occupancy_count} onChange={(e) => setForm({ ...form, occupancy_count: Number(e.target.value) })} />
            </div>
          </div>

          <div className="form-row">
            <label>Property Address (search and confirm on the map)</label>
            <MapAddressSelector
              initialAddress={form.formatted_address}
              onConfirm={(addr) => setForm({ ...form, formatted_address: addr })}
            />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Consumer Number</label>
              <input value={form.consumer_number || ''} onChange={(e) => setForm({ ...form, consumer_number: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Meter Number</label>
              <input value={form.meter_number || ''} onChange={(e) => setForm({ ...form, meter_number: e.target.value })} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Electricity Board</label>
              <input value={form.electricity_board || ''} onChange={(e) => setForm({ ...form, electricity_board: e.target.value })} placeholder="e.g. Demo State Electricity Board" />
            </div>
            <div className="form-row">
              <label>Billing Cycle Length (days)</label>
              <input type="number" value={form.cycle_length_days} onChange={(e) => setForm({ ...form, cycle_length_days: Number(e.target.value) })} disabled={isEdit} />
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Property'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/properties')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
