import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, registerUser, getMe } from '../services/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('guardian_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('guardian_token')
    if (token) {
      getMe()
        .then((res) => {
          const updated = { ...user, ...res.data }
          setUser(updated)
          localStorage.setItem('guardian_user', JSON.stringify(updated))
        })
        .catch(() => {
          localStorage.removeItem('guardian_token')
          localStorage.removeItem('guardian_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, password) => {
    const res = await loginUser({ email, password })
    const data = res.data
    localStorage.setItem('guardian_token', data.access_token)
    const userData = {
      id: data.user_id,
      name: data.name,
      role: data.role,
      profile_completed: data.profile_completed,
    }
    localStorage.setItem('guardian_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (payload) => {
    const res = await registerUser(payload)
    const data = res.data
    localStorage.setItem('guardian_token', data.access_token)
    const userData = {
      id: data.user_id,
      name: data.name,
      role: data.role,
      profile_completed: data.profile_completed,
    }
    localStorage.setItem('guardian_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('guardian_token')
    localStorage.removeItem('guardian_user')
    setUser(null)
  }

  const markProfileCompleted = () => {
    setUser((prev) => {
      const updated = { ...prev, profile_completed: true }
      localStorage.setItem('guardian_user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, markProfileCompleted }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
