import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  CheckCircle2, 
  Lock, 
  ChevronRight, 
  SlidersHorizontal, 
  Layers, 
  ArrowUpDown,
  FileCode,
  LayoutGrid,
  List
} from 'lucide-react'
import { useCTF } from '../context/CTFContext'
import { Challenge, ChallengeCategory, ChallengeDifficulty } from '../types'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { getDifficultyColor, getCategoryBadge } from '../lib/utils'

export const ChallengesPage: React.FC = () => {
  const { challenges, isLoading, solvedCount, totalChallenges } = useCTF()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [selectedSource, setSelectedSource] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unsolved' | 'Solved'>('All')
  const [sortBy, setSortBy] = useState<'points_asc' | 'points_desc' | 'unsolved_first' | 'title' | 'solves'>('unsolved_first')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const categories = ['All', 'Web', 'Crypto', 'Forensics', 'OSINT', 'Reverse Engineering', 'Pwn', 'Miscellaneous']
  const difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Insane']
  const sources = ['All', 'ACM', 'NEAR.AI']

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = c.title.toLowerCase().includes(query)
        const matchCat = c.category.toLowerCase().includes(query)
        const matchAuthor = c.author.toLowerCase().includes(query)
        if (!matchTitle && !matchCat && !matchAuthor) return false
      }

      // Category
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false
      }

      // Difficulty
      if (selectedDifficulty !== 'All' && c.difficulty !== selectedDifficulty) {
        return false
      }

      // Source
      if (selectedSource !== 'All' && c.source !== selectedSource) {
        return false
      }

      // Solved Status
      if (statusFilter === 'Unsolved' && c.isSolved) return false
      if (statusFilter === 'Solved' && !c.isSolved) return false

      return true
    }).sort((a, b) => {
      if (sortBy === 'unsolved_first') {
        if (a.isSolved !== b.isSolved) return a.isSolved ? 1 : -1
        return b.points - a.points
      }
      if (sortBy === 'points_desc') return b.points - a.points
      if (sortBy === 'points_asc') return a.points - b.points
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'solves') return b.solvesCount - a.solvesCount
      return 0
    })
  }, [challenges, searchQuery, selectedCategory, selectedDifficulty, selectedSource, statusFilter, sortBy])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Challenges</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {solvedCount} / {totalChallenges} Solved
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browse and filter problems curated by ACM and NEAR.AI across 7 security disciplines.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded border transition-colors ${
              viewMode === 'grid' 
                ? 'bg-zinc-800 text-white border-zinc-700' 
                : 'text-zinc-500 hover:text-zinc-300 border-transparent'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded border transition-colors ${
              viewMode === 'table' 
                ? 'bg-zinc-800 text-white border-zinc-700' 
                : 'text-zinc-500 hover:text-zinc-300 border-transparent'
            }`}
            title="Table view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Section 11) */}
      <div className="bg-[#10121a] border border-zinc-800 rounded-lg p-4 space-y-4">
        
        {/* Top search & sorting row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search challenges by title, category, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <div className="relative w-full">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="unsolved_first">Sort: Unsolved First</option>
                <option value="points_desc">Points: High to Low</option>
                <option value="points_asc">Points: Low to High</option>
                <option value="solves">Solves: Most to Least</option>
                <option value="title">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-zinc-500 mr-1.5">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-500 font-medium'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary filters: Difficulty, Source, Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-800/60 text-xs font-mono">
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Difficulty */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[11px]">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs focus:outline-none"
              >
                {difficulties.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Source: ACM vs NEAR.AI */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[11px]">Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs focus:outline-none"
              >
                {sources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Status: Solved vs Unsolved */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs focus:outline-none"
              >
                <option value="All">All Challenges</option>
                <option value="Unsolved">Unsolved Only</option>
                <option value="Solved">Solved Only</option>
              </select>
            </div>
          </div>

          {/* Result Count and Clear Filters */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[11px]">
              Showing {filteredChallenges.length} of {challenges.length}
            </span>
            {(selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedSource !== 'All' || statusFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedDifficulty('All')
                  setSelectedSource('All')
                  setStatusFilter('All')
                  setSearchQuery('')
                }}
                className="text-blue-400 hover:underline text-[11px]"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Challenge Listing: Grid View */}
      {viewMode === 'grid' && (
        <>
          {filteredChallenges.length === 0 ? (
            <EmptyState
              title="No challenges match filters"
              description="Try relaxing your category or difficulty filters, or clear your search term to see all available challenges."
              actionLabel="Reset All Filters"
              onAction={() => {
                setSelectedCategory('All')
                setSelectedDifficulty('All')
                setSelectedSource('All')
                setStatusFilter('All')
                setSearchQuery('')
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge) => {
                const diff = getDifficultyColor(challenge.difficulty)
                const cat = getCategoryBadge(challenge.category)

                return (
                  <Link
                    key={challenge.id}
                    to={`/challenges/${challenge.slug}`}
                    className="block group"
                  >
                    <Card
                      className={`p-4 transition-all h-full flex flex-col justify-between ${
                        challenge.isSolved
                          ? 'bg-[#0e1319] border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-[#10121a] border-zinc-800 hover:border-zinc-700 hover:bg-[#121522]'
                      }`}
                    >
                      <div>
                        {/* Header Badges */}
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

                        {/* Title & Solved Indicator */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                            {challenge.title}
                          </h3>
                          {challenge.isSolved && (
                            <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              SOLVED
                            </span>
                          )}
                        </div>

                        {/* Description Preview */}
                        <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {challenge.description.replace(/```[\s\S]*?```/g, '').replace(/[\n#*]/g, ' ')}
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-blue-400 text-sm">{challenge.points}</span>
                          <span className="text-[10px] text-zinc-500">pts</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                          <span>{challenge.solvesCount} solves</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Challenge Listing: Table View */}
      {viewMode === 'table' && (
        <Card className="bg-[#10121a] border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c0e15] text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-medium">NAME</th>
                  <th className="py-3 px-4 font-medium">CATEGORY</th>
                  <th className="py-3 px-4 font-medium">DIFFICULTY</th>
                  <th className="py-3 px-4 font-medium">POINTS</th>
                  <th className="py-3 px-4 font-medium">SOURCE</th>
                  <th className="py-3 px-4 font-medium">SOLVES</th>
                  <th className="py-3 px-4 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredChallenges.map((challenge) => {
                  const diff = getDifficultyColor(challenge.difficulty)
                  const cat = getCategoryBadge(challenge.category)

                  return (
                    <tr 
                      key={challenge.id}
                      className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/challenges/${challenge.slug}`}
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-zinc-200">
                        <Link to={`/challenges/${challenge.slug}`} className="hover:text-blue-400">
                          {challenge.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${cat.bg} ${cat.text} ${cat.border}`}>
                          {challenge.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${diff.bg} ${diff.text} ${diff.border}`}>
                          {challenge.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-400">
                        {challenge.points} pts
                      </td>
                      <td className="py-3.5 px-4">
                        {challenge.source === 'NEAR.AI' ? (
                          <Badge variant="near" size="sm">NEAR.AI</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">ACM</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {challenge.solvesCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {challenge.isSolved ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SOLVED
                          </span>
                        ) : (
                          <span className="text-zinc-500">UNSOLVED</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  )
}
