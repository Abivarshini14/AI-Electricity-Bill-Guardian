import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PropertyProvider } from './context/PropertyContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import SetupProfile from './pages/SetupProfile'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import PropertyForm from './pages/PropertyForm'
import MeterReadings from './pages/MeterReadings'
import Appliances from './pages/Appliances'
import AppliancePlanner from './pages/AppliancePlanner'
import WhatIfSimulator from './pages/WhatIfSimulator'
import StandbyWastage from './pages/StandbyWastage'
import BillEstimator from './pages/BillEstimator'
import BillingCycle from './pages/BillingCycle'
import BillHistory from './pages/BillHistory'
import PaymentHistory from './pages/PaymentHistory'
import BudgetGuardian from './pages/BudgetGuardian'
import HealthScore from './pages/HealthScore'
import SavingsGoals from './pages/SavingsGoals'
import Challenges from './pages/Challenges'
import SolarCalculator from './pages/SolarCalculator'
import AwayMode from './pages/AwayMode'
import OutageLog from './pages/OutageLog'
import AIAssistant from './pages/AIAssistant'
import Complaints from './pages/Complaints'
import EnergyReports from './pages/EnergyReports'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import AdminComplaints from './pages/AdminComplaints'

function Protected({ children, adminOnly, requireProfile = true }) {
  return (
    <ProtectedRoute adminOnly={adminOnly} requireProfile={requireProfile}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PropertyProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/setup-profile"
                element={
                  <ProtectedRoute requireProfile={false}>
                    <SetupProfile />
                  </ProtectedRoute>
                }
              />

              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/properties" element={<Protected><Properties /></Protected>} />
              <Route path="/properties/new" element={<Protected><PropertyForm /></Protected>} />
              <Route path="/properties/:id/edit" element={<Protected><PropertyForm /></Protected>} />
              <Route path="/meter-readings" element={<Protected><MeterReadings /></Protected>} />
              <Route path="/appliances" element={<Protected><Appliances /></Protected>} />
              <Route path="/appliance-planner" element={<Protected><AppliancePlanner /></Protected>} />
              <Route path="/what-if" element={<Protected><WhatIfSimulator /></Protected>} />
              <Route path="/standby-wastage" element={<Protected><StandbyWastage /></Protected>} />
              <Route path="/bill-estimator" element={<Protected><BillEstimator /></Protected>} />
              <Route path="/billing-cycle" element={<Protected><BillingCycle /></Protected>} />
              <Route path="/bills" element={<Protected><BillHistory /></Protected>} />
              <Route path="/payments" element={<Protected><PaymentHistory /></Protected>} />
              <Route path="/budget" element={<Protected><BudgetGuardian /></Protected>} />
              <Route path="/health-score" element={<Protected><HealthScore /></Protected>} />
              <Route path="/savings-goals" element={<Protected><SavingsGoals /></Protected>} />
              <Route path="/challenges" element={<Protected><Challenges /></Protected>} />
              <Route path="/solar-calculator" element={<Protected><SolarCalculator /></Protected>} />
              <Route path="/away-mode" element={<Protected><AwayMode /></Protected>} />
              <Route path="/outages" element={<Protected><OutageLog /></Protected>} />
              <Route path="/ai-assistant" element={<Protected><AIAssistant /></Protected>} />
              <Route path="/complaints" element={<Protected><Complaints /></Protected>} />
              <Route path="/reports" element={<Protected><EnergyReports /></Protected>} />
              <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
              <Route path="/profile" element={<Protected requireProfile={false}><Profile /></Protected>} />
              <Route path="/settings" element={<Protected requireProfile={false}><Settings /></Protected>} />

              <Route path="/admin" element={<Protected adminOnly requireProfile={false}><AdminDashboard /></Protected>} />
              <Route path="/admin/complaints" element={<Protected adminOnly requireProfile={false}><AdminComplaints /></Protected>} />

              <Route path="*" element={<Landing />} />
            </Routes>
          </PropertyProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
