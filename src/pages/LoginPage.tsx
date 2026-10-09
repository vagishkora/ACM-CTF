import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, User as UserIcon, ArrowRight, Terminal, AlertCircle, Users, Shield, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authService, isValidEmail } from '../services/authService'
import { realtimeSync } from '../services/realtimeSync'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  // Tabs: 'student' or 'admin'
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student')

  // Student form state
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [isCustomTeam, setIsCustomTeam] = useState<boolean>(false)
  const [customTeamName, setCustomTeamName] = useState<string>('')
  const [studentId, setStudentId] = useState<string>('')
  const [studentPassword, setStudentPassword] = useState<string>('')

  // Admin form state
  const [adminEmail, setAdminEmail] = useState<string>('')
  const [adminPassword, setAdminPassword] = useState<string>('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadTeams = () => {
      authService.getRegisteredTeams().then(teams => {
        setAvailableTeams(teams)
        if (teams.length > 0) {
          setSelectedTeam(prev => (prev && teams.includes(prev)) ? prev : teams[0])
        }
      })
    }

    loadTeams()

    const unsub = realtimeSync.subscribe((msg) => {
      if (msg.type === 'ACCOUNT_PROVISIONED') {
        loadTeams()
      }
    })

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'acm_ctf_provisioned_accounts') {
        loadTeams()
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      unsub()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const activeStudentTeam = isCustomTeam ? customTeamName.trim() : (selectedTeam || undefined)

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      const user = await login({
        teamName: activeStudentTeam,
        identifier: studentId.trim(),
        password: studentPassword.trim()
      })

      toast({
        type: 'success',
        title: 'Authentication Successful',
        description: `Welcome back, ${user.displayName || user.email}! Connected to team ${user.teamName || 'Solo'}.`
      })
      navigate('/dashboard')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid credentials. Please verify your team name, email, and password.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const trimmedAdminEmail = adminEmail.trim()
    if (!isValidEmail(trimmedAdminEmail)) {
      setErrorMessage(`"${adminEmail}" is not a valid email address. It must contain "@" and a domain (e.g. admin@gmail.com).`)
      setIsLoading(false)
      return
    }

    try {
      const user = await login({
        identifier: trimmedAdminEmail,
        password: adminPassword.trim()
      })

      if (user.role !== 'organizer') {
        throw new Error('This account does not have administrative privileges.')
      }

      toast({
        type: 'success',
        title: 'Admin Access Granted',
        description: `Logged in as ${user.displayName || user.email}. Opening Control Panel.`
      })
      navigate('/admin')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid admin credentials. Check your email and password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-tech-grid">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Wordmark */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <img 
              src="/acm-logo.png" 
              alt="ACM Logo" 
              className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.25)]" 
            />
          </div>
          <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>ACM CYBER CHALLENGE PORTAL</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign In to CTF
          </h1>
          <p className="text-xs text-zinc-400">
            {activeTab === 'student' 
              ? 'Enter credentials provided by the organizer to access your team workspace.' 
              : 'Enter administrative credentials to access event controls and telemetry.'}
          </p>
        </div>

        {/* Tab Toggle: Student vs Admin */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student')
              setErrorMessage(null)
            }}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all font-semibold ${
              activeTab === 'student'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participant</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin')
              setErrorMessage(null)
            }}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all font-semibold ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Login Card */}
        <Card className="p-6 bg-[#10121a] border-zinc-800">
          {errorMessage && (
            <div className="p-3 mb-4 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-rose-400 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {activeTab === 'student' ? (
            /* Student Login Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {/* Team Selection */}
              <div>
                <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    ASSIGNED TEAM NAME
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomTeam(!isCustomTeam)}
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {isCustomTeam ? 'Select from list' : 'Type custom team'}
                  </button>
                </label>

                {isCustomTeam ? (
                  <Input
                    placeholder="Enter exact team name..."
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    required
                  />
                ) : (
                  <div>
                    {availableTeams.length > 0 ? (
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                      >
                        {availableTeams.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="e.g. CyberKnights or BinaryBeasts"
                        value={customTeamName}
                        onChange={(e) => {
                          setIsCustomTeam(true)
                          setCustomTeamName(e.target.value)
                        }}
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              <Input
                label="Student Email or USN"
                placeholder="e.g. student@college.edu or 1RV22CS010"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                leftIcon={<UserIcon className="w-4 h-4" />}
              />

              <Input
                label="Temporary Password / USN"
                type="password"
                placeholder="Enter password assigned by admin"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-500 text-[11px]">Credentials assigned by event organizers</span>
                <button 
                  type="button" 
                  onClick={() => toast({ type: 'info', title: 'Need Assistance?', description: 'Contact your event admin or check the Discord announcements.' })}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-[11px]"
                >
                  Help?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-mono"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In as Participant
              </Button>
            </form>
          ) : (
            /* Admin Login Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <Input
                  label="Administrator Email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                {adminEmail.length > 0 && !isValidEmail(adminEmail) && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1 flex items-center gap-1">
                    ⚠️ Email must contain "@" and a valid domain (e.g. admin@gmail.com)
                  </p>
                )}
              </div>

              <Input
                label="Admin Password"
                type="password"
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="p-3 rounded bg-purple-950/20 border border-purple-800/40 text-[11px] text-purple-300 font-mono">
                🛡️ Direct administrative access to challenges, timers, scoring, and user management.
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-mono"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In as Administrator
              </Button>
            </form>
          )}
        </Card>

        {/* Informational Notice */}
        <p className="text-center text-xs text-zinc-400">
          Students are onboarded and managed directly by event organizers.{' '}
          <Link to="/rules" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Read Competition Rules
          </Link>
        </p>

      </div>
    </div>
  )
}
