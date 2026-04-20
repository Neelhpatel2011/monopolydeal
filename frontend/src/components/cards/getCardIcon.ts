import { ActionIcon, MoneyIcon, PropertyIcon, RentIcon, WildIcon } from "./CardIcons";

export function getCardIcon(kind?: string) {
  switch (kind) {
    case "property":
      return PropertyIcon;
    case "money":
      return MoneyIcon;
    case "rent":
      return RentIcon;
    case "wild":
      return WildIcon;
    case "action":
    default:
      return ActionIcon;
  }
}
