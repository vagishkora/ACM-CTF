import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  FileCode, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Binary,
  Radio,
  Search
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEvent } from '../context/EventContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { config, status, timeRemaining } = useEvent()

  const categories = [
    {
      name: 'Web Exploitation',
      code: 'WEB',
      icon: <FileCode className="w-4 h-4 text-cyan-400" />,
      desc: 'HTTP proxies, header confusion, modern token verification vulnerabilities, and API parsing traps.'
    },
    {
      name: 'Cryptography',
      code: 'CRYPTO',
      icon: <Lock className="w-4 h-4 text-violet-400" />,
      desc: 'LFSR state reconstruction, stream cipher flaws, and neural weight parity bit cryptanalysis.'
    },
    {
      name: 'Digital Forensics',
      code: 'FORENSICS',
      icon: <Database className="w-4 h-4 text-teal-400" />,
      desc: 'Filesystem journal carving, unallocated inode reconstruction, and triage memory dump extraction.'
    },
    {
      name: 'Reverse Engineering',
      code: 'REV',
      icon: <Binary className="w-4 h-4 text-indigo-400" />,
      desc: 'Custom VM bytecode interpreters, ELF decompilation, and telemetry protocol checksum reverse engineering.'
    },
    {
      name: 'Binary Exploitation (Pwn)',
      code: 'PWN',
      icon: <Cpu className="w-4 h-4 text-rose-400" />,
      desc: 'Modern stack frame pivots, ROP chains, and heap chunk layout manipulation under memory constraints.'
    },
    {
      name: 'Open Source Intelligence (OSINT)',
      code: 'OSINT',
      icon: <Search className="w-4 h-4 text-amber-400" />,
      desc: 'Satellite Doppler shift telemetry, ground station locator analysis, and public registry correlation.'
    },
    {
      name: 'Autonomous Systems & AI Safety',
      code: 'NEAR.AI',
      icon: <Radio className="w-4 h-4 text-cyan-300" />,
      desc: 'Model guardrail bypassing, prompt boundary analysis, and WebAssembly smart contract invariant evaluation.'
    }
  ]

  const statusBadgeVariant = {
    BEFORE_EVENT: 'info',
    LIVE: 'success',
    ENDING_SOON: 'warning',
    FINISHED: 'neutral',
    MAINTENANCE: 'danger'
  } as const

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-zinc-800/80 bg-tech-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090a0f]/80 to-[#090a0f] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            
            {/* Status / Track Meta Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Badge 
                variant={statusBadgeVariant[status] || 'default'} 
                dot={status === 'LIVE'}
                className="py-1 px-2.5"
              >
                Event Status: {status.replace('_', ' ')}
              </Badge>
              <span className="text-zinc-600 font-mono text-xs">•</span>
              <span className="text-zinc-400 font-mono text-xs flex items-center gap-1.5 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                6-Hour Timed Window
              </span>
              <span className="text-zinc-400 font-mono text-xs bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                ACM (75%) × NEAR.AI (25%)
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
              <span className="font-mono text-blue-500">ACM</span>{' '}
              <span className="text-zinc-500 font-light">×</span>{' '}
              <span className="font-mono text-cyan-400">NEAR.AI</span>
              <br />
              <span className="text-zinc-100">CTF Competition</span>
            </h1>

            {/* Clean, Non-AI Marketing Prose (Per Section 34) */}
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed mb-8 max-w-2xl">
              A 6-hour cybersecurity Capture The Flag competition built around problem solving, investigation, exploitation, and technical creativity. Organized by the ACM Student Chapter with challenges contributed in collaboration with NEAR.AI.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                <Button 
                  size="lg" 
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isAuthenticated ? "Enter Command Center" : "Enter the CTF"}
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg">
                  How It Works
                </Button>
              </a>
            </div>

            {/* Quick Telemetry Callout */}
            <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">DURATION</span>
                <span className="text-zinc-200 font-semibold text-sm">6.0 Hours</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">ACTIVE CLOCK</span>
                <span className="text-emerald-400 font-semibold text-sm">
                  {timeRemaining.hours}:{timeRemaining.minutes}:{timeRemaining.seconds}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">CHALLENGE MIX</span>
                <span className="text-zinc-200 font-semibold text-sm">ACM + NEAR.AI</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">TEAM FORMAT</span>
                <span className="text-zinc-200 font-semibold text-sm">1–4 Members</span>
              </div>
            </div>

          </div>
        </div>

        {/* Technical Hero Visual: Realistic Terminal & Architecture Snippet (Section 8) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-[#0e1017] border border-zinc-800 rounded-lg p-4 font-mono text-xs shadow-2xl text-zinc-300 overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80 text-zinc-500 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 text-zinc-400">env://telemetry/session_matrix.env</span>
              </div>
              <span className="text-emerald-400 font-medium">● INSTANCE_ORCHESTRATOR_ONLINE</span>
            </div>
            <pre className="text-zinc-400 leading-relaxed overflow-x-auto">
              <span className="text-zinc-600">01</span> <span className="text-blue-400">[ACM-INGRESS]</span> Initialized challenge partition: 75% ACM Core Infrastructure, 25% NEAR.AI Track.{'\n'}
              <span className="text-zinc-600">02</span> <span className="text-cyan-400">[NEAR-EVAL]</span> Autonomous agent evaluation sandbox ready. Rate limiter active: 6 req/min.{'\n'}
              <span className="text-zinc-600">03</span> <span className="text-emerald-400">[FLAG-ROUTER]</span> SHA-256 flag verification engine mounted. Zero plaintext client exposure.{'\n'}
              <span className="text-zinc-600">04</span> <span className="text-zinc-300">[COMPETITION]</span> Ready for submissions across 7 disciplines. Format: ACM&#123;...&#125;
            </pre>
          </div>
        </div>
      </section>

      {/* ACM × NEAR.AI Collaboration Section (Section 8) */}
      <section className="py-16 md:py-20 border-b border-zinc-800 bg-[#0b0d14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-4">
              <Badge variant="acm" className="text-[11px]">
                Collaborative Initiative
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                ACM Student Chapter × NEAR.AI
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Challenges are contributed across ACM and NEAR.AI, creating a mixed competition experience.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                While the ACM student team curates traditional cybersecurity disciplines like web exploitation, digital forensics, cryptography, reverse engineering, and pwn, NEAR.AI mentors contribute specialized problem sets centered around the resilience and boundaries of modern artificial intelligence and WebAssembly state execution.
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 bg-[#0f111a] border-zinc-800">
                <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-mono">ACM Track (~75%)</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Engineered by the ACM technical committee. Features real-world attack vectors, kernel debugging, filesystem reconstruction, and protocol reversing.
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Categories: Web, Pwn, Crypto, Forensics, OSINT</span>
                </div>
              </Card>

              <Card className="p-5 bg-[#0f111a] border-zinc-800">
                <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-mono">NEAR.AI Track (~25%)</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Contributed by NEAR.AI researchers. Focuses on autonomous agent prompt guardrail robustness, WASM verifier invariants, and model weight steganography.
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Specialized Track</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Categories Grid */}
      <section className="py-16 md:py-20 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="font-mono text-xs text-blue-400 uppercase tracking-wider mb-1">COMPETITION DOMAINS</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Challenge Categories
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm">
              Problems span beginner-friendly entry points through advanced binary exploitation and AI security invariants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.code} className="p-4 bg-[#10121a] border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                      {cat.icon}
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {cat.code}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">{cat.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Points: 100–450</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section (Section 8) */}
      <section id="how-it-works" className="py-16 md:py-20 border-b border-zinc-800 bg-[#090b11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="font-mono text-xs text-blue-400 uppercase tracking-wider mb-1">PARTICIPATION GUIDE</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How The CTF Works
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              Four structured phases to get your team onto the live scoreboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative p-5 rounded-lg border border-zinc-800 bg-[#10121a]">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded">
                STEP 01
              </span>
              <h3 className="text-sm font-semibold text-zinc-100 mt-3">Register & Form Team</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Sign in with your university or personal handle. Create a new team or enter your captain's invite code to assemble up to 4 participants.
              </p>
            </div>

            <div className="relative p-5 rounded-lg border border-zinc-800 bg-[#10121a]">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded">
                STEP 02
              </span>
              <h3 className="text-sm font-semibold text-zinc-100 mt-3">Explore Challenges</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Filter by category, points, and source. Download verified file artifacts or spawn target instance sandboxes on demand.
              </p>
            </div>

            <div className="relative p-5 rounded-lg border border-zinc-800 bg-[#10121a]">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                STEP 03
              </span>
              <h3 className="text-sm font-semibold text-zinc-100 mt-3">Submit Secret Flags</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Uncover tokens matching the format <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">ACM&#123;...&#125;</code> and submit them via the dedicated flag box.
              </p>
            </div>

            <div className="relative p-5 rounded-lg border border-zinc-800 bg-[#10121a]">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded">
                STEP 04
              </span>
              <h3 className="text-sm font-semibold text-zinc-100 mt-3">Climb The Leaderboard</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Track live rankings, solve timelines, and breakdown points across both ACM and NEAR.AI tracks in real time.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to={isAuthenticated ? "/challenges" : "/register"}>
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                {isAuthenticated ? "Browse Challenge Catalog" : "Create Account & Get Started"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
