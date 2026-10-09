import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Users, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { toast } = useToast()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamMode, setTeamMode] = useState<'create' | 'join' | 'individual'>('create')
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all mandatory fields.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    if (teamMode === 'create' && !teamName.trim()) {
      setErrorMessage('Please specify a name for your team.')
      return
    }

    if (teamMode === 'join' && !inviteCode.trim()) {
      setErrorMessage('Please provide your captain’s invite code.')
      return
    }

    setIsLoading(true)

    try {
      const user = await register({
        username,
        displayName: displayName || username,
        email,
        password,
        teamMode,
        teamName,
        inviteCode
      })
      toast({
        type: 'success',
        title: 'Registration Complete',
        description: `Welcome to ACM × NEAR.AI CTF, ${user.displayName}!`
      })
      navigate('/dashboard')
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-tech-grid">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>EXTERNAL ONBOARDING NOTICE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Participant Registration
          </h1>
          <p className="text-xs text-zinc-400">
            Student registration is managed externally. Accounts are provisioned directly by the Admin.
          </p>
        </div>

        {/* Notice Card for Students */}
        <div className="p-4 rounded-lg bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">Registered via External Portal?</p>
            <p className="text-[11px] text-blue-300/90 mt-0.5">
              Your Team Name, Email, and temporary Password have been pre-provisioned. You do not need to register again.
            </p>
          </div>
          <Link
            to="/login"
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 text-center transition-colors shadow-sm"
          >
            Go to Login
          </Link>
        </div>

        <Card className="p-6 bg-[#10121a] border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMessage && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Registration Issue</p>
                  <p className="text-rose-400 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Username / Handle"
                placeholder="e.g. byte_seeker"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Full Name / Display Name"
                placeholder="e.g. Jordan Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. jordan@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            {/* Team Mode Selector (Section 9: flexible architecture) */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Team Format Option
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setTeamMode('create')}
                  className={`p-2 rounded border text-center transition-colors ${
                    teamMode === 'create'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => setTeamMode('join')}
                  className={`p-2 rounded border text-center transition-colors ${
                    teamMode === 'join'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Join Team
                </button>
                <button
                  type="button"
                  onClick={() => setTeamMode('individual')}
                  className={`p-2 rounded border text-center transition-colors ${
                    teamMode === 'individual'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Solo / Open
                </button>
              </div>

              {teamMode === 'create' && (
                <div className="mt-3">
                  <Input
                    label="Team Name"
                    placeholder="e.g. CyberVanguards"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    helperText="You will be registered as captain with an invite code to share."
                    leftIcon={<Users className="w-4 h-4" />}
                  />
                </div>
              )}

              {teamMode === 'join' && (
                <div className="mt-3">
                  <Input
                    label="Team Invite Code"
                    placeholder="e.g. ROOT-9924-ACM"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    helperText="Obtain this code from your team captain."
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  )
}
