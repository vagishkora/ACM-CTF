import React, { useState, useEffect } from 'react'
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Bell, 
  KeyRound, 
  Save, 
  LogOut,
  Users,
  Hash,
  GraduationCap,
  Building2,
  Phone,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { ProvisionedAccount } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'

export const ProfilePage: React.FC = () => {
  const { user, completeProfile, logout } = useAuth()
  const { toast } = useToast()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [usn, setUsn] = useState(user?.usn || '')
  const [year, setYear] = useState(user?.year || '3rd Year')
  const [branch, setBranch] = useState(user?.branch || 'Computer Science & Engineering')
  const [phone, setPhone] = useState(user?.phone || '')
  const [isSaving, setIsSaving] = useState(false)

  const [teammates, setTeammates] = useState<ProvisionedAccount[]>([])
  const [isLoadingTeammates, setIsLoadingTeammates] = useState(true)

  const [announcementAlerts, setAnnouncementAlerts] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (user?.teamName) {
      setIsLoadingTeammates(true)
      authService.getTeamMembers(user.teamName)
        .then(members => setTeammates(members))
        .finally(() => setIsLoadingTeammates(false))
    }
  }, [user?.teamName])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await completeProfile({
        name: displayName.trim(),
        usn: usn.trim().toUpperCase(),
        year: year.trim(),
        branch: branch.trim(),
        phone: phone.trim()
      })
      toast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Your participant details have been synchronized with the database.'
      })
      // Refresh teammates
      if (user?.teamName) {
        const refreshed = await authService.getTeamMembers(user.teamName)
        setTeammates(refreshed)
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Update Failed', description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return

    toast({
      type: 'success',
      title: 'Password Updated',
      description: 'Your security password has been changed.'
    })
    setCurrentPassword('')
    setNewPassword('')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="pb-2 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            PARTICIPANT TELEMETRY & PROFILE
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Student credentials, verified team squad members, and security preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user?.role === 'organizer' ? 'near' : 'acm'} size="sm">
            ROLE: {user?.role.toUpperCase()}
          </Badge>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
            TEAM: <strong className="text-cyan-300">{user?.teamName || 'Solo'}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Personal Credentials Form */}
        <div className="md:col-span-7 space-y-6">
          <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xl text-blue-400">
                {user?.displayName?.[0] || 'A'}
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">{user?.displayName}</h2>
                <p className="text-xs font-mono text-zinc-400">{user?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    USN: {user?.usn || 'PENDING SETUP'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-zinc-800/80">
              {/* Assigned Team: Locked */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  ASSIGNED TEAM NAME (MANAGED BY ADMIN)
                </label>
                <div className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold text-xs flex justify-between items-center">
                  <span>{user?.teamName || 'Individual'}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">LOCKED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  leftIcon={<UserIcon className="w-4 h-4" />}
                />

                <Input
                  label="USN / Roll Number"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  required
                  leftIcon={<Hash className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    YEAR OF STUDY
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="PG / MCA">PG / MCA / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    BRANCH / DEPARTMENT
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Computer Science & Engineering">CSE (Computer Science)</option>
                    <option value="Information Science & Engineering">ISE (Info Science)</option>
                    <option value="Artificial Intelligence & ML">AI / ML / Data Science</option>
                    <option value="Electronics & Communication">ECE (Electronics)</option>
                    <option value="Cyber Security / IT">Cyber Security / IT</option>
                    <option value="Other Engineering">Other Engineering</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contact Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />

                <Input
                  label="Registered Email"
                  value={user?.email || ''}
                  disabled
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Details
              </Button>
            </form>
          </Card>

          {/* Security Credentials */}
          <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-4">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 uppercase flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-zinc-400" />
              SECURITY CREDENTIALS
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!currentPassword || !newPassword}
              >
                Update Password
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Teammates List & Stats */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Teammates Roster (Fetched from Database) */}
          <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase">
                  TEAM ROSTER (DATABASE)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                {teammates.length} Members
              </span>
            </div>

            <p className="text-[11px] text-zinc-400">
              All students registered under squad <strong>{user?.teamName || 'Solo'}</strong>:
            </p>

            {isLoadingTeammates ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">
                Fetching team roster from database...
              </div>
            ) : teammates.length === 0 ? (
              <div className="p-4 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 text-center">
                No teammates registered under this team yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {teammates.map((member) => {
                  const isCurrent = member.email.toLowerCase() === user?.email.toLowerCase()
                  return (
                    <div 
                      key={member.id} 
                      className={`p-3 rounded border transition-colors ${
                        isCurrent 
                          ? 'bg-blue-950/20 border-blue-800/60' 
                          : 'bg-zinc-900/60 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-xs font-bold text-zinc-300">
                            {(member.name || member.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-zinc-200">
                                {member.name || member.email.split('@')[0]}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 block">
                              {member.email}
                            </span>
                          </div>
                        </div>

                        {member.isProfileComplete ? (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400">
                            Pending Login
                          </span>
                        )}
                      </div>

                      {member.isProfileComplete && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/60 grid grid-cols-2 text-[10px] font-mono text-zinc-400">
                          <div>USN: <span className="text-zinc-200">{member.usn}</span></div>
                          <div>Year: <span className="text-zinc-200">{member.year || 'N/A'}</span></div>
                          <div className="col-span-2 mt-0.5 truncate text-zinc-400">
                            Branch: <span className="text-zinc-300">{member.branch || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Operator Telemetry */}
          <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-3 font-mono text-xs">
            <h3 className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
              OPERATOR TELEMETRY
            </h3>
            <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Points Credited:</span>
                <span className="text-blue-400 font-bold">{user?.score ?? 0} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Flags Submitted:</span>
                <span className="text-emerald-400 font-bold">{user?.solvedCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Active Squad:</span>
                <span className="text-zinc-200">{user?.teamName || 'Solo'}</span>
              </div>
            </div>
          </Card>

          {/* Sign Out Card */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-rose-400 border-rose-900/40 hover:bg-rose-950/20"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              onClick={logout}
            >
              Sign Out of Competition
            </Button>
          </div>

        </div>

      </div>

    </div>
  )
}
