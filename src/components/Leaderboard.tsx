import React, { useState, useEffect, useCallback } from 'react'
import { leaderboardService } from '@/lib/LeaderboardService'
import type { LeaderboardEntry } from '@/lib/LeaderboardService'
import { useAuth } from '@/contexts/AuthContext'

interface LeaderboardProps {
  currentScore?: number
  currentWave?: number
  onClose: () => void
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentScore, currentWave, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchScores = useCallback(async () => {
    setLoading(true)
    try {
      const scores = await leaderboardService.getTopScores()
      setEntries(scores)
    } catch {
      setEntries([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  const handleSubmitScore = async () => {
    if (!user || !currentScore || currentScore <= 0 || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await leaderboardService.submitScore({
        score: currentScore,
        wave: currentWave ?? 1,
        username: user.displayName || 'Anonymous',
        biome: 'neon_core',
        prestigeLevel: 0,
        bugsKilled: 0,
      })
      await fetchScores()
    } catch {
      setSubmitError('Failed to submit score. Check your connection.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/30 font-mono tracking-[0.3em]">GLOBAL LEADERBOARD</div>
            <div className="text-[10px] text-white/20 font-mono mt-1">TOP SCORES WORLDWIDE</div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-mono text-white/30 hover:text-white/60 border border-white/10 hover:border-white/30 transition-all tracking-widest"
          >
            CLOSE
          </button>
        </div>

        <div className="p-6">
          {currentScore && currentScore > 0 && (
            <div className="mb-6 p-4 border border-yellow-400/20 bg-yellow-400/5">
              <div className="text-[10px] font-mono text-yellow-400/60 tracking-wider mb-2">YOUR SCORE: {currentScore}</div>
              {user ? (
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  className="w-full py-3 text-[10px] font-mono tracking-widest border border-yellow-400/30 hover:border-yellow-400/60 text-yellow-400/60 hover:text-yellow-400/80 transition-all disabled:opacity-50"
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT SCORE TO LEADERBOARD'}
                </button>
              ) : (
                <div className="text-[10px] font-mono text-white/20 text-center tracking-wider">SIGN IN WITH ACCOUNT TO SUBMIT SCORES</div>
              )}
              {submitError && <div className="mt-2 text-[10px] font-mono text-red-400/60 text-center">{submitError}</div>}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-[10px] font-mono text-white/20 tracking-wider">LOADING...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-[10px] font-mono text-white/30 tracking-wider">NO SCORES YET</div>
              <div className="text-[9px] font-mono text-white/10 mt-2">Be the first to claim your place</div>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className={`flex items-center justify-between p-3 border ${
                    index < 3 ? 'border-yellow-400/20' : 'border-white/5'
                  } ${index === 0 ? 'bg-yellow-400/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 text-center text-xs font-mono font-bold ${
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-white/30'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-white/70 truncate max-w-[150px]">{entry.username}</div>
                      <div className="text-[9px] font-mono text-white/20">Wave {entry.wave}</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono font-bold text-white/80">{entry.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
