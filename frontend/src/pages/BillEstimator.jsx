import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProperty } from '../context/PropertyContext'
import { getDashboardSummary, generateBill } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState } from '../components/UI'

export default function BillEstimator() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    getDashboardSummary(selectedProperty.id)
      .then((res) => setSummary(res.data))
      .catch((e) => setError(e.response?.data?.detail || 'Could not load bill estimate'))
      .finally(() => setLoading(false))
  }, [selectedProperty])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await generateBill(selectedProperty.id)
      showToast(`Bill generated: ₹${res.data.total_amount}`)
      navigate('/bills')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not generate bill', 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />
  if (error) return <div className="card">{error}</div>

  const b = summary?.bill_breakdown

  return (
    <div>
      <div className="page-header"><div className="page-title">Bill Estimator — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title">Projected Units This Cycle</div>
          <div className="card-value">{summary.usage_pace.projected_cycle_usage} kWh</div>
          <div className="card-sub">Based on {summary.usage_pace.avg_daily_usage} units/day average</div>
        </div>
        <div className="card">
          <div className="card-title">Estimated Total Bill</div>
          <div className="card-value">₹{summary.estimated_bill}</div>
          <div className="card-sub">This is an estimate using demo tariffs — labeled as estimated/simulated.</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>Bill Breakdown</div>
        <table className="table">
          <tbody>
            <tr><td>Energy Charge</td><td>₹{b.energy_charge}</td></tr>
            <tr><td>Fixed Charge</td><td>₹{b.fixed_charge}</td></tr>
            <tr><td>Additional Charge</td><td>₹{b.additional_charge}</td></tr>
            <tr><td>Tax</td><td>₹{b.tax_amount}</td></tr>
            <tr><td style={{ fontWeight: 700 }}>Total</td><td style={{ fontWeight: 700 }}>₹{b.total_amount}</td></tr>
          </tbody>
        </table>
        {b.used_fallback_tariff && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-warning)' }}>
            No matching admin tariff was configured for this property type/area — a safe default rate was used.
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Official Bill for This Cycle'}
        </button>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
          Generating a bill uses actual recorded meter readings for the current cycle and rolls the billing cycle forward.
        </div>
      </div>
    </div>
  )
}
