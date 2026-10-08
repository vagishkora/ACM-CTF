import React, { useState } from 'react'
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
  RotateCcw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEvent } from '../context/EventContext'
import { useCTF } from '../context/CTFContext'
import { challengeService } from '../services/challengeService'
import { announcementService } from '../services/announcementService'
import { Challenge, ChallengeCategory, ChallengeDifficulty, ChallengeSource, EventStatus } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

export const AdminPage: React.FC = () => {
  const { user } = useAuth()
  const { status, setStatus, resetEvent } = useEvent()
  const { challenges, refreshChallenges } = useCTF()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'challenges' | 'announcements' | 'event_states'>('challenges')

  // Create/Edit Challenge Modal
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [chTitle, setChTitle] = useState('')
  const [chCategory, setChCategory] = useState<ChallengeCategory>('Web')
  const [chDifficulty, setChDifficulty] = useState<ChallengeDifficulty>('Easy')
  const [chPoints, setChPoints] = useState(100)
  const [chSource, setChSource] = useState<ChallengeSource>('ACM')
  const [chDescription, setChDescription] = useState('')

  // New Announcement
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPriority, setAnnPriority] = useState<'urgent' | 'update' | 'info'>('update')
  const [annCategory, setAnnCategory] = useState<any>('general')
  const [isPostingAnn, setIsPostingAnn] = useState(false)

  // Handlers
  const handleOpenCreateChallenge = () => {
    setEditingChallenge(null)
    setChTitle('')
    setChCategory('Web')
    setChDifficulty('Easy')
    setChPoints(100)
    setChSource('ACM')
    setChDescription('')
    setChallengeModalOpen(true)
  }

  const handleOpenEditChallenge = (ch: Challenge) => {
    setEditingChallenge(ch)
    setChTitle(ch.title)
    setChCategory(ch.category)
    setChDifficulty(ch.difficulty)
    setChPoints(ch.points)
    setChSource(ch.source)
    setChDescription(ch.description)
    setChallengeModalOpen(true)
  }

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chTitle.trim()) return

    if (editingChallenge) {
      await challengeService.updateChallenge(editingChallenge.id, {
        title: chTitle,
        category: chCategory,
        difficulty: chDifficulty,
        points: chPoints,
        source: chSource,
        description: chDescription
      })
      toast({ type: 'success', title: 'Challenge Updated', description: `Modified "${chTitle}".` })
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
        hints: [],
        solvesCount: 0,
        isSolved: false
      }
      await challengeService.createChallenge(newCh)
      toast({ type: 'success', title: 'Challenge Created', description: `Published "${chTitle}".` })
    }

    setChallengeModalOpen(false)
    await refreshChallenges()
  }

  const handleDeleteChallenge = async (id: string, title: string) => {
    await challengeService.deleteChallenge(id)
    toast({ type: 'info', title: 'Challenge Deleted', description: `Removed "${title}".` })
    await refreshChallenges()
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitle.trim() || !annContent.trim()) return

    setIsPostingAnn(true)
    try {
      await announcementService.createAnnouncement(
        annTitle,
        annContent,
        annPriority,
        annCategory,
        'ACM Lead Organizer'
      )
      toast({ type: 'success', title: 'Broadcast Sent', description: 'Published to all participants.' })
      setAnnTitle('')
      setAnnContent('')
    } finally {
      setIsPostingAnn(false)
    }
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
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
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
          Dispatch Broadcast
        </button>
        <button
          onClick={() => setActiveTab('event_states')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'event_states'
              ? 'bg-purple-950/60 border border-purple-700/60 text-purple-200 font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Event Controls
        </button>
      </div>

      {/* Tab 1: Challenges Inventory */}
      {activeTab === 'challenges' && (
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
                  <th className="py-3 px-4 font-medium">SOLVES</th>
                  <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {challenges.map((ch) => (
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
                    <td className="py-3 px-4 text-zinc-400">
                      {ch.solvesCount}
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
        </Card>
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

      {/* Challenge Create / Edit Modal */}
      <Modal
        isOpen={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        title={editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
        description="Configure challenge specifications"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveChallenge} className="space-y-4 text-xs font-sans">
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

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Description / Markdown Brief
            </label>
            <textarea
              rows={4}
              className="w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500"
              placeholder="Challenge instructions, endpoints, and clues..."
              value={chDescription}
              onChange={(e) => setChDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setChallengeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Challenge
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
