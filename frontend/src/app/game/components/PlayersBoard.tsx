import { moneyCards } from "@/data/cards/money"
import Pile from "./Pile"
import MiniMoneyCard from "@/components/MiniMoneyCard"

export default function PlayersBoard() {
    return (
        <div className="flex items-stretch justify-center gap-2 w-full">
            <Pile type="bank">
                <MiniMoneyCard card={moneyCards[3]}/>
            </Pile>
            <div id="property container" className="flex bg-container-bg flex-1 rounded-sm overflow-x-auto">
            </div>
        </div>
    )
}