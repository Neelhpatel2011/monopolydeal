import { Card as CardType } from "@/types/card"

type CardProps = {
    card: CardType
}

export default function MiniMoneyCard({ card }: CardProps) {
    return (
        <div className="
            aspect-card w-15 border-1 border-white rounded-md
            bg-gray-50
            overflow-hidden
            flex flex-1
        ">
            <div className={`
                ${card.color}
                flex flex-1 items-center justify-center
            `}>
                <div className="
                    aspect-square rounded-full w-full max-h-full
                    border-2 border-black bg-gray-50
                    flex items-center justify-center
                    p-1
                    text-black font-black
                ">
                    ${card.bankValue}M
                </div>
            </div>
        </div>
    )
}