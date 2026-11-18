import { Suspense, useLayoutEffect, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LogOut,
  Menu,
  ShieldCheck,
  ChevronRight,
  LoaderCircle,
  UsersRound,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Logo,
  ErrorState,
  FormDialog,
  DemoNotice,
  PageSkeleton,
  type PageSkeletonVariant,
} from './common'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { useAuth } from '../contexts/AuthContext'
import { useVault } from '../contexts/DataContext'
import { cn } from '../lib/utils'
import { errorMessage } from '../lib/api'
import { ThemeSelect } from './ThemeSelect'
import { navigation, mobileNavigation } from '../lib/navigation'
import { CommandPalette } from './CommandPalette'
import { cancelThemeTransition } from '../lib/theme'
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-8">
        <Logo />
      </div>
      <nav aria-label="Main navigation" className="space-y-1 px-4">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'nav-item relative flex items-center gap-3 px-4 py-3 text-sm font-medium',
                isActive
                  ? 'font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-6 py-6">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Documents stay in private storage, open only to your signed-in
          account.
        </p>
      </div>
    </div>
  )
}
export function Header({ onMenu }: { onMenu: () => void }) {
  const location = useLocation()
  const { session, signOut } = useAuth()
  const {
    profile,
    refreshing,
    familyMembers,
    selectedFamilyMemberId,
    selectFamilyMember,
  } = useVault()
  const selectedMember = familyMembers.find(
    (member) => member.id === selectedFamilyMemberId,
  )
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const name =
    selectedMember?.full_name ??
    profile?.full_name ??
    session?.user.email?.split('@')[0] ??
    'Your account'
  const avatarName = name
    .replace(/^\[DEMO\]\s*/i, '')
    .split(' - ')[0]
    .trim()
  const initials =
    avatarName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'MV'
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
    <header className="workspace-header flex min-h-20 flex-col justify-center gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:px-8 sm:py-2">
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
          {selectedMember?.relationship === 'self'
            ? 'Personal workspace'
            : `${selectedMember?.full_name ?? 'Family'} workspace`}
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
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-3">
        {familyMembers.length > 1 && (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-input bg-card px-3 max-[359px]:basis-full sm:w-60 sm:flex-none">
            <UsersRound
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            <span className="hidden shrink-0 text-[11px] font-medium text-muted-foreground sm:inline">
              Viewing
            </span>
            <Select
              aria-label="Viewing profile"
              className="!min-h-10 !w-auto !max-w-none !flex-1 !rounded-full !border-0 !bg-transparent !px-0 !py-2 text-xs font-semibold"
              value={selectedFamilyMemberId}
              onValueChange={selectFamilyMember}
              options={familyMembers.map((member) => ({
                value: member.id,
                label: member.full_name,
              }))}
            />
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <CommandPalette />
          <ThemeSelect />
        </div>
        <Link
          to="/profile"
          aria-label={`Health profile for ${name}`}
          className="hidden items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-primary sm:flex"
        >
          <div className="hidden text-right sm:block">
            <p className="max-w-40 truncate text-sm font-medium text-slate-800">
              {name}
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedMember?.relationship === 'self'
                ? 'Personal account'
                : 'Family profile'}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold tracking-wide text-primary">
            {initials}
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
function pageSkeletonFor(pathname: string): PageSkeletonVariant {
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/profile') || pathname.startsWith('/settings'))
    return 'form'
  return 'list'
}
export default function Layout() {
  const [mobile, setMobile] = useState(false)
  const { loading, error, reload, profile, now } = useVault()
  const location = useLocation()
  const skeleton = pageSkeletonFor(location.pathname)
  useLayoutEffect(() => {
    cancelThemeTransition()
    window.scrollTo(0, 0)
  }, [location.pathname])
  return (
    <div className="workspace-shell min-h-screen bg-workspace">
      <div className="ambient-backdrop" aria-hidden="true" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <aside className="workspace-sidebar fixed inset-y-4 left-4 hidden w-56 rounded-[30px] border border-slate-200/60 lg:block">
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
      <div className="min-w-0 pb-32 lg:ml-64 lg:pb-0">
        <DemoNotice />
        <Header onMenu={() => setMobile(true)} />
        <main
          id="main-content"
          className="mx-auto min-w-0 max-w-[1440px] px-4 pt-5 pb-8 sm:px-8 sm:pt-8"
        >
          {loading ? (
            <PageSkeleton variant={skeleton} />
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
              {(!error || profile) && (
                <div key={location.pathname} data-route-transition>
                  <Suspense fallback={<PageSkeleton variant={skeleton} />}>
                    <Outlet />
                  </Suspense>
                </div>
              )}
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
        className="mobile-dock fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-md grid-cols-4 gap-1 rounded-full border border-slate-300/50 p-1.5 lg:hidden"
      >
        {mobileNavigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex min-h-14 flex-col items-center justify-center gap-1 rounded-full py-2 text-[10px] transition-colors',
                isActive
                  ? 'font-medium'
                  : 'text-slate-500 hover:text-slate-900',
              )
            }
          >
            <span className="flex h-5 items-center justify-center">
              <Icon size={19} />
            </span>
            {label === 'Medical records'
              ? 'Records'
              : label === 'Health profile'
                ? 'Profile'
                : label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
