import Card from "@/components/Card"
import PropertyCard from "@/components/PropertyCard"
import { Card as CardType} from "@/types/card"

type ActiveCardSlotProps = {
    card?: CardType | null
}

export default function ActiveCardSlot({ card }: ActiveCardSlotProps) {
    return (
        <div className="
            aspect-card w-36 min-w-36
            md:w-52
            bg-container-bg rounded-lg
            flex items-center justify-center
            "
        >
            {
                card ? (
                    card.category === "property" ? 
                        <PropertyCard card={card}/> :
                        <Card card={card} />
                ) : (
                    <span className="
                            text-slate-400
                            text-xs md:text-lg
                        "
                    >
                        Play a card silly goose!
                    </span>
                )
            }
        </div>
    )
}