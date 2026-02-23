import type { Card } from "@/types/card"
import GameBoard from "./components/GameBoard"
import OpponentBoard from "./components/OpponentBoard"
import PlayersBoard from "./components/PlayersBoard"
import PlayersHand from "./components/PlayersHand"
import EmoteButton from "./components/EmoteButton"
import { actionCards } from "@/data/cards/action"
import { moneyCards } from "@/data/cards/money"
import { propertyCards } from "@/data/cards/property"

export default function GamePage() {
    return (
        <main className="flex flex-col w-full h-full overflow-hidden px-2 py-4 min-w-[320px]">
            <div id="opponents-container" className="flex gap-1 overflow-x-auto">
                <OpponentBoard
                    color="blue"
                    icon="/kitchenGoblin.png"
                    name="Jack"
                    money={15}
                >
                    <div>card 1</div>  
                </OpponentBoard>
                <OpponentBoard
                    color="red"
                    icon="/chickHicks.webp"
                    name="Mihir"
                    money={15}
                >
                    <div>card 2</div>  
                </OpponentBoard>
                <OpponentBoard
                    color="green"
                    icon="/loneWolf.jpg.webp"
                    name="Roman"
                    money={15}
                >
                    <div>card 3</div>  
                </OpponentBoard>
            </div>

            {/* Center GameBoard vertically */}
            <div className="flex-1 flex items-center justify-center">
                <GameBoard activeCard={propertyCards[0]} />
            </div>

            {/* Bottom section */}
            <PlayersBoard />
            <PlayersHand />

        </main>
    )
}