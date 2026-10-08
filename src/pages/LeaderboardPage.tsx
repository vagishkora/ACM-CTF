import React, { useState, useEffect, useMemo } from 'react'
import { 
  Trophy, 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  RefreshCw
} from 'lucide-react'
import { leaderboardService } from '../services/leaderboardService'
import { LeaderboardEntry } from '../types'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadLeaderboard = async () => {
    try {
      const data = await leaderboardService.getLeaderboard()
      setEntries(data)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadLeaderboard()
  }

  const myTeamEntry = useMemo(() => {
    return entries.find(e => e.teamName === user?.teamName || e.isCurrentTeam)
  }, [entries, user])

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(e => e.teamName.toLowerCase().includes(q))
  }, [entries, searchQuery])

  // Top 5 teams for timeline visualization
  const topTeams = entries.slice(0, 5)

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Live Leaderboard</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              ● REALTIME SYNC
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Official team standings for the 6-hour ACM × NEAR.AI competition window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Scores
          </Button>
        </div>
      </div>

      {/* User's Team Highlight Pill (Section 13: subtle highlight) */}
      {myTeamEntry && (
        <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-sm">
              #{myTeamEntry.rank}
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">YOUR SQUAD STANDING</span>
              <span className="text-white font-semibold text-sm font-sans">{myTeamEntry.teamName}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-zinc-500 block text-[10px]">CURRENT SCORE</span>
              <span className="text-blue-400 font-bold text-base">{myTeamEntry.score} pts</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">SOLVES</span>
              <span className="text-zinc-200 font-bold text-base">{myTeamEntry.solvesCount} solved</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">LAST SOLVE</span>
              <span className="text-zinc-400">{myTeamEntry.lastSolveTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Score Progression Timeline Chart (Clean SVG Line Chart, Not a Casino) */}
      <Card className="p-6 bg-[#10121a] border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              SCORE PROGRESSION TIMELINE (TOP CONTENDERS)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">6-Hour Window</span>
        </div>

        {/* Clean Line Chart Representation */}
        <div className="h-44 w-full bg-[#0c0e15] border border-zinc-800/80 rounded p-4 relative flex flex-col justify-between font-mono text-[10px] text-zinc-500">
          <div className="flex justify-between border-b border-zinc-800/60 pb-1">
            <span>1500 pts</span>
            <span>Elapsed: 2h 18m</span>
          </div>

          {/* SVG Multi-line trajectory */}
          <div className="absolute inset-x-8 inset-y-8 pointer-events-none">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="#222634" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#222634" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#222634" strokeDasharray="3 3" />

              {/* Team 1: ByteBandits (Blue) */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points="0,95 80,80 180,55 300,30 450,10"
              />
              {/* Team 2: NullPointer (Cyan) */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                points="0,95 70,88 170,68 280,42 420,18"
              />
              {/* Team 3: KernelPanic (Purple) */}
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                points="0,95 90,82 200,60 320,38 410,25"
              />
              {/* Team 4: RootAccess (Emerald / Active User Squad) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                points="0,95 60,88 160,72 260,52 380,32"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
            <span>00:00:00 (Kick-off)</span>
            <span>02:00:00</span>
            <span>04:00:00</span>
            <span>06:00:00 (Closing)</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            ByteBandits (#1)
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            NullPointer (#2)
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            KernelPanic (#3)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            RootAccess (Your Team - #4)
          </span>
        </div>
      </Card>

      {/* Main Leaderboard Table */}
      <Card className="bg-[#10121a] border-zinc-800 overflow-hidden">
        
        {/* Table Search & Controls */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search team name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Total Enrolled: {entries.length} Teams
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0c0e15] text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-medium w-16">RANK</th>
                <th className="py-3 px-4 font-medium">TEAM NAME</th>
                <th className="py-3 px-4 font-medium text-right">SCORE</th>
                <th className="py-3 px-4 font-medium text-center">SOLVED</th>
                <th className="py-3 px-4 font-medium">MEMBERS</th>
                <th className="py-3 px-4 font-medium text-right">LAST ACTIVITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredEntries.map((team) => {
                const isMyTeam = team.teamName === user?.teamName || team.isCurrentTeam

                return (
                  <tr
                    key={team.teamId}
                    className={`transition-colors ${
                      isMyTeam 
                        ? 'bg-blue-950/25 hover:bg-blue-950/40 font-semibold' 
                        : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    {/* Rank with subtle medal/accent */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm ${
                          team.rank === 1 ? 'text-amber-400 font-bold' :
                          team.rank === 2 ? 'text-zinc-300 font-bold' :
                          team.rank === 3 ? 'text-amber-600 font-bold' :
                          'text-zinc-400'
                        }`}>
                          #{team.rank}
                        </span>
                      </div>
                    </td>

                    {/* Team Name */}
                    <td className="py-3.5 px-4 font-sans font-medium text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span>{team.teamName}</span>
                        {isMyTeam && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-right font-bold text-blue-400 text-sm">
                      {team.score} pts
                    </td>

                    {/* Solved Count */}
                    <td className="py-3.5 px-4 text-center text-zinc-300">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        {team.solvesCount}
                      </span>
                    </td>

                    {/* Members Count */}
                    <td className="py-3.5 px-4 text-zinc-400">
                      {team.membersCount} operators
                    </td>

                    {/* Last Solve Time */}
                    <td className="py-3.5 px-4 text-right text-zinc-500">
                      {team.lastSolveTime}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="p-8">
            <EmptyState
              title="No teams match query"
              description="No enrolled teams match your search term. Clear the search input to view the complete rankings."
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          </div>
        )}
      </Card>

    </div>
  )
}
