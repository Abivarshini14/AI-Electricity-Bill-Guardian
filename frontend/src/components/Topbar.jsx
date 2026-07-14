import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProperty } from '../context/PropertyContext'
import { getUnreadCount } from '../services/endpoints'
import { API_BASE_URL } from '../services/api'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { properties, selectedPropertyId, selectProperty } = useProperty()
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    getUnreadCount()
      .then((res) => mounted && setUnread(res.data.unread_count))
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="topbar">
      <div>
        {properties && properties.length > 0 && (
          <select
            className="property-select"
            value={selectedPropertyId || ''}
            onChange={(e) => selectProperty(Number(e.target.value))}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="topbar-right">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/notifications')}>
          🔔{unread > 0 && <span className="badge-count">{unread}</span>}
        </button>
        <div className="avatar" title={user?.name} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          {initials}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login') }}>
          Logout
        </button>
      </div>
    </div>
  )
}
