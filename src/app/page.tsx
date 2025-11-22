'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { LeaderboardTable } from '@/components/leaderboard-table'
import { Trophy, Github, Twitter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

interface LeaderboardEntry {
  id: string
  rank: number
  domain: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  lastUpdated: Date
}

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/websites')
        if (response.ok) {
          const result = await response.json()
          // Convert lastUpdated strings to Date objects
          const processedData = (result.data || []).map((entry: any) => ({
            ...entry,
            lastUpdated: new Date(entry.lastUpdated)
          }))
          setLeaderboardData(processedData)

          // Find the most recent update time
          if (processedData.length > 0) {
            const latestUpdate = processedData.reduce((latest: Date | null, entry: LeaderboardEntry) => {
              return !latest || entry.lastUpdated > latest ? entry.lastUpdated : latest
            }, null)
            setLastUpdate(latestUpdate)
          }
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Add padding for fixed navbar */}
      <div className="pt-16">
        <Hero />
        <HowItWorks />

        {/* Leaderboard Section */}
        <section id="leaderboard" className="py-32 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            {/* Section Header */}
            <div className="text-center space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Trophy className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-mono text-cyan-400 uppercase tracking-wider">Live Rankings</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl font-black text-white">
                CURRENT <span className="gradient-text">LEADERBOARD</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
                Top performers ranked by clicks in the last 28 days
              </p>
            </div>

            {/* Leaderboard */}
            <div className="max-w-7xl mx-auto">
              {loading ? (
                // Loading skeleton
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-slate-800/50 border border-slate-700 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : leaderboardData.length === 0 ? (
                // Empty state
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-6">
                    <Trophy className="h-8 w-8 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    No Competitors Yet
                  </h3>
                  <p className="text-slate-400 mb-8">
                    Be the first to enter the arena and claim the top spot!
                  </p>
                </div>
              ) : (
                <LeaderboardTable data={leaderboardData} />
              )}
            </div>

            {/* Update Info */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-mono text-xs text-slate-400 uppercase">Auto-Refresh: 30s</span>
                </div>
                <div className="w-px h-4 bg-slate-600" />
                <span className="font-mono text-xs text-slate-500">
                  {loading ? (
                    'Loading...'
                  ) : lastUpdate ? (
                    `Last update: ${formatDistanceToNow(lastUpdate, { addSuffix: true })}`
                  ) : (
                    'No updates yet'
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              {/* Brand */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50" />
                    <Trophy className="relative h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <span className="font-display text-lg font-black text-white">GSC</span>
                    <span className="font-display text-lg font-black text-cyan-400 ml-1">ARENA</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                  The competitive platform for website owners to compare Google Search Console metrics globally.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-display font-bold text-white mb-4 uppercase tracking-wider text-sm">
                  Navigate
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#how-it-works" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-mono">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#leaderboard" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-mono">
                      Leaderboard
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-mono">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-mono">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h3 className="font-display font-bold text-white mb-4 uppercase tracking-wider text-sm">
                  Connect
                </h3>
                <div className="flex gap-4">
                  <a
                    href="https://x.com/meltingdad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all hover:glow-cyan"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="https://github.com/meltingdad/gsc-leaderboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all hover:glow-cyan"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500 font-mono">
                  © {new Date().getFullYear()} GSC Arena. All rights reserved.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-500 font-mono">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
