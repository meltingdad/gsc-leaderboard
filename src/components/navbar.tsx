'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, LogOut } from 'lucide-react'
import { AddWebsiteDialog } from './add-website-dialog'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/webmasters.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleAddWebsite = () => {
    if (!user) {
      handleSignIn()
    } else {
      setShowDialog(true)
    }
  }

  const getUserInitials = () => {
    if (!user?.user_metadata?.name) return '?'
    return user.user_metadata.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50" />
                <Trophy className="relative h-7 w-7 text-cyan-400" />
              </div>
              <div>
                <span className="font-display text-xl font-black text-white tracking-tight">
                  GSC
                </span>
                <span className="font-display text-xl font-black text-cyan-400 tracking-tight ml-1">
                  ARENA
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              <a
                href="#how-it-works"
                className="hidden sm:block font-mono text-sm text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
              >
                How It Works
              </a>
              <a
                href="#leaderboard"
                className="hidden sm:block font-mono text-sm text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
              >
                Leaderboard
              </a>

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
              ) : user ? (
                <>
                  <Button
                    onClick={handleAddWebsite}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold font-mono uppercase tracking-wide transition-all duration-300 hover:glow-cyan cursor-pointer"
                  >
                    Add/Remove Site
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-cyan-500 blur-md opacity-0 group-hover:opacity-50 transition-opacity rounded-full" />
                        <Avatar className="relative h-8 w-8 border-2 border-slate-700 group-hover:border-cyan-500 transition-colors">
                          <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
                          <AvatarFallback className="bg-slate-800 text-cyan-400 font-mono text-xs">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-slate-900 border-slate-700"
                    >
                      <div className="px-2 py-2">
                        <p className="text-sm font-mono text-white">{user.user_metadata?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="font-mono text-sm">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={handleAddWebsite}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold font-mono uppercase tracking-wide transition-all duration-300 hover:glow-cyan cursor-pointer"
                >
                  Enter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Subtle scan line effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </nav>

      <AddWebsiteDialog open={showDialog} onOpenChange={setShowDialog} user={user} />
    </>
  )
}
