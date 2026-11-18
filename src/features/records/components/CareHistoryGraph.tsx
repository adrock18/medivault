/**
 * Medical-history relationship view. Presents supplied care tracks, visits and
 * attached records without inventing causal or clinical relationships.
 */

import { GitBranch } from 'lucide-react'
import { Link } from 'react-router-dom'
import type {
  CareTrack,
  CareVisit,
  MedicalRecord,
  Medication,
  VisitFollowUp,
} from '@shared/database.types'
import { EmptyState, SectionTitle } from '@/components/common'
import { providerSummary } from '@/lib/utils'

type Props = {
  careTracks: CareTrack[]
  visits: CareVisit[]
  records: MedicalRecord[]
  medications: Medication[]
  followUps: VisitFollowUp[]
}

/**
 * Render the stored care hierarchy with links back to actionable visit and
 * document views.
 */
export function CareHistoryGraph({
  careTracks,
  visits,
  records,
  medications,
  followUps,
}: Props) {
  function renderRecords(visitRecords: MedicalRecord[]) {
    if (!visitRecords.length)
      return (
        <p className="mt-3 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          No documents are attached to this visit.
        </p>
      )
    return (
      <ul className="mt-3 space-y-2 border-l border-primary/20 pl-4">
        {visitRecords.map((record) => {
          const linkedMedications = medications.filter(
            (medication) => medication.source_record_id === record.id,
          )
          return (
            <li key={record.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.35rem] top-3 size-2 rounded-full bg-primary/60"
              />
              <div className="rounded-lg border bg-background p-3">
                <Link
                  to={`/medical-records?record=${encodeURIComponent(record.id)}`}
                  className="inline-flex min-h-11 items-center break-words text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {record.title}
                </Link>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {record.document_kind.replaceAll('_', ' ')} ·{' '}
                  {record.record_date}
                  {providerSummary(record)
                    ? ` · ${providerSummary(record)}`
                    : ''}
                </p>
                {linkedMedications.length > 0 && (
                  <ul
                    className="mt-2 flex flex-wrap gap-2"
                    aria-label="Medication schedules linked to this record"
                  >
                    {linkedMedications.map((medication) => (
                      <li key={medication.id}>
                        <Link
                          to={`/medications?record=${encodeURIComponent(record.id)}`}
                          className="inline-flex min-h-11 max-w-full flex-col justify-center break-words rounded-xl bg-primary/10 px-2.5 py-2 text-xs font-medium text-primary hover:underline"
                        >
                          {medication.name}
                          <span className="font-normal">
                            {medication.times.join(' · ')}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  function renderVisitNode(visit: CareVisit) {
    const followUp = followUps.find((item) => item.visit_id === visit.id)
    const visitRecords = records.filter(
      (record) => record.visit_id === visit.id,
    )
    return (
      <li key={visit.id} className="relative pb-4 last:pb-0">
        <span
          aria-hidden="true"
          className="absolute -left-[1.45rem] top-4 size-3 rounded-full border-2 border-primary bg-card"
        />
        <article className="min-w-0 rounded-xl border bg-card p-3 sm:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="min-w-0 break-words font-semibold">
              <Link
                to={`/medical-records?visit=${encodeURIComponent(visit.id)}`}
                className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
              >
                {visit.title}
              </Link>
            </h4>
            <time
              dateTime={visit.visit_date}
              className="text-xs text-muted-foreground"
            >
              {visit.visit_date}
            </time>
          </div>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {visit.reason || visit.setting.replaceAll('_', ' ')}
            {providerSummary(visit) ? ` · ${providerSummary(visit)}` : ''}
          </p>
          {followUp && (
            <p className="mt-3 break-words rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Follow-up due {followUp.due_date} · {followUp.status}. Not a
              booked appointment.
            </p>
          )}
          {renderRecords(visitRecords)}
        </article>
      </li>
    )
  }

  const tracks = [...careTracks].sort(
    (a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
  )
  const standaloneVisits = visits
    .filter((visit) => !visit.care_track_id)
    .sort(
      (a, b) =>
        a.visit_date.localeCompare(b.visit_date) || a.id.localeCompare(b.id),
    )
  const unassignedRecords = records.filter((record) => !record.visit_id)
  const hasCareHistory =
    tracks.length > 0 ||
    standaloneVisits.length > 0 ||
    unassignedRecords.length > 0

  return (
    <section className="mb-6 min-w-0" aria-label="Care history map">
      <SectionTitle
        title="Care history map"
        description="Explore saved care tracks, visits, documents and linked medication schedules for the selected profile, oldest to newest."
      />
      {hasCareHistory ? (
        <div className="grid items-start gap-5 min-[1440px]:grid-cols-2">
          {tracks.map((track) => {
            const trackVisits = visits
              .filter((visit) => visit.care_track_id === track.id)
              .sort(
                (a, b) =>
                  a.visit_date.localeCompare(b.visit_date) ||
                  a.id.localeCompare(b.id),
              )
            return (
              <article
                key={track.id}
                className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 hidden size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex"
                  >
                    <GitBranch size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      {track.kind.replaceAll('_', ' ')} care track
                    </p>
                    <h3 className="mt-1 break-words font-semibold">
                      {track.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {trackVisits.length}{' '}
                      {trackVisits.length === 1 ? 'visit' : 'visits'}
                    </p>
                    {trackVisits.length ? (
                      <ol className="mt-4 space-y-0 border-l-2 border-primary/25 pl-5">
                        {trackVisits.map(renderVisitNode)}
                      </ol>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No visits are linked to this track yet.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
          {standaloneVisits.length > 0 && (
            <article className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold">Standalone visits</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                These visits are not grouped into a care track.
              </p>
              <ol className="mt-4 space-y-0 border-l-2 border-primary/25 pl-5">
                {standaloneVisits.map(renderVisitNode)}
              </ol>
            </article>
          )}
          {unassignedRecords.length > 0 && (
            <article className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold">Unassigned records</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Documents that are not linked to a visit.
              </p>
              {renderRecords(unassignedRecords)}
            </article>
          )}
        </div>
      ) : (
        <EmptyState
          icon={GitBranch}
          title="No care history to map yet"
          description="Add a care track or visit, or upload a record to start connecting this profile's history."
        />
      )}
    </section>
  )
}
