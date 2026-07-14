const translations = {
  en: {
    dashboard: 'Dashboard',
    properties: 'Properties',
    meterReadings: 'Meter Readings',
    appliances: 'Appliances',
    billEstimator: 'Bill Estimator',
    budget: 'Budget Guardian',
    healthScore: 'Usage Health Score',
    aiAssistant: 'AI Assistant',
    bills: 'Bill History',
    payments: 'Payments',
    notifications: 'Notifications',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    admin: 'Admin',
    welcome: 'Welcome back',
    estimatedBill: 'Estimated Bill',
    currentUnits: 'Current Units',
    daysRemaining: 'Days Remaining',
    nextBillDate: 'Next Bill Date',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு',
    properties: 'சொத்துக்கள்',
    meterReadings: 'மீட்டர் அளவீடுகள்',
    appliances: 'மின் உபகரணங்கள்',
    billEstimator: 'பில் மதிப்பீடு',
    budget: 'பட்ஜெட் காவலர்',
    healthScore: 'பயன்பாட்டு மதிப்பெண்',
    aiAssistant: 'AI உதவியாளர்',
    bills: 'பில் வரலாறு',
    payments: 'கட்டணங்கள்',
    notifications: 'அறிவிப்புகள்',
    settings: 'அமைப்புகள்',
    profile: 'சுயவிவரம்',
    logout: 'வெளியேறு',
    admin: 'நிர்வாகம்',
    welcome: 'மீண்டும் வரவேற்கிறோம்',
    estimatedBill: 'மதிப்பிடப்பட்ட பில்',
    currentUnits: 'தற்போதைய யூனிட்கள்',
    daysRemaining: 'மீதமுள்ள நாட்கள்',
    nextBillDate: 'அடுத்த பில் தேதி',
  },
}

export function t(key, language = 'en') {
  return translations[language]?.[key] || translations.en[key] || key
}

export default translations
