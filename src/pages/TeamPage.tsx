import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Trophy, 
  Crown, 
  UserPlus, 
  Copy, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  RefreshCw,
  Mail
} from 'lucide-react'
import { teamService } from '../services/teamService'
import { Team, TeamMember } from '../types'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'

export const TeamPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const loadTeam = async () => {
    try {
      const data = await teamService.getMyTeam()
      setTeam(data)
      setNewTeamName(data.name)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  const handleCopyInviteCode = () => {
    if (!team) return
    navigator.clipboard.writeText(team.inviteCode)
    toast({
      type: 'success',
      title: 'Invite Code Copied',
      description: `Share code "${team.inviteCode}" with your teammates.`
    })
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsSendingInvite(true)
    try {
      const res = await teamService.inviteMember(inviteEmail)
      toast({
        type: 'success',
        title: 'Invitation Sent',
        description: res.message
      })
      setInviteModalOpen(false)
      setInviteEmail('')
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Invitation Failed',
        description: err.message
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setIsSavingSettings(true)
    try {
      const updated = await teamService.updateTeamName(newTeamName)
      setTeam(updated)
      toast({
        type: 'success',
        title: 'Team Settings Updated',
        description: `Team name changed to "${updated.name}".`
      })
      setSettingsModalOpen(false)
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: err.message
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!team) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Team Header Banner */}
      <div className="p-6 rounded-lg bg-[#10121a] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300">
              TEAM HQ
            </span>
            <span className="text-zinc-600 font-mono text-xs">•</span>
            <span className="text-zinc-400 font-mono text-xs">Max 4 Operators</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            {team.name}
          </h1>
          <p className="text-xs text-zinc-400">
            Formed {new Date(team.createdAt).toLocaleDateString()} for the ACM × NEAR.AI CTF.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 bg-[#090b10] border border-zinc-800 rounded-md p-3.5 font-mono text-xs shrink-0">
          <div>
            <span className="text-zinc-500 block text-[10px]">CURRENT RANK</span>
            <span className="text-amber-400 font-bold text-lg">#{team.rank}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div>
            <span className="text-zinc-500 block text-[10px]">TOTAL SCORE</span>
            <span className="text-blue-400 font-bold text-lg">{team.score} pts</span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div>
            <span className="text-zinc-500 block text-[10px]">ROSTER</span>
            <span className="text-zinc-200 font-bold text-lg">{team.members.length}/4</span>
          </div>
        </div>
      </div>

      {/* Action Row: Invite Code, Invite Button, Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#0e1017] border border-zinc-800/80 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">Team Invite Code:</span>
          <code className="px-2.5 py-1 rounded bg-[#131622] text-cyan-300 border border-zinc-700/60 font-semibold select-all">
            {team.inviteCode}
          </code>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyInviteCode}
          >
            Copy
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {team.members.length < 4 && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setInviteModalOpen(true)}
            >
              Invite Teammate
            </Button>
          )}

          {user?.isTeamCaptain && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Settings className="w-3.5 h-3.5" />}
              onClick={() => setSettingsModalOpen(true)}
            >
              Team Settings
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Members Roster vs Solve History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Team Members Roster */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Roster & Contributions ({team.members.length}/4)
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">All members active</span>
          </div>

          <div className="space-y-3">
            {team.members.map((member) => (
              <Card key={member.id} className="p-4 bg-[#10121a] border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-semibold text-sm text-zinc-200">
                      {member.displayName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-100">{member.displayName}</span>
                        {member.isCaptain && (
                          <span title="Team Captain" className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Crown className="w-3 h-3" />
                            CAPTAIN
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-500">@{member.username}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-blue-400 font-bold block">{member.pointsContributed} pts</span>
                    <span className="text-[10px] text-zinc-500">{member.solvesCount} solves</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Verified Solves Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Team Solves Feed ({team.solves.length})
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">Chronological</span>
          </div>

          <Card className="p-4 bg-[#10121a] border-zinc-800 divide-y divide-zinc-800/60">
            {team.solves.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No challenges solved yet.</p>
            ) : (
              team.solves.map((solve, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-zinc-200">{solve.challengeTitle}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                      <span className="text-zinc-400">{solve.category}</span>
                      <span>•</span>
                      <span>Solved by @{solve.solvedByUsername}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-bold block">+{solve.points} pts</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(solve.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Teammate"
        description="Send an invitation link or share your invite code"
      >
        <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
          <Input
            label="Teammate Email Address"
            type="email"
            placeholder="e.g. partner@student.acm.org"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Direct Invite Token:</span>
            <code className="text-cyan-300 font-mono font-bold">{team.inviteCode}</code>
            <p className="text-[10px] text-zinc-500 mt-1">
              Teammates can also enter this code during registration to join immediately.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSendingInvite}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Team Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Team Settings"
        description="Update your team public identity"
      >
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <Input
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            required
            helperText="Changing your team name updates your presence on the public scoreboard."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSavingSettings}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
