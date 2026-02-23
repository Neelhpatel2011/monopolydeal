import { Card as CardType } from "@/types/card"

type CardProps = {
  card: CardType
}

export default function MiniActionCard({ card }: CardProps) {
  return (
    <div
      className={`
        aspect-card w-15 border-1 border-white
        ${card.lighterColor} rounded-md
        flex flex-col
        overflow-hidden
        text-black
      `}
    >
      <header
        className={`
          flex justify-between items-center
          ${card.color} px-1 py-0.5
          font-bold
        `}
      >
        <span className="text-[0.65rem]">${card.bankValue}</span>
        <span className="text-[0.45rem]">{card.category.toUpperCase()}</span>
      </header>

      <h3
        className="
          flex-1 flex items-center justify-center
          text-center px-1
          text-xs font-semibold
        "
      >
        {card.name}
      </h3>
    </div>
  )
}