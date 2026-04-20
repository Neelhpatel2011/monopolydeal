import type { MonopolyDealCardData, MonopolyDealCardSize } from "../../types/monopolyDeal";
import { ActionCardFace } from "./ActionCardFace";
import { MoneyCardFace } from "./MoneyCardFace";
import { PropertyCardFace } from "./PropertyCardFace";
import { RentCardFace } from "./RentCardFace";
import { WildCardFace } from "./WildCardFace";

type MonopolyDealCardProps = {
  card: MonopolyDealCardData;
  size?: MonopolyDealCardSize;
};

export function MonopolyDealCard({ card, size = "md" }: MonopolyDealCardProps) {
  switch (card.type) {
    case "property":
      return <PropertyCardFace card={card} size={size} />;
    case "rent":
      return <RentCardFace card={card} size={size} />;
    case "money":
      return <MoneyCardFace card={card} size={size} />;
    case "wild":
      return <WildCardFace card={card} size={size} />;
    case "action":
      return <ActionCardFace card={card} size={size} />;
  }
}
