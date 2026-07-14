import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { listProperties } from '../services/endpoints'

const PropertyContext = createContext(null)

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([])
  const [selectedPropertyId, setSelectedPropertyId] = useState(() => {
    const stored = localStorage.getItem('guardian_selected_property')
    return stored ? Number(stored) : null
  })
  const [loading, setLoading] = useState(true)

  const refreshProperties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listProperties()
      setProperties(res.data)
      if (res.data.length > 0) {
        const stillExists = res.data.some((p) => p.id === selectedPropertyId)
        if (!stillExists) {
          setSelectedPropertyId(res.data[0].id)
          localStorage.setItem('guardian_selected_property', res.data[0].id)
        }
      } else {
        setSelectedPropertyId(null)
      }
    } catch (e) {
      // fail silently; pages will show empty states
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('guardian_token')
    if (token) refreshProperties()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectProperty = (id) => {
    setSelectedPropertyId(id)
    localStorage.setItem('guardian_selected_property', id)
  }

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null

  return (
    <PropertyContext.Provider
      value={{ properties, selectedPropertyId, selectedProperty, selectProperty, refreshProperties, loading }}
    >
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  return useContext(PropertyContext)
}
