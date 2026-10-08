import React, { useState } from 'react'
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Bell, 
  KeyRound, 
  CheckCircle2, 
  Save, 
  LogOut,
  Trophy,
  Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth()
  const { toast } = useToast()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [announcementAlerts, setAnnouncementAlerts] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Security placeholder
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Your profile preferences have been successfully recorded.'
      })
    }, 400)
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return

    toast({
      type: 'success',
      title: 'Credentials Updated',
      description: 'Your security password has been changed.'
    })
    setCurrentPassword('')
    setNewPassword('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="pb-2 border-b border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile & Preferences</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your competition account telemetry, handle credentials, and broadcast notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Account Details */}
        <div className="md:col-span-7 space-y-6">
          <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xl text-blue-400">
                {user?.displayName?.[0] || 'A'}
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">{user?.displayName}</h2>
                <p className="text-xs font-mono text-zinc-500">@{user?.username}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={user?.role === 'organizer' ? 'near' : 'acm'} size="sm">
                    {user?.role.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Team: {user?.teamName || 'Solo'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-zinc-800/80">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                helperText="Public name visible on scoreboard and team logs."
              />

              <Input
                label="Registered Email"
                value={user?.email || ''}
                disabled
                helperText="University email linked to registration record."
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Profile
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

        {/* Right Column: Competition Stats & Notifications */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Quick Participant Summary */}
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
                <span className="text-zinc-500">Active Team:</span>
                <span className="text-zinc-200">{user?.teamName || 'Solo'}</span>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-4 text-xs">
            <h3 className="text-zinc-400 text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              BROADCAST PREFERENCES
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementAlerts}
                  onChange={(e) => setAnnouncementAlerts(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-zinc-200 block">Organizer Broadcasts</span>
                  <span className="text-zinc-500 text-[11px]">Display urgent notifications and first blood alerts inline.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-zinc-200 block">Critical System Alerts</span>
                  <span className="text-zinc-500 text-[11px]">Receive updates regarding platform maintenance and closing windows.</span>
                </div>
              </label>
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
