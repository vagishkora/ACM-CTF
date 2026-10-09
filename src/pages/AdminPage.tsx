import React, { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Send, 
  Radio, 
  BarChart3, 
  Layers, 
  Users, 
  Clock, 
  Eye, 
  EyeOff,
  Sliders,
  RotateCcw,
  Key,
  Copy,
  Award,
  UserPlus,
  Shield,
  AlertCircle,
  Link2,
  Server,
  Globe,
  ExternalLink,
  FileCode,
  Paperclip,
  Lock,
  Unlock,
  Zap,
  Sparkles,
  Calendar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEvent } from '../context/EventContext'
import { useCTF } from '../context/CTFContext'
import { challengeService } from '../services/challengeService'
import { announcementService } from '../services/announcementService'
import { teamService } from '../services/teamService'
import { authService, isValidEmail } from '../services/authService'
import { Challenge, ChallengeCategory, ChallengeDifficulty, ChallengeSource, EventStatus, Announcement, Team, ProvisionedAccount, FileAttachment, InstanceTarget, ReleaseWaveConfig } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

export const AdminPage: React.FC = () => {
  const { user } = useAuth()
  const { 
    status, 
    setStatus, 
    resetEvent, 
    timeRemaining, 
    isPaused, 
    setCustomTimer, 
    adjustTimerMinutes, 
    togglePauseTimer 
  } = useEvent()
  const { 
    challenges, 
    refreshChallenges, 
    unlockedWaves, 
    waves,
    unlockWave, 
    lockWave, 
    setChallengeWave,
    addWave,
    updateWave,
    deleteWave,
    generateWavesForCTF,
    distributeChallengesEvenly
  } = useCTF()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'challenges' | 'announcements' | 'event_states' | 'timer' | 'teams' | 'users'>('challenges')

  // CTF Duration & Wave Planner State
  const [ctfDurationHours, setCtfDurationHours] = useState<number>(4)
  const [ctfWaveCount, setCtfWaveCount] = useState<number>(3)
  const [autoDistributeWaves, setAutoDistributeWaves] = useState<boolean>(true)
  const [isGeneratingWaves, setIsGeneratingWaves] = useState<boolean>(false)
  const [showAddWaveModal, setShowAddWaveModal] = useState<boolean>(false)
  const [customWaveTitle, setCustomWaveTitle] = useState<string>('')
  const [customWaveUnlockAt, setCustomWaveUnlockAt] = useState<string>('')
  const [editingWave, setEditingWave] = useState<ReleaseWaveConfig | null>(null)

  // Custom Timer Form State
  const [timerHours, setTimerHours] = useState<number>(3)
  const [timerMinutes, setTimerMinutes] = useState<number>(0)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const [isApplyingTimer, setIsApplyingTimer] = useState<boolean>(false)

  // Provisioned Accounts & Access Control State
  const [accountsList, setAccountsList] = useState<ProvisionedAccount[]>([])
  const [newTeamName, setNewTeamName] = useState('')
  const [member1Email, setMember1Email] = useState('')
  const [member1Pass, setMember1Pass] = useState('')
  const [member2Email, setMember2Email] = useState('')
  const [member2Pass, setMember2Pass] = useState('')
  const [hasMember2, setHasMember2] = useState(true)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Admin Provisioning State
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  // Create/Edit Challenge Modal
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [chTitle, setChTitle] = useState('')
  const [chCategory, setChCategory] = useState<ChallengeCategory>('Web')
  const [chDifficulty, setChDifficulty] = useState<ChallengeDifficulty>('Easy')
  const [chPoints, setChPoints] = useState(100)
  const [chSource, setChSource] = useState<ChallengeSource>('ACM')
  const [chFlag, setChFlag] = useState('ACM{custom_flag_here}')
  const [chDescription, setChDescription] = useState('')
  const [chWave, setChWave] = useState<number>(1)

  // Challenge Attachments / Google Drive Links
  const [chFiles, setChFiles] = useState<FileAttachment[]>([])

  // Challenge Target Instance Sandbox
  const [chHasTarget, setChHasTarget] = useState(false)
  const [chTargetHost, setChTargetHost] = useState('ch-web-01.sandbox.ctf.internal')
  const [chTargetPort, setChTargetPort] = useState(8080)
  const [chTargetProtocol, setChTargetProtocol] = useState<'http' | 'tcp' | 'ssh'>('http')

  // Announcements State
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([])
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPriority, setAnnPriority] = useState<'urgent' | 'update' | 'info'>('update')
  const [annCategory, setAnnCategory] = useState<any>('general')
  const [isPostingAnn, setIsPostingAnn] = useState(false)

  // Team Admin State
  const [adminTeam, setAdminTeam] = useState<Team | null>(null)
  const [adminNewScore, setAdminNewScore] = useState<number>(0)
  const [adminMemberUser, setAdminMemberUser] = useState('')
  const [adminMemberDisplay, setAdminMemberDisplay] = useState('')
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false)

  const loadAccounts = async () => {
    try {
      const accs = await authService.getProvisionedAccounts()
      setAccountsList(accs)
    } catch (err) {
      console.error(err)
    }
  }

  const loadAdminData = async () => {
    try {
      const [anns, t] = await Promise.all([
        announcementService.getAnnouncements(),
        teamService.getMyTeam()
      ])
      setAnnouncementsList(anns)
      setAdminTeam(t)
      setAdminNewScore(t.score)
      await loadAccounts()
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Team Provisioning & Role Handlers
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTeam = newTeamName.trim()
    if (!trimmedTeam) {
      toast({ type: 'error', title: 'Missing Team Name', description: 'Please provide a Team Name.' })
      return
    }
    if (!member1Email.trim() || !member1Pass.trim()) {
      toast({ type: 'error', title: 'Member 1 Incomplete', description: 'Please provide Email and Password (USN) for Member 1.' })
      return
    }
    if (!isValidEmail(member1Email.trim())) {
      toast({ 
        type: 'error', 
        title: 'Invalid Email for Member 1', 
        description: `"${member1Email}" is not a valid email address. It must include "@" and a valid domain (e.g. name@college.edu).` 
      })
      return
    }
    if (hasMember2 && (!member2Email.trim() || !member2Pass.trim())) {
      toast({ type: 'error', title: 'Member 2 Incomplete', description: 'Please provide Email and Password (USN) for Member 2.' })
      return
    }
    if (hasMember2 && !isValidEmail(member2Email.trim())) {
      toast({ 
        type: 'error', 
        title: 'Invalid Email for Member 2', 
        description: `"${member2Email}" is not a valid email address. It must include "@" and a valid domain (e.g. name@college.edu).` 
      })
      return
    }

    const membersToCreate = [
      { email: member1Email.trim(), password: member1Pass.trim() }
    ]
    if (hasMember2 && member2Email.trim()) {
      membersToCreate.push({ email: member2Email.trim(), password: member2Pass.trim() })
    }

    setIsCreatingAccount(true)
    try {
      const created = await authService.createTeamWithMembers(trimmedTeam, membersToCreate)
      toast({
        type: 'success',
        title: 'Team Provisioned Successfully',
        description: `Created team "${trimmedTeam}" with ${created.length} registered members!`
      })
      setNewTeamName('')
      setMember1Email('')
      setMember1Pass('')
      setMember2Email('')
      setMember2Pass('')
      await loadAccounts()
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed to Add Team', description: err.message || 'Error provisioning team.' })
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      toast({ type: 'error', title: 'Missing Details', description: 'Enter Email and Password for the new Admin.' })
      return
    }
    if (!isValidEmail(newAdminEmail.trim())) {
      toast({
        type: 'error',
        title: 'Invalid Admin Email',
        description: `"${newAdminEmail}" is not a valid email address. It must include "@" and a valid domain (e.g. admin@gmail.com).`
      })
      return
    }
    setIsCreatingAdmin(true)
    try {
      const created = await authService.createAdminAccount({
        email: newAdminEmail.trim(),
        password: newAdminPassword.trim(),
        name: newAdminName.trim() || undefined
      })
      toast({
        type: 'success',
        title: 'Admin Account Created',
        description: `Successfully created admin credentials for ${created.email}.`
      })
      setNewAdminEmail('')
      setNewAdminPassword('')
      setNewAdminName('')
      await loadAccounts()
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed to Add Admin', description: err.message || 'Error creating admin.' })
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  const handleDeleteAccount = async (accId: string, email: string) => {
    const target = accountsList.find(a => a.id === accId)
    const adminCount = accountsList.filter(a => a.role === 'organizer').length
    if (target?.role === 'organizer' && adminCount <= 1) {
      toast({ type: 'error', title: 'Action Denied', description: 'Cannot delete the only remaining Administrator account.' })
      return
    }

    if (!window.confirm(`Are you sure you want to delete access for ${email}?`)) return
    try {
      await authService.deleteAccount(accId)
      toast({ type: 'info', title: 'Account Deleted', description: `Removed ${email} from event database.` })
      await loadAccounts()
    } catch (err: any) {
      toast({ type: 'error', title: 'Delete Failed', description: err.message })
    }
  }

  // Timer Handlers
  const handleApplyCustomTimer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplyingTimer(true)
    try {
      await setCustomTimer(Number(timerHours), Number(timerMinutes), Number(timerSeconds))
      const totalHours = Number(timerHours) + Number(timerMinutes) / 60
      if (autoDistributeWaves && totalHours > 0) {
        await generateWavesForCTF(totalHours, ctfWaveCount)
      }
      toast({
        type: 'success',
        title: 'Competition Clock Updated',
        description: `Timer set to ${String(timerHours).padStart(2, '0')}:${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}${autoDistributeWaves ? ` & re-aligned ${ctfWaveCount} question drops.` : '.'}`
      })
      await refreshChallenges()
    } finally {
      setIsApplyingTimer(false)
    }
  }

  const handleAdjustMinutes = async (mins: number) => {
    await adjustTimerMinutes(mins)
    toast({
      type: 'info',
      title: 'Clock Adjusted',
      description: `${mins > 0 ? '+' : ''}${mins} minutes applied to competition clock.`
    })
  }

  const handleTogglePause = async () => {
    await togglePauseTimer()
    toast({
      type: isPaused ? 'success' : 'warning',
      title: isPaused ? 'Clock Resumed' : 'Clock Paused',
      description: isPaused ? 'Countdown resumed across all participant dashboards.' : 'Competition clock frozen for all participants.'
    })
  }

  const handleExpireNow = async () => {
    await setCustomTimer(0, 0, 0)
    toast({
      type: 'warning',
      title: 'Clock Expired',
      description: 'Timer set to 00:00:00 and competition marked as FINISHED.'
    })
  }

  const handleResetToDefault = async () => {
    await resetEvent()
    toast({
      type: 'info',
      title: 'Event Reset',
      description: 'Reset competition clock back to standard 6-hour window.'
    })
  }

  // Handlers
  const handleOpenCreateChallenge = () => {
    setEditingChallenge(null)
    setChTitle('')
    setChCategory('Web')
    setChDifficulty('Easy')
    setChPoints(100)
    setChSource('ACM')
    setChFlag('ACM{custom_flag_here}')
    setChDescription('')
    setChFiles([])
    setChHasTarget(false)
    setChTargetHost('ch-web-01.sandbox.ctf.internal')
    setChTargetPort(8080)
    setChTargetProtocol('http')
    setChWave(1)
    setChallengeModalOpen(true)
  }

  const handleOpenEditChallenge = (ch: Challenge) => {
    setEditingChallenge(ch)
    setChTitle(ch.title)
    setChCategory(ch.category)
    setChDifficulty(ch.difficulty)
    setChPoints(ch.points)
    setChSource(ch.source)
    setChFlag(challengeService.getFlag(ch.id))
    setChDescription(ch.description)
    setChFiles(ch.files ? [...ch.files] : [])
    setChHasTarget(!!ch.target && !!ch.target.host)
    setChTargetHost(ch.target?.host || 'ch-web-01.sandbox.ctf.internal')
    setChTargetPort(ch.target?.port || 8080)
    setChTargetProtocol(ch.target?.protocol || 'http')
    setChWave(ch.releaseWave || 1)
    setChallengeModalOpen(true)
  }

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chTitle.trim()) return

    const targetObj: InstanceTarget | undefined = chHasTarget && chTargetHost.trim() ? {
      id: editingChallenge?.target?.id || `inst-${Date.now().toString(36)}`,
      host: chTargetHost.trim(),
      port: Number(chTargetPort) || 8080,
      protocol: chTargetProtocol,
      status: editingChallenge?.target?.status || 'running',
      expiresInSeconds: 2700
    } : undefined

    if (editingChallenge) {
      await challengeService.updateChallenge(editingChallenge.id, {
        title: chTitle,
        category: chCategory,
        difficulty: chDifficulty,
        points: chPoints,
        source: chSource,
        description: chDescription,
        files: chFiles,
        target: targetObj,
        releaseWave: Number(chWave) || 1
      }, chFlag)
      toast({ type: 'success', title: 'Challenge Updated', description: `Modified "${chTitle}" (Wave ${chWave}).` })
    } else {
      const slug = chTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const newCh: Challenge = {
        id: `ch-custom-${Date.now()}`,
        slug,
        title: chTitle,
        category: chCategory,
        difficulty: chDifficulty,
        points: chPoints,
        source: chSource,
        author: 'ACM Organizer',
        description: chDescription || 'Challenge brief description.',
        files: chFiles,
        target: targetObj,
        hints: [],
        solvesCount: 0,
        isSolved: false,
        releaseWave: Number(chWave) || 1
      }
      await challengeService.createChallenge(newCh, chFlag)
      toast({ type: 'success', title: 'Challenge Created', description: `Published "${chTitle}" to Wave ${chWave}.` })
    }

    setChallengeModalOpen(false)
    await refreshChallenges()
  }

  const handleDeleteChallenge = async (id: string, title: string) => {
    if (!window.confirm(`Delete challenge "${title}"?`)) return
    await challengeService.deleteChallenge(id)
    toast({ type: 'info', title: 'Challenge Deleted', description: `Removed "${title}".` })
    await refreshChallenges()
  }

  const handleGenerateWaves = async () => {
    setIsGeneratingWaves(true)
    try {
      await generateWavesForCTF(ctfDurationHours, ctfWaveCount)
      toast({
        type: 'success',
        title: 'Waves Generated & Scheduled',
        description: `Created ${ctfWaveCount} waves and distributed all ${challenges.length} questions across them.`
      })
      await refreshChallenges()
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed to generate waves', description: err?.message || 'Error generating waves' })
    } finally {
      setIsGeneratingWaves(false)
    }
  }

  const handleDistributeChallenges = async () => {
    try {
      await distributeChallengesEvenly()
      toast({
        type: 'success',
        title: 'Questions Re-Distributed',
        description: `Evenly spread all ${challenges.length} questions across all ${waves.length} waves.`
      })
      await refreshChallenges()
    } catch (err: any) {
      toast({ type: 'error', title: 'Distribution Failed', description: err?.message || 'Error' })
    }
  }

  const handleCreateCustomWave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customWaveTitle.trim() || !customWaveUnlockAt) {
      toast({ type: 'error', title: 'Missing Information', description: 'Please provide a title and unlock timestamp.' })
      return
    }
    try {
      await addWave(customWaveTitle, new Date(customWaveUnlockAt).toISOString())
      toast({ type: 'success', title: 'Wave Added', description: `Scheduled "${customWaveTitle}".` })
      setShowAddWaveModal(false)
      setCustomWaveTitle('')
      setCustomWaveUnlockAt('')
      await refreshChallenges()
    } catch (err: any) {
      toast({ type: 'error', title: 'Error adding wave', description: err?.message || 'Error' })
    }
  }

  const handleUpdateWave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWave) return
    try {
      await updateWave(editingWave.id, {
        title: editingWave.title,
        unlockAt: editingWave.unlockAt,
        isUnlocked: new Date(editingWave.unlockAt).getTime() <= Date.now()
      })
      toast({ type: 'success', title: 'Wave Updated', description: `Saved changes to Wave ${editingWave.waveNumber}.` })
      setEditingWave(null)
      await refreshChallenges()
    } catch (err: any) {
      toast({ type: 'error', title: 'Error updating wave', description: err?.message || 'Error' })
    }
  }

  const handleDeleteWave = async (waveId: string, waveNumber: number) => {
    if (waves.length <= 1) {
      toast({ type: 'warning', title: 'Cannot Delete Wave', description: 'At least one wave must remain active.' })
      return
    }
    if (!window.confirm(`Are you sure you want to delete Wave ${waveNumber}? Any challenges in this wave will be reassigned to Wave 1.`)) return
    try {
      const matching = challenges.filter(c => c.releaseWave === waveNumber)
      for (const ch of matching) {
        await setChallengeWave(ch.id, 1)
      }
      await deleteWave(waveId)
      toast({ type: 'info', title: 'Wave Deleted', description: `Wave ${waveNumber} was removed.` })
      await refreshChallenges()
    } catch (err: any) {
      toast({ type: 'error', title: 'Error deleting wave', description: err?.message || 'Error' })
    }
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitle.trim() || !annContent.trim()) return

    setIsPostingAnn(true)
    try {
      const newAnn = await announcementService.createAnnouncement(
        annTitle,
        annContent,
        annPriority,
        annCategory,
        'ACM Lead Organizer'
      )
      toast({ type: 'success', title: 'Broadcast Sent', description: 'Published to all participants.' })
      setAnnTitle('')
      setAnnContent('')
      setAnnouncementsList(prev => [newAnn, ...prev])
    } finally {
      setIsPostingAnn(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    await announcementService.deleteAnnouncement(id)
    setAnnouncementsList(prev => prev.filter(a => a.id !== id))
    toast({ type: 'info', title: 'Broadcast Removed', description: `Deleted "${title}".` })
  }

  const handleAdminUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault()
    const updated = await teamService.updateScore(Number(adminNewScore))
    setAdminTeam(updated)
    toast({ type: 'success', title: 'Score Calibrated', description: `Squad score updated to ${adminNewScore} pts.` })
  }

  const handleAdminKickMember = async (memberId: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from team roster?`)) return
    const updated = await teamService.removeMember(memberId)
    setAdminTeam(updated)
    toast({ type: 'info', title: 'Member Kicked', description: `Removed "${name}" from team.` })
  }

  const handleAdminAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminMemberUser.trim() || !adminMemberDisplay.trim()) return
    setIsAddingTeamMember(true)
    try {
      const updated = await teamService.addMember(adminMemberUser, adminMemberDisplay)
      setAdminTeam(updated)
      toast({ type: 'success', title: 'Member Added', description: `Enrolled "${adminMemberDisplay}".` })
      setAdminMemberUser('')
      setAdminMemberDisplay('')
    } finally {
      setIsAddingTeamMember(false)
    }
  }

  const handleAdminResetTeam = async () => {
    if (!window.confirm('Reset team data back to initial state?')) return
    await teamService.resetTeam()
    const t = await teamService.getMyTeam()
    setAdminTeam(t)
    setAdminNewScore(t.score)
    toast({ type: 'info', title: 'Team Reset', description: 'Reset squad data.' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Privilege Header (Section 30: visually distinct) */}
      <div className="p-6 rounded-lg bg-gradient-to-r from-purple-950/40 via-[#141221] to-[#0d0f17] border border-purple-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900/60 border border-purple-700/60 text-purple-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-purple-300" />
                ORGANIZER OPERATIONS DESK
              </span>
              <span className="text-zinc-500 font-mono text-xs">Role: {user?.displayName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              CTF Event Management Console
            </h1>
            <p className="text-xs text-zinc-400">
              Manage challenge parameters, issue broadcast alerts, control state lifecycles, and monitor submissions.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenCreateChallenge}
              className="border-purple-800/60 text-purple-200 hover:bg-purple-900/30"
            >
              New Challenge
            </Button>
          </div>
        </div>
      </div>

      {/* Organizer Telemetry Stats (Section 31) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded bg-[#10121a] border border-zinc-800">
          <span className="text-zinc-500 block text-[10px]">ACTIVE TEAMS</span>
          <span className="text-lg font-bold text-white">32</span>
          <span className="text-[10px] text-emerald-400 block mt-1">● 100% checked in</span>
        </div>
        <div className="p-3.5 rounded bg-[#10121a] border border-zinc-800">
          <span className="text-zinc-500 block text-[10px]">FLAG ATTEMPTS</span>
          <span className="text-lg font-bold text-blue-400">418</span>
          <span className="text-[10px] text-zinc-500 block mt-1">Simulated audit log</span>
        </div>
        <div className="p-3.5 rounded bg-[#10121a] border border-zinc-800">
          <span className="text-zinc-500 block text-[10px]">SOLVES RECORDED</span>
          <span className="text-lg font-bold text-emerald-400">229</span>
          <span className="text-[10px] text-zinc-500 block mt-1">Across 14 challenges</span>
        </div>
        <div className="p-3.5 rounded bg-[#10121a] border border-zinc-800">
          <span className="text-zinc-500 block text-[10px]">NEAR.AI RATIO</span>
          <span className="text-lg font-bold text-cyan-400">25.0%</span>
          <span className="text-[10px] text-zinc-500 block mt-1">3 of 14 challenges</span>
        </div>
        <div className="p-3.5 rounded bg-[#10121a] border border-zinc-800">
          <span className="text-zinc-500 block text-[10px]">STATE STATUS</span>
          <span className="text-lg font-bold text-amber-400">{status}</span>
          <span className="text-[10px] text-zinc-500 block mt-1">Lifecycle active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('timer')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'timer'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          Competition Timer & Clock
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'challenges'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Challenge Inventory ({challenges.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'announcements'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Dispatch Broadcast ({announcementsList.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'teams'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-400" />
          Squads & Roster
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          Students & Access Control ({accountsList.length})
        </button>
        <button
          onClick={() => setActiveTab('event_states')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'event_states'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Lifecycle States
        </button>
      </div>

      {/* Tab: Student Provisioning & Role Delegation */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Card 1: Add Team with 2 Members */}
          <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  PROVISION TEAM & MEMBERS (2-MEMBER SQUAD)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Onboard a 2-member team at once. Enter the <strong>Team Name</strong> and credentials for <strong>Member 1 & Member 2</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                  <input
                    type="checkbox"
                    checked={hasMember2}
                    onChange={(e) => setHasMember2(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-purple-600"
                  />
                  <span>2-Member Team</span>
                </label>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
                  BATCH SQUAD PROVISION
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
              {/* Team Name Input */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  TEAM NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. CyberKnights or BinaryBeasts"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  list="existing-teams-datalist"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-semibold focus:outline-none focus:border-purple-500 font-mono"
                />
                <datalist id="existing-teams-datalist">
                  {Array.from(new Set(accountsList.map(a => a.teamName))).map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Squad name shared by both student teammates</span>
              </div>

              {/* Members Grid (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Member 1 Box */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      MEMBER 1 (PRIMARY)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Student 1</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-mono text-zinc-400">
                        STUDENT 1 EMAIL *
                      </label>
                      {member1Email.length > 0 && (
                        <span className={`text-[10px] font-mono flex items-center gap-1 ${
                          isValidEmail(member1Email) ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                        }`}>
                          {isValidEmail(member1Email) ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Valid Email
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              Missing '@' or domain
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      placeholder="e.g. student1@college.edu"
                      value={member1Email}
                      onChange={(e) => setMember1Email(e.target.value)}
                      required
                      className={`w-full px-3 py-2 bg-zinc-950 border rounded text-xs font-mono transition-colors focus:outline-none ${
                        member1Email.length === 0
                          ? 'border-zinc-800 text-zinc-200 focus:border-cyan-500'
                          : isValidEmail(member1Email)
                          ? 'border-emerald-600/80 text-emerald-100 focus:border-emerald-500 bg-emerald-950/20'
                          : 'border-rose-500 text-rose-100 focus:border-rose-500 bg-rose-950/30'
                      }`}
                    />
                    {member1Email.length > 0 && !isValidEmail(member1Email) && (
                      <p className="text-[10px] text-rose-400 font-mono mt-1 flex items-center gap-1">
                        ⚠️ Must be a valid email containing '@' and a domain (e.g. name@college.edu)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      STUDENT 1 PASSWORD (TEMP / USN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1RV22CS010"
                      value={member1Pass}
                      onChange={(e) => setMember1Pass(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Member 2 Box */}
                {hasMember2 && (
                  <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
                      <span className="font-mono text-xs font-bold text-purple-400">
                        MEMBER 2 (TEAMMATE)
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Student 2</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-mono text-zinc-400">
                          STUDENT 2 EMAIL *
                        </label>
                        {member2Email.length > 0 && (
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${
                            isValidEmail(member2Email) ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                          }`}>
                            {isValidEmail(member2Email) ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Valid Email
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                Missing '@' or domain
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        placeholder="e.g. student2@college.edu"
                        value={member2Email}
                        onChange={(e) => setMember2Email(e.target.value)}
                        required={hasMember2}
                        className={`w-full px-3 py-2 bg-zinc-950 border rounded text-xs font-mono transition-colors focus:outline-none ${
                          member2Email.length === 0
                            ? 'border-zinc-800 text-zinc-200 focus:border-purple-500'
                            : isValidEmail(member2Email)
                            ? 'border-emerald-600/80 text-emerald-100 focus:border-emerald-500 bg-emerald-950/20'
                            : 'border-rose-500 text-rose-100 focus:border-rose-500 bg-rose-950/30'
                        }`}
                      />
                      {member2Email.length > 0 && !isValidEmail(member2Email) && (
                        <p className="text-[10px] text-rose-400 font-mono mt-1 flex items-center gap-1">
                          ⚠️ Must be a valid email containing '@' and a domain (e.g. name@college.edu)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                        STUDENT 2 PASSWORD (TEMP / USN)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1RV22CS099"
                        value={member2Pass}
                        onChange={(e) => setMember2Pass(e.target.value)}
                        required={hasMember2}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isCreatingAccount}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono"
                >
                  {hasMember2 ? 'Provision Team (Both Members)' : 'Provision Single Student'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Add Co-Administrator Form */}
          <Card className="p-6 bg-[#10121a] border-purple-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  ADD CO-ADMINISTRATOR
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Provision direct organizer credentials for staff or coordinators. Enter their <strong>Email</strong> and <strong>Password</strong>.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300">
                STAFF ACCESS
              </span>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-mono text-zinc-400">
                      ADMIN EMAIL *
                    </label>
                    {newAdminEmail.length > 0 && (
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${
                        isValidEmail(newAdminEmail) ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                      }`}>
                        {isValidEmail(newAdminEmail) ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Valid Email
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            Missing '@' or domain
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. co_admin@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                    className={`w-full px-3 py-2 bg-zinc-950 border rounded text-xs font-mono transition-colors focus:outline-none ${
                      newAdminEmail.length === 0
                        ? 'border-zinc-800 text-zinc-200 focus:border-purple-500'
                        : isValidEmail(newAdminEmail)
                        ? 'border-emerald-600/80 text-emerald-100 focus:border-emerald-500 bg-emerald-950/20'
                        : 'border-rose-500 text-rose-100 focus:border-rose-500 bg-rose-950/30'
                    }`}
                  />
                  {newAdminEmail.length > 0 && !isValidEmail(newAdminEmail) && (
                    <p className="text-[10px] text-rose-400 font-mono mt-1 flex items-center gap-1">
                      ⚠️ Must be a valid email containing '@' and a domain (e.g. admin@gmail.com)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    ADMIN PASSWORD *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. password123"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    DISPLAY NAME / TITLE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faculty Coordinator"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isCreatingAdmin}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-mono"
                >
                  Create Co-Admin
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 3: Administrators Table */}
          <Card className="bg-[#10121a] border-purple-900/30 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-purple-300 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  EVENT ADMINISTRATORS ({accountsList.filter(a => a.role === 'organizer').length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Accounts with full event authority (managing challenges, timer clocks, and accounts).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAccounts}
                className="text-[11px] font-mono"
              >
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c0e15] text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">ADMIN EMAIL</th>
                    <th className="py-3 px-4 font-medium">NAME / TITLE</th>
                    <th className="py-3 px-4 font-medium">PASSWORD</th>
                    <th className="py-3 px-4 font-medium">PRIVILEGE</th>
                    <th className="py-3 px-4 font-medium text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {accountsList.filter(a => a.role === 'organizer').map((acc) => (
                    <tr key={acc.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 text-purple-200 font-semibold">
                        {acc.email}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {acc.name || 'Lead Administrator'}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-[11px]">
                          {showPasswords[acc.id] ? acc.password : '••••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() => setShowPasswords(p => ({ ...p, [acc.id]: !p[acc.id] }))}
                          className="ml-2 text-[10px] text-zinc-500 hover:text-zinc-300"
                        >
                          {showPasswords[acc.id] ? 'hide' : 'show'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-semibold text-[11px]">
                          ORGANIZER
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.email)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                          title="Delete Admin Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Card 4: Registered Student Teams & Participants Table */}
          <Card className="bg-[#10121a] border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  REGISTERED STUDENT TEAMS & PARTICIPANTS ({accountsList.filter(a => a.role !== 'organizer').length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Students provisioned for competition. Solves are synchronized per team.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c0e15] text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">TEAM NAME</th>
                    <th className="py-3 px-4 font-medium">STUDENT EMAIL</th>
                    <th className="py-3 px-4 font-medium">PROFILE DETAILS</th>
                    <th className="py-3 px-4 font-medium">PASSWORD</th>
                    <th className="py-3 px-4 font-medium">ROLE</th>
                    <th className="py-3 px-4 font-medium text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {accountsList.filter(a => a.role !== 'organizer').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-500 font-mono text-xs">
                        No student teams provisioned yet. Use the squad provision form above to register participants.
                      </td>
                    </tr>
                  ) : (
                    accountsList.filter(a => a.role !== 'organizer').map((acc) => (
                      <tr key={acc.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-zinc-200">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-cyan-300">
                            {acc.teamName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {acc.email}
                        </td>
                        <td className="py-3 px-4">
                          {acc.isProfileComplete ? (
                            <div>
                              <span className="text-zinc-100 font-sans font-semibold">{acc.name}</span>
                              <span className="text-zinc-500 text-[11px] block">{acc.usn} • {acc.branch}</span>
                            </div>
                          ) : (
                            <span className="text-amber-400/80 italic text-[11px]">
                              Pending first login setup
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-[11px]">
                            {showPasswords[acc.id] ? acc.password : '••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => setShowPasswords(p => ({ ...p, [acc.id]: !p[acc.id] }))}
                            className="ml-2 text-[10px] text-zinc-500 hover:text-zinc-300"
                          >
                            {showPasswords[acc.id] ? 'hide' : 'show'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/50 text-blue-300 text-[11px]">
                            PARTICIPANT
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteAccount(acc.id, acc.email)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 1: Challenges Inventory */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* DYNAMIC CTF DURATION & QUESTION WAVE CONTROLLER */}
          <Card className="p-5 bg-[#10121a] border-purple-900/50 relative overflow-hidden space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="p-2 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      CTF TIME & QUESTION WAVE CONTROLLER
                    </h2>
                    <Badge variant="acm" size="sm">{waves.length} WAVES CONFIGURED</Badge>
                    <span className="text-[11px] font-mono text-zinc-400">({challenges.length} total questions)</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure your CTF duration and automatically schedule or customize question release waves. Question sets unlock on schedule or on demand.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomWaveTitle(`Wave ${waves.length + 1}: Question Drop`)
                    const nextTime = new Date(Date.now() + 60 * 60 * 1000)
                    // Format to local datetime-local string
                    const localISO = new Date(nextTime.getTime() - nextTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    setCustomWaveUnlockAt(localISO)
                    setShowAddWaveModal(true)
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-purple-300" />}
                  className="border-purple-800/60 text-purple-200 hover:bg-purple-900/30 font-mono text-xs"
                >
                  + Add Custom Wave
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    const nextLockedWave = waves.find(w => !unlockedWaves.includes(w.waveNumber))
                    if (nextLockedWave) {
                      await unlockWave(nextLockedWave.waveNumber)
                      toast({
                        type: 'success',
                        title: `🚀 Wave ${nextLockedWave.waveNumber} Released!`,
                        description: `All "${nextLockedWave.title}" questions are now active and an announcement was broadcasted.`
                      })
                      await refreshChallenges()
                    } else {
                      toast({ type: 'info', title: 'All Waves Released', description: 'All configured waves are already live.' })
                    }
                  }}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs whitespace-nowrap"
                >
                  Drop Next Wave Now
                </Button>
              </div>
            </div>

            {/* CTF DURATION & AUTO-WAVE GENERATOR BOX */}
            <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-purple-900/40 font-mono text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AUTO-SCHEDULE WAVES FOR CTF DURATION:
                </span>
                <span className="text-[10px] text-zinc-500">
                  Admin decides total competition duration & wave split
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 text-[11px]">Total CTF Hours:</span>
                  <input
                    type="number"
                    min={0.5}
                    max={48}
                    step={0.5}
                    value={ctfDurationHours}
                    onChange={(e) => setCtfDurationHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
                    className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-center text-white font-bold text-xs focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-zinc-500 text-[10px]">hrs</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 text-[11px]">Question Waves:</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={ctfWaveCount}
                    onChange={(e) => setCtfWaveCount(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                    className="w-14 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-center text-white font-bold text-xs focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-zinc-500 text-[10px]">drops</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isGeneratingWaves}
                  onClick={handleGenerateWaves}
                  className="border-purple-700/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 text-xs font-mono"
                >
                  ⚡ Auto-Calculate & Schedule {ctfWaveCount} Waves
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDistributeChallenges}
                  className="border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-mono"
                  title="Evenly spreads all questions across waves 1 to N"
                >
                  Re-Distribute Questions Across All {waves.length} Waves
                </Button>
              </div>
            </div>

            {/* Dynamic Waves Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 pt-1">
              {waves.map(wave => {
                const isLive = unlockedWaves.includes(wave.waveNumber)
                const count = challenges.filter(c => (c.releaseWave || 1) === wave.waveNumber).length
                const unlockDate = new Date(wave.unlockAt)
                const formattedTime = !isNaN(unlockDate.getTime()) 
                  ? unlockDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Manual'

                return (
                  <div
                    key={wave.id}
                    className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                      isLive 
                        ? 'bg-purple-950/25 border-purple-600/50 text-purple-200 shadow-sm shadow-purple-900/20' 
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-bold text-zinc-100 truncate" title={wave.title}>
                          Wave {wave.waveNumber}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                          isLive 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {isLive ? 'LIVE' : 'LOCKED'}
                        </span>
                      </div>

                      <p className="text-[10px] text-zinc-400 truncate mb-1.5 font-sans" title={wave.title}>
                        {wave.title}
                      </p>

                      <div className="text-[11px] font-mono text-zinc-400 mb-2">
                        <span className="text-white font-bold">{count}</span> questions
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                          <span>{wave.waveNumber === 1 ? 'CTF Start' : formattedTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={async () => {
                          if (isLive) {
                            await lockWave(wave.waveNumber)
                            toast({ type: 'warning', title: `Wave ${wave.waveNumber} Locked`, description: `Hidden from participants.` })
                          } else {
                            await unlockWave(wave.waveNumber)
                            toast({ type: 'success', title: `Wave ${wave.waveNumber} Unlocked`, description: `Released to participants & broadcasted!` })
                          }
                          await refreshChallenges()
                        }}
                        className={`w-full py-1 rounded text-[10px] font-mono font-medium flex items-center justify-center gap-1 transition-colors border ${
                          isLive 
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-rose-300 hover:border-rose-800/40' 
                            : 'bg-purple-900/40 border-purple-600/50 text-purple-300 hover:bg-purple-800/50'
                        }`}
                      >
                        {isLive ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                        {isLive ? 'Lock Wave' : 'Drop Wave Now'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(wave.unlockAt)
                            const localISO = !isNaN(d.getTime()) 
                              ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                              : ''
                            setEditingWave({ ...wave, unlockAt: localISO })
                          }}
                          className="flex-1 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[10px] font-mono flex items-center justify-center gap-1"
                        >
                          <Edit className="w-2.5 h-2.5" />
                          Edit Time
                        </button>

                        {waves.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWave(wave.id, wave.waveNumber)}
                            className="p-1 rounded bg-zinc-900 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 border border-zinc-800 transition-colors"
                            title="Delete wave"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Challenges Inventory Table */}
          <Card className="bg-[#10121a] border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c0e15] text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">TITLE</th>
                    <th className="py-3 px-4 font-medium">CATEGORY</th>
                    <th className="py-3 px-4 font-medium">DIFFICULTY</th>
                    <th className="py-3 px-4 font-medium">POINTS</th>
                    <th className="py-3 px-4 font-medium">SOURCE</th>
                    <th className="py-3 px-4 font-medium text-purple-300">RELEASE WAVE</th>
                    <th className="py-3 px-4 font-medium">SOLVES</th>
                    <th className="py-3 px-4 font-medium text-amber-300">FLAG SECRET</th>
                    <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {challenges.map((ch) => {
                    const isWaveLive = unlockedWaves.includes(ch.releaseWave || 1)
                    return (
                      <tr key={ch.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-zinc-100">
                          {ch.title}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {ch.category}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {ch.difficulty}
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-400">
                          {ch.points} pts
                        </td>
                        <td className="py-3 px-4">
                          {ch.source === 'NEAR.AI' ? (
                            <Badge variant="near" size="sm">NEAR.AI</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">ACM</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                              isWaveLive
                                ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                                : 'bg-amber-950/60 border-amber-800/50 text-amber-300'
                            }`}>
                              Wave {ch.releaseWave || 1} • {isWaveLive ? 'LIVE' : 'LOCKED'}
                            </span>
                            <select
                              value={ch.releaseWave || 1}
                              onChange={async (e) => {
                                await setChallengeWave(ch.id, Number(e.target.value))
                                toast({
                                  type: 'info',
                                  title: 'Wave Updated',
                                  description: `Assigned "${ch.title}" to Wave ${e.target.value}.`
                                })
                              }}
                              className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                              title="Reassign Release Wave"
                            >
                              {waves.map((w) => (
                                <option key={w.id} value={w.waveNumber}>
                                  Wave {w.waveNumber} ({w.title})
                                </option>
                              ))}
                              <option value={99}>Wave 99 (Vault)</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {ch.solvesCount}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-amber-200 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40 text-[11px] font-mono select-all">
                            {challengeService.getFlag(ch.id)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditChallenge(ch)}
                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Edit Challenge"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChallenge(ch.id, ch.title)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                              title="Delete Challenge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Dispatch Broadcast */}
      {activeTab === 'announcements' && (
        <Card className="p-6 bg-[#10121a] border-zinc-800 max-w-2xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 font-mono">
              DISPATCH ORGANIZER BROADCAST
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantly notifies all registered participant sessions.
            </p>
          </div>

          <form onSubmit={handlePostAnnouncement} className="space-y-4 text-xs font-sans">
            {/* Quick 1-Click Broadcast Presets */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#0b0d14] border border-purple-900/40">
              <span className="text-[11px] font-mono text-purple-300 block uppercase font-semibold">
                Quick 1-Click Broadcast Templates:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnnTitle('🚀 Wave 2 Challenges Unlocked!')
                    setAnnContent('Attention participants: Wave 2 has dropped! 4 brand new challenges are now unlocked on the challenge board. Check them out and submit your flags!')
                    setAnnPriority('update')
                    setAnnCategory('challenges')
                  }}
                  className="px-2.5 py-1 rounded bg-purple-950/60 border border-purple-700/60 text-purple-300 hover:bg-purple-900/60 text-xs font-mono transition-colors"
                >
                  + Wave 2 Drop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnnTitle('🚀 Wave 3 Challenges Unlocked!')
                    setAnnContent('Attention hackers: Wave 3 challenges in Pwn and Forensics are now live! Head to the challenges tab to begin your analysis.')
                    setAnnPriority('update')
                    setAnnCategory('challenges')
                  }}
                  className="px-2.5 py-1 rounded bg-purple-950/60 border border-purple-700/60 text-purple-300 hover:bg-purple-900/60 text-xs font-mono transition-colors"
                >
                  + Wave 3 Drop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnnTitle('⚠️ Hint Released for Web Challenges')
                    setAnnContent('An organizer hint has been published for all Web challenges. Check the hint drawer on the challenge detail page if your team is stuck.')
                    setAnnPriority('info')
                    setAnnCategory('challenges')
                  }}
                  className="px-2.5 py-1 rounded bg-blue-950/60 border border-blue-700/60 text-blue-300 hover:bg-blue-900/60 text-xs font-mono transition-colors"
                >
                  + Hint Release
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnnTitle('⏰ 1 Hour Remaining Warning')
                    setAnnContent('Only 60 minutes remain on the competition clock! Finalize your active flag submissions and check your scoreboard positions.')
                    setAnnPriority('urgent')
                    setAnnCategory('general')
                  }}
                  className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-700/60 text-rose-300 hover:bg-rose-900/60 text-xs font-mono transition-colors"
                >
                  + 1-Hour Warning
                </button>
              </div>
            </div>

            <Input
              label="Broadcast Title"
              placeholder="e.g. First Blood on Stack Boundary"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Broadcast Body
              </label>
              <textarea
                rows={4}
                className="w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                placeholder="Write announcement details..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Priority</label>
                <select
                  value={annPriority}
                  onChange={(e: any) => setAnnPriority(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 text-xs focus:outline-none"
                >
                  <option value="info">Info</option>
                  <option value="update">Update</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Channel Category</label>
                <select
                  value={annCategory}
                  onChange={(e: any) => setAnnCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 text-xs focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="challenges">Challenges</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="rules">Rules</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isPostingAnn}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Broadcast Notification
            </Button>
          </form>

          {/* Active Announcements List */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 uppercase">
              ACTIVE BROADCAST NOTIFICATIONS ({announcementsList.length})
            </h3>
            {announcementsList.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono">No broadcasts active.</p>
            ) : (
              <div className="space-y-2">
                {announcementsList.map((ann) => (
                  <div key={ann.id} className="p-3 rounded bg-[#0b0d13] border border-zinc-800 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{ann.title}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono ${
                          ann.priority === 'urgent' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' :
                          ann.priority === 'update' ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {ann.priority}
                        </span>
                        <span className="text-zinc-500 text-[10px] font-mono">{ann.timestamp}</span>
                      </div>
                      <p className="text-zinc-400 mt-1">{ann.content}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Delete Broadcast"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab: Squads & Roster Management */}
      {activeTab === 'teams' && adminTeam && (
        <div className="space-y-6 max-w-4xl font-mono text-xs">
          {/* Squad Header Card */}
          <Card className="p-6 bg-[#10121a] border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase">MANAGED SQUAD</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{adminTeam.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-zinc-400">
                  <span>Invite Token: <code className="text-cyan-300">{adminTeam.inviteCode}</code></span>
                  <span>•</span>
                  <span>Rank: <strong className="text-amber-400">#{adminTeam.rank}</strong></span>
                  <span>•</span>
                  <span>Score: <strong className="text-blue-400">{adminTeam.score} pts</strong></span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAdminResetTeam}
                className="border-rose-900/50 text-rose-300 hover:bg-rose-950/30"
              >
                Reset Squad
              </Button>
            </div>

            {/* Score Calibration Form */}
            <form onSubmit={handleAdminUpdateScore} className="mt-4 p-4 rounded bg-[#0b0d13] border border-zinc-800/80 space-y-3">
              <span className="text-zinc-400 font-semibold block text-[11px]">CALIBRATE SQUAD SCORE / POINTS</span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={adminNewScore}
                  onChange={(e) => setAdminNewScore(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-[#121520] border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 w-44"
                />
                <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500 text-white">
                  Update Points
                </Button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setAdminNewScore(prev => prev + 100)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminNewScore(prev => prev + 250)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                  >
                    +250
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminNewScore(prev => Math.max(0, prev - 100))}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-[11px]"
                  >
                    -100
                  </button>
                </div>
              </div>
            </form>

            {/* Member Roster Table */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold block text-[11px]">OPERATOR ROSTER ({adminTeam.members.length}/4)</span>
              </div>
              <div className="overflow-x-auto rounded border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0d13] text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">OPERATOR</th>
                      <th className="py-2.5 px-3">HANDLE</th>
                      <th className="py-2.5 px-3">ROLE</th>
                      <th className="py-2.5 px-3">SOLVES</th>
                      <th className="py-2.5 px-3">CONTRIBUTION</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {adminTeam.members.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">{m.displayName}</td>
                        <td className="py-2.5 px-3 text-zinc-400">@{m.username}</td>
                        <td className="py-2.5 px-3">
                          {m.isCaptain ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                              CAPTAIN
                            </span>
                          ) : (
                            <span className="text-zinc-500">OPERATOR</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">{m.solvesCount}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-400">{m.pointsContributed} pts</td>
                        <td className="py-2.5 px-3 text-right">
                          {!m.isCaptain && (
                            <button
                              type="button"
                              onClick={() => handleAdminKickMember(m.id, m.displayName)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/20 transition-colors"
                              title="Kick Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enrol Member Form */}
            <form onSubmit={handleAdminAddMember} className="mt-6 p-4 rounded bg-[#0b0d13] border border-zinc-800/80 space-y-3 font-sans">
              <span className="text-zinc-400 font-mono font-semibold block text-[11px] uppercase">DIRECTLY ENROL OPERATOR TO SQUAD</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Input
                  label="Display Name"
                  placeholder="e.g. Jordan Smith"
                  value={adminMemberDisplay}
                  onChange={(e) => setAdminMemberDisplay(e.target.value)}
                  required
                />
                <Input
                  label="Username"
                  placeholder="e.g. jsmith26"
                  value={adminMemberUser}
                  onChange={(e) => setAdminMemberUser(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="primary" size="sm" isLoading={isAddingTeamMember} className="bg-purple-600 hover:bg-purple-500 font-mono text-xs">
                Enrol Operator
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 3: Event State Controls */}
      {activeTab === 'event_states' && (
        <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-4 max-w-xl font-mono text-xs">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase">
              EVENT LIFECYCLE CONTROLS
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              Test and demonstrate platform UI transitions across all 5 competition phases.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {[
              { val: 'BEFORE_EVENT', label: '1. BEFORE_EVENT (Countdown to start, registration open)' },
              { val: 'LIVE', label: '2. LIVE (6-hour active countdown, submissions active)' },
              { val: 'ENDING_SOON', label: '3. ENDING_SOON (Final 15-minute warning banner)' },
              { val: 'FINISHED', label: '4. FINISHED (Submissions locked, frozen standings)' },
              { val: 'MAINTENANCE', label: '5. MAINTENANCE (Cluster maintenance advisory)' },
            ].map(item => (
              <button
                key={item.val}
                onClick={() => setStatus(item.val as EventStatus)}
                className={`w-full text-left p-3 rounded border transition-colors flex items-center justify-between ${
                  status === item.val
                    ? 'bg-purple-950/60 border-purple-600 text-purple-200 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{item.label}</span>
                {status === item.val && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 4: Competition Timer & Clock Controls */}
      {activeTab === 'timer' && (
        <div className="space-y-6 max-w-4xl">
          {/* Master Synchronized Clock Card */}
          <Card className="p-6 bg-[#10121a] border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="font-mono text-xs text-purple-400 uppercase tracking-wider block">LIVE PLATFORM TELEMETRY</span>
                <h2 className="text-xl font-bold text-white mt-0.5">Master Competition Clock</h2>
                <p className="text-xs text-zinc-400 mt-1">Changes applied here take immediate effect across all participant dashboards, navbar headers, and countdown timers.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status === 'LIVE' ? 'success' : status === 'ENDING_SOON' ? 'warning' : 'neutral'} dot={status === 'LIVE'}>
                  {status}
                </Badge>
                {isPaused && (
                  <Badge variant="danger" dot>
                    COUNTDOWN PAUSED
                  </Badge>
                )}
              </div>
            </div>

            {/* Giant Digital Readout */}
            <div className="my-8 text-center p-8 rounded-lg bg-[#08090e] border border-zinc-800/80 font-mono">
              <span className="text-zinc-500 text-xs block uppercase tracking-widest mb-3">
                CURRENT TIME REMAINING
              </span>
              <div className="text-5xl sm:text-7xl font-bold tracking-widest text-zinc-100 flex items-center justify-center gap-2 sm:gap-4">
                <span className="bg-zinc-900/90 px-4 py-2 rounded border border-zinc-800 shadow-inner">{timeRemaining.hours}</span>
                <span className="text-purple-400 animate-pulse">:</span>
                <span className="bg-zinc-900/90 px-4 py-2 rounded border border-zinc-800 shadow-inner">{timeRemaining.minutes}</span>
                <span className="text-purple-400 animate-pulse">:</span>
                <span className="bg-zinc-900/90 px-4 py-2 rounded border border-zinc-800 shadow-inner">{timeRemaining.seconds}</span>
              </div>
              <span className="text-zinc-500 text-xs block mt-4">
                Format: [HOURS : MINUTES : SECONDS] • Global Synced State
              </span>
            </div>

            {/* Quick Extension / Subtraction Buttons */}
            <div className="space-y-3 pt-2">
              <span className="font-mono text-xs text-zinc-400 block font-semibold">QUICK TIME EXTENSIONS & MODIFIERS:</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAdjustMinutes(15)} className="font-mono text-xs border-purple-800/40 hover:bg-purple-950/30 text-purple-200">
                  +15 Minutes
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAdjustMinutes(30)} className="font-mono text-xs border-purple-800/40 hover:bg-purple-950/30 text-purple-200">
                  +30 Minutes
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAdjustMinutes(60)} className="font-mono text-xs border-blue-800/40 hover:bg-blue-950/30 text-blue-200">
                  +1 Hour
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAdjustMinutes(120)} className="font-mono text-xs border-blue-800/40 hover:bg-blue-950/30 text-blue-200">
                  +2 Hours
                </Button>
                <span className="text-zinc-700 hidden sm:inline">|</span>
                <Button variant="outline" size="sm" onClick={() => handleAdjustMinutes(-15)} className="font-mono text-xs text-amber-400 border-amber-900/40 hover:bg-amber-950/20">
                  -15 Minutes
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAdjustMinutes(-30)} className="font-mono text-xs text-amber-400 border-amber-900/40 hover:bg-amber-950/20">
                  -30 Minutes
                </Button>
              </div>
            </div>
          </Card>

          {/* Form to Set Custom Exact Timer Duration & Emergency Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-[#10121a] border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100 font-mono uppercase mb-1">
                Set Exact Countdown Duration
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Input custom hours, minutes, and seconds to set the countdown clock.
              </p>

              <form onSubmit={handleApplyCustomTimer} className="space-y-4">
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Hours</label>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={timerHours}
                      onChange={(e) => setTimerHours(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Minutes</label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Seconds</label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-2 font-mono">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
                    <input
                      type="checkbox"
                      checked={autoDistributeWaves}
                      onChange={(e) => setAutoDistributeWaves(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700 text-purple-600 focus:ring-0"
                    />
                    <span>Auto-align question drops across this CTF duration</span>
                  </label>
                  {autoDistributeWaves && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300 pl-5">
                      <span>Total waves:</span>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={ctfWaveCount}
                        onChange={(e) => setCtfWaveCount(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                        className="w-14 px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-center text-white font-bold"
                      />
                      <span className="text-[10px] text-zinc-500">(drops will space out evenly)</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={isApplyingTimer}
                  className="w-full bg-purple-600 hover:bg-purple-500 font-mono"
                >
                  Apply Custom Timer
                </Button>
              </form>
            </Card>

            {/* Emergency & State Controls Card */}
            <Card className="p-6 bg-[#10121a] border-zinc-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 font-mono uppercase mb-1">
                  Clock Controls & Emergency Actions
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Emergency controls for freezing the competition, ending the event, or resetting.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <button
                    onClick={handleTogglePause}
                    type="button"
                    className={`w-full p-3 rounded border text-left flex items-center justify-between transition-colors ${
                      isPaused 
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{isPaused ? '▶ Resume Countdown Clock' : '⏸ Pause / Freeze Countdown Clock'}</span>
                    <span className="text-[10px] text-zinc-500">{isPaused ? 'Paused' : 'Active'}</span>
                  </button>

                  <button
                    onClick={handleExpireNow}
                    type="button"
                    className="w-full p-3 rounded border border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-left flex items-center justify-between transition-colors"
                  >
                    <span>Expire Clock Immediately (00:00:00)</span>
                    <span className="text-[10px] text-rose-400">Lock Event</span>
                  </button>

                  <button
                    onClick={handleResetToDefault}
                    type="button"
                    className="w-full p-3 rounded border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 text-left flex items-center justify-between transition-colors"
                  >
                    <span>Reset to Default 6-Hour CTF (06:00:00)</span>
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Challenge Create / Edit Modal */}
      <Modal
        isOpen={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        title={editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
        description="Configure challenge specifications, target sandbox, and file attachments / links."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveChallenge} className="space-y-4 text-xs font-sans max-h-[75vh] overflow-y-auto pr-1">
          <Input
            label="Challenge Title"
            placeholder="e.g. Rogue Memory Carve"
            value={chTitle}
            onChange={(e) => setChTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Category</label>
              <select
                value={chCategory}
                onChange={(e: any) => setChCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 text-xs"
              >
                <option value="Web">Web</option>
                <option value="Crypto">Crypto</option>
                <option value="Forensics">Forensics</option>
                <option value="OSINT">OSINT</option>
                <option value="Reverse Engineering">Reverse Engineering</option>
                <option value="Pwn">Pwn</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Difficulty</label>
              <select
                value={chDifficulty}
                onChange={(e: any) => setChDifficulty(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 text-xs"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Insane">Insane</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Points</label>
              <Input
                type="number"
                value={chPoints}
                onChange={(e) => setChPoints(Number(e.target.value))}
                min={50}
                max={500}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Source Track</label>
              <select
                value={chSource}
                onChange={(e: any) => setChSource(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 text-xs"
              >
                <option value="ACM">ACM</option>
                <option value="NEAR.AI">NEAR.AI</option>
              </select>
            </div>
          </div>

          {/* Progressive Release Wave Selector */}
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-1">
            <label className="block text-xs font-semibold text-purple-200 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              RELEASE WAVE / HOURLY QUESTION DROP SCHEDULE
            </label>
            <select
              value={chWave}
              onChange={(e) => setChWave(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs font-mono focus:border-purple-500 focus:outline-none"
            >
              {waves.map((w) => (
                <option key={w.id} value={w.waveNumber}>
                  Wave {w.waveNumber}: {w.title} ({unlockedWaves.includes(w.waveNumber) ? 'Live' : `Scheduled`})
                </option>
              ))}
              <option value={99}>Wave 99: Vault / Hidden Reserve</option>
            </select>
            <p className="text-[11px] text-zinc-400 font-sans">
              Participants will only see and submit to this question once Wave {chWave} is unlocked (either automatically or via Admin Wave Drop).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5 font-mono">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Target Flag Answer (Secret Key Validated on Submission)
            </label>
            <Input
              placeholder="e.g. ACM{secret_flag_key}"
              value={chFlag}
              onChange={(e) => setChFlag(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Description / Markdown Brief
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500"
              placeholder="Challenge instructions, endpoints, and clues..."
              value={chDescription}
              onChange={(e) => setChDescription(e.target.value)}
            />
          </div>

          {/* Target Instance Sandbox Section */}
          <div className="p-3.5 rounded-lg bg-[#0b0d14] border border-zinc-800 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200">
                <input
                  type="checkbox"
                  checked={chHasTarget}
                  onChange={(e) => setChHasTarget(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  Enable Target Instance Sandbox (Live Service / Container)
                </span>
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                chHasTarget ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}>
                {chHasTarget ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            {chHasTarget && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <p className="text-[11px] text-zinc-400 font-sans">
                  Configure the spawned container address or service endpoint for participants to interact with.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">PROTOCOL</label>
                    <select
                      value={chTargetProtocol}
                      onChange={(e: any) => setChTargetProtocol(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="http">http (Web)</option>
                      <option value="tcp">tcp (nc / Pwn / Reverse)</option>
                      <option value="ssh">ssh (Remote Shell)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-zinc-400 mb-1">HOST / DOMAIN / IP</label>
                    <input
                      type="text"
                      placeholder="e.g. ch-web-01.sandbox.ctf.internal or 10.0.4.12"
                      value={chTargetHost}
                      onChange={(e) => setChTargetHost(e.target.value)}
                      required={chHasTarget}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">PORT</label>
                    <input
                      type="number"
                      placeholder="8080"
                      value={chTargetPort}
                      onChange={(e) => setChTargetPort(Number(e.target.value))}
                      required={chHasTarget}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded w-full text-[11px] text-cyan-300 truncate">
                      <span className="text-zinc-500 mr-1.5">PREVIEW:</span>
                      {chTargetProtocol}://{chTargetHost}:{chTargetPort}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Files & Google Drive Links Section */}
          <div className="p-3.5 rounded-lg bg-[#0b0d14] border border-zinc-800 space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                  CHALLENGE ATTACHMENTS & GOOGLE DRIVE LINKS ({chFiles.length})
                </span>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Attach files or paste Google Drive / external links. Add as many items as needed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChFiles(prev => [
                      ...prev,
                      {
                        name: 'Google Drive Resource',
                        downloadUrl: '',
                        url: '',
                        size: 'Google Drive Link',
                        isLink: true,
                        type: 'gdrive'
                      }
                    ])
                  }}
                  className="text-[11px] border-purple-800/60 text-purple-200 hover:bg-purple-950/40"
                  leftIcon={<Globe className="w-3.5 h-3.5" />}
                >
                  + Add Google Drive Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChFiles(prev => [
                      ...prev,
                      {
                        name: 'handout.zip',
                        downloadUrl: '#download',
                        size: '1.5 MB',
                        isLink: false,
                        type: 'file'
                      }
                    ])
                  }}
                  className="text-[11px] border-blue-800/60 text-blue-200 hover:bg-blue-950/40"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  + Add File / Upload
                </Button>
              </div>
            </div>

            {/* List of Attachments */}
            {chFiles.length === 0 ? (
              <div className="p-4 rounded border border-dashed border-zinc-800 text-center text-zinc-500 text-[11px] font-sans">
                No files or Google Drive links attached. Use the buttons above to add attachments.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {chFiles.map((file, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          file.isLink || file.type === 'gdrive'
                            ? 'bg-purple-950 border border-purple-800 text-purple-300'
                            : 'bg-blue-950 border border-blue-800 text-blue-300'
                        }`}>
                          {file.isLink || file.type === 'gdrive' ? 'GOOGLE DRIVE / LINK' : 'FILE'}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-semibold">Item #{idx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">TITLE / DISPLAY NAME</label>
                        <input
                          type="text"
                          placeholder={file.isLink ? "e.g. Challenge Folder (Drive)" : "e.g. source_code.zip"}
                          value={file.name}
                          onChange={(e) => {
                            const val = e.target.value
                            setChFiles(prev => prev.map((f, i) => i === idx ? { ...f, name: val } : f))
                          }}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          {file.isLink || file.type === 'gdrive' ? 'GOOGLE DRIVE / EXTERNAL LINK URL' : 'DOWNLOAD URL / PATH'}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder={file.isLink || file.type === 'gdrive' ? "https://drive.google.com/drive/folders/..." : "https://... or #download"}
                            value={file.downloadUrl || file.url || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setChFiles(prev => prev.map((f, i) => i === idx ? { ...f, downloadUrl: val, url: val } : f))
                            }}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                          />
                          {!file.isLink && (
                            <label className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono cursor-pointer shrink-0 border border-zinc-700">
                              Upload
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const localFile = e.target.files?.[0]
                                  if (localFile) {
                                    const sizeStr = (localFile.size / 1024).toFixed(1) + ' KB'
                                    setChFiles(prev => prev.map((f, i) => i === idx ? {
                                      ...f,
                                      name: localFile.name,
                                      size: sizeStr,
                                      downloadUrl: URL.createObjectURL(localFile)
                                    } : f))
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setChallengeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-purple-600 hover:bg-purple-500 font-mono">
              Save Challenge
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Custom Wave */}
      <Modal
        isOpen={showAddWaveModal}
        onClose={() => setShowAddWaveModal(false)}
        title="SCHEDULE NEW QUESTION DROP WAVE"
        size="md"
      >
        <form onSubmit={handleCreateCustomWave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              WAVE TITLE / PHASE NAME
            </label>
            <Input
              placeholder="e.g. Wave 4: Midgame Deep Dive"
              value={customWaveTitle}
              onChange={(e) => setCustomWaveTitle(e.target.value)}
              required
            />
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
              Title announced to participants when this wave goes live.
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              AUTOMATIC UNLOCK TIME (LOCAL TIME)
            </label>
            <input
              type="datetime-local"
              value={customWaveUnlockAt}
              onChange={(e) => setCustomWaveUnlockAt(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
              When this timestamp arrives, questions unlock automatically and an announcement is broadcasted.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowAddWaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-purple-600 hover:bg-purple-500 font-mono">
              Save Wave
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Wave */}
      <Modal
        isOpen={editingWave !== null}
        onClose={() => setEditingWave(null)}
        title={`EDIT WAVE ${editingWave?.waveNumber} SETTINGS`}
        size="md"
      >
        {editingWave && (
          <form onSubmit={handleUpdateWave} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">
                WAVE TITLE / NAME
              </label>
              <Input
                value={editingWave.title}
                onChange={(e) => setEditingWave({ ...editingWave, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">
                SCHEDULED UNLOCK TIME
              </label>
              <input
                type="datetime-local"
                value={editingWave.unlockAt}
                onChange={(e) => setEditingWave({ ...editingWave, unlockAt: e.target.value })}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditingWave(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" className="bg-purple-600 hover:bg-purple-500 font-mono">
                Update Wave
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  )
}
