'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cleanDomain } from '@/lib/utils/domain'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, CheckCircle, AlertCircle, Check, Trash2, EyeOff } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface AddWebsiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

interface GSCSite {
  siteUrl: string
  permissionLevel: string
  computedHash?: string
}

interface LeaderboardSite {
  domain: string
  site_url: string
  site_hash?: string
  original_site_url?: string
}

export function AddWebsiteDialog({ open, onOpenChange, user }: AddWebsiteDialogProps) {
  const [sites, setSites] = useState<GSCSite[]>([])
  const [existingSites, setExistingSites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [removingSite, setRemovingSite] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open && user) {
      fetchSites()
    }
  }, [open, user])

  const fetchSites = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch both GSC sites and user's existing sites in parallel
      const [gscResponse, myWebsitesResponse] = await Promise.all([
        fetch('/api/gsc/sites'),
        fetch('/api/my-websites'),
      ])

      const gscData = await gscResponse.json()
      const myWebsitesData = await myWebsitesResponse.json()

      if (!gscResponse.ok) {
        throw new Error(gscData.error || 'Failed to fetch sites')
      }

      // Build a set of existing site identifiers (hash-based for new entries, URL-based for legacy)
      const existingSiteIdentifiers = new Set<string>()

      for (const site of myWebsitesData.data || []) {
        // Add site_hash if available (new hash-based matching)
        if (site.site_hash) {
          existingSiteIdentifiers.add(site.site_hash)
        }
        // Fallback: add original_site_url for backwards compatibility
        if (site.original_site_url) {
          existingSiteIdentifiers.add(site.original_site_url)
        }
        // Fallback: add domain for very old entries
        if (site.domain) {
          existingSiteIdentifiers.add(site.domain)
        }
      }

      // Compute hashes for all GSC sites
      const gscSitesWithHashes = await Promise.all(
        (gscData.sites || []).map(async (site: GSCSite) => {
          // Compute hash for this site
          const textEncoder = new TextEncoder()
          const hashData = textEncoder.encode(`${user?.id}:${site.siteUrl}`)
          const hashBuffer = await crypto.subtle.digest('SHA-256', hashData)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const siteHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

          return {
            ...site,
            computedHash: siteHash,
          }
        })
      )

      setSites(gscSitesWithHashes)
      setExistingSites(existingSiteIdentifiers)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSite = async (siteUrl: string, isAnonymous: boolean) => {
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteUrl, anonymous: isAnonymous }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add website')
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        // Refresh the page to show updated leaderboard
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveSite = async (siteUrl: string) => {
    setRemovingSite(siteUrl)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/websites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove website')
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        // Refresh the page to show updated leaderboard
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRemovingSite(null)
    }
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/webmasters.readonly',
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-white">
            <span className="gradient-text">MANAGE</span> YOUR SITES
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {!user
              ? 'Sign in with Google to connect your Search Console account'
              : 'Add or remove websites from the global leaderboard'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!user ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <Globe className="h-16 w-16 mx-auto text-cyan-400 mb-4" />
                <p className="text-sm text-slate-400">
                  You need to authorize with Google to access your Search Console data
                </p>
              </div>
              <Button
                onClick={handleSignIn}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold glow-cyan"
              >
                Sign In with Google
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-sm text-slate-400 font-mono">Loading your websites...</p>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-bold text-white mb-2">Success!</p>
              <p className="text-sm text-slate-400">Leaderboard updated successfully</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-400 mb-1">Error</p>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-400 mb-2">No websites found</p>
              <p className="text-xs text-slate-500">
                Make sure you have websites added to Google Search Console
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sites.map((site) => {
                // Check if already added by hash (primary) or URL (fallback)
                const isAlreadyAdded =
                  (site.computedHash && existingSites.has(site.computedHash)) ||
                  existingSites.has(site.siteUrl)

                return (
                  <div
                    key={site.siteUrl}
                    className={`rounded-lg p-4 transition-all duration-300 ${
                      isAlreadyAdded
                        ? 'bg-slate-900/50 border border-slate-800/50 opacity-60'
                        : 'bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className={`h-4 w-4 flex-shrink-0 ${isAlreadyAdded ? 'text-slate-600' : 'text-cyan-400'}`} />
                          <p className={`font-mono text-sm truncate ${isAlreadyAdded ? 'text-slate-500' : 'text-white'}`}>
                            {cleanDomain(site.siteUrl)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isAlreadyAdded
                                ? 'border-slate-700/30 text-slate-600'
                                : 'border-cyan-500/30 text-cyan-400'
                            }`}
                          >
                            {site.permissionLevel}
                          </Badge>
                          {isAlreadyAdded && (
                            <Badge
                              variant="outline"
                              className="text-xs border-green-500/20 bg-green-500/10 text-green-500 flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              ON LEADERBOARD
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isAlreadyAdded ? (
                        <Button
                          onClick={() => handleRemoveSite(site.siteUrl)}
                          disabled={removingSite === site.siteUrl}
                          size="sm"
                          variant="outline"
                          className="ml-4 border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-bold transition-all duration-300 group"
                        >
                          {removingSite === site.siteUrl ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1 group-hover:animate-pulse" />
                              Remove
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleAddSite(site.siteUrl, false)}
                            disabled={submitting}
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-all duration-300 hover:glow-cyan"
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Globe className="h-4 w-4 mr-1" />
                                Add Publicly
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleAddSite(site.siteUrl, true)}
                            disabled={submitting}
                            size="sm"
                            variant="outline"
                            className="border-2 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 font-bold transition-all duration-300"
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Add Anonymously
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
