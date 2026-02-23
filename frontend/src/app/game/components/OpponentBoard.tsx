import { colorBgMap } from "@/lib/tailwind-parsing"
import { PlayerColor } from "@/types/player"

type OpponentsBoardProps = {
    color: PlayerColor
    icon: string
    name: string
    money: number
    children?: React.ReactNode // property cards played to their board
    // ToDo - change children to be specific property card component, not React.ReactNode
}

export default function OpponentBoard({ color, icon, name, money, children }: OpponentsBoardProps) {
    return (
        <section className="@container flex flex-1 flex-col bg-container-bg rounded-md overflow-hidden text-foreground min-w-23 h-40">
           <header className={`flex items-center justify-between border-slate-600 p-2 ${colorBgMap[color]}`}>
                <div className="flex items-center gap-2">
                    <img src={icon} alt={`${name} icon`} className="w-7 h-7 rounded-full border border-slate-600"/>
                    <p className="hidden @[140px]:block whitespace-nowrap">{name}</p>
                </div>
                <p>${money}</p>
            </header>
            <div className="pl-2">
                <p>x7</p>
                <ul className="flex min-h-50 overflow-x-auto">
                    {children}
                </ul>
            </div>
        </section>
    )
}