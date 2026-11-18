/**
 * Selected-profile medical-history page. Resets local workspace state when the
 * managed profile changes and coordinates confirmed track deletion.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderHeart, Plus, Pencil, Trash2 } from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { api } from '@/lib/api'
import type { CareTrack } from '@shared/database.types'
import { PageTitle, SafetyNote, ConfirmationDialog } from '@/components/common'
import { Button } from '@/components/ui/button'
import { CareHistoryGraph } from '../components/CareHistoryGraph'
import { CareDialog } from '../components/CareDialog'

/**
 * Key history workspace state by managed profile so selections do not carry
 * across people.
 */
export default function MedicalHistoryPage() {
  const { selectedFamilyMemberId } = useVault()
  return <HistoryWorkspace key={selectedFamilyMemberId} />
}

/**
 * Connect stored care relationships to history presentation and working
 * track/visit actions.
 */
function HistoryWorkspace() {
  const { careTracks, visits, records, medications, followUps, reload } =
    useVault()
  const [dialog, setDialog] = useState<{ track?: CareTrack } | null>(null)
  const [removing, setRemoving] = useState<CareTrack | null>(null)
  const mutation = useMutation()

  /**
   * Remove the explicitly chosen care track through the mutation boundary and
   * retain failures for retry.
   */
  async function removeTrack() {
    if (!removing) return
    const saved = await mutation.run(async () => {
      await api.care.removeTrack(removing.id)
      await reload()
    }, 'Care track deleted.')
    if (saved) setRemoving(null)
  }

  return (
    <>
      <PageTitle
        title="Medical history"
        description="See how this profile's visits, documents and medication schedules connect. Only relationships you have recorded are shown."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialog({})}>
              <Plus /> Add care track
            </Button>
            <Link to="/medical-records" className="action-link">
              <FolderHeart size={16} aria-hidden="true" /> Manage records
            </Link>
          </div>
        }
      />
      {careTracks.length > 0 && (
        <details className="mb-6 rounded-2xl border bg-card p-4 sm:p-5">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
            Organize care tracks ({careTracks.length})
          </summary>
          <ul className="mt-3 divide-y">
            {careTracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">
                    {track.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      visits.filter((visit) => visit.care_track_id === track.id)
                        .length
                    }{' '}
                    visits
                    {' · '}
                    {track.kind.replaceAll('_', ' ')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit care track ${track.title}`}
                    onClick={() => setDialog({ track })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete care track ${track.title}`}
                    onClick={() => setRemoving(track)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
      {dialog && (
        <CareDialog
          key={dialog.track?.id ?? 'new'}
          kind="track"
          track={dialog.track}
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmationDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete this care track?"
        description={`Visits in "${removing?.title ?? ''}" will remain as standalone visits.`}
        busy={mutation.pending}
        error={mutation.error}
        onConfirm={() => void removeTrack()}
      />
      <CareHistoryGraph
        careTracks={careTracks}
        visits={visits}
        records={records}
        medications={medications}
        followUps={followUps}
      />
      <SafetyNote />
    </>
  )
}
