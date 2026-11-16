import { Monitor, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { setThemePreference, useTheme } from '../lib/theme'
import { Select } from './ui/select'

const appearances = [
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Match your device',
  },
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'A brighter workspace',
  },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
]

export function ThemeSelect() {
  const { preference } = useTheme()
  return (
    <Select
      aria-label="Appearance"
      compact
      options={appearances}
      value={preference}
      onValueChange={(value) => {
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
    />
  )
}
