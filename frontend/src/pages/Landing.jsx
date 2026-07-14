import { useNavigate } from 'react-router-dom'

const features = [
  { icon: '🧾', title: 'Two-Month Bill Estimator', desc: 'Deterministic slab-wise tariff calculation, admin-configurable.' },
  { icon: '🏠', title: 'Multi-Property Management', desc: 'Track your house, shop, and office separately.' },
  { icon: '🤖', title: 'Grok AI Assistant', desc: 'Ask why your bill is high and get personalized saving tips.' },
  { icon: '🎯', title: 'Budget Guardian', desc: 'Set a budget and get alerted before you exceed it.' },
  { icon: '💚', title: 'Usage Health Score', desc: 'A transparent, rule-based 0-100 energy usage score.' },
  { icon: '📮', title: 'Complaint Tracking', desc: 'Raise and track electricity-related complaints end to end.' },
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="landing-hero">
      <div style={{ fontSize: 40 }}>⚡</div>
      <h1 className="landing-title">AI Electricity Bill Guardian</h1>
      <p className="landing-sub">
        Estimate your two-month electricity bill, track appliance usage, manage multiple properties, and get
        AI-powered energy-saving guidance — all with transparent, deterministic calculations.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
      </div>
      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="icon">{f.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 40, fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 600 }}>
        This is an independent energy-management tool. Bills shown are estimated/simulated using admin-configurable
        demo tariffs and are not official electricity board documents. Payments are simulated for demonstration only.
      </p>
    </div>
  )
}
