import { Card as CardType } from "@/types/card"

type CardProps = {
  card: CardType
}

export default function Card({ card }: CardProps) {
    return (
        <div className={`
            bg-gray-50  rounded-lg
            w-full h-full
            flex flex-col
            p-2
            relative
            text-black
            overflow-hidden
        `}>
            <span className={`
                absolute -top-1 -left-1
                ${card.color} border-2 border-black rounded-full
                w-6 h-6 md:w-8 md:h-8
                flex items-center justify-center
                text-[0.6rem] md:text-xs font-bold
            `}>
                ${card.bankValue}
            </span>

            <span className={`
                absolute -bottom-1 -right-1
                ${card.color} border-2 border-black rounded-full
                w-6 h-6 md:w-8 md:h-8
                flex items-center justify-center
                text-[0.6rem] md:text-xs font-bold
            `}>
                ${card.bankValue}
            </span>

            <div className={`
                flex flex-col flex-1
                ${card.color} border-2 border-black rounded-md
                overflow-hidden
            `}>
                {card?.category == "action" && (
                    <h3 className="text-center text-[0.7rem] md:text-xs font-extrabold tracking-tighter pt-2">
                        ACTION CARD
                    </h3>

                )}
                <div className="
                    flex-1
                    flex items-center justify-center
                    min-h-0
                    pt-2
                ">
                    <div className="
                        aspect-square w-[85%] max-h-full
                        bg-gray-50 border-3 border-black rounded-full
                        flex items-center justify-center
                        p-1
                    ">
                        <span className="
                            font-black text-center
                            text-xl md:text-3xl
                            leading-tight
                        ">
                            {card.name}
                        </span>
                    </div>
                </div>

                <div className="text-[0.6rem] md:text-xs text-center px-2 pb-2 pt-2 leading-tight">
                    {card.description}
                </div>
            </div>
        </div>
    )
}