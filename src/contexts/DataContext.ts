/**
 * Workspace data contract and consumer hook. Exposes account data,
 * selected-profile collections and explicit loading/refresh/error state.
 */

import { createContext, useContext } from 'react'
import type { VaultData } from '@shared/contracts'
import type { FamilyMember, Profile } from '@shared/database.types'

export type DataState = Omit<
  VaultData,
  | 'profile'
  | 'records'
  | 'medications'
  | 'logs'
  | 'careTracks'
  | 'visits'
  | 'notificationPreferences'
> & {
  profile: Profile | null
  notificationPreferences: VaultData['notificationPreferences'] | null
  selectedFamilyMemberId: string
  selectFamilyMember: (id: string) => void
  familyMembers: FamilyMember[]
  records: VaultData['records']
  medications: VaultData['medications']
  logs: VaultData['logs']
  careTracks: VaultData['careTracks']
  visits: VaultData['visits']
  now: Date
  loading: boolean
  refreshing: boolean
  error: string | null
  reload: () => Promise<void>
}
export const DataContext = createContext<DataState | null>(null)
/**
 * Read workspace data and fail immediately if the protected data provider is
 * missing.
 */
export function useVault() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useVault must be used inside DataProvider.')
  return context
}
