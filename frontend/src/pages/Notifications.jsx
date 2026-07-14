import { useEffect, useState } from 'react'
import { listNotifications, markNotificationRead, markAllRead } from '../services/endpoints'
import { EmptyState, LoadingState } from '../components/UI'

const typeIcons = {
  HIGH_USAGE: '⚡', BUDGET_ALERT: '🎯', BILL_SHOCK: '⚠️', BILL_GENERATED: '🧾',
  PAYMENT_SUCCESS: '✅', COMPLAINT_SUBMITTED: '📮', COMPLAINT_UPDATE: '📮',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listNotifications().then((res) => setNotifications(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    load()
  }

  const handleMarkAll = async () => {
    await markAllRead()
    load()
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Notifications</div>
        <button className="btn btn-outline btn-sm" onClick={handleMarkAll}>Mark all as read</button>
      </div>
      {notifications.length === 0 ? <EmptyState title="No notifications yet" /> : notifications.map((n) => (
        <div key={n.id} className="list-item" onClick={() => !n.is_read && handleMarkRead(n.id)} style={{ cursor: n.is_read ? 'default' : 'pointer', opacity: n.is_read ? 0.65 : 1 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{typeIcons[n.type] || '🔔'} {n.title}</div>
            <div className="card-sub" style={{ marginTop: 4 }}>{n.message}</div>
            <div className="card-sub" style={{ marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
          </div>
          {!n.is_read && <span className="tag tag-blue">New</span>}
        </div>
      ))}
    </div>
  )
}
