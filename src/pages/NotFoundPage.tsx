import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Terminal } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mx-auto">
          <Terminal className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="font-mono text-xs text-blue-400 font-semibold uppercase tracking-widest">
            ERROR 404: RESOURCE NOT LOCATED
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Target Page Not Found
          </h1>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The requested path does not exist on the competition router or the challenge endpoint has been decommissioned.
        </p>
        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Command Center
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
