import { Card as CardType } from "@/types/card"

type PileProps = {
    type: "draw" | "discard" | "bank"
    widthClass?: string
    card?: CardType | null
    children?: React.ReactNode
}

export default function Pile({ widthClass = "w-14 md:w-20", children }: PileProps) {
    return (
        <div
            className={`aspect-card bg-container-bg rounded-md flex items-center justify-center ${widthClass} min-w-14`}
        >
            {
                children ? (
                    children
                ) : (
                    <span className="text-slate-400 text-sm">Empty</span>
                )
            }
        </div>
    )
}
