import { useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { getEnergyReportUrl } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState } from '../components/UI'
import api from '../services/api'

export default function EnergyReports() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api.post(`/api/reports/energy-report/${selectedProperty.id}`, null, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `energy_report_${selectedProperty.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToast('Energy report downloaded')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not generate report. Generate at least one bill first.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  return (
    <div>
      <div className="page-header"><div className="page-title">AI Two-Month Energy Report — {selectedProperty.name}</div></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <p className="card-sub">
          Generate a detailed PDF report covering your billing cycle, previous cycle comparison, highest-usage
          appliances, budget status, usage health score, and AI-generated (or rule-based fallback) energy-saving
          recommendations.
        </p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating report...' : 'Generate & Download Report'}
        </button>
      </div>
    </div>
  )
}
