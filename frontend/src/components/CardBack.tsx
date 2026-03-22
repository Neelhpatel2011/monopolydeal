export default function CardBack() {
  return (
    <div className="card-back" aria-label="Deck">
      <div className="card-back-inner">
        <span className="card-back-corner card-back-corner-top" />
        <span className="card-back-corner card-back-corner-bottom" />

        <div className="card-back-mark">
          <div className="card-back-ring">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4.5 9.5 12 4l7.5 5.5v8.5h-5.25v-4.5H9.75v4.5H4.5z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="card-back-title">Monopoly Deal</span>
          <span className="card-back-subtitle">Table Deck</span>
        </div>
      </div>
    </div>
  )
}
