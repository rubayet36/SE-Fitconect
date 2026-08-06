'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LogOut, Menu, X, LayoutDashboard, Dumbbell, Salad, Search, Bookmark, ClipboardList, LayoutGrid, ChefHat, FileText, Megaphone, Crown, UserPlus, Clock } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavItem { label: string; href: string; icon: string; lucide: React.ComponentType<{ size?: number; className?: string }> }

const memberNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/member/dashboard', icon: '🏠', lucide: LayoutDashboard },
  { label: 'My Plan', href: '/member/my-plan', icon: '💪', lucide: Dumbbell },
  { label: 'Diet', href: '/member/diet', icon: '🥗', lucide: Salad },
  { label: 'Explore', href: '/member/explore', icon: '🔍', lucide: Search },
  { label: 'Bookmarks', href: '/member/bookmarks', icon: '🔖', lucide: Bookmark },
  { label: 'Request Plan', href: '/member/request', icon: '📋', lucide: ClipboardList },
]

const trainerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/trainer/dashboard', icon: '🏠', lucide: LayoutGrid },
  { label: 'Workout Builder', href: '/trainer/workout-builder', icon: '🏋️', lucide: Dumbbell },
  { label: 'Diet Generator', href: '/trainer/diet-generator', icon: '🥣', lucide: ChefHat },
  { label: 'Templates', href: '/trainer/templates', icon: '📄', lucide: FileText },
  { label: 'Billboard', href: '/trainer/billboard', icon: '📢', lucide: Megaphone },
]

const ownerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: '👑', lucide: Crown },
  { label: 'Add Trainer', href: '/owner/create-trainer', icon: '➕', lucide: UserPlus },
  { label: 'Billboard', href: '/owner/billboard', icon: '📢', lucide: Megaphone },
  { label: 'Timetable', href: '/owner/timetable', icon: '🕐', lucide: Clock },
]

interface AppNavbarProps { role: 'member' | 'trainer' | 'owner'; userName?: string }

export function AppNavbar({ role, userName }: AppNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = role === 'owner' ? ownerNavItems : role === 'trainer' ? trainerNavItems : memberNavItems
  // Bottom bar items: first 5 for member, all 4 for trainer
  const bottomItems = navItems.slice(0, 5)

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop side nav */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-zinc-800">
          <Link href={role === 'owner' ? '/owner/dashboard' : role === 'trainer' ? '/trainer/dashboard' : '/member/dashboard'}
            className="flex flex-col gap-0.5 group">
            <span className="text-2xl font-black tracking-[0.15em] text-white group-hover:text-red-400 transition-colors">VORTEX</span>
            <span className="text-red-500 text-[10px] tracking-[0.4em] uppercase font-semibold">Fitness Club</span>
          </Link>
          <div className="mt-3 px-2 py-1.5 bg-red-950/30 border border-red-800/30 rounded-lg">
            <p className="text-xs text-red-400 font-semibold capitalize">{role} Portal</p>
            {userName && <p className="text-xs text-zinc-500 truncate">{userName}</p>}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === item.href
                  ? 'bg-red-600/15 text-red-400 border border-red-800/30'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              )}>
              <span>{item.icon}</span>
              {item.label}
              {pathname === item.href && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all duration-200">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 py-3">
        <Link href={role === 'owner' ? '/owner/dashboard' : role === 'trainer' ? '/trainer/dashboard' : '/member/dashboard'}>
          <span className="text-xl font-black tracking-[0.15em] text-white">VORTEX</span>
          <span className="text-red-500 text-[9px] tracking-[0.3em] uppercase font-semibold ml-2">{role}</span>
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile slide-down menu (extra items) */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-4 space-y-1 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold px-3 pb-2">Navigation</p>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                  pathname === item.href
                    ? 'bg-red-600/15 text-red-400 border border-red-800/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                )}>
                <span className="text-base">{item.icon}</span>{item.label}
                {pathname === item.href && <div className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
              </Link>
            ))}
            <div className="pt-3 border-t border-zinc-800">
              {userName && <p className="text-xs text-zinc-600 px-3 pb-2 truncate">{userName}</p>}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex items-center safe-area-pb">
        {bottomItems.map(item => {
          const Icon = item.lucide
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-3 px-1 transition-all',
                active ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-300'
              )}>
              <Icon size={20} className={active ? 'text-red-400' : ''} />
              <span className="text-[9px] font-semibold tracking-wide truncate max-w-[52px] text-center leading-tight">
                {item.label}
              </span>
              {active && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500" />}
            </Link>
          )
        })}
      </div>
    </>
  )
}
