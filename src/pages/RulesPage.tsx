import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, ArrowLeft, Terminal, CheckCircle2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const RulesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back button */}
      <div className="pb-2 border-b border-zinc-800">
        <Link to="/" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO EVENT OVERVIEW</span>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OFFICIAL CODE OF CONDUCT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Competition Rules & Guidelines
        </h1>
        <p className="text-xs text-zinc-400">
          Standard operational protocols for all participants of the ACM × NEAR.AI CTF.
        </p>
      </div>

      <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
        
        {/* Rule 1 */}
        <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-100">
            <span className="text-blue-400">01.</span>
            <span>Target Boundary & Infrastructure</span>
          </div>
          <p>
            Attacking competition scoring infrastructure, scoreboard servers, or any service not explicitly designated as a challenge target is strictly forbidden. All legitimate challenge targets are bound to <code className="text-cyan-300 font-mono bg-zinc-900 px-1 py-0.5 rounded">*.internal</code> or the dynamic sandbox ports assigned to your team.
          </p>
        </Card>

        {/* Rule 2 */}
        <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-100">
            <span className="text-blue-400">02.</span>
            <span>Flag Sharing & External Collaboration</span>
          </div>
          <p>
            Do not share flags, solutions, or exploit scripts with other competing teams during the active 6-hour competition window. Team cooperation is limited to members registered under the same team handle.
          </p>
        </Card>

        {/* Rule 3 */}
        <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-100">
            <span className="text-blue-400">03.</span>
            <span>Denial of Service (DoS)</span>
          </div>
          <p>
            Do not execute brute-force attacks, high-frequency automated flooding, or denial-of-service against challenge containers. Flag verification routes are rate-limited to 6 requests per 30 seconds.
          </p>
        </Card>

        {/* Rule 4 */}
        <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-100">
            <span className="text-blue-400">04.</span>
            <span>Flag Submission Format</span>
          </div>
          <p>
            All validated flags adhere to the standard format <code className="text-emerald-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">ACM&#123;...&#125;</code> unless explicitly overridden in the challenge brief. Submissions are case-sensitive.
          </p>
        </Card>

        {/* Rule 5 */}
        <Card className="p-5 bg-[#10121a] border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-100">
            <span className="text-blue-400">05.</span>
            <span>NEAR.AI Autonomous Agent Track Policies</span>
          </div>
          <p>
            Adversarial prompt evaluations on the NEAR.AI track are processed through designated evaluation nodes. Prompt submissions are monitored for structural containment and rate-limited to avoid compute starvation.
          </p>
        </Card>

      </div>

      <div className="pt-4 text-center">
        <Link to="/challenges">
          <Button variant="primary">
            Proceed to Challenges
          </Button>
        </Link>
      </div>

    </div>
  )
}
