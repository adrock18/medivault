import { useId } from 'react'
import { toast } from 'sonner'
import { setThemePreference, useTheme } from '../lib/theme'

export function ThemeSelect() {
  const id = useId()
  const { preference } = useTheme()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        Appearance
      </label>
      <select
        id={id}
        className="form-select max-w-32"
        value={preference}
        onChange={(event) => {
          const value = event.target.value
          if (value !== 'light' && value !== 'dark' && value !== 'system') {
            toast.error('Choose Light, Dark, or System.')
            return
          }
          try {
            setThemePreference(value)
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Unable to save appearance.',
            )
          }
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  )
}
