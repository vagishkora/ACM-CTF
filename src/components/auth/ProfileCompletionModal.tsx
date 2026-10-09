import React, { useState } from 'react'
import { UserCheck, Shield, Phone, GraduationCap, Building2, User, Hash } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

export const ProfileCompletionModal: React.FC = () => {
  const { user, completeProfile } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.displayName && user.displayName !== user.email.split('@')[0] ? user.displayName : '')
  const [usn, setUsn] = useState(user?.usn || '')
  const [year, setYear] = useState(user?.year || '3rd Year')
  const [branch, setBranch] = useState(user?.branch || 'Computer Science & Engineering')
  const [phone, setPhone] = useState(user?.phone || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only display if logged in, participant, and profile not completed yet
  const shouldShow = !!user && user.role === 'participant' && !user.isProfileComplete

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide your full legal or college name.')
      return
    }
    if (!usn.trim()) {
      setError('University Seat Number (USN) or Student ID is required.')
      return
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please provide a valid 10-digit phone number.')
      return
    }

    setIsSubmitting(true)
    try {
      await completeProfile({
        name: name.trim(),
        usn: usn.trim().toUpperCase(),
        year: year.trim(),
        branch: branch.trim(),
        phone: phone.trim()
      })

      toast({
        type: 'success',
        title: 'Profile Completed!',
        description: `Welcome to the CTF, ${name.trim()}! Your team credentials are now fully active.`
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile details. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!shouldShow) return null

  return (
    <Modal
      isOpen={shouldShow}
      onClose={() => {}} // Cannot dismiss until completed
      title="Complete Your Participant Profile"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 rounded bg-blue-950/30 border border-blue-800/50 flex items-start gap-3 text-blue-300">
          <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">First-Time Setup Required</p>
            <p className="text-[11px] text-blue-300/90 mt-0.5">
              Your account has been provisioned by the event administrator. Please provide your student credentials to link with your team and qualify for scoreboard prizes.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 font-mono text-[11px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Team Name: Read-Only / Auto-Assigned */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              ASSIGNED TEAM NAME (LOCKED)
            </label>
            <div className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold flex items-center justify-between">
              <span>{user?.teamName || 'Assigned CTF Team'}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                VERIFIED BY ADMIN
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Your team allocation is managed by event organizers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<User className="w-3.5 h-3.5" />}
            />

            <Input
              label="USN / Roll Number"
              placeholder="e.g. 1RV22CS010"
              value={usn}
              onChange={(e) => setUsn(e.target.value.toUpperCase())}
              required
              leftIcon={<Hash className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                YEAR OF STUDY
              </label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="PG / MCA">PG / MCA / Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                BRANCH / DEPARTMENT
              </label>
              <div className="relative">
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Computer Science & Engineering">CSE (Computer Science)</option>
                  <option value="Information Science & Engineering">ISE (Info Science)</option>
                  <option value="Artificial Intelligence & ML">AI / ML / Data Science</option>
                  <option value="Electronics & Communication">ECE (Electronics)</option>
                  <option value="Cyber Security / IT">Cyber Security / IT</option>
                  <option value="Other Engineering">Other Engineering</option>
                </select>
              </div>
            </div>
          </div>

          <Input
            label="Contact Phone Number"
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            helperText="Used for prize distribution and on-site event coordination."
            leftIcon={<Phone className="w-3.5 h-3.5" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Complete Registration & Access CTF
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
