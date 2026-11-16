import {
  LayoutDashboard,
  FolderHeart,
  Pill,
  UserRound,
  Settings,
} from 'lucide-react'

export const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/medications', label: 'Medications', icon: Pill },
  { to: '/medical-records', label: 'Medical records', icon: FolderHeart },
  { to: '/profile', label: 'Health profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]
