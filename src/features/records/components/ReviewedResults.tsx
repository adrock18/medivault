/**
 * Reviewed-result history presentation. Groups only current user-reviewed
 * snapshots and retains visible links or labels for their original sources.
 */

import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { EmptyState, Panel, SectionTitle } from '@/components/common'
import { Button } from '@/components/ui/button'
import { displayDate } from '@/lib/utils'
import {
  resultFields,
  resultHistories,
  type ResultReview,
} from '@shared/record-results'

function ResultSource({ review }: { review: ResultReview }) {
  return review.source_record_id ? (
    <Link
      className="small-link max-w-full break-words text-xs"
      to={`/medical-records?record=${encodeURIComponent(review.source_record_id)}`}
    >
      {review.source_title}
    </Link>
  ) : (
    <span className="text-xs text-muted-foreground">
      {review.source_title} (source document deleted)
    </span>
  )
}

/**
 * Display reviewed observation histories without interpreting them as diagnoses
 * or generating missing ranges.
 */
export function ReviewedResults({
  vitalsOnly = false,
  recordId,
  onReview,
}: {
  vitalsOnly?: boolean
  recordId?: string
  onReview?: () => void
}) {
  const { resultReviews } = useVault()
  const reviews = recordId
    ? resultReviews.filter((review) => review.source_record_key === recordId)
    : resultReviews
  const histories = resultHistories(reviews).filter(
    (history) =>
      !vitalsOnly ||
      resultFields.some(
        (field) => field.name.toLowerCase() === history[0].name.toLowerCase(),
      ),
  )
  return (
    <Panel className="mb-6">
      <SectionTitle
        title={
          vitalsOnly
            ? 'Latest recorded measurements'
            : 'Latest recorded test results'
        }
        description="Reviewed report values, not a diagnosis or a statement of your health today. Dates refer to measurements, not uploads."
        action={
          onReview ? (
            <Button variant="outline" onClick={onReview}>
              <ClipboardList /> Review a report
            </Button>
          ) : (
            <Link className="small-link" to="/medical-records?view=results">
              All test results
            </Link>
          )
        }
      />
      {histories.length ? (
        <div
          className={
            vitalsOnly
              ? 'grid min-w-0 gap-3 sm:grid-cols-2 min-[90rem]:grid-cols-3'
              : 'space-y-3'
          }
        >
          {histories.map((history) => {
            const latest = history[0]
            return (
              <details
                key={`${latest.name}|${latest.unit}|${latest.context}`}
                className="min-w-0 rounded-2xl border bg-background p-4"
              >
                <summary className="min-h-11 cursor-pointer list-none rounded-lg focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="break-words text-sm font-medium">
                      {latest.name}
                    </span>
                    <span className="break-words text-lg font-semibold">
                      {latest.value}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        {latest.unit}
                      </span>
                    </span>
                  </span>
                  {latest.context && (
                    <span className="mt-1 block break-words text-xs text-muted-foreground">
                      {latest.context}
                    </span>
                  )}
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {displayDate(latest.review.measured_on)} · {history.length}{' '}
                    {history.length === 1 ? 'measurement' : 'measurements'} ·
                    Show history
                  </span>
                </summary>
                {latest.reference_range && (
                  <p className="mt-2 break-words text-xs text-muted-foreground">
                    Report reference range: {latest.reference_range}
                  </p>
                )}
                <ResultSource review={latest.review} />
                <ol
                  className="mt-3 space-y-3 border-t pt-3"
                  aria-label={`${latest.name} measurement history`}
                >
                  {history.map((item) => (
                    <li key={item.review.id} className="break-words text-sm">
                      <p>
                        <time dateTime={item.review.measured_on}>
                          {displayDate(item.review.measured_on)}
                        </time>{' '}
                        — {item.value} {item.unit}
                      </p>
                      {item.reference_range && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Report range: {item.reference_range}
                        </p>
                      )}
                      <ResultSource review={item.review} />
                    </li>
                  ))}
                </ol>
              </details>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No reviewed results yet"
          description="Choose a report in Medical Records, review its measurements, then save them. Missing results are never guessed."
        />
      )}
      {!vitalsOnly && reviews.length > 0 && (
        <details className="mt-5 border-t pt-4">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">
            Review history ({reviews.length})
          </summary>
          <ul className="space-y-3 py-3">
            {[...reviews]
              .sort(
                (a, b) =>
                  b.created_at.localeCompare(a.created_at) ||
                  b.id.localeCompare(a.id),
              )
              .map((review) => (
                <li key={review.id} className="rounded-xl border p-3 text-sm">
                  <p className="break-words font-medium">
                    {review.source_title} · measured{' '}
                    {displayDate(review.measured_on)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reviewed {new Date(review.created_at).toLocaleString()}.
                    Newer reviews of the same report supersede this snapshot.
                  </p>
                  <ul className="mt-2 space-y-1">
                    {review.results.map((result, index) => (
                      <li key={index} className="break-words text-xs">
                        {result.name}: {result.value} {result.unit}
                        {result.context ? ` · ${result.context}` : ''}
                        {result.reference_range
                          ? ` · report range: ${result.reference_range}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        </details>
      )}
    </Panel>
  )
}
