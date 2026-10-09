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
  List,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Key
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCTF } from '../context/CTFContext'
import { challengeService } from '../services/challengeService'
import { Challenge, ChallengeCategory, ChallengeDifficulty, ChallengeSource } from '../types'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { getDifficultyColor, getCategoryBadge } from '../lib/utils'

export const ChallengesPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const { challenges, isLoading, solvedCount, totalChallenges, refreshChallenges } = useCTF()

  const isOrganizer = user?.role === 'organizer'

  // Admin Challenge Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState<ChallengeCategory>('Web')
  const [formDifficulty, setFormDifficulty] = useState<ChallengeDifficulty>('Easy')
  const [formPoints, setFormPoints] = useState(100)
  const [formSource, setFormSource] = useState<ChallengeSource>('ACM')
  const [formAuthor, setFormAuthor] = useState('ACM Organizer')
  const [formFlag, setFormFlag] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenCreate = () => {
    setEditingChallenge(null)
    setFormTitle('')
    setFormCategory('Web')
    setFormDifficulty('Easy')
    setFormPoints(100)
    setFormSource('ACM')
    setFormAuthor('ACM Organizer')
    setFormFlag('ACM{custom_flag_here}')
    setFormDescription('')
    setModalOpen(true)
  }

  const handleOpenEdit = (ch: Challenge, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setEditingChallenge(ch)
    setFormTitle(ch.title)
    setFormCategory(ch.category)
    setFormDifficulty(ch.difficulty)
    setFormPoints(ch.points)
    setFormSource(ch.source)
    setFormAuthor(ch.author)
    setFormFlag(challengeService.getFlag(ch.id))
    setFormDescription(ch.description)
    setModalOpen(true)
  }

  const handleDelete = async (id: string, title: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!window.confirm(`Delete challenge "${title}"?`)) return
    await challengeService.deleteChallenge(id)
    await refreshChallenges()
    toast({
      type: 'info',
      title: 'Challenge Removed',
      description: `Removed "${title}" from competition inventory.`
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    setIsSaving(true)
    try {
      if (editingChallenge) {
        await challengeService.updateChallenge(editingChallenge.id, {
          title: formTitle,
          category: formCategory,
          difficulty: formDifficulty,
          points: Number(formPoints),
          source: formSource,
          author: formAuthor,
          description: formDescription
        }, formFlag)
        toast({
          type: 'success',
          title: 'Challenge Updated',
          description: `Saved modifications to "${formTitle}".`
        })
      } else {
        const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const newCh: Challenge = {
          id: `ch-custom-${Date.now()}`,
          slug,
          title: formTitle,
          category: formCategory,
          difficulty: formDifficulty,
          points: Number(formPoints),
          source: formSource,
          author: formAuthor,
          description: formDescription || 'Custom security challenge brief.',
          hints: [],
          solvesCount: 0,
          isSolved: false
        }
        await challengeService.createChallenge(newCh, formFlag)
        toast({
          type: 'success',
          title: 'Challenge Published',
          description: `Added "${formTitle}" to competition inventory.`
        })
      }
      setModalOpen(false)
      await refreshChallenges()
    } finally {
      setIsSaving(false)
    }
  }

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
            {isOrganizer && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700/60 text-purple-300 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-purple-400" />
                ADMIN ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browse and filter problems curated by ACM and NEAR.AI across 7 security disciplines.
          </p>
        </div>

        {/* Action Buttons & View Toggle */}
        <div className="flex items-center gap-2.5">
          {isOrganizer && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenCreate}
              className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs"
            >
              Add Challenge
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-md border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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

                if (challenge.isLocked && !isOrganizer) {
                  return (
                    <div key={challenge.id} className="block cursor-not-allowed group">
                      <Card className="p-4 h-full flex flex-col justify-between bg-[#0e1017]/80 border-dashed border-zinc-800">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                              {challenge.category}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center gap-1 font-semibold">
                              <Lock className="w-3 h-3" />
                              WAVE {challenge.releaseWave || 2} LOCKED
                            </span>
                          </div>

                          <h3 className="text-sm font-semibold text-zinc-400">
                            {challenge.title}
                          </h3>

                          <p className="text-xs text-zinc-500 mt-2 font-mono">
                            Scheduled release in Wave {challenge.releaseWave || 2}. Unlocks automatically as competition progresses.
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-500">
                          <span className="font-bold text-zinc-400">{challenge.points} pts</span>
                          <span className="text-amber-400/80 text-[11px]">Releases Soon</span>
                        </div>
                      </Card>
                    </div>
                  )
                }

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
                          {isOrganizer ? (
                            <div className="flex items-center gap-1.5 ml-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(challenge, e)}
                                className="p-1 rounded bg-zinc-800 hover:bg-purple-900/60 text-zinc-400 hover:text-purple-200 transition-colors"
                                title="Edit Challenge"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(challenge.id, challenge.title, e)}
                                className="p-1 rounded bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-300 transition-colors"
                                title="Delete Challenge"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                          )}
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
                  {isOrganizer && <th className="py-3 px-4 font-medium text-right">ACTIONS</th>}
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
                        {challenge.isLocked && !isOrganizer ? (
                          <span className="text-amber-400/90 inline-flex items-center gap-1 font-semibold">
                            <Lock className="w-3.5 h-3.5" />
                            WAVE {challenge.releaseWave || 2} LOCKED
                          </span>
                        ) : challenge.isSolved ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SOLVED
                          </span>
                        ) : (
                          <span className="text-zinc-500">UNSOLVED</span>
                        )}
                      </td>
                      {isOrganizer && (
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(challenge, e)}
                              className="p-1 rounded bg-zinc-800 hover:bg-purple-900/60 text-zinc-300 hover:text-purple-200 transition-colors"
                              title="Edit Challenge"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(challenge.id, challenge.title, e)}
                              className="p-1 rounded bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-300 transition-colors"
                              title="Delete Challenge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Admin Create / Edit Challenge Modal */}
      {isOrganizer && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingChallenge ? `EDIT CHALLENGE: ${editingChallenge.title}` : 'CREATE NEW COMPETITION CHALLENGE'}
          size="lg"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-sans text-zinc-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Challenge Title"
                placeholder="e.g. Memory Stack Pivot 2026"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />

              <Input
                label="Author / Contributor"
                placeholder="e.g. ACM CTF Team"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e: any) => setFormCategory(e.target.value)}
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
                  value={formDifficulty}
                  onChange={(e: any) => setFormDifficulty(e.target.value)}
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
                  value={formPoints}
                  onChange={(e) => setFormPoints(Math.max(25, parseInt(e.target.value) || 25))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Curated Source</label>
                <select
                  value={formSource}
                  onChange={(e: any) => setFormSource(e.target.value)}
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
                Target Flag Answer (Secret Key Verified on Submit)
              </label>
              <Input
                placeholder="e.g. ACM{secret_flag_string}"
                value={formFlag}
                onChange={(e) => setFormFlag(e.target.value)}
                required
              />
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                Submissions matching this string will be accepted with +{formPoints} points.
              </span>
            </div>

            {/* Description / Instructions */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Challenge Description & Brief
              </label>
              <textarea
                rows={5}
                className="w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                placeholder="Describe challenge context, endpoints, and clues..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                className="bg-purple-600 hover:bg-purple-500 text-white font-mono"
              >
                {editingChallenge ? 'Save Changes' : 'Publish Challenge'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
