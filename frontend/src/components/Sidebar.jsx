import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navSections = [
  {
    title: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/properties', label: 'Properties', icon: '🏠' },
      { to: '/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    title: 'Usage',
    links: [
      { to: '/meter-readings', label: 'Meter Readings', icon: '📟' },
      { to: '/appliances', label: 'Appliances', icon: '🔌' },
      { to: '/appliance-planner', label: 'Appliance Planner', icon: '🗓️' },
      { to: '/standby-wastage', label: 'Standby Wastage', icon: '🔋' },
      { to: '/what-if', label: 'What-If Simulator', icon: '🧪' },
    ],
  },
  {
    title: 'Billing',
    links: [
      { to: '/bill-estimator', label: 'Bill Estimator', icon: '🧾' },
      { to: '/billing-cycle', label: 'Billing Cycle', icon: '📅' },
      { to: '/bills', label: 'Bill History', icon: '📚' },
      { to: '/payments', label: 'Payments', icon: '💳' },
    ],
  },
  {
    title: 'Smart Tools',
    links: [
      { to: '/budget', label: 'Budget Guardian', icon: '🎯' },
      { to: '/health-score', label: 'Usage Health Score', icon: '💚' },
      { to: '/savings-goals', label: 'Savings Goals', icon: '🏆' },
      { to: '/challenges', label: 'Energy Challenges', icon: '🔥' },
      { to: '/solar-calculator', label: 'Solar Calculator', icon: '☀️' },
      { to: '/away-mode', label: 'Away Mode', icon: '✈️' },
      { to: '/outages', label: 'Outage Log', icon: '⚡' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
      { to: '/complaints', label: 'Complaints', icon: '📮' },
      { to: '/reports', label: 'Energy Reports', icon: '📄' },
      { to: '/profile', label: 'Profile', icon: '👤' },
      { to: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
]

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="bolt">⚡</span> Guardian
      </div>
      {navSections.map((section) => (
        <div key={section.title}>
          <div className="sidebar-section-title">{section.title}</div>
          {section.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span>{link.icon}</span> {link.label}
            </NavLink>
          ))}
        </div>
      ))}
      {user?.role === 'ADMIN' && (
        <div>
          <div className="sidebar-section-title">Administration</div>
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span>🛠️</span> Admin Dashboard
          </NavLink>
          <NavLink to="/admin/complaints" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span>📮</span> Admin Complaints
          </NavLink>
        </div>
      )}
    </aside>
  )
}
