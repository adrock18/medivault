import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Upload, CalendarDays, ArrowUpRight } from 'lucide-react'
import { navigation } from '../lib/navigation'
import { Button } from './ui/button'
import { Field } from './common'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'

const actions = [
  ...navigation.map((item) => ({ ...item, keywords: 'navigate page' })),
  {
    to: '/medications?action=add',
    label: 'Add medication',
    icon: Plus,
    keywords: 'medicine prescription',
  },
  {
    to: '/medications?action=scan',
    label: 'Upload prescription',
    icon: Upload,
    keywords: 'ocr scan document',
  },
  {
    to: '/medical-records?action=upload',
    label: 'Upload record',
    icon: Upload,
    keywords: 'file document report',
  },
  {
    to: '/dashboard',
    label: 'Return to today',
    icon: CalendarDays,
    keywords: 'schedule routine',
  },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  const destination = useRef<string | null>(null)
  const navigate = useNavigate()
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.key.toLowerCase() !== 'k'
      )
        return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input, textarea, [contenteditable]:not([contenteditable="false"])',
        )
      )
        return
      if (
        document.querySelector(
          '[role="dialog"]:not([data-closed]), [role="alertdialog"]:not([data-closed])',
        )
      )
        return
      event.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])
  const normalized = query.trim().toLowerCase()
  const results = actions.filter((action) =>
    `${action.label} ${action.keywords}`.toLowerCase().includes(normalized),
  )
  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) setQuery('')
  }
  return (
    <>
      <Button
        ref={trigger}
        variant="outline"
        className="w-full min-w-0 justify-start rounded-xl text-muted-foreground"
        aria-label="Search actions"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="truncate">Search</span>
        <kbd className="ml-auto hidden rounded border px-1.5 text-xs text-muted-foreground sm:inline">
          Ctrl / ⌘ K
        </kbd>
      </Button>
      <Dialog
        open={open}
        onOpenChange={changeOpen}
        onOpenChangeComplete={(next) => {
          if (!next && destination.current) {
            const to = destination.current
            destination.current = null
            navigate(to)
          }
        }}
      >
        <DialogContent
          finalFocus={trigger}
          className="command-palette max-h-[85dvh] overflow-y-auto sm:max-w-xl"
        >
          <div className="pr-12">
            <DialogTitle>Where would you like to go?</DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground">
              Find a page or start a workflow. No medical contents are searched.
            </DialogDescription>
          </div>
          <Field
            label="Search pages and actions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Try upload, medication, or profile"
          />
          {results.length ? (
            <ul className="space-y-1">
              {results.map(({ to, label, icon: Icon }) => (
                <li key={label}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 !px-3 !py-3"
                    onClick={() => {
                      destination.current = to
                      changeOpen(false)
                    }}
                  >
                    <Icon className="size-5 text-primary" />
                    <span className="flex-1 text-left">{label}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-5 text-center">
              <p className="mb-3 text-muted-foreground">No matching actions.</p>
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
