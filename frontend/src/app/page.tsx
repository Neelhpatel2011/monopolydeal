'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { GameSummary } from '@/types/api'
import CardBack from '@/components/CardBack'
import { CatalogCard } from '@/components/game/CatalogCard'

const MAX_PLAYERS = 5

export default function LobbyPage() {
  const router = useRouter()
  const [games, setGames] = useState<GameSummary[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [hostName, setHostName] = useState('')
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null)
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [storedPlayers, setStoredPlayers] = useState<Record<string, string>>({})

  const joiningGame =
    joiningGameId
      ? games.find(game => game.game_id === joiningGameId) ?? null
      : null

  const openGames = games.filter(game => !game.started).length
  const liveGames = games.filter(game => game.started).length

  const fetchGames = useCallback(async () => {
    try {
      const data = await api.listGames()
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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const nextStoredPlayers: Record<string, string> = {}
    for (const game of games) {
      const storedPlayerId = localStorage.getItem(`player_id_${game.game_id}`)
      if (storedPlayerId) nextStoredPlayers[game.game_id] = storedPlayerId
    }
    setStoredPlayers(nextStoredPlayers)
  }, [games])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = hostName.trim()
    if (!name) {
      setError('Enter your name to host a table.')
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

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!joiningGameId || !joinName.trim()) return

    if ((joiningGame?.player_ids.length ?? 0) >= MAX_PLAYERS) {
      setError('That table is already full.')
      return
    }

    setJoining(true)
    setError(null)

    try {
      const res = await api.joinGame(joiningGameId, joinName.trim())
      const playerId = res.player_id
      localStorage.setItem(`player_id_${joiningGameId}`, playerId)
      router.push(`/game/${joiningGameId}?player_id=${encodeURIComponent(playerId)}`)
    } catch (err) {
      setError((err as Error).message)
      setJoining(false)
    }
  }

  async function handleQuickStart() {
    setCreating(true)
    setError(null)

    try {
      const game = await api.createGame('Alice')
      await api.joinGame(game.game_id, 'Bob')
      await api.startGame(game.game_id, 'Alice')
      localStorage.setItem(`player_id_${game.game_id}`, 'Alice')
      router.push(`/game/${game.game_id}?player_id=Alice`)
    } catch (err) {
      setError((err as Error).message)
      setCreating(false)
    }
  }

  return (
    <div className="lobby-shell">
      <div className="lobby-shell-glow" aria-hidden="true" />

      <section className="lobby-hero">
        <div className="lobby-hero-copy">
          <span className="lobby-eyebrow">Premium Digital Table</span>
          <h1 className="lobby-title-display">Monopoly Deal</h1>
          <p className="lobby-hero-text">
            Open a private table, seat up to five players, and drop straight into a premium black-and-gold game board built for tactical card play.
          </p>

          <div className="lobby-stat-row">
            <div className="lobby-stat">
              <span className="lobby-stat-label">Open Tables</span>
              <span className="lobby-stat-value">{openGames}</span>
            </div>
            <div className="lobby-stat">
              <span className="lobby-stat-label">Live Games</span>
              <span className="lobby-stat-value">{liveGames}</span>
            </div>
            <div className="lobby-stat">
              <span className="lobby-stat-label">Seats</span>
              <span className="lobby-stat-value">Up to {MAX_PLAYERS}</span>
            </div>
          </div>
        </div>

        <div className="lobby-hero-visual" aria-hidden="true">
          <div className="lobby-hero-deck">
            <div className="lobby-hero-card lobby-hero-card-back lobby-hero-card-a">
              <CardBack />
            </div>
            <div className="lobby-hero-card lobby-hero-card-b">
              <CatalogCard cardId="action_forced_deal" size="fill" />
            </div>
            <div className="lobby-hero-card lobby-hero-card-c">
              <CatalogCard cardId="prop_dark_blue_boardwalk" size="fill" />
            </div>
            <div className="lobby-hero-card lobby-hero-card-d">
              <CatalogCard cardId="action_sly_deal" size="fill" />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="lobby-alert">
          <span className="lobby-alert-kicker">Table Notice</span>
          <span className="lobby-alert-text">{error}</span>
        </div>
      )}

      <div className="lobby-grid">
        <section className="lobby-panel">
          <div className="lobby-panel-head">
            <div>
              <span className="lobby-section-kicker">Host Table</span>
              <h2 className="lobby-panel-title">Open a new lobby</h2>
            </div>
            <span className="lobby-panel-meta">Seat the room, then launch</span>
          </div>

          <form onSubmit={handleCreate} className="lobby-form">
            <label className="lobby-field">
              <span className="lobby-field-label">Host Name</span>
              <input
                type="text"
                value={hostName}
                onChange={event => setHostName(event.target.value)}
                placeholder="Enter your table name"
                maxLength={20}
                aria-label="Your name"
                className="lobby-input"
              />
            </label>

            <div className="lobby-action-row">
              <button
                type="submit"
                disabled={creating || !hostName.trim()}
                className="btn btn-primary"
              >
                {creating ? 'Creating Table...' : 'Create Lobby'}
              </button>
              <button
                type="button"
                onClick={handleQuickStart}
                disabled={creating}
                className="btn btn-ghost"
              >
                Quick Start
              </button>
            </div>
          </form>
        </section>

        <section className="lobby-panel">
          <div className="lobby-panel-head">
            <div>
              <span className="lobby-section-kicker">Live Tables</span>
              <h2 className="lobby-panel-title">Available rooms</h2>
            </div>
            <button
              onClick={fetchGames}
              className="btn btn-ghost lobby-refresh-btn"
              aria-label="Refresh games list"
            >
              Refresh
            </button>
          </div>

          {loadingGames ? (
            <div className="lobby-empty-state">Loading active tables...</div>
          ) : games.length === 0 ? (
            <div className="lobby-empty-state">No tables are open yet. Create one to start.</div>
          ) : (
            <div className="lobby-table-list">
              {games.map(game => {
                const isFull = game.player_ids.length >= MAX_PLAYERS
                const storedPlayerId = storedPlayers[game.game_id] ?? null

                return (
                  <div key={game.game_id} className="lobby-table-row">
                    <div className="lobby-table-copy">
                      <div className="lobby-table-title-row">
                        <span className="lobby-table-id">{game.game_id.slice(0, 8)}</span>
                        <span className={`lobby-table-status ${game.started ? 'lobby-table-status-live' : 'lobby-table-status-open'}`}>
                          {game.started ? 'Live' : 'Lobby'}
                        </span>
                      </div>
                      <div className="lobby-table-meta">
                        {game.player_ids.length}/{MAX_PLAYERS} seated
                      </div>
                      <div className="lobby-table-players">
                        {game.player_ids.join(' - ')}
                      </div>
                    </div>

                    <div className="lobby-table-actions">
                      {!game.started && (
                        <button
                          onClick={() => {
                            setJoiningGameId(game.game_id)
                            setJoinName('')
                          }}
                          disabled={isFull}
                          className="btn btn-ghost"
                        >
                          {isFull ? 'Full' : 'Join'}
                        </button>
                      )}

                      {storedPlayerId && (
                        <button
                          onClick={() => {
                            router.push(`/game/${game.game_id}?player_id=${encodeURIComponent(storedPlayerId)}`)
                          }}
                          className="btn btn-primary"
                        >
                          Rejoin
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {joiningGameId && (
        <div className="modal-backdrop" onClick={() => setJoiningGameId(null)}>
          <div className="modal-panel lobby-join-modal" onClick={event => event.stopPropagation()}>
            <div className="lobby-panel-head">
              <div>
                <span className="lobby-section-kicker">Join Table</span>
                <h3 className="lobby-panel-title">Take a seat</h3>
              </div>
              <span className="lobby-panel-meta">{joiningGameId.slice(0, 8)}</span>
            </div>

            {joiningGame && (
              <div className="lobby-join-summary">
                <span>{joiningGame.player_ids.length}/{MAX_PLAYERS} seated</span>
                <span>{joiningGame.player_ids.join(' - ')}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="lobby-form">
              <label className="lobby-field">
                <span className="lobby-field-label">Player Name</span>
                <input
                  type="text"
                  value={joinName}
                  onChange={event => setJoinName(event.target.value)}
                  placeholder="Enter your player name"
                  maxLength={20}
                  autoFocus
                  aria-label="Your player name"
                  className="lobby-input"
                />
              </label>

              <div className="lobby-action-row">
                <button type="button" onClick={() => setJoiningGameId(null)} className="btn btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinName.trim() || (joiningGame?.player_ids.length ?? 0) >= MAX_PLAYERS}
                  className="btn btn-primary"
                >
                  {joining
                    ? 'Joining...'
                    : (joiningGame?.player_ids.length ?? 0) >= MAX_PLAYERS
                      ? 'Table Full'
                      : 'Join Lobby'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
