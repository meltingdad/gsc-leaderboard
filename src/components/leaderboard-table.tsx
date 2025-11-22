'use client'

import { useState } from 'react'
import { ArrowUpDown, TrendingUp, Eye, MousePointer, Target } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type SortField = 'clicks' | 'impressions' | 'ctr' | 'position'
type SortDirection = 'asc' | 'desc'

interface LeaderboardEntry {
  id: string
  rank: number
  domain: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  lastUpdated: Date
  anonymous: boolean
  faviconUrl: string | null
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  const [sortField, setSortField] = useState<SortField>('clicks')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    }
    return aValue < bValue ? 1 : -1
  })

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="metallic-gold px-4 py-2 rounded-lg font-black text-slate-900 text-lg min-w-[60px] text-center">
          #1
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="metallic-silver px-4 py-2 rounded-lg font-black text-slate-900 text-lg min-w-[60px] text-center">
          #2
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="metallic-bronze px-4 py-2 rounded-lg font-black text-slate-900 text-lg min-w-[60px] text-center">
          #3
        </div>
      )
    }
    return (
      <div className="border-2 border-slate-700 px-4 py-2 rounded-lg font-bold text-slate-400 text-lg min-w-[60px] text-center font-mono">
        #{rank}
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const formatCTR = (ctr: number) => {
    return ctr.toFixed(2) + '%'
  }

  const formatPosition = (pos: number) => {
    return pos.toFixed(1)
  }

  const SortButton = ({ field, label, icon: Icon }: { field: SortField; label: string; icon?: any }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-2 font-mono uppercase text-xs tracking-wider transition-colors hover:text-cyan-400 ${
        sortField === field ? 'text-cyan-400' : 'text-slate-400'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 backdrop-blur-sm">
        <div className="grid grid-cols-[80px_1fr_repeat(4,120px)_140px] gap-4 items-center">
          <div className="font-mono uppercase text-xs tracking-wider text-slate-400">Rank</div>
          <div className="font-mono uppercase text-xs tracking-wider text-slate-400">Domain</div>
          <div className="text-right">
            <SortButton field="clicks" label="Clicks" icon={MousePointer} />
          </div>
          <div className="text-right">
            <SortButton field="impressions" label="Impressions" icon={Eye} />
          </div>
          <div className="text-right">
            <SortButton field="ctr" label="AVG CTR" icon={TrendingUp} />
          </div>
          <div className="text-right">
            <SortButton field="position" label="AVG Position" icon={Target} />
          </div>
          <div className="text-right font-mono uppercase text-xs tracking-wider text-slate-400">
            Updated
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-3">
        {sortedData.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center backdrop-blur-sm">
            <div className="text-slate-500 font-mono">
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-lg mb-2">NO COMPETITORS YET</div>
              <div className="text-sm text-slate-600">Be the first to enter the arena</div>
            </div>
          </div>
        ) : (
          sortedData.map((entry, index) => (
            <div
              key={entry.id}
              className="group bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:glow-cyan animate-count-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="grid grid-cols-[80px_1fr_repeat(4,120px)_140px] gap-4 items-center">
                {/* Rank Badge */}
                <div>{getRankBadge(entry.rank)}</div>

                {/* Domain */}
                <div className="flex items-center gap-2 font-display font-bold text-white text-lg truncate group-hover:text-cyan-400 transition-colors">
                  {entry.anonymous ? (
                    <>
                      <span className="blur-sm select-none">••••••••••••</span>
                      <span className="ml-2 text-xs text-purple-400 font-mono">(ANONYMOUS)</span>
                    </>
                  ) : (
                    <>
                      {entry.faviconUrl && (
                        <img
                          src={entry.faviconUrl}
                          alt=""
                          className="w-5 h-5 flex-shrink-0"
                          onError={(e) => {
                            // Hide favicon if it fails to load
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <span className="truncate">{entry.domain}</span>
                    </>
                  )}
                </div>

                {/* Clicks */}
                <div className="text-right font-mono text-lg font-bold text-cyan-400">
                  {formatNumber(entry.clicks)}
                </div>

                {/* Impressions */}
                <div className="text-right font-mono text-lg font-bold text-purple-400">
                  {formatNumber(entry.impressions)}
                </div>

                {/* CTR */}
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-mono text-sm font-bold ${
                    entry.ctr > 3
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {entry.ctr > 3 ? <TrendingUp className="h-3 w-3" /> : null}
                    {formatCTR(entry.ctr)}
                  </div>
                </div>

                {/* Position */}
                <div className="text-right font-mono text-lg font-bold text-amber-400">
                  {formatPosition(entry.position)}
                </div>

                {/* Last Updated */}
                <div className="text-right">
                  <div className="text-xs font-mono text-slate-500">
                    {formatDistanceToNow(new Date(entry.lastUpdated), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
