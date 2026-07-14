export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" style={{ margin: '0 auto 10px' }} />
      {label}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}

export function StatCard({ title, value, sub, accent }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  )
}

export function StatusTag({ status }) {
  const map = {
    Paid: 'tag-green', Resolved: 'tag-green', Closed: 'tag-blue', Excellent: 'tag-green', Good: 'tag-green',
    Pending: 'tag-yellow', Generated: 'tag-yellow', Submitted: 'tag-yellow', 'Under Review': 'tag-yellow',
    'In Progress': 'tag-blue', Moderate: 'tag-yellow',
    Failed: 'tag-red', Overdue: 'tag-red', 'High Usage': 'tag-red',
  }
  return <span className={`tag ${map[status] || 'tag-blue'}`}>{status}</span>
}

export function ProgressBar({ percent, warningAt = 80, dangerAt = 100 }) {
  const clamped = Math.max(0, Math.min(percent, 100))
  let cls = ''
  if (percent >= dangerAt) cls = 'danger'
  else if (percent >= warningAt) cls = 'warning'
  return (
    <div className="progress-bar-track">
      <div className={`progress-bar-fill ${cls}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
