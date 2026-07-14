import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProperty } from '../context/PropertyContext'
import { deleteProperty } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, ConfirmDialog } from '../components/UI'

const typeIcons = { House: '🏠', Shop: '🏪', Office: '🏢' }

export default function Properties() {
  const { properties, loading, refreshProperties, selectProperty, selectedPropertyId } = useProperty()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [toDelete, setToDelete] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteProperty(toDelete.id)
      showToast('Property deleted')
      refreshProperties()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not delete property', 'error')
    } finally {
      setToDelete(null)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Properties</div>
          <div className="page-subtitle">Manage multiple properties like your house, shop, or office.</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/properties/new')}>+ Add Property</button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          title="No properties yet"
          subtitle="Add your first property (e.g. My House) to start tracking electricity usage."
          action={<button className="btn btn-primary" onClick={() => navigate('/properties/new')}>Add Property</button>}
        />
      ) : (
        <div className="grid grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className={`card`} style={{ borderColor: p.id === selectedPropertyId ? 'var(--color-primary)' : undefined }}>
              <div style={{ fontSize: 26 }}>{typeIcons[p.property_type] || '🏠'}</div>
              <div style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 2px' }}>{p.name}</div>
              <div className="card-sub">{p.property_type} • {p.property_category} • {p.area_category}</div>
              <div className="card-sub" style={{ marginTop: 8 }}>{p.formatted_address}</div>
              <div className="card-sub">Consumer: {p.consumer_number || 'N/A'} | Meter: {p.meter_number || 'N/A'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { selectProperty(p.id); navigate('/dashboard') }}>Select</button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/properties/${p.id}/edit`)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setToDelete(p)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Property"
        message={`This will permanently delete "${toDelete?.name}" and all its related data (readings, bills, appliances). This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        confirmLabel="Delete"
      />
    </div>
  )
}
