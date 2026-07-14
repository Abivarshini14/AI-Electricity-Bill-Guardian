import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listSavingsGoals, createSavingsGoal, getBillingCycle, getDashboardSummary } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, ProgressBar } from '../components/UI'

export default function SavingsGoals() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [goals, setGoals] = useState([])
  const [cycle, setCycle] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', target_amount: '' })

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      listSavingsGoals(selectedProperty.id),
      getBillingCycle(selectedProperty.id),
      getDashboardSummary(selectedProperty.id).catch(() => ({ data: null })),
    ]).then(([g, c, s]) => { setGoals(g.data); setCycle(c.data); setSummary(s.data) }).finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createSavingsGoal({
        property_id: selectedProperty.id,
        title: form.title,
        target_amount: Number(form.target_amount),
        cycle_start: cycle.cycle_start,
        cycle_end: cycle.cycle_end,
      })
      showToast('Savings goal created')
      setForm({ title: '', target_amount: '' })
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not create goal', 'error')
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Electricity Savings Goals — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Create a Savings Goal</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Goal Title</label>
              <input placeholder="e.g. Save ₹500 this billing cycle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Target Amount (₹)</label>
              <input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
            </div>
            <button className="btn btn-primary btn-block">Create Goal</button>
          </form>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Your Goals</div>
          {goals.length === 0 ? <EmptyState title="No savings goals yet" /> : goals.map((g) => (
            <div key={g.id} className="list-item" style={{ display: 'block' }}>
              <div style={{ fontWeight: 600 }}>{g.title}</div>
              <div className="card-sub">Target: ₹{g.target_amount} • {g.cycle_start} to {g.cycle_end}</div>
              {summary && (
                <div style={{ marginTop: 8 }}>
                  <ProgressBar percent={summary.savings_goal_progress_percent} />
                  <div className="card-sub" style={{ marginTop: 4 }}>{summary.savings_goal_progress_percent}% progress</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
