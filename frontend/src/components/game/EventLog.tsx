'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/contexts/GameContext'

export function EventLog() {
  const { state, dispatch } = useGame()
  const { eventLog, eventLogCollapsed } = state
  const open = !eventLogCollapsed
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = 0
    }
  }, [eventLog, open])

  return (
    <>
      <button
        type="button"
        className="nav-log-btn"
        onClick={() => dispatch({ type: 'TOGGLE_EVENT_LOG' })}
        aria-label={open ? 'Close event log' : 'Open event log'}
      >
        Log
        {eventLog.length > 0 && <span className="nav-log-count">{eventLog.length}</span>}
      </button>

      {open && (
        <div
          className="event-log-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Event log"
          onClick={() => dispatch({ type: 'TOGGLE_EVENT_LOG' })}
        >
          <div className="event-log-panel" onClick={(e) => e.stopPropagation()}>
            <div className="event-log-panel-head">
              <div>
                <div className="event-log-panel-title">Event Log</div>
                <div className="event-log-panel-sub">Most recent first</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => dispatch({ type: 'TOGGLE_EVENT_LOG' })}
                aria-label="Close event log"
              >
                Close
              </button>
            </div>

            <div ref={scrollRef} className="event-log-panel-body">
              {eventLog.length === 0 ? (
                <div className="event-log-empty">No events yet</div>
              ) : (
                eventLog.map((entry, i) => (
                  <div key={i} className={`event-entry ${i === 0 ? 'event-entry-latest' : ''}`}>
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

