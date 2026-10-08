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
  Info
} from 'lucide-react'
import { useCTF } from '../context/CTFContext'
import { useEvent } from '../context/EventContext'
import { Challenge, Hint } from '../types'
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
  const { challenges, submitFlag, unlockHint, startInstance, stopInstance } = useCTF()
  const { status: eventStatus } = useEvent()
  const { toast } = useToast()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      {/* Files Attachments Section (Section 12) */}
      {challenge.files && challenge.files.length > 0 && (
        <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-3">
          <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            CHALLENGE ATTACHMENTS ({challenge.files.length})
          </h2>
          <div className="space-y-2">
            {challenge.files.map((file, idx) => (
              <div 
                key={idx}
                className="p-3 rounded bg-[#0b0d14] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-semibold text-zinc-200 truncate">{file.name}</span>
                    <span className="text-zinc-500">({file.size})</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    SHA256: <span className="text-zinc-400">{file.sha256}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(file.sha256, 'SHA-256 Hash')}
                    className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 transition-colors"
                    title="Copy SHA-256"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      toast({
                        type: 'info',
                        title: 'Download Initiated',
                        description: `Downloading verified artifact: ${file.name}`
                      })
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Target Container Instance (Section 12) */}
      {challenge.target && (
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

    </div>
  )
}
