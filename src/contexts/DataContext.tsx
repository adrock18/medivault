import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api, errorMessage } from '../lib/api'
import type { VaultData } from '../lib/contracts'
import type { Profile } from '../lib/database.types'
type DataState = Omit<VaultData, 'profile'> & {
  profile: Profile | null
  now: Date
  loading: boolean
  refreshing: boolean
  error: string | null
  reload: () => Promise<void>
}
const DataContext = createContext<DataState | null>(null)
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
    void reload()
    const onFocus = () => {
      void reload()
    }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(onFocus, 60_000)
    return () => {
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
export function useVault() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useVault must be used inside DataProvider.')
  return context
}
