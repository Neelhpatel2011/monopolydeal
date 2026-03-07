'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { GameSummary } from '@/types/api'
import CardBack from '@/components/CardBack'

export default function LobbyPage() {
  const router = useRouter()
  const [games, setGames] = useState<GameSummary[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create game state
  const [creating, setCreating] = useState(false)
  const [hostName, setHostName] = useState('')

  // Join game state
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null)
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)

  const fetchGames = useCallback(async () => {
    try {
      const data = await api.listGames()
      // Ensure we always have an array
      setGames(Array.isArray(data) ? data : [])
    } catch {
      setGames([])
    } finally {
      setLoadingGames(false)
    }
  }, [])

  useEffect(() => {
    fetchGames()
    const interval = setInterval(fetchGames, 5000)
    return () => clearInterval(interval)
  }, [fetchGames])

  // ─── Create Game ─────────────────────────────────────────────────────────

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = hostName.trim()
    if (!name) {
      setError('Enter your name to host a lobby.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const game = await api.createGame(name)
      localStorage.setItem(`player_id_${game.game_id}`, name)
      router.push(`/game/${game.game_id}?player_id=${encodeURIComponent(name)}`)
    } catch (err) {
      setError((err as Error).message)
      setCreating(false)
    }
  }

  // ─── Join Game ────────────────────────────────────────────────────────────

  async function handleJoin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!joiningGameId || !joinName.trim()) return
    setJoining(true)
    setError(null)
    try {
      const res = await api.joinGame(joiningGameId, joinName.trim())
      const pid = res.player_id
      localStorage.setItem(`player_id_${joiningGameId}`, pid)
      router.push(`/game/${joiningGameId}?player_id=${encodeURIComponent(pid)}`)
    } catch (err) {
      setError((err as Error).message)
      setJoining(false)
    }
  }

  // ─── Quick Start (dev helper) ─────────────────────────────────────────────

  async function handleQuickStart() {
    setCreating(true)
    setError(null)
    try {
      const game = await api.createGame('Alice')
      await api.joinGame(game.game_id, 'Bob')
      await api.startGame(game.game_id)
      localStorage.setItem(`player_id_${game.game_id}`, 'Alice')
      router.push(`/game/${game.game_id}?player_id=Alice`)
    } catch (err) {
      setError((err as Error).message)
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      {/* Header */}
      <div className="zone w-full max-w-3xl p-5 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-1">
            Monopoly Deal
          </h1>
          <p className="text-white/50 text-sm">
            Host a lobby, invite friends, then start the game.
          </p>
        </div>
        <div className="hidden sm:block pile-visual pile-visual-deck" style={{ width: 76 }}>
          <CardBack />
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Error Banner */}
        {error && (
          <div className="zone border-red-500/50 bg-red-900/20 text-red-300 p-3 text-sm rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        {/* Create Game */}
        <div className="zone p-5">
          <h2 className="text-lg font-semibold mb-4 text-white/90">Host Lobby</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <span className="text-white/40 text-sm w-16 shrink-0">You</span>
                <input
                  type="text"
                  value={hostName}
                  onChange={e => setHostName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  aria-label="Your name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={creating || !hostName.trim()}
                className="btn btn-primary flex-1"
              >
                {creating ? 'Creating…' : 'Create Lobby'}
              </button>
            </div>
          </form>

          <div className="mt-3 pt-3 border-t border-white/5">
            <button
              onClick={handleQuickStart}
              disabled={creating}
              className="btn btn-ghost w-full text-xs text-white/40"
            >
              Quick Start (Alice vs Bob) — dev helper
            </button>
          </div>
        </div>

        {/* Active Games */}
        <div className="zone p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/90">Active Games</h2>
            <button
              onClick={fetchGames}
              className="text-white/30 hover:text-white/70 text-xs transition-colors"
              aria-label="Refresh games list"
            >
              ↻ Refresh
            </button>
          </div>

          {loadingGames ? (
            <p className="text-white/30 text-sm text-center py-4">Loading…</p>
          ) : games.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No active games. Create one above.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {games.map(game => (
                <div
                  key={game.game_id}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 hover:bg-white/8 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-white font-medium font-mono">
                      {game.game_id.slice(0, 8)}…
                    </span>
                    <span className="text-xs text-white/40">
                      {game.started ? 'active' : 'lobby'} · {game.player_ids.join(', ')}
                    </span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className={`w-2 h-2 rounded-full ${game.started ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    {!game.started && (
                      <button
                        onClick={() => {
                          setJoiningGameId(game.game_id)
                          setJoinName('')
                        }}
                        className="btn btn-ghost text-xs"
                      >
                        Join
                      </button>
                    )}
                    {/* Rejoin if localStorage has player_id */}
                    {typeof window !== 'undefined' && localStorage.getItem(`player_id_${game.game_id}`) && (
                      <button
                        onClick={() => {
                          const pid = localStorage.getItem(`player_id_${game.game_id}`)!
                          router.push(`/game/${game.game_id}?player_id=${encodeURIComponent(pid)}`)
                        }}
                        className="btn btn-primary text-xs"
                      >
                        Rejoin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join Modal */}
        {joiningGameId && (
          <div className="modal-backdrop" onClick={() => setJoiningGameId(null)}>
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1">Join Game</h3>
              <p className="text-white/40 text-xs mb-4 font-mono">{joiningGameId}</p>
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  placeholder="Your player name"
                  maxLength={20}
                  autoFocus
                  aria-label="Your player name"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setJoiningGameId(null)} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={joining || !joinName.trim()} className="btn btn-primary flex-1">
                    {joining ? 'Joining…' : 'Join Game'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
