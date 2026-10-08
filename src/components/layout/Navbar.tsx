import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Trophy, 
  Users, 
  Bell, 
  Terminal, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ShieldAlert,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEvent } from '../../context/EventContext'
import { useCTF } from '../../context/CTFContext'
import { cn } from '../../lib/utils'

export const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { status, timeRemaining } = useEvent()
  const { unreadAnnouncementsCount } = useCTF()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Challenges', path: '/challenges' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Team', path: '/team' },
    { 
      name: 'Announcements', 
      path: '/announcements',
      badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : undefined
    }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="sticky top-0 z-30 bg-[#090a0f]/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Wordmark (Strictly adheres to Section 33) */}
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:border-blue-500/60 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="font-bold tracking-tight text-zinc-100 text-sm sm:text-base">ACM</span>
              <span className="text-zinc-500 text-xs font-light">×</span>
              <span className="font-semibold text-cyan-400 text-sm sm:text-base tracking-tight">NEAR.AI</span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-400 ml-1.5 uppercase px-1 py-0.2 rounded bg-zinc-800/80 border border-zinc-700/50">
                CTF
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {navLinks.map((link) => {
                const active = isActive(link.path)
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'px-3 py-1.5 rounded transition-colors relative flex items-center gap-1.5',
                      active 
                        ? 'text-white bg-zinc-800/70 border border-zinc-700/60' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent'
                    )}
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-[10px] font-mono font-bold text-white flex items-center justify-center">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                )
              })}

              {user?.role === 'organizer' && (
                <Link
                  to="/admin"
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border flex items-center gap-1',
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-950/60 text-purple-200 border-purple-700/60'
                      : 'text-purple-400 hover:bg-purple-950/30 border-purple-800/40'
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  ORGANIZER
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right Section: Time Remaining, Score, Rank, User */}
        <div className="flex items-center gap-3">
          {/* Dynamic Countdown Timer (Section 7) */}
          <div 
            title={`Event Status: ${status}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300"
          >
            <Clock className={cn(
              'w-3.5 h-3.5',
              status === 'LIVE' ? 'text-emerald-400 animate-pulse' :
              status === 'ENDING_SOON' ? 'text-amber-400 animate-pulse' :
              'text-zinc-500'
            )} />
            <div className="flex items-baseline gap-1">
              <span className="hidden xl:inline text-[10px] text-zinc-500 uppercase tracking-wider">
                {status === 'BEFORE_EVENT' ? 'STARTS IN' : 'REMAINING'}
              </span>
              <span className="font-semibold tracking-wider text-zinc-100">
                {timeRemaining.hours}:{timeRemaining.minutes}:{timeRemaining.seconds}
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <>
              {/* Score & Rank Badges (Desktop) */}
              <div className="hidden lg:flex items-center gap-2 font-mono text-xs">
                <div className="px-2.5 py-1.5 rounded bg-blue-950/30 border border-blue-800/40 text-blue-300 flex items-center gap-1.5">
                  <span className="text-zinc-500 text-[10px] uppercase font-sans">Score:</span>
                  <span className="font-bold">{user?.score ?? 0}</span>
                </div>
                <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="text-zinc-500 text-[10px] uppercase font-sans">Rank:</span>
                  <span className="font-bold text-zinc-200">#4</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-800/60 text-left transition-colors focus:outline-none"
                >
                  <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-xs font-semibold text-zinc-200">
                    {user?.displayName?.[0] || 'A'}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-zinc-300 max-w-[100px] truncate">
                    {user?.displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setProfileDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-52 rounded-md bg-[#11131b] border border-zinc-800 shadow-xl shadow-black/80 py-1.5 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-zinc-800/80">
                        <p className="font-semibold text-zinc-200 truncate">{user?.displayName}</p>
                        <p className="text-zinc-500 text-[11px] truncate font-mono">@{user?.username}</p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                          <Users className="w-3 h-3 text-zinc-500" />
                          <span>Team: <strong className="text-zinc-300">{user?.teamName || 'Solo'}</strong></span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                        Profile & Settings
                      </Link>

                      {user?.role === 'organizer' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-purple-300 hover:bg-purple-950/40 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                          Admin Console
                        </Link>
                      )}

                      <div className="border-t border-zinc-800/80 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            handleLogout()
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-950/20 text-left transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded border border-blue-500/30 transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-zinc-400 hover:text-zinc-200 p-1.5 rounded hover:bg-zinc-800/60 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-zinc-800 bg-[#0c0e15] px-4 pt-3 pb-5 space-y-3">
          {/* Mobile Stats Bar */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-zinc-500 text-[10px] block">TEAM SCORE</span>
              <span className="text-blue-400 font-bold">{user?.score ?? 0} pts</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] block">CURRENT RANK</span>
              <span className="text-zinc-200 font-bold">#4 / 32 Teams</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded flex items-center justify-between',
                    active 
                      ? 'bg-zinc-800 text-white border border-zinc-700' 
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  )}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-[10px] font-mono font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {user?.role === 'organizer' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded text-purple-300 bg-purple-950/30 border border-purple-800/40 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Admin Console
              </Link>
            )}

            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              Profile & Settings
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full text-left px-3 py-2 rounded text-rose-400 hover:bg-rose-950/20 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
