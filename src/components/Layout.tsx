import { useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  FolderHeart,
  Pill,
  ChartNoAxesCombined,
  UserRound,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Logo, LoadingState, ErrorState, FormDialog } from './common'
import { Button } from './ui/button'
import { useAuth } from '../contexts/AuthContext'
import { useVault } from '../contexts/DataContext'
import { cn } from '../lib/utils'
import { errorMessage } from '../lib/api'

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/medical-records', label: 'Medical records', icon: FolderHeart },
  { to: '/medications', label: 'Medications', icon: Pill },
  { to: '/health-tracker', label: 'Health tracker', icon: ChartNoAxesCombined },
  { to: '/profile', label: 'Health profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-8">
        <Logo />
      </div>
      <div className="mb-3 px-7 text-xs font-semibold tracking-[0.16em] text-muted-foreground">
        YOUR HEALTH SPACE
      </div>
      <nav aria-label="Main navigation" className="space-y-1 px-4">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-50 text-primary'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-5">
        <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4">
          <ShieldCheck className="mb-2 text-primary" size={22} />
          <p className="text-sm font-semibold text-teal-900">
            Private by design
          </p>
          <p className="mt-1 text-xs leading-5 text-teal-800">
            Your documents stay in private server storage, accessible only
            through your signed-in account.
          </p>
        </div>
        <p className="mt-5 text-center text-[11px] text-slate-400">
          MediVault &middot; Personal healthcare
        </p>
      </div>
    </div>
  )
}
export function Header({ onMenu }: { onMenu: () => void }) {
  const location = useLocation()
  const { session, signOut } = useAuth()
  const { profile, refreshing } = useVault()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const name =
    profile?.full_name || session?.user.email?.split('@')[0] || 'Your account'
  async function logout() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <header className="flex min-h-20 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="lg:hidden"
          onClick={onMenu}
        >
          <Menu />
        </Button>
        <span className="hidden text-sm text-slate-400 sm:block">
          My workspace
        </span>
        <ChevronRight className="hidden size-3 text-slate-300 sm:block" />
        <span className="truncate text-sm font-semibold text-slate-700">
          {navigation.find((n) => n.to === location.pathname)?.label ??
            'MediVault'}
        </span>
        {refreshing && (
          <LoaderCircle
            aria-label="Refreshing data"
            className="size-3 animate-spin text-primary"
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <Link
          to="/profile"
          aria-label={`Health profile for ${name}`}
          className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="hidden text-right sm:block">
            <p className="max-w-40 truncate text-sm font-medium text-slate-800">
              {name}
            </p>
            <p className="text-[11px] text-slate-400">Personal account</p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-full border-4 border-teal-50 bg-teal-100 text-sm font-semibold text-primary">
            {name.slice(0, 2).toUpperCase()}
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void logout()}
          disabled={signingOut}
          aria-label="Log out"
        >
          {signingOut ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
        </Button>
      </div>
    </header>
  )
}
export default function Layout() {
  const [mobile, setMobile] = useState(false)
  const { loading, error, reload, profile, now } = useVault()
  return (
    <div className="min-h-screen bg-[var(--workspace)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/80 bg-white lg:block">
        <Sidebar />
      </aside>
      <FormDialog
        open={mobile}
        onClose={() => setMobile(false)}
        title="Navigation"
        description="Your personal health workspace."
      >
        <Sidebar onNavigate={() => setMobile(false)} />
      </FormDialog>
      <div className="min-w-0 pb-24 lg:ml-64 lg:pb-0">
        <Header onMenu={() => setMobile(true)} />
        <main
          id="main-content"
          className="mx-auto min-w-0 max-w-7xl px-4 py-7 sm:px-8 sm:py-8"
        >
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {error && (
                <div className="mb-6">
                  <ErrorState
                    message={`${error}${profile ? ' Displaying the last successfully loaded data.' : ' Start the Express API and check your connection.'}`}
                    retry={() => void reload()}
                  />
                </div>
              )}
              {(!error || profile) && <Outlet />}
            </>
          )}
        </main>
        <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 pb-6 text-[11px] text-slate-400 sm:px-8">
          <span>
            Your health. Organized. &copy; {now.getFullYear()} MediVault
          </span>
          <span>{format(now, 'EEEE, MMMM d, yyyy')}</span>
        </footer>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(24,59,53,0.04)] lg:hidden"
      >
        {navigation.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-3 text-[10px]',
                isActive ? 'text-primary' : 'text-slate-400',
              )
            }
          >
            <Icon size={20} />
            {label === 'Medical records'
              ? 'Records'
              : label === 'Health tracker'
                ? 'Tracker'
                : label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
