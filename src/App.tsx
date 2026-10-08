import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { EventProvider } from './context/EventContext'
import { CTFProvider } from './context/CTFContext'
import { ToastProvider } from './components/ui/Toast'

// Layout
import { Navbar } from './components/layout/Navbar'
import { EventBanner } from './components/layout/EventBanner'
import { DemoToolbar } from './components/layout/DemoToolbar'
import { Footer } from './components/layout/Footer'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { ChallengeDetailPage } from './pages/ChallengeDetailPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { TeamPage } from './pages/TeamPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RulesPage } from './pages/RulesPage'
import { AdminPage } from './pages/AdminPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs text-zinc-500">
        Authenticating session token...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs text-zinc-500">Verifying organizer role...</div>
  }

  if (!isAuthenticated || user?.role !== 'organizer') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventProvider>
          <CTFProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100 font-sans selection:bg-blue-600/30 selection:text-blue-200">
                {/* Demo & Evaluation State Simulator Toolbar */}
                <DemoToolbar />

                {/* Navbar */}
                <Navbar />

                {/* State-driven Notice Banner (Before event / Ending soon / Concluded / Maintenance) */}
                <EventBanner />

                {/* Main View Router */}
                <main className="flex-1 w-full">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/rules" element={<RulesPage />} />

                    {/* Participant Protected Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
                    <Route path="/challenges/:id" element={<ProtectedRoute><ChallengeDetailPage /></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                    <Route path="/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
                    <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                    {/* Admin / Organizer Route */}
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

                    {/* Fallback 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>

                {/* Footer */}
                <Footer />
              </div>
            </ToastProvider>
          </CTFProvider>
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
