import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { getBillingCycle } from '../services/endpoints'
import { EmptyState, LoadingState, ProgressBar } from '../components/UI'

export default function BillingCycle() {
  const { selectedProperty } = useProperty()
  const [cycle, setCycle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    getBillingCycle(selectedProperty.id).then((res) => setCycle(res.data)).finally(() => setLoading(false))
  }, [selectedProperty])

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />
  if (!cycle) return <EmptyState title="No billing cycle configured" />

  return (
    <div>
      <div className="page-header"><div className="page-title">Billing Cycle Tracker — {selectedProperty.name}</div></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="grid grid-cols-2" style={{ marginBottom: 20 }}>
          <div><div className="card-title">Cycle Start</div><div style={{ fontWeight: 600 }}>{cycle.cycle_start}</div></div>
          <div><div className="card-title">Cycle End</div><div style={{ fontWeight: 600 }}>{cycle.cycle_end}</div></div>
          <div><div className="card-title">Payment Due Date</div><div style={{ fontWeight: 600 }}>{cycle.due_date}</div></div>
          <div><div className="card-title">Days Remaining</div><div style={{ fontWeight: 600 }}>{cycle.days_remaining} of {cycle.days_total}</div></div>
        </div>
        <div className="card-title" style={{ marginBottom: 8 }}>Cycle Progress</div>
        <ProgressBar percent={cycle.progress_percent} />
        <div className="card-sub" style={{ marginTop: 6 }}>{cycle.progress_percent}% of billing cycle completed</div>
      </div>
    </div>
  )
}
