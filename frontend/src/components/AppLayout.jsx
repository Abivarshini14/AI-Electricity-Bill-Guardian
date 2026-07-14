import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar />
        <div className="main-content">{children}</div>
      </div>
    </div>
  )
}
