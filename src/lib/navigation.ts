/**
 * Shared workspace route metadata. Desktop and mobile navigation reuse these
 * destinations to keep page labels and icons consistent.
 */

import {
  LayoutDashboard,
  FolderHeart,
  Pill,
  UserRound,
  Settings,
  GitBranch,
} from 'lucide-react'

export const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/medications', label: 'Medications', icon: Pill },
  { to: '/medical-records', label: 'Medical records', icon: FolderHeart },
  { to: '/medical-history', label: 'Medical history', icon: GitBranch },
  { to: '/profile', label: 'Health profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const mobileNavigation = navigation.filter(({ to }) =>
  ['/dashboard', '/medications', '/medical-records', '/profile'].includes(to),
)
