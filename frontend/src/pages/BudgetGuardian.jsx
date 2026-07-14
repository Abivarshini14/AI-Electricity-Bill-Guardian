import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { getDashboardSummary, createBudget, getBillingCycle } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, ProgressBar } from '../components/UI'

export default function BudgetGuardian() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [summary, setSummary] = useState(null)
  const [cycle, setCycle] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    Promise.all([getDashboardSummary(selectedProperty.id), getBillingCycle(selectedProperty.id)])
      .then(([s, c]) => { setSummary(s.data); setCycle(c.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const handleSetBudget = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createBudget({
        property_id: selectedProperty.id,
        cycle_start: cycle.cycle_start,
        cycle_end: cycle.cycle_end,
        amount: Number(amount),
      })
      showToast('Budget set for this cycle')
      setAmount('')
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not set budget', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  const budget = summary?.budget

  return (
    <div>
      <div className="page-header"><div className="page-title">Electricity Budget Guardian — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Set Two-Month Budget</div>
          <form onSubmit={handleSetBudget}>
            <div className="form-row">
              <label>Budget Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving...' : 'Set Budget'}</button>
          </form>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Budget Status</div>
          {budget?.amount ? (
            <>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Budget: ₹{budget.amount}</div>
              <div style={{ fontSize: 14, marginBottom: 10 }}>Estimated Bill: ₹{budget.estimated_bill}</div>
              <ProgressBar percent={budget.progress_percent} />
              <div style={{ marginTop: 10 }}>
                {budget.exceeded_amount > 0 ? (
                  <div style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                    Budget Alert: Estimated bill may exceed your target by ₹{budget.exceeded_amount}
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    Remaining Budget: ₹{budget.remaining}
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="No budget set for this cycle" />
          )}
        </div>
      </div>
    </div>
  )
}
