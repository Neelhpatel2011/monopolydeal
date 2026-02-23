import { Card as CardType } from "@/types/card"

type CardProps = {
    card: CardType
}
// ToDo - move money bubble into the inner div? Look at pics, I didn't copy the card design right
export default function PropertyCard({ card }: CardProps) {
    return (
        <div className={`
            bg-gray-50 rounded-lg
            w-full h-full
            flex flex-col
            p-2
            relative
            text-black
            overflow-hidden
        `}>
            <span className={`
                absolute -top-1 -left-1
                bg-gray-50 border-2 border-black rounded-full
                w-6 h-6 md:w-8 md:h-8
                flex items-center justify-center
                text-[0.6rem] md:text-xs font-bold
            `}>
                ${card.bankValue}
            </span>

            <div className="
                flex flex-col flex-1 items-center
                border-2 border-black rounded-md
            ">
                <header className={`
                    ${card.color}
                    p-2 border-black border-1 m-2
                    text-center uppercase font-extrabold leading-tight text-xs
                `}>
                    {card.name}
                </header>

                <div className="w-full flex justify-center px-2">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-x-0 gap-y-1 items-center">
                        {/* Header row */}
                        <span className="text-[0.35rem] md:text-[0.5rem] text-gray-600 mb-1 text-center">
                            (No. of properties owned in set)
                        </span>
                        <span></span>
                        <span className="text-[0.65rem] md:text-[0.5rem] text-center">RENT</span>

                        {/* 1 property rent row */}
                        <div className="bg-yellow-300 border border-black rounded-sm aspect-card w-4 flex items-center justify-center text-xs justify-self-center">
                            1
                        </div>
                        <div className="border-b border-dotted border-gray-400"></div>
                        <span className="font-bold text-[0.6rem] text-center">$2M</span>

                        {/* 2 properties rent row */}
                        <div className="flex -space-x-3 justify-self-center">
                            <div className="bg-yellow-300 border border-black rounded-sm aspect-card w-4" />
                            <div className="bg-yellow-300 border border-black rounded-sm aspect-card w-4 flex items-center justify-center text-xs">
                                2
                            </div>
                        </div>
                        <div className="border-b border-dotted border-gray-400"></div>
                        <span className="font-bold text-[0.6rem] text-center">$4M</span>

                        {/* 3 properties (FULL SET) rent row */}
                        <div className="flex -space-x-3 justify-self-center">
                            <div className="bg-yellow-300 border border-black rounded-sm aspect-card w-4" />
                            <div className="bg-yellow-300 border border-black rounded-sm aspect-card w-4" />
                            <div className="bg-yellow-300 border border-black rounded-sm aspect-card w-4 flex items-center justify-center text-xs">
                                3
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <span className="text-[0.5rem] font-bold whitespace-nowrap">FULL SET</span>
                            <div className="border-b border-dotted border-gray-400 flex-1"></div>
                        </div>
                        <span className="font-bold text-[0.6rem] text-center">$6M</span>
                    </div>
                </div>
            </div>
        </div>
    )
}