import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminAnalytics, adminListUsers, adminToggleUser, adminListProperties,
  adminListBills, adminListPayments, adminListAlerts, listTariffs, createTariff,
} from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { LoadingState, EmptyState, StatCard, StatusTag } from '../components/UI'

const TABS = ['Overview', 'Users', 'Properties', 'Bills', 'Payments', 'Alerts', 'Tariffs']
const AREA_CATEGORIES = ['City', 'Town', 'Village', 'Commercial Area', 'Other']
const PROPERTY_TYPES = ['House', 'Shop', 'Office']

export default function AdminDashboard() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [tariffs, setTariffs] = useState([])
  const [tariffForm, setTariffForm] = useState({
    area_category: 'City', property_type: 'House', min_unit: 0, max_unit: '',
    rate_per_unit: '', fixed_charge: 0, additional_charge: 0, tax_percent: 0, label: '',
  })

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      adminAnalytics(), adminListUsers(), adminListProperties(),
      adminListBills(), adminListPayments(), adminListAlerts(), listTariffs(),
    ]).then(([a, u, p, b, pay, al, t]) => {
      setAnalytics(a.data); setUsers(u.data); setProperties(p.data)
      setBills(b.data); setPayments(pay.data); setAlerts(al.data); setTariffs(t.data)
    }).finally(() => setLoading(false))
  }
  useEffect(loadAll, [])

  const handleToggleUser = async (id) => {
    await adminToggleUser(id)
    showToast('User status updated')
    loadAll()
  }

  const handleCreateTariff = async (e) => {
    e.preventDefault()
    try {
      await createTariff({
        ...tariffForm,
        min_unit: Number(tariffForm.min_unit),
        max_unit: tariffForm.max_unit === '' ? null : Number(tariffForm.max_unit),
        rate_per_unit: Number(tariffForm.rate_per_unit),
        fixed_charge: Number(tariffForm.fixed_charge),
        additional_charge: Number(tariffForm.additional_charge),
        tax_percent: Number(tariffForm.tax_percent),
      })
      showToast('Tariff slab created')
      loadAll()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not create tariff', 'error')
    }
  }

  if (loading) return <LoadingState label="Loading admin dashboard..." />

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Admin Dashboard</div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/complaints')}>Manage Complaints →</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && analytics && (
        <div className="grid grid-cols-4">
          <StatCard title="Total Users" value={analytics.total_users} />
          <StatCard title="Total Properties" value={analytics.total_properties} />
          <StatCard title="Total Bills" value={analytics.total_bills} />
          <StatCard title="Paid Payments" value={analytics.total_paid_payments} />
          <StatCard title="Active Tariff Slabs" value={analytics.active_tariff_slabs} />
        </div>
      )}

      {tab === 'Users' && (
        users.length === 0 ? <EmptyState title="No users" /> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Profile</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
                  <td>{u.profile_completed ? 'Complete' : 'Incomplete'}</td>
                  <td><StatusTag status={u.is_active ? 'Paid' : 'Failed'} /></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => handleToggleUser(u.id)}>{u.is_active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'Properties' && (
        properties.length === 0 ? <EmptyState title="No properties" /> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Owner ID</th><th>Type</th><th>Area</th><th>Address</th></tr></thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td>{p.owner_id}</td><td>{p.property_type}</td><td>{p.area_category}</td><td>{p.formatted_address}</td></tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'Bills' && (
        bills.length === 0 ? <EmptyState title="No bills" /> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Property ID</th><th>Units</th><th>Total</th><th>Status</th><th>Due</th></tr></thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}><td>{b.id}</td><td>{b.property_id}</td><td>{b.units_consumed}</td><td>₹{b.total_amount}</td><td><StatusTag status={b.status} /></td><td>{b.due_date}</td></tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'Payments' && (
        payments.length === 0 ? <EmptyState title="No payments" /> : (
          <table className="table">
            <thead><tr><th>Reference</th><th>Bill ID</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}><td>{p.reference_id}</td><td>{p.bill_id}</td><td>₹{p.amount}</td><td>{p.method}</td><td><StatusTag status={p.status} /></td></tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'Alerts' && (
        alerts.length === 0 ? <EmptyState title="No alerts generated yet" /> : alerts.map((a) => (
          <div key={a.id} className="list-item" style={{ display: 'block' }}>
            <div style={{ fontWeight: 600 }}>{a.title} <span className="tag tag-red">{a.type}</span></div>
            <div className="card-sub">{a.message}</div>
            <div className="card-sub">{new Date(a.created_at).toLocaleString()}</div>
          </div>
        ))
      )}

      {tab === 'Tariffs' && (
        <div className="grid grid-cols-2">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Create Tariff Slab</div>
            <form onSubmit={handleCreateTariff}>
              <div className="form-grid">
                <div className="form-row"><label>Area Category</label>
                  <select value={tariffForm.area_category} onChange={(e) => setTariffForm({ ...tariffForm, area_category: e.target.value })}>
                    {AREA_CATEGORIES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-row"><label>Property Type</label>
                  <select value={tariffForm.property_type} onChange={(e) => setTariffForm({ ...tariffForm, property_type: e.target.value })}>
                    {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-row"><label>Min Unit</label><input type="number" value={tariffForm.min_unit} onChange={(e) => setTariffForm({ ...tariffForm, min_unit: e.target.value })} /></div>
                <div className="form-row"><label>Max Unit (blank = no limit)</label><input type="number" value={tariffForm.max_unit} onChange={(e) => setTariffForm({ ...tariffForm, max_unit: e.target.value })} /></div>
              </div>
              <div className="form-grid">
                <div className="form-row"><label>Rate per Unit (₹)</label><input type="number" step="0.01" value={tariffForm.rate_per_unit} onChange={(e) => setTariffForm({ ...tariffForm, rate_per_unit: e.target.value })} required /></div>
                <div className="form-row"><label>Fixed Charge (₹)</label><input type="number" value={tariffForm.fixed_charge} onChange={(e) => setTariffForm({ ...tariffForm, fixed_charge: e.target.value })} /></div>
              </div>
              <div className="form-grid">
                <div className="form-row"><label>Additional Charge (₹)</label><input type="number" value={tariffForm.additional_charge} onChange={(e) => setTariffForm({ ...tariffForm, additional_charge: e.target.value })} /></div>
                <div className="form-row"><label>Tax %</label><input type="number" value={tariffForm.tax_percent} onChange={(e) => setTariffForm({ ...tariffForm, tax_percent: e.target.value })} /></div>
              </div>
              <div className="form-row"><label>Label</label><input value={tariffForm.label} onChange={(e) => setTariffForm({ ...tariffForm, label: e.target.value })} placeholder="e.g. Demo City House Slab" /></div>
              <button className="btn btn-primary btn-block">Create Tariff Slab</button>
            </form>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Active Tariff Slabs</div>
            {tariffs.length === 0 ? <EmptyState title="No tariffs configured" /> : (
              <table className="table">
                <thead><tr><th>Area/Type</th><th>Units</th><th>Rate</th><th>Fixed</th></tr></thead>
                <tbody>
                  {tariffs.map((t) => (
                    <tr key={t.id}>
                      <td>{t.area_category} / {t.property_type}</td>
                      <td>{t.min_unit}-{t.max_unit ?? '∞'}</td>
                      <td>₹{t.rate_per_unit}</td>
                      <td>₹{t.fixed_charge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
