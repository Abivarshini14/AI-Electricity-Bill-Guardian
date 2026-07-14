import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listAppliances, simulateAppliance } from '../services/endpoints'
import { EmptyState, LoadingState } from '../components/UI'

export default function WhatIfSimulator() {
  const { selectedProperty } = useProperty()
  const [appliances, setAppliances] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [wattage, setWattage] = useState(0)
  const [hours, setHours] = useState(0)
  const [current, setCurrent] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    listAppliances(selectedProperty.id).then((res) => setAppliances(res.data)).finally(() => setLoading(false))
  }, [selectedProperty])

  const selectAppliance = (id) => {
    setSelectedId(id)
    const a = appliances.find((x) => x.id === Number(id))
    if (a) {
      setCurrent(a)
      setQuantity(a.quantity)
      setWattage(a.wattage)
      setHours(a.daily_usage_hours)
    }
  }

  const runSimulation = async () => {
    const res = await simulateAppliance({ property_id: selectedProperty.id, quantity, wattage, daily_usage_hours: hours })
    setResult(res.data)
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  const unitsSaved = current ? Math.max(current.two_month_units - (result?.two_month_units ?? current.two_month_units), 0) : 0
  const moneySaved = current ? Math.max(current.estimated_cost - (result?.estimated_cost ?? current.estimated_cost), 0) : 0

  return (
    <div>
      <div className="page-header"><div className="page-title">What-If Savings Simulator</div></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-row">
          <label>Select Appliance</label>
          <select value={selectedId} onChange={(e) => selectAppliance(e.target.value)}>
            <option value="">Choose an appliance</option>
            {appliances.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {current && (
          <>
            <div className="form-grid">
              <div className="form-row"><label>Quantity</label><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
              <div className="form-row"><label>Wattage (W)</label><input type="number" value={wattage} onChange={(e) => setWattage(Number(e.target.value))} /></div>
            </div>
            <div className="form-row"><label>Daily Usage Hours</label><input type="number" step="0.1" value={hours} onChange={(e) => setHours(Number(e.target.value))} /></div>
            <button className="btn btn-primary btn-block" onClick={runSimulation}>Simulate</button>

            {result && (
              <div className="map-address-box" style={{ marginTop: 16 }}>
                <div>Current: {current.two_month_units} units / ₹{current.estimated_cost}</div>
                <div>Simulated: {result.two_month_units} units / ₹{result.estimated_cost}</div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginTop: 6 }}>
                  Possible Estimated Savings: {unitsSaved.toFixed(2)} units / ₹{moneySaved.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  This is a simulation only — your actual appliance record has not been changed.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
