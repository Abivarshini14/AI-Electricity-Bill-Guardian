import { useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { EmptyState } from '../components/UI'

export default function SolarCalculator() {
  const { selectedProperty } = useProperty()
  const [capacityKw, setCapacityKw] = useState(3)
  const [dailyGenUnits, setDailyGenUnits] = useState(12)
  const [rate, setRate] = useState(6)
  const [offsetPercent, setOffsetPercent] = useState(80)

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  const twoMonthGeneration = dailyGenUnits * 60
  const gridUnitsOffset = twoMonthGeneration * (offsetPercent / 100)
  const estimatedBillReduction = gridUnitsOffset * rate

  return (
    <div>
      <div className="page-header"><div className="page-title">Solar Savings Calculator — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Your Assumptions</div>
          <div className="form-row"><label>Proposed Solar Capacity (kW)</label><input type="number" value={capacityKw} onChange={(e) => setCapacityKw(Number(e.target.value))} /></div>
          <div className="form-row"><label>Estimated Daily Generation (units)</label><input type="number" value={dailyGenUnits} onChange={(e) => setDailyGenUnits(Number(e.target.value))} /></div>
          <div className="form-row"><label>Estimated Grid Offset (%)</label><input type="number" value={offsetPercent} onChange={(e) => setOffsetPercent(Number(e.target.value))} /></div>
          <div className="form-row"><label>Your Average Rate per Unit (₹)</label><input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Illustrative Two-Month Estimate</div>
          <table className="table">
            <tbody>
              <tr><td>Two-Month Solar Generation</td><td>{twoMonthGeneration.toFixed(1)} units</td></tr>
              <tr><td>Grid Units Offset</td><td>{gridUnitsOffset.toFixed(1)} units</td></tr>
              <tr><td style={{ fontWeight: 700 }}>Estimated Bill Reduction</td><td style={{ fontWeight: 700 }}>₹{estimatedBillReduction.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12 }}>
            This is a simplified estimation calculator based on the assumptions you entered above. Actual solar
            generation and savings depend on panel orientation, shading, local weather, inverter efficiency, and
            your electricity board's net-metering policy.
          </div>
        </div>
      </div>
    </div>
  )
}
