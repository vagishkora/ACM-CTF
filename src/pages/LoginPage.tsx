import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, User as UserIcon, ArrowRight, ShieldCheck, Terminal, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [identifier, setIdentifier] = useState('alex_c')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      const user = await login({ identifier, password })
      toast({
        type: 'success',
        title: 'Authentication Successful',
        description: `Welcome back, ${user.displayName}. Connected to team ${user.teamName || 'Solo'}.`
      })
      navigate('/dashboard')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid credentials. Please verify your username and password.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFillDemo = (type: 'participant' | 'organizer') => {
    if (type === 'participant') {
      setIdentifier('alex_c')
      setPassword('password123')
    } else {
      setIdentifier('admin_acm')
      setPassword('adminPass2026')
    }
    setErrorMessage(null)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-tech-grid">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Wordmark */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>SESSION AUTHENTICATION</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Access CTF Platform
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your credentials to connect to your team and access the challenge matrix.
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 bg-[#10121a] border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMessage && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication Error</p>
                  <p className="text-rose-400 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <Input
              label="Username or University Email"
              placeholder="e.g. alex_c or alex@student.acm.org"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">Need help?</span>
              <button 
                type="button" 
                onClick={() => toast({ type: 'info', title: 'Password Reset', description: 'Contact your ACM team lead or the event Discord helpdesk.' })}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to CTF
            </Button>
          </form>

          {/* Quick Demo Credentials Preset */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <p className="text-[11px] font-mono text-zinc-500 mb-2.5 text-center">
              DEMO EVALUATOR SHORTCUTS:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleFillDemo('participant')}
                className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] transition-colors"
              >
                Participant (Alex Chen)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('organizer')}
                className="px-2.5 py-1.5 rounded bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 text-purple-300 text-[11px] transition-colors"
              >
                Organizer (Admin)
              </button>
            </div>
          </div>
        </Card>

        {/* Link to Register */}
        <p className="text-center text-xs text-zinc-400">
          Not yet registered for the event?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create an account or join a team
          </Link>
        </p>

      </div>
    </div>
  )
}
