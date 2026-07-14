import api from './api'

// ---------- Auth ----------
export const registerUser = (data) => api.post('/api/auth/register', data)
export const loginUser = (data) => api.post('/api/auth/login', data)
export const getMe = () => api.get('/api/auth/me')

// ---------- Profile ----------
export const getProfile = () => api.get('/api/profile')
export const updateProfile = (data) => api.put('/api/profile', data)
export const uploadProfilePhoto = (formData) =>
  api.post('/api/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// ---------- Properties ----------
export const listProperties = () => api.get('/api/properties')
export const createProperty = (data) => api.post('/api/properties', data)
export const getProperty = (id) => api.get(`/api/properties/${id}`)
export const updateProperty = (id, data) => api.put(`/api/properties/${id}`, data)
export const deleteProperty = (id) => api.delete(`/api/properties/${id}`)
export const getBillingCycle = (id) => api.get(`/api/properties/${id}/billing-cycle`)

// ---------- Meter Readings ----------
export const addMeterReading = (data) => api.post('/api/meter-readings', data)
export const listMeterReadings = (propertyId) => api.get('/api/meter-readings', { params: { property_id: propertyId } })

// ---------- Appliances ----------
export const getDefaultAppliances = () => api.get('/api/appliances/defaults')
export const listAppliances = (propertyId) => api.get('/api/appliances', { params: { property_id: propertyId } })
export const addAppliance = (data) => api.post('/api/appliances', data)
export const deleteAppliance = (id) => api.delete(`/api/appliances/${id}`)
export const simulateAppliance = (params) => api.post('/api/appliances/simulate', null, { params })

// ---------- Appliance Schedules ----------
export const createSchedule = (data) => api.post('/api/appliance-schedules', data)
export const listSchedules = (propertyId) => api.get('/api/appliance-schedules', { params: { property_id: propertyId } })

// ---------- Tariffs ----------
export const listTariffs = () => api.get('/api/tariffs')
export const createTariff = (data) => api.post('/api/tariffs', data)
export const updateTariff = (id, data) => api.put(`/api/tariffs/${id}`, data)
export const deleteTariff = (id) => api.delete(`/api/tariffs/${id}`)

// ---------- Bills ----------
export const generateBill = (propertyId) => api.post(`/api/bills/generate/${propertyId}`)
export const listBills = (propertyId) => api.get('/api/bills', { params: { property_id: propertyId } })
export const getBill = (id) => api.get(`/api/bills/${id}`)
export const getBillPdfUrl = (id) => `${api.defaults.baseURL}/api/bills/${id}/pdf`

// ---------- Payments ----------
export const makePayment = (data) => api.post('/api/payments', data)
export const listPayments = (propertyId) => api.get('/api/payments', { params: { property_id: propertyId } })
export const getReceiptUrl = (id) => `${api.defaults.baseURL}/api/payments/${id}/receipt`

// ---------- Budgets & Savings ----------
export const createBudget = (data) => api.post('/api/budgets', data)
export const getBudget = (propertyId) => api.get('/api/budgets', { params: { property_id: propertyId } })
export const createSavingsGoal = (data) => api.post('/api/savings-goals', data)
export const listSavingsGoals = (propertyId) => api.get('/api/savings-goals', { params: { property_id: propertyId } })

// ---------- Dashboard ----------
export const getDashboardSummary = (propertyId) => api.get(`/api/dashboard/${propertyId}/summary`)

// ---------- Notifications ----------
export const listNotifications = () => api.get('/api/notifications')
export const getUnreadCount = () => api.get('/api/notifications/unread-count')
export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`)
export const markAllRead = () => api.put('/api/notifications/read-all')

// ---------- AI ----------
export const sendChatMessage = (data) => api.post('/api/ai/chat', data)

// ---------- Challenges, Streaks, Away Mode, Outages ----------
export const createChallenge = (data) => api.post('/api/challenges', data)
export const listChallenges = (propertyId) => api.get('/api/challenges', { params: { property_id: propertyId } })
export const getStreak = (propertyId) => api.get('/api/streaks', { params: { property_id: propertyId } })
export const createAwayMode = (data) => api.post('/api/away-mode', data)
export const listAwayMode = (propertyId) => api.get('/api/away-mode', { params: { property_id: propertyId } })
export const logOutage = (data) => api.post('/api/outages', data)
export const listOutages = (propertyId) => api.get('/api/outages', { params: { property_id: propertyId } })

// ---------- Complaints ----------
export const raiseComplaint = (formData) =>
  api.post('/api/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const listMyComplaints = (params) => api.get('/api/complaints', { params })
export const getComplaint = (id) => api.get(`/api/complaints/${id}`)
export const adminListComplaints = (params) => api.get('/api/complaints/admin/all', { params })
export const adminComplaintStats = () => api.get('/api/complaints/admin/stats')
export const updateComplaintStatus = (id, data) => api.put(`/api/complaints/${id}/status`, data)

export const COMPLAINT_CATEGORIES = [
  'High Electricity Bill',
  'Meter Issue',
  'Incorrect Meter Reading',
  'Payment Issue',
  'Bill Generation Issue',
  'Power Supply Issue',
  'Voltage Issue',
  'Electricity Connection Issue',
  'Other',
]

export const COMPLAINT_STATUS_FLOW = {
  Submitted: ['Under Review', 'Closed'],
  'Under Review': ['In Progress', 'Closed'],
  'In Progress': ['Resolved', 'Closed'],
  Resolved: ['Closed'],
  Closed: [],
}

// ---------- Reports ----------
export const getEnergyReportUrl = (propertyId) => `${api.defaults.baseURL}/api/reports/energy-report/${propertyId}`

// ---------- Admin ----------
export const adminListUsers = () => api.get('/api/admin/users')
export const adminToggleUser = (id) => api.put(`/api/admin/users/${id}/toggle-active`)
export const adminListProperties = () => api.get('/api/admin/properties')
export const adminListBills = () => api.get('/api/admin/bills')
export const adminListPayments = () => api.get('/api/admin/payments')
export const adminListAlerts = () => api.get('/api/admin/alerts')
export const adminAnalytics = () => api.get('/api/admin/analytics')
export const adminListPeakHours = () => api.get('/api/admin/peak-hours')
