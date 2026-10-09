import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const Footer: React.FC = () => {
  const { user } = useAuth()
  return (
    <footer className="border-t border-zinc-800/80 bg-[#07080c] py-10 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Brand identity */}
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center gap-2.5 font-mono text-zinc-300">
            <img src="/acm-logo.png" alt="ACM Logo" className="h-6 w-auto object-contain" />
            <span className="text-zinc-600 text-xs">×</span>
            <span className="font-semibold text-cyan-400">NEAR.AI</span>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] text-zinc-400">6-Hour CTF</span>
          </div>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Organized by the ACM Student Chapter in collaboration with NEAR.AI. Built for technical security problem-solving, binary analysis, cryptography, and artificial intelligence safety.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/rules" className="hover:text-zinc-300 transition-colors">
            Competition Rules
          </Link>
          <Link to="/challenges" className="hover:text-zinc-300 transition-colors">
            Challenges
          </Link>
          {user?.role === 'organizer' && (
            <Link to="/leaderboard" className="hover:text-zinc-300 transition-colors">
              Scoreboard
            </Link>
          )}
          <a 
            href="#faq" 
            className="hover:text-zinc-300 transition-colors"
          >
            How It Works
          </a>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="text-zinc-500">
            Platform ver 1.0 (Student Build)
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
        <div>
          © {new Date().getFullYear()} ACM Student Chapter & NEAR.AI. All challenge trademarks belong to respective authors.
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Telemetry: Nominal
          </span>
          <span className="text-zinc-700">|</span>
          <span>Zero Server-Side Secrets Client Exposed</span>
        </div>
      </div>
    </footer>
  )
}
