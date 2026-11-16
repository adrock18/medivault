import { useCallback } from 'react'
import { useSearchParams, type NavigateOptions } from 'react-router-dom'

export type ParamChanges = Record<string, string | null>

/** Changes only the named query parameters; `null` removes a parameter. */
export function useQueryParams() {
  const [params, setParams] = useSearchParams()
  const update = useCallback(
    (changes: ParamChanges, options?: NavigateOptions) =>
      setParams((previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes))
          if (value === null) next.delete(key)
          else next.set(key, value)
        return next
      }, options),
    [setParams],
  )
  return [params, update] as const
}
