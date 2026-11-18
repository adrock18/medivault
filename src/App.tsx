import {
  Component,
  lazy,
  Suspense,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
} from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './contexts/AuthContext'
import { AuthProvider } from './contexts/AuthProvider'
import { DataProvider } from './contexts/DataProvider'
import {
  LoadingState,
  ErrorState,
  Panel,
  EmptyState,
} from './components/common'
import Layout from './components/Layout'
import AuthPage from '@/features/auth/pages/AuthPage'
import { useTheme } from './lib/theme'
const DashboardPage = lazy(
  () => import('@/features/dashboard/pages/DashboardPage'),
)
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const MedicalRecordsPage = lazy(
  () => import('@/features/records/pages/MedicalRecordsPage'),
)
const MedicalHistoryPage = lazy(
  () => import('@/features/records/pages/MedicalHistoryPage'),
)
const MedicationsPage = lazy(
  () => import('@/features/medications/pages/MedicationsPage'),
)
const SettingsPage = lazy(
  () => import('@/features/settings/pages/SettingsPage'),
)

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MediVault rendering failed', error, info.componentStack)
  }
  render() {
    if (this.state.failed)
      return (
        <div className="mx-auto max-w-xl p-8">
          <ErrorState
            message="MediVault could not render this page. Reload to try again. Your saved data remains on the backend."
            retry={() => window.location.reload()}
          />
        </div>
      )
    return this.props.children
  }
}
function ProtectedRoute() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return (
    <DataProvider key={session.user.id}>
      <Outlet />
    </DataProvider>
  )
}
function AppRoutes() {
  const { loading, error, retry, session } = useAuth()
  const location = useLocation()
  if (loading)
    return <LoadingState message="Opening your health workspace..." />
  if (error)
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorState message={error} retry={retry} />
      </div>
    )
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage registration />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/medical-records" element={<MedicalRecordsPage />} />
          <Route path="/medical-history" element={<MedicalHistoryPage />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route
            path="/health-tracker"
            element={<Navigate to="/medications" replace />}
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route
        path="/"
        element={
          <Navigate
            to={
              session
                ? '/dashboard'
                : `/login${location.search}${location.hash}`
            }
            replace
          />
        }
      />
      <Route
        path="*"
        element={
          <div className="mx-auto max-w-lg p-8">
            <Panel>
              <EmptyState
                title="Page not found"
                description="This page isn't part of your health workspace."
                action={
                  <Link className="action-link" to="/">
                    Back to MediVault
                  </Link>
                }
              />
            </Panel>
          </div>
        }
      />
    </Routes>
  )
}
export default function App() {
  const { resolved } = useTheme()
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense
          fallback={<LoadingState message="Loading your workspace..." />}
        >
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Suspense>
        <Toaster theme={resolved} richColors position="top-right" closeButton />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
