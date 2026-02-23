import { Card as CardType } from "@/types/card"
import Pile from "./Pile"
import ActiveCardSlot from "./ActiveCardSlot"
import CardBack from "@/components/CardBack"
import MiniActionCard from "@/components/MiniActionCard"
import { actionCards } from "@/data/cards/action"

type GameBoardProps = {
    activeCard: CardType | null
}

export default function GameBoard({ activeCard }: GameBoardProps) {
    return (
        <div className="flex items-center justify-center gap-4 md:gap-10 my-12">
            <Pile type="discard">
                <MiniActionCard card={actionCards[0]} />
            </Pile>
            <ActiveCardSlot card={activeCard} />
            <Pile type="draw">
                <CardBack></CardBack>
            </Pile>
        </div>
    )
}