export default function CardBack() {
  return (
    <div
      className="card-back w-full h-full"
      style={{
        background:
          "linear-gradient(135deg, #b11b1b 0%, #6b0b0b 48%, #200404 100%)",
      }}
      aria-label="Deck"
    >
      {/* Lighting */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 18%, rgba(255,255,255,0.18), transparent 56%), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.10), transparent 62%)",
        }}
      />

      {/* Diagonal pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 7px)",
          opacity: 0.28,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-white px-1">
        <div className="font-display" style={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Monopoly
        </div>
        <div className="font-display" style={{ fontSize: "0.56rem", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: -2 }}>
          Deal
        </div>
        <div style={{ width: 22, height: 1, background: "rgba(255,255,255,0.35)", marginTop: 6 }} />
        <div className="font-mono" style={{ fontSize: "0.45rem", opacity: 0.7, marginTop: 4 }}>
          MD
        </div>
      </div>
    </div>
  )
}
