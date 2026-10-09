import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Trophy, 
  CheckCircle2, 
  Users, 
  ChevronRight,
  Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEvent } from '../context/EventContext'
import { useCTF } from '../context/CTFContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { getDifficultyColor, getCategoryBadge } from '../lib/utils'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { status, timeRemaining } = useEvent()
  const { challenges, isLoading, solvedCount, totalChallenges, earnedPoints, unreadAnnouncementsCount } = useCTF()

  const unsolvedChallenges = challenges.filter(c => !c.isSolved).slice(0, 4)
  const recentSolves = challenges.filter(c => c.isSolved).slice(0, 3)

  const progressPercent = totalChallenges > 0 ? Math.round((solvedCount / totalChallenges) * 100) : 0

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Command Center Header Banner (Section 10) */}
      <div className="p-6 rounded-lg bg-gradient-to-r from-[#10131d] via-[#121625] to-[#0f121a] border border-zinc-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge 
                variant={status === 'LIVE' ? 'success' : status === 'ENDING_SOON' ? 'warning' : 'default'}
                dot={status === 'LIVE'}
                className="py-0.5"
              >
                {status.replace('_', ' ')}
              </Badge>
              <span className="text-zinc-600 font-mono text-xs">•</span>
              <span className="text-xs font-mono text-zinc-400">Team: <strong className="text-zinc-200">{user?.teamName || 'Solo Operator'}</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Competition Command Center
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Real-time situational telemetry for the ACM × NEAR.AI 6-Hour CTF. Monitor challenges, flag verify cycles, and team score progression.
            </p>
          </div>

          {/* Large Countdown Telemetry */}
          <div className="bg-[#090b10] border border-zinc-800 rounded-md p-4 shrink-0 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">
                TIME REMAINING
              </span>
              <span className="text-2xl font-bold text-zinc-100 tracking-wider">
                {timeRemaining.hours}:{timeRemaining.minutes}:{timeRemaining.seconds}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Stats Row (Section 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Score Card */}
        <Card className="p-4 bg-[#10121a]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono">TEAM SCORE</span>
            <Trophy className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{earnedPoints}</span>
            <span className="text-xs text-zinc-500 font-mono">pts</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Points in Play: {challenges.reduce((a, c) => a + c.points, 0)}</span>
          </div>
        </Card>

        {/* Challenges Solved */}
        <Card className="p-4 bg-[#10121a]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono">CHALLENGES SOLVED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{solvedCount}</span>
            <span className="text-xs text-zinc-500 font-mono">/ {totalChallenges}</span>
          </div>
          <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </Card>

      </div>

      {/* Main Grid: Priority / Recommended Challenges vs Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Recommended / Available Challenges */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Recommended Challenges</h2>
              <p className="text-xs text-zinc-400">Available unsolved targets awaiting your team's solution.</p>
            </div>
            <Link to="/challenges">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                View All {totalChallenges}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unsolvedChallenges.map((challenge) => {
              const diff = getDifficultyColor(challenge.difficulty)
              const cat = getCategoryBadge(challenge.category)

              return (
                <Link 
                  key={challenge.id} 
                  to={`/challenges/${challenge.slug}`}
                  className="block group"
                >
                  <Card className="p-4 bg-[#10121a] border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between h-full group-hover:bg-[#121522]">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {challenge.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {challenge.source === 'NEAR.AI' ? (
                            <Badge variant="near" size="sm">NEAR.AI</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">ACM</Badge>
                          )}
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${diff.bg} ${diff.text} ${diff.border}`}>
                            {challenge.difficulty}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                        {challenge.title}
                      </h3>
                      
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {challenge.description.replace(/```[\s\S]*?```/g, '').replace(/[\n#*]/g, ' ')}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-blue-400">{challenge.points} pts</span>
                      <span className="text-zinc-500 text-[11px]">{challenge.solvesCount} solves</span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Quick Category Summary Row */}
          <div className="p-4 rounded-lg bg-[#0e1017] border border-zinc-800/80">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 uppercase mb-3">
              CHALLENGE REPOSITORY DISTRIBUTION
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px]">WEB & NETWORK</span>
                <span className="text-zinc-200">2 Challenges (1 Solved)</span>
              </div>
              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px]">REVERSE & PWN</span>
                <span className="text-zinc-200">4 Challenges (1 Solved)</span>
              </div>
              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px]">CRYPTO & FORENSICS</span>
                <span className="text-zinc-200">4 Challenges (2 Solved)</span>
              </div>
              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-cyan-400 block text-[10px]">NEAR.AI TRACK</span>
                <span className="text-cyan-200">3 Challenges (0 Solved)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Solves & Competition Broadcast */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Team Solves Log */}
          <Card className="bg-[#10121a]">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-semibold text-zinc-200">TEAM SOLVES RECORD</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{recentSolves.length} Solved</span>
            </div>

            <div className="p-4 space-y-3">
              {recentSolves.map((ch) => (
                <div key={ch.id} className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-zinc-200">{ch.title}</p>
                    <span className="text-[10px] font-mono text-zinc-500">{ch.category}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-semibold block">+{ch.points} pts</span>
                    <span className="text-[10px] text-zinc-500">Solved</span>
                  </div>
                </div>
              ))}

              {user?.role === 'organizer' && (
                <Link to="/team" className="block text-center pt-2">
                  <span className="text-xs text-blue-400 hover:underline">View Complete Team Activity →</span>
                </Link>
              )}
            </div>
          </Card>

          {/* Quick Notice Card */}
          <Card className="p-4 bg-[#10121a] border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-400" />
                ANNOUNCEMENT DESK
              </span>
              {unreadAnnouncementsCount > 0 && (
                <Badge variant="info" size="sm">{unreadAnnouncementsCount} unread</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-300 font-medium">
              Model Guardrail Bypass: prompt submissions rate-limited to 6/min.
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Check announcements tab for recent hints, updates, and organizer alerts.
            </p>
            <div className="mt-3 pt-3 border-t border-zinc-800/60">
              <Link to="/announcements">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Open Announcements
                </Button>
              </Link>
            </div>
          </Card>

        </div>

      </div>

    </div>
  )
}
