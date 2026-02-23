'use client'
import { useState } from "react"
import { PlayerColor } from "@/types/player";
import { colorBgMap } from "@/lib/tailwind-parsing"
import MiniActionCard from "@/components/MiniActionCard";
import FullCard from "@/components/Card";
import { actionCards } from "@/data/cards/action";
import { Card } from "@/types/card";
import { moneyCards } from "@/data/cards/money";
import MiniMoneyCard from "@/components/MiniMoneyCard";

export default function PlayersHand() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // const cards: Card[] = [actionCards[0], actionCards[1], actionCards[2], actionCards[3], actionCards[4]]
  // const cards: Card[] = [actionCards[0], actionCards[1], actionCards[2], actionCards[3], actionCards[4], actionCards[5], actionCards[6]]
  // const cards: Card[] = [actionCards[0], actionCards[1], actionCards[2], actionCards[3], actionCards[4], actionCards[5], actionCards[6], actionCards[7], actionCards[8], actionCards[9]]
  const cards: Card[] = [actionCards[0], actionCards[1], moneyCards[2], actionCards[3], actionCards[4], actionCards[5], actionCards[6], actionCards[7], actionCards[8], actionCards[9]]
  // const cards: PlayerColor[] = ["red", "orange", "yellow", "green", "blue", "purple", "pink"]

  const middle = (cards.length - 1) / 2
  const baseSpacing = 35
  const baseRotation = 3.5
  const scaleFactor = Math.max(0.3, 1 - ((cards.length - 7) * 0.12))
  const spreadOnHover = 50

  return (
    <div className="relative w-full h-36 md:h-44 mt-auto">
      {cards.map((card, i) => {
          const offset = i - middle

          let translateX = offset * (baseSpacing * scaleFactor)
          const rotation = offset * (baseRotation * scaleFactor)
          let translateY = Math.abs(rotation) * 1.2

          if (offset === 0) translateY += 3

          // Spread effect: move cards away from hovered card
          if (hoveredIndex !== null && hoveredIndex !== i) {
            if (i < hoveredIndex) {
              translateX -= spreadOnHover
            } else {
              translateX += spreadOnHover
            }
          }

          return (
            <div
              key={i}
              className="
                absolute top-1/2 left-1/2
              "
              style={{
                transform: `
                  translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))
                  rotate(${rotation}deg)
                `,
                transition: 'transform 0.4s ease-out'
              }}
            >
              <div
                className="
                  hover:-translate-y-10
                  hover:drop-shadow-xl
                  hover:scale-115
                  hover:py-5
                  hover:px-2
                  transition-all duration-400 ease-out
                  cursor-pointer
                "
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {card.category === "action" ?
                  <MiniActionCard card={card} /> :
                  <MiniMoneyCard card={card} />

                }
              </div>
            </div>
          )
        })}

      {/* Full card preview overlay */}
      {hoveredIndex !== null && (
        <div
          className="
            fixed inset-0
            flex items-center justify-center
            pointer-events-none
            z-50
          "
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div
            className="aspect-card drop-shadow-2xl flex-shrink-0" 
            // ToDo - adding overflow hidden gets rid of overflow, but cuts off bottom of card when viewing fullc ard on player hand over. Figure out why and how to fix.
            style={{
              animation: 'zoomIn 0.5s ease-out',
              width: 'clamp(13rem, 13rem, 13rem)',
              height: 'auto'
            }}
          >
            <FullCard card={cards[hoveredIndex]} />
          </div>
        </div>
      )}
    </div>
  )
}