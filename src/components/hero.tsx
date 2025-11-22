'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trophy, Zap, Users, TrendingUp } from 'lucide-react'
import { AddWebsiteDialog } from './add-website-dialog'
import type { User } from '@supabase/supabase-js'

export function Hero() {
  const [user, setUser] = useState<User | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAddWebsite = async () => {
    if (!user) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    } else {
      setShowDialog(true)
    }
  }

  return (
    <>
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Diagonal accent lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1 h-96 bg-gradient-to-b from-cyan-500/50 to-transparent rotate-12 translate-x-32 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-1 h-96 bg-gradient-to-t from-purple-500/30 to-transparent -rotate-12 -translate-x-32 translate-y-16" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div className="space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-mono text-cyan-400">COMPETE_GLOBALLY</span>
                </div>

                {/* Headline */}
                <div className="space-y-4">
                  <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight">
                    <span className="block text-white">CLIMB THE</span>
                    <span className="block gradient-text glow-text-cyan">RANKINGS</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-300 font-light max-w-lg">
                    Join the <span className="font-mono text-cyan-400">global arena</span> where websites compete.
                    Connect your Google Search Console and prove your dominance.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={handleAddWebsite}
                    className="group relative overflow-hidden bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg px-8 h-14 glow-cyan transition-all duration-300 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      ENTER ARENA
                    </span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-500/10 text-white font-semibold text-lg px-8 h-14 transition-all duration-300"
                    asChild
                  >
                    <a href="#leaderboard">VIEW LEADERBOARD</a>
                  </Button>
                </div>

                {/* Live Stats Ticker */}
                <div className="pt-4">
                  <p className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-wider">Live Stats</p>
                  <div className="flex gap-6 font-mono">
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-white animate-count-up">0</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Sites Competing</div>
                    </div>
                    <div className="w-px bg-slate-700" />
                    <div className="space-y-1 delay-200">
                      <div className="text-3xl font-bold text-cyan-400 animate-count-up delay-200">0M</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Total Clicks</div>
                    </div>
                    <div className="w-px bg-slate-700" />
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-purple-400 animate-count-up delay-300">0</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Active Players</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Floating Stats Card */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Glow effect background */}
                  <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />

                  {/* Main card */}
                  <div className="relative bg-slate-800/90 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm scan-lines">
                    <div className="space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                        <div>
                          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Top Performer</p>
                          <h3 className="text-2xl font-bold text-white mt-1 font-display">example.com</h3>
                        </div>
                        <div className="metallic-gold px-4 py-2 rounded-lg font-black text-slate-900">
                          #1
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center gap-2 text-cyan-400 mb-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-xs font-mono uppercase">Clicks</span>
                          </div>
                          <div className="text-2xl font-bold text-white font-mono">125.4K</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center gap-2 text-purple-400 mb-2">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-mono uppercase">Impressions</span>
                          </div>
                          <div className="text-2xl font-bold text-white font-mono">3.5M</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="text-xs font-mono text-slate-400 mb-2 uppercase">CTR</div>
                          <div className="text-2xl font-bold text-green-400 font-mono">3.54%</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="text-xs font-mono text-slate-400 mb-2 uppercase">Position</div>
                          <div className="text-2xl font-bold text-amber-400 font-mono">12.3</div>
                        </div>
                      </div>

                      {/* Pulse indicator */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span>UPDATED 2 MIN AGO</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating accent elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-float" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-float delay-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <AddWebsiteDialog open={showDialog} onOpenChange={setShowDialog} user={user} />
    </>
  )
}
