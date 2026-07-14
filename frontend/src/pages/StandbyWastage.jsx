import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listAppliances, listTariffs } from '../services/endpoints'
import { EmptyState, LoadingState } from '../components/UI'

export default function StandbyWastage() {
  const { selectedProperty } = useProperty()
  const [appliances, setAppliances] = useState([])
  const [loading, setLoading] = useState(true)
  const [avgRate, setAvgRate] = useState(6)

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    Promise.all([listAppliances(selectedProperty.id), listTariffs()])
      .then(([a, t]) => {
        setAppliances(a.data)
        const relevant = t.data.filter((s) => s.area_category === selectedProperty.area_category && s.property_type === selectedProperty.property_type)
        if (relevant.length) setAvgRate(relevant.reduce((sum, s) => sum + s.rate_per_unit, 0) / relevant.length)
      })
      .finally(() => setLoading(false))
  }, [selectedProperty])

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  const totalStandbyUnits = appliances.reduce((sum, a) => sum + a.standby_units, 0)
  const totalStandbyCost = totalStandbyUnits * avgRate

  return (
    <div>
      <div className="page-header"><div className="page-title">Standby Power Wastage — {selectedProperty.name}</div></div>
      <div className="grid grid-cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Total Standby Units (2-month)</div>
          <div className="card-value">{totalStandbyUnits.toFixed(2)} kWh</div>
        </div>
        <div className="card">
          <div className="card-title">Estimated Standby Cost</div>
          <div className="card-value">₹{totalStandbyCost.toFixed(2)}</div>
          <div className="card-sub">Possible savings if standby usage is eliminated</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Standby Breakdown by Appliance</div>
        {appliances.length === 0 ? <EmptyState title="No appliances added yet" /> : (
          <table className="table">
            <thead><tr><th>Appliance</th><th>Standby Wattage</th><th>Standby Hrs/Day</th><th>Standby Units (2mo)</th><th>Est. Cost</th></tr></thead>
            <tbody>
              {appliances.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.standby_wattage} W</td>
                  <td>{a.standby_hours} h</td>
                  <td>{a.standby_units} kWh</td>
                  <td>₹{(a.standby_units * avgRate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
