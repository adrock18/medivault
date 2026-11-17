import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '../lib/api'
import { useVault } from '../contexts/DataContext'

export function useMutation() {
  const { reload } = useVault()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lock = useRef(false)
  async function run(
    action: () => Promise<void>,
    success: string | (() => string),
  ) {
    if (lock.current) return false
    lock.current = true
    setPending(true)
    setError(null)
    try {
      await action()
      toast.success(typeof success === 'function' ? success() : success)
      await reload()
      return true
    } catch (err) {
      const message = errorMessage(err)
      setError(message)
      toast.error(message)
      await reload()
      return false
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return { run, pending, error }
}
