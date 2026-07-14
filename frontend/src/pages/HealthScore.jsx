import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { getDashboardSummary } from '../services/endpoints'
import { EmptyState, LoadingState, StatusTag } from '../components/UI'

export default function HealthScore() {
  const { selectedProperty } = useProperty()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    getDashboardSummary(selectedProperty.id).then((res) => setSummary(res.data)).finally(() => setLoading(false))
  }, [selectedProperty])

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />
  if (!summary) return <EmptyState title="No data available yet" />

  const h = summary.health_score
  const color = h.score >= 85 ? '#22c55e' : h.score >= 70 ? '#4ade80' : h.score >= 50 ? '#facc15' : '#ef4444'

  return (
    <div>
      <div className="page-header"><div className="page-title">Electricity Usage Health Score — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 800, color }}>{h.score}</div>
          <div style={{ marginBottom: 10 }}><StatusTag status={h.category} /></div>
          <div className="card-sub">Score out of 100, calculated using deterministic rules (not machine learning).</div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>How this score is calculated</div>
          <ul style={{ fontSize: 13, color: 'var(--color-text-muted)', paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Budget status: whether your estimated bill is within your set budget</li>
            <li>Daily usage vs your recommended daily unit limit</li>
            <li>Consumption increase vs previous billing cycle</li>
            <li>Standby power wastage across your appliances</li>
            <li>Progress toward your savings goal (if set)</li>
          </ul>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--color-text-muted)' }}>
            85-100 Excellent • 70-84 Good • 50-69 Moderate • Below 50 High Usage
          </div>
        </div>
      </div>
    </div>
  )
}
