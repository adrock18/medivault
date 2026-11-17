import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, errorMessage } from '../lib/api'
import { DataContext, type DataState } from './DataContext'

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<
    Omit<
      DataState,
      | 'now'
      | 'loading'
      | 'refreshing'
      | 'error'
      | 'reload'
      | 'selectedFamilyMemberId'
      | 'selectFamilyMember'
    >
  >({
    profile: null,
    familyMembers: [],
    features: {
      remoteOcrAvailable: false,
      emailRemindersConfigured: false,
    },
    notificationPreferences: null,
    healthProfile: null,
    records: [],
    medications: [],
    logs: [],
    careTracks: [],
    visits: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState('')
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
  const selectedMember =
    data.familyMembers.find((member) => member.id === selectedFamilyMemberId) ??
    data.familyMembers.find((member) => member.relationship === 'self') ??
    data.familyMembers[0]
  const familyMemberId = selectedMember?.id ?? ''
  const medications = data.medications.filter(
    (medication) => medication.family_member_id === familyMemberId,
  )
  const medicationIds = new Set(medications.map((medication) => medication.id))
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
      value={{
        ...data,
        selectedFamilyMemberId: familyMemberId,
        selectFamilyMember: setSelectedFamilyMemberId,
        records: data.records.filter(
          (record) => record.family_member_id === familyMemberId,
        ),
        medications,
        logs: data.logs.filter((log) => medicationIds.has(log.medication_id)),
        careTracks: data.careTracks.filter(
          (track) => track.family_member_id === familyMemberId,
        ),
        visits: data.visits.filter(
          (visit) => visit.family_member_id === familyMemberId,
        ),
        now,
        loading,
        refreshing,
        error,
        reload,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
