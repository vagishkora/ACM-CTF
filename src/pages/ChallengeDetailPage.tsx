import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Terminal, 
  Server, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Clock, 
  Play, 
  Square, 
  Lock, 
  Key,
  ShieldCheck,
  FileCode,
  Info,
  Edit,
  Trash2,
  ShieldAlert,
  Eye,
  EyeOff,
  Globe,
  ExternalLink,
  Paperclip,
  Plus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCTF } from '../context/CTFContext'
import { useEvent } from '../context/EventContext'
import { Challenge, Hint, ChallengeCategory, ChallengeDifficulty, ChallengeSource, FileAttachment } from '../types'
import { challengeService } from '../services/challengeService'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { useToast } from '../components/ui/Toast'
import { getDifficultyColor, getCategoryBadge } from '../lib/utils'

export const ChallengeDetailPage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { challenges, submitFlag, unlockHint, startInstance, stopInstance, refreshChallenges } = useCTF()
  const { status: eventStatus } = useEvent()
  const { toast } = useToast()

  const isOrganizer = user?.role === 'organizer'

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Organizer Edit & Superpower State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showSecretFlag, setShowSecretFlag] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState<ChallengeCategory>('Web')
  const [editDifficulty, setEditDifficulty] = useState<ChallengeDifficulty>('Easy')
  const [editPoints, setEditPoints] = useState(100)
  const [editSource, setEditSource] = useState<ChallengeSource>('ACM')
  const [editAuthor, setEditAuthor] = useState('')
  const [editFlag, setEditFlag] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFiles, setEditFiles] = useState<FileAttachment[]>([])
  const [editHasTarget, setEditHasTarget] = useState(false)
  const [editTargetHost, setEditTargetHost] = useState('')
  const [editTargetPort, setEditTargetPort] = useState(8080)
  const [editTargetProtocol, setEditTargetProtocol] = useState<'http' | 'tcp' | 'ssh'>('http')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Flag Submission State
  const [flagInput, setFlagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    status: 'correct' | 'incorrect' | 'already_solved' | 'rate_limited'
    message: string
    pointsAwarded: number
  } | null>(null)

  // Target instance state
  const [isStartingInstance, setIsStartingInstance] = useState(false)
  const [isStoppingInstance, setIsStoppingInstance] = useState(false)

  // Hint unlock modal
  const [pendingHint, setPendingHint] = useState<Hint | null>(null)
  const [isUnlockingHint, setIsUnlockingHint] = useState(false)

  // Load challenge
  useEffect(() => {
    if (!paramId) return
    setIsLoading(true)
    setError(null)
    setSubmissionFeedback(null)

    challengeService.getChallengeByIdOrSlug(paramId)
      .then((data) => {
        setChallenge(data)
      })
      .catch((err) => {
        setError(err.message || 'Challenge not found')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [paramId, challenges])

  // Navigation: prev / next
  const currentIndex = challenges.findIndex(c => c.id === challenge?.id || c.slug === challenge?.slug)
  const prevChallenge = currentIndex > 0 ? challenges[currentIndex - 1] : null
  const nextChallenge = currentIndex >= 0 && currentIndex < challenges.length - 1 ? challenges[currentIndex + 1] : null

  // Organizer Superpower Actions
  const handleOpenEdit = () => {
    if (!challenge) return
    setEditTitle(challenge.title)
    setEditCategory(challenge.category)
    setEditDifficulty(challenge.difficulty)
    setEditPoints(challenge.points)
    setEditSource(challenge.source)
    setEditAuthor(challenge.author)
    setEditFlag(challengeService.getFlag(challenge.id))
    setEditDescription(challenge.description)
    setEditFiles(challenge.files ? [...challenge.files] : [])
    setEditHasTarget(!!(challenge.target && challenge.target.host))
    setEditTargetHost(challenge.target?.host || '')
    setEditTargetPort(challenge.target?.port || 8080)
    setEditTargetProtocol(challenge.target?.protocol || 'http')
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || !editTitle.trim()) return

    setIsSavingEdit(true)
    try {
      const targetObj = editHasTarget && editTargetHost.trim() ? {
        id: challenge.target?.id || `target-${challenge.id}`,
        host: editTargetHost.trim(),
        port: Number(editTargetPort) || 8080,
        protocol: editTargetProtocol,
        status: challenge.target?.status || ('stopped' as const)
      } : undefined

      const updated = await challengeService.updateChallenge(challenge.id, {
        title: editTitle,
        category: editCategory,
        difficulty: editDifficulty,
        points: Number(editPoints),
        source: editSource,
        author: editAuthor,
        description: editDescription,
        files: editFiles,
        target: targetObj
      }, editFlag)
      setChallenge(updated)
      await refreshChallenges()
      toast({
        type: 'success',
        title: 'Challenge Updated',
        description: `Saved changes to "${editTitle}".`
      })
      setEditModalOpen(false)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteChallenge = async () => {
    if (!challenge) return
    if (!window.confirm(`Are you sure you want to permanently delete "${challenge.title}"?`)) return
    await challengeService.deleteChallenge(challenge.id)
    await refreshChallenges()
    toast({
      type: 'info',
      title: 'Challenge Deleted',
      description: `Removed "${challenge.title}".`
    })
    navigate('/challenges')
  }

  const handleToggleSolvedForAdmin = async () => {
    if (!challenge) return
    const newSolved = !challenge.isSolved
    const updated = await challengeService.updateChallenge(challenge.id, {
      isSolved: newSolved,
      solvesCount: newSolved ? challenge.solvesCount + 1 : Math.max(0, challenge.solvesCount - 1)
    })
    setChallenge(updated)
    await refreshChallenges()
    toast({
      type: 'info',
      title: newSolved ? 'Marked Solved' : 'Marked Unsolved',
      description: `Challenge solve status updated for testing.`
    })
  }

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || !flagInput.trim()) return

    if (eventStatus === 'FINISHED') {
      toast({
        type: 'error',
        title: 'Competition Finished',
        description: 'The CTF has concluded and flag submissions are locked.'
      })
      return
    }

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    try {
      const result = await submitFlag(challenge.id, flagInput)
      setSubmissionFeedback(result)

      if (result.status === 'correct') {
        toast({
          type: 'success',
          title: 'Flag Accepted!',
          description: `+${result.pointsAwarded} points recorded for your team.`
        })
        setChallenge(prev => prev ? { ...prev, isSolved: true, solvesCount: prev.solvesCount + 1 } : null)
      } else if (result.status === 'incorrect') {
        toast({
          type: 'error',
          title: 'Incorrect Flag',
          description: 'The submitted flag does not match the expected challenge secret.'
        })
      } else if (result.status === 'rate_limited') {
        toast({
          type: 'error',
          title: 'Submission Rate Limited',
          description: result.message
        })
      }
    } catch (err: any) {
      setSubmissionFeedback({
        status: 'incorrect',
        message: err.message || 'Failed to submit flag due to a network anomaly.',
        pointsAwarded: 0
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      type: 'info',
      title: 'Copied to Clipboard',
      description: `${label} copied.`
    })
  }

  const handleToggleInstance = async () => {
    if (!challenge) return

    if (challenge.target?.status === 'running') {
      setIsStoppingInstance(true)
      try {
        const updated = await stopInstance(challenge.id)
        setChallenge(updated)
        toast({ type: 'info', title: 'Instance Terminated', description: 'Target container stopped.' })
      } finally {
        setIsStoppingInstance(false)
      }
    } else {
      setIsStartingInstance(true)
      try {
        const updated = await startInstance(challenge.id)
        setChallenge(updated)
        toast({ type: 'success', title: 'Instance Online', description: 'Target container spawned.' })
      } finally {
        setIsStartingInstance(false)
      }
    }
  }

  const handleConfirmUnlockHint = async () => {
    if (!challenge || !pendingHint) return
    setIsUnlockingHint(true)
    try {
      await unlockHint(challenge.id, pendingHint.id)
      setChallenge(prev => {
        if (!prev) return null
        return {
          ...prev,
          hints: prev.hints.map(h => h.id === pendingHint.id ? { ...h, isUnlocked: true } : h)
        }
      })
      toast({
        type: 'success',
        title: 'Hint Unlocked',
        description: `Hint #${pendingHint.order} is now readable.`
      })
      setPendingHint(null)
    } finally {
      setIsUnlockingHint(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Challenge Not Found"
          message={error || "The requested challenge ID does not exist or has been unpublished."}
          onRetry={() => navigate('/challenges')}
        />
      </div>
    )
  }

  if (challenge.isLocked && user?.role !== 'organizer') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-mono">
        <div className="p-8 rounded-xl bg-[#10121a] border border-amber-900/50 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-300 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-100">CHALLENGE IS CURRENTLY LOCKED</h2>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            "{challenge.title}" is scheduled for release in <strong className="text-amber-300">Wave {challenge.releaseWave || 2}</strong>. It will automatically unlock when that wave of the competition begins.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/challenges')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="font-mono text-xs"
            >
              Back to Available Challenges
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const diff = getDifficultyColor(challenge.difficulty)
  const cat = getCategoryBadge(challenge.category)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back and Navigation Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-800">
        <Link 
          to="/challenges"
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO CHALLENGES</span>
        </Link>

        <div className="flex items-center gap-2">
          {prevChallenge && (
            <Link
              to={`/challenges/${prevChallenge.slug}`}
              className="flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
              title={prevChallenge.title}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PREV</span>
            </Link>
          )}
          <span className="text-zinc-600">|</span>
          {nextChallenge && (
            <Link
              to={`/challenges/${nextChallenge.slug}`}
              className="flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
              title={nextChallenge.title}
            >
              <span className="hidden sm:inline">NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Organizer Superpowers Control Banner */}
      {isOrganizer && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-950/40 via-[#141221] to-[#0d0f17] border border-purple-800/40 font-mono text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-700/60 text-purple-200 font-bold flex items-center gap-1.5 text-[10px]">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
                ORGANIZER PRIVILEGE MODE
              </span>
              <span className="text-zinc-400 text-[11px]">Direct on-page challenge controls</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={handleOpenEdit}
                className="border-purple-800/60 text-purple-200 hover:bg-purple-900/40"
              >
                Edit Challenge
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleDeleteChallenge}
                className="border-rose-800/60 text-rose-300 hover:bg-rose-950/40"
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-900/30 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">SECRET FLAG:</span>
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-purple-900/40 font-mono">
                <Key className="w-3 h-3 text-amber-400" />
                <span className="text-amber-200 font-semibold select-all">
                  {showSecretFlag ? challengeService.getFlag(challenge.id) : '••••••••••••••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecretFlag(!showSecretFlag)}
                  className="text-zinc-400 hover:text-white ml-1"
                  title={showSecretFlag ? 'Hide Flag' : 'Reveal Flag'}
                >
                  {showSecretFlag ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(challengeService.getFlag(challenge.id), 'Flag')}
                  className="text-zinc-400 hover:text-white ml-1"
                  title="Copy Flag"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSolvedForAdmin}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-4 text-[10px]"
            >
              Toggle Test Solve State ({challenge.isSolved ? 'Currently Solved' : 'Currently Unsolved'})
            </button>
          </div>
        </div>
      )}

      {/* Challenge Header Card (Section 12) */}
      <Card className="p-6 bg-[#10121a] border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                {challenge.category}
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${diff.bg} ${diff.text} ${diff.border}`}>
                {challenge.difficulty}
              </span>
              {challenge.source === 'NEAR.AI' ? (
                <Badge variant="near">NEAR.AI Track</Badge>
              ) : (
                <Badge variant="neutral">ACM</Badge>
              )}
              <span className="text-zinc-500 font-mono text-xs">
                Author: {challenge.author}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {challenge.title}
            </h1>

            <p className="text-xs font-mono text-zinc-500">
              ID: {challenge.id} • {challenge.solvesCount} solves recorded
            </p>
          </div>

          {/* Points & Solved status */}
          <div className="sm:text-right shrink-0">
            <div className="text-3xl font-bold font-mono text-blue-400">
              {challenge.points} <span className="text-xs text-zinc-500">pts</span>
            </div>
            {challenge.isSolved ? (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SOLVED BY TEAM
              </div>
            ) : (
              <span className="mt-2 inline-block font-mono text-xs text-zinc-500">
                UNSOLVED
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Challenge Description (Rendered Markdown Safely) */}
      <Card className="p-6 bg-[#10121a] border-zinc-800">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          CHALLENGE BRIEF
        </h2>
        <div className="text-sm text-zinc-200 leading-relaxed space-y-4">
          {challenge.description.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('```')) {
              const codeClean = paragraph.replace(/```[a-z]*\n?/g, '').replace(/```/g, '')
              return (
                <div key={idx} className="relative group my-3">
                  <pre className="p-3.5 rounded bg-[#090b10] border border-zinc-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                    {codeClean}
                  </pre>
                  <button
                    onClick={() => handleCopy(codeClean, 'Code snippet')}
                    className="absolute top-2 right-2 p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                    title="Copy snippet"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
            return <p key={idx}>{paragraph}</p>
          })}
        </div>
      </Card>

      {/* Files Attachments & Google Drive Links Section */}
      {challenge.files && challenge.files.length > 0 && (
        <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-purple-400" />
              CHALLENGE ATTACHMENTS & LINKS ({challenge.files.length})
            </h2>
          </div>
          <div className="space-y-2">
            {challenge.files.map((file, idx) => {
              const isDriveOrLink = file.isLink || file.type === 'gdrive' || file.type === 'link' || 
                (file.downloadUrl && (file.downloadUrl.includes('drive.google.com') || file.downloadUrl.startsWith('http://') || file.downloadUrl.startsWith('https://')))
              const fileUrl = file.downloadUrl || file.url || '#'

              return (
                <div 
                  key={idx}
                  className="p-3.5 rounded bg-[#0b0d14] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDriveOrLink ? (
                        <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <span className="font-semibold text-zinc-200 truncate">{file.name}</span>
                      {file.size && (
                        <span className="text-zinc-500 text-[11px]">({file.size})</span>
                      )}
                      {isDriveOrLink && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950/80 border border-purple-800/60 text-purple-300 font-bold uppercase tracking-wider">
                          {file.downloadUrl?.includes('drive.google.com') || file.type === 'gdrive' ? 'Google Drive' : 'External Link'}
                        </span>
                      )}
                    </div>
                    {file.sha256 ? (
                      <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1.5">
                        <span>SHA256:</span>
                        <span className="text-zinc-400 font-mono select-all">{file.sha256}</span>
                      </div>
                    ) : isDriveOrLink && fileUrl !== '#' ? (
                      <div className="text-[10px] text-zinc-500 truncate font-mono">
                        {fileUrl}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file.sha256 && (
                      <button
                        onClick={() => handleCopy(file.sha256!, 'SHA-256 Hash')}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 transition-colors"
                        title="Copy SHA-256"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isDriveOrLink ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {file.downloadUrl?.includes('drive.google.com') || file.type === 'gdrive' ? 'Open Drive' : 'Open Link'}
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Download className="w-3.5 h-3.5 text-blue-400" />}
                        onClick={() => {
                          if (fileUrl && fileUrl !== '#') {
                            const link = document.createElement('a')
                            link.href = fileUrl
                            link.download = file.name
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }
                          toast({
                            type: 'info',
                            title: 'Download Initiated',
                            description: `Downloading verified artifact: ${file.name}`
                          })
                        }}
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Target Container Instance (Only if target host is configured) */}
      {challenge.target && challenge.target.host && challenge.target.host.trim() !== '' && (
        <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                TARGET INSTANCE SANDBOX
              </h2>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              challenge.target.status === 'running' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}>
              {challenge.target.status.toUpperCase()}
            </span>
          </div>

          {challenge.target.status === 'running' ? (
            <div className="p-3.5 rounded bg-[#090b10] border border-emerald-500/30 font-mono text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px]">SERVICE ENDPOINT:</span>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold mt-0.5">
                    <span>{challenge.target.protocol}://{challenge.target.host}:{challenge.target.port}</span>
                    <button
                      onClick={() => handleCopy(`${challenge.target?.host}:${challenge.target?.port}`, 'Instance address')}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-zinc-400 text-[11px]">Expires in 44m 12s</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={isStoppingInstance}
                  leftIcon={<Square className="w-3.5 h-3.5" />}
                  onClick={handleToggleInstance}
                >
                  Terminate Instance
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded bg-[#0b0d14] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-zinc-400">
                This challenge requires an isolated runtime instance container. Containers run with a 45-minute TTL.
              </p>
              <Button
                size="sm"
                variant="primary"
                isLoading={isStartingInstance}
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={handleToggleInstance}
              >
                Spawn Instance
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Hints Accordion / Cards (Section 12) */}
      {challenge.hints && challenge.hints.length > 0 && (
        <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              PROGRESSIVE HINTS ({challenge.hints.length})
            </h2>
            <span className="text-[11px] text-zinc-500">Unlocking deductions are final</span>
          </div>

          <div className="space-y-2">
            {challenge.hints.map((hint) => (
              <div 
                key={hint.id}
                className="p-3.5 rounded bg-[#0b0d14] border border-zinc-800/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-semibold text-zinc-200">Hint #{hint.order}</span>
                  </div>
                  {hint.isUnlocked ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      UNLOCKED
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1 h-7"
                      leftIcon={<Lock className="w-3 h-3 text-amber-400" />}
                      onClick={() => setPendingHint(hint)}
                    >
                      Unlock (-{hint.cost} pts)
                    </Button>
                  )}
                </div>

                {hint.isUnlocked ? (
                  <p className="text-zinc-300 leading-relaxed font-sans pt-1 border-t border-zinc-800/60">
                    {hint.content}
                  </p>
                ) : (
                  <p className="text-zinc-500 italic text-[11px]">
                    Hint content is encrypted. Click unlock to reveal hint guidance.
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Flag Submission Box (Section 12) */}
      <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-4">
        <div>
          <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
            SUBMIT SECRET FLAG
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Expected format: <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 font-mono">ACM&#123;...&#125;</code>
          </p>
        </div>

        {submissionFeedback && (
          <div className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
            submissionFeedback.status === 'correct' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
              : submissionFeedback.status === 'already_solved'
              ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            {submissionFeedback.status === 'correct' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {submissionFeedback.status === 'correct' ? 'Challenge Solved!' : 
                 submissionFeedback.status === 'already_solved' ? 'Already Solved' : 'Submission Rejected'}
              </p>
              <p className="mt-0.5 text-zinc-300">{submissionFeedback.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleFlagSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="ACM{flag_string_here}"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              disabled={challenge.isSolved || isSubmitting}
              className="font-mono text-xs"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={challenge.isSolved || !flagInput.trim()}
            className="shrink-0 font-mono text-xs"
          >
            {challenge.isSolved ? 'Already Solved' : 'Submit Flag'}
          </Button>
        </form>

        {challenge.isSolved && (
          <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Flag verified and credited to team score.
          </p>
        )}
      </Card>

      {/* Hint Unlock Confirmation Modal */}
      <Modal
        isOpen={!!pendingHint}
        onClose={() => setPendingHint(null)}
        title="Unlock Challenge Hint"
        description={`Unlocking Hint #${pendingHint?.order}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-zinc-300">
            Unlocking this hint will deduct <strong className="text-amber-400 font-mono">{pendingHint?.cost} points</strong> from the potential solve reward for this challenge.
          </p>
          <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            Are you sure you want to proceed? This action cannot be reversed.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPendingHint(null)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              isLoading={isUnlockingHint}
              onClick={handleConfirmUnlockHint}
            >
              Confirm Unlock (-{pendingHint?.cost} pts)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Organizer Edit Challenge Modal */}
      {isOrganizer && challenge && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`EDIT CHALLENGE: ${challenge.title}`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-sans text-zinc-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Challenge Title"
                placeholder="e.g. Memory Stack Pivot 2026"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />

              <Input
                label="Author / Contributor"
                placeholder="e.g. ACM CTF Team"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e: any) => setEditCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  {['Web', 'Crypto', 'Forensics', 'OSINT', 'Reverse Engineering', 'Pwn', 'Miscellaneous'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Difficulty</label>
                <select
                  value={editDifficulty}
                  onChange={(e: any) => setEditDifficulty(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  {['Easy', 'Medium', 'Hard', 'Insane'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Points</label>
                <input
                  type="number"
                  min="25"
                  max="1000"
                  step="25"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Math.max(25, parseInt(e.target.value) || 25))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Curated Source</label>
                <select
                  value={editSource}
                  onChange={(e: any) => setEditSource(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="ACM">ACM</option>
                  <option value="NEAR.AI">NEAR.AI</option>
                </select>
              </div>
            </div>

            {/* Target Secret Flag */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Target Flag Secret (Validated when users submit)
              </label>
              <Input
                placeholder="e.g. ACM{secret_flag_string}"
                value={editFlag}
                onChange={(e) => setEditFlag(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Challenge Description & Brief
              </label>
              <textarea
                rows={5}
                className="w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                placeholder="Describe challenge context, endpoints, and clues..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
            </div>

            {/* Target Instance Sandbox Settings */}
            <div className="p-3.5 rounded bg-zinc-950/70 border border-zinc-800 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                    TARGET INSTANCE SANDBOX
                  </span>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    For dynamic challenges (Web, Pwn) that need an isolated container instance.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editHasTarget}
                    onChange={(e) => setEditHasTarget(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-purple-600 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-zinc-300">
                    {editHasTarget ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {editHasTarget && (
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">PROTOCOL</label>
                      <select
                        value={editTargetProtocol}
                        onChange={(e: any) => setEditTargetProtocol(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                      >
                        <option value="http">http</option>
                        <option value="tcp">tcp</option>
                        <option value="ssh">ssh</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">HOST / DOMAIN</label>
                      <input
                        type="text"
                        placeholder="e.g. ctf-box.acm.org"
                        value={editTargetHost}
                        onChange={(e) => setEditTargetHost(e.target.value)}
                        required={editHasTarget}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">PORT</label>
                      <input
                        type="number"
                        placeholder="8080"
                        value={editTargetPort}
                        onChange={(e) => setEditTargetPort(parseInt(e.target.value) || 8080)}
                        required={editHasTarget}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                    Endpoint preview:{' '}
                    <span className="text-emerald-400 font-semibold">
                      {editTargetProtocol}://{editTargetHost || 'host'}:{editTargetPort}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Challenge Attachments & Google Drive Links */}
            <div className="p-3.5 rounded bg-zinc-950/70 border border-zinc-800 space-y-3 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                    CHALLENGE ATTACHMENTS & GOOGLE DRIVE LINKS ({editFiles.length})
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
                      setEditFiles(prev => [
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
                      setEditFiles(prev => [
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

              {editFiles.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-zinc-800 text-center text-zinc-500 text-[11px] font-sans">
                  No files or Google Drive links attached. Use the buttons above to add attachments.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editFiles.map((file, idx) => (
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
                          onClick={() => setEditFiles(prev => prev.filter((_, i) => i !== idx))}
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
                              setEditFiles(prev => prev.map((f, i) => i === idx ? { ...f, name: val } : f))
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
                                setEditFiles(prev => prev.map((f, i) => i === idx ? { ...f, downloadUrl: val, url: val } : f))
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
                                      setEditFiles(prev => prev.map((f, i) => i === idx ? {
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingEdit}
                className="bg-purple-600 hover:bg-purple-500 text-white font-mono"
              >
                Save Challenge
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
