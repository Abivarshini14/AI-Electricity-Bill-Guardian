import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listChallenges, createChallenge, getStreak, getBillingCycle } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, ProgressBar } from '../components/UI'

export default function Challenges() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [challenges, setChallenges] = useState([])
  const [streak, setStreak] = useState(null)
  const [cycle, setCycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', target_type: 'units', target_value: '' })

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    Promise.all([listChallenges(selectedProperty.id), getStreak(selectedProperty.id), getBillingCycle(selectedProperty.id)])
      .then(([c, s, cy]) => { setChallenges(c.data); setStreak(s.data); setCycle(cy.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createChallenge({
        property_id: selectedProperty.id,
        name: form.name,
        target_type: form.target_type,
        target_value: Number(form.target_value),
        start_date: cycle.cycle_start,
        end_date: cycle.cycle_end,
      })
      showToast('Challenge created')
      setForm({ name: '', target_type: 'units', target_value: '' })
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not create challenge', 'error')
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Family Energy Saving Challenges — {selectedProperty.name}</div></div>

      {streak && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Energy Saving Streak</div>
          <div className="card-value">🔥 {streak.current_streak_weeks} Week Streak</div>
          <div className="card-sub">Best streak: {streak.best_streak_weeks} weeks</div>
        </div>
      )}

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Create a Challenge</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Challenge Name</label>
              <input placeholder="e.g. Reduce 50 units" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Target Type</label>
              <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
                <option value="units">Units</option>
                <option value="amount">Amount (₹)</option>
              </select>
            </div>
            <div className="form-row">
              <label>Target Value</label>
              <input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} required />
            </div>
            <button className="btn btn-primary btn-block">Create Challenge</button>
          </form>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Active Challenges</div>
          {challenges.length === 0 ? <EmptyState title="No challenges yet" /> : challenges.map((c) => (
            <div key={c.id} className="list-item" style={{ display: 'block' }}>
              <div style={{ fontWeight: 600 }}>{c.name} {c.badge_awarded && '🏅'}</div>
              <div className="card-sub">Target: {c.target_value} {c.target_type} • Used so far: {c.units_used}</div>
              <ProgressBar percent={c.progress_percent} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
