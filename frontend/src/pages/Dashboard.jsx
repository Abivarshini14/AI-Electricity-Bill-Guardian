import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useProperty } from '../context/PropertyContext'
import { useAuth } from '../context/AuthContext'
import { getDashboardSummary, listBills } from '../services/endpoints'
import { StatCard, LoadingState, EmptyState, ProgressBar, StatusTag } from '../components/UI'

const COLORS = ['#22c55e', '#38bdf8', '#facc15', '#f472b6', '#a78bfa', '#f97316']

export default function Dashboard() {
  const { selectedProperty, properties, loading: propLoading } = useProperty()
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    setError('')
    Promise.all([
      getDashboardSummary(selectedProperty.id),
      listBills(selectedProperty.id),
    ])
      .then(([s, b]) => { setSummary(s.data); setBills(b.data) })
      .catch((e) => setError(e.response?.data?.detail || 'Could not load dashboard. Make sure a billing cycle and meter readings exist.'))
      .finally(() => setLoading(false))
  }, [selectedProperty])

  if (propLoading || loading) return <LoadingState label="Loading your dashboard..." />

  if (!properties || properties.length === 0) {
    return (
      <EmptyState
        title="No properties yet"
        subtitle="Add your first property to start tracking electricity usage."
        action={<button className="btn btn-primary" onClick={() => navigate('/properties')}>Add Property</button>}
      />
    )
  }

  const billHistoryData = [...bills].reverse().map((b) => ({
    cycle: `${b.cycle_start}`,
    amount: b.total_amount,
    units: b.units_consumed,
  }))

  const applianceData = (summary?.top_appliances || []).map((a) => ({ name: a.name, value: a.two_month_units }))

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Welcome back, {user?.name}</div>
          <div className="page-subtitle">{selectedProperty?.name} — {selectedProperty?.formatted_address}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/bill-estimator')}>Generate Bill</button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-warning)', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
            <StatCard title="Estimated Bill" value={`₹${summary.estimated_bill}`} sub={`${summary.usage_pace.projected_cycle_usage} units projected`} />
            <StatCard title="Current Units" value={summary.usage_pace.avg_daily_usage + '/day'} sub={`${summary.usage_pace.days_completed} of ${summary.usage_pace.total_days} days completed`} />
            <StatCard title="Usage Health Score" value={`${summary.health_score.score}/100`} sub={summary.health_score.category} accent={summary.health_score.score >= 70 ? '#22c55e' : summary.health_score.score >= 50 ? '#facc15' : '#ef4444'} />
            <StatCard title="Next Bill Due" value={summary.billing_cycle.due_date} sub={`Cycle ends ${summary.billing_cycle.cycle_end}`} />
          </div>

          <div className="grid grid-cols-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-title">Budget vs Estimated Bill</div>
              {summary.budget.amount ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span>₹{summary.estimated_bill} of ₹{summary.budget.amount}</span>
                    <span>{summary.budget.progress_percent}%</span>
                  </div>
                  <ProgressBar percent={summary.budget.progress_percent} />
                  {summary.budget.exceeded_amount > 0 && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-danger)' }}>
                      Budget Alert: Estimated bill may exceed your target by ₹{summary.budget.exceeded_amount}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState title="No budget set" subtitle="Set a budget to track your spending." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/budget')}>Set Budget</button>} />
              )}
            </div>

            <div className="card">
              <div className="card-title">Bill Shock Alert</div>
              {summary.bill_shock.is_shock ? (
                <div style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                  ⚠ Warning: Your projected bill is {summary.bill_shock.percent_change}% higher than the previous billing cycle.
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No bill shock detected. Change vs previous cycle: {summary.bill_shock.percent_change}%
                </div>
              )}
              <div className="card-sub" style={{ marginTop: 10 }}>Previous bill: ₹{summary.previous_bill_amount}</div>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-title">Bill History</div>
              {billHistoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={billHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263544" />
                    <XAxis dataKey="cycle" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#1a2632', border: '1px solid #263544' }} />
                    <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No bill history yet" subtitle="Generate your first bill to see trends here." />
              )}
            </div>

            <div className="card">
              <div className="card-title">Appliance Usage Distribution</div>
              {applianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={applianceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {applianceData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2632', border: '1px solid #263544' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No appliances added yet" subtitle="Add appliances to see usage distribution." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/appliances')}>Add Appliances</button>} />
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Top Consuming Appliances</div>
            {summary.top_appliances.length > 0 ? (
              <table className="table">
                <thead><tr><th>Appliance</th><th>Two-Month Units</th><th>Standby Waste</th></tr></thead>
                <tbody>
                  {summary.top_appliances.map((a) => (
                    <tr key={a.name}>
                      <td>{a.name}</td>
                      <td>{a.two_month_units} kWh</td>
                      <td>{a.standby_units} kWh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No appliance data" />
            )}
          </div>
        </>
      )}
    </div>
  )
}
