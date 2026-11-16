import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, errorMessage } from '../lib/api'
import { DataContext, type DataState } from './DataContext'

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<
    Omit<DataState, 'now' | 'loading' | 'refreshing' | 'error' | 'reload'>
  >({
    profile: null,
    healthProfile: null,
    records: [],
    medications: [],
    logs: [],
    metrics: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const sequence = useRef(0)
  const reload = useCallback(async () => {
    const current = ++sequence.current
    setNow(new Date())
    setRefreshing(true)
    try {
      const next = await api.vault()
      if (current === sequence.current) {
        setData(next)
        setError(null)
      }
    } catch (err) {
      if (current === sequence.current)
        setError(`Unable to refresh your health data. ${errorMessage(err)}`)
    } finally {
      if (current === sequence.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])
  useEffect(() => {
    // Initial fetch from the external API; reload's state updates are intentional here.
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
    const onFocus = () => {
      void reload()
    }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(onFocus, 60_000)
    return () => {
      // Must invalidate the latest pending generation, not a value captured at setup.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      sequence.current++
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
    }
  }, [reload])
  return (
    <DataContext.Provider
      value={{ ...data, now, loading, refreshing, error, reload }}
    >
      {children}
    </DataContext.Provider>
  )
}
