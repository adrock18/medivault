import { createContext, useContext } from 'react'
import type { VaultData } from '../lib/contracts'
import type { Profile } from '../lib/database.types'

export type DataState = Omit<VaultData, 'profile'> & {
  profile: Profile | null
  now: Date
  loading: boolean
  refreshing: boolean
  error: string | null
  reload: () => Promise<void>
}
export const DataContext = createContext<DataState | null>(null)
export function useVault() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useVault must be used inside DataProvider.')
  return context
}
