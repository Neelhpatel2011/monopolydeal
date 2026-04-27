import rawCatalog from "../../data/monopolyDealCards.json";
import type {
  MonopolyDealCardByType,
  MonopolyDealCardColor,
  MonopolyDealCardData,
} from "../../types/monopolyDeal";
import type {
  BoardHandCardRef,
  BoardMoneyCardRef,
  BoardPropertyCardRef,
  BoardRenderableCardRef,
} from "./renderRefs";
import type { LocalPropertySet } from "../../features/board/model/localPlayer";
import type { OpponentPropertySet } from "../../features/opponents/model/opponentExpansion";
import { parseMonopolyDealCatalog } from "./catalog";

const catalog = parseMonopolyDealCatalog(rawCatalog);

const cardsById = new Map(catalog.map((card) => [card.id, card]));

function getCatalogCard<TCard extends MonopolyDealCardData>(id: string) {
  const card = cardsById.get(id);

  if (!card) {
    throw new Error(`Missing Monopoly Deal catalog card: ${id}`);
  }

  return card as TCard;
}

export function getRenderCardByCatalogId(catalogCardId: string) {
  return getCatalogCard(catalogCardId);
}

function getRenderCard(card: BoardRenderableCardRef) {
  return getCatalogCard(card.catalogCardId);
}

function getWildCardIdForColor(color: MonopolyDealCardColor) {
  switch (color) {
    case "brown":
    case "light_blue":
      return "wild-brown-lightblue";
    case "pink":
    case "orange":
      return "wild-pink-orange";
    case "red":
    case "yellow":
      return "wild-red-yellow";
    case "green":
    case "dark_blue":
      return "wild-green-darkblue";
    case "railroad":
      return "wild-railroad-utility";
    case "utility":
      return "wild-railroad-utility";
    case "any":
    default:
      return "wild-any";
  }
}

function buildFallbackRentCard(colors: MonopolyDealCardColor[]) {
  const [first = "brown", second = first] = colors;

  return {
    ...getCatalogCard<MonopolyDealCardByType<"rent">>("rent-green-blue"),
    id: `rent-fallback-${colors.join("-")}`,
    gradientFrom: getCatalogCard<MonopolyDealCardByType<"wild">>(getWildCardIdForColor(first))
      .gradientFrom,
    gradientTo: getCatalogCard<MonopolyDealCardByType<"wild">>(getWildCardIdForColor(second))
      .gradientTo,
    rentColors: colors,
    value: "$1M",
  } satisfies MonopolyDealCardByType<"rent">;
}

export function getHandRenderCard(card: BoardHandCardRef): MonopolyDealCardData {
  return getRenderCard(card);
}

export function getPropertySetRenderCards(set: LocalPropertySet | OpponentPropertySet) {
  return set.cards.map((card: BoardPropertyCardRef) => getRenderCard(card));
}

export function getBankRenderCard(card: BoardMoneyCardRef): MonopolyDealCardData {
  return getRenderCard(card);
}

export function getRentPreviewCardForSet(colors: MonopolyDealCardColor[]) {
  if (colors.length === 1 && colors[0] === "any") {
    return getCatalogCard("rent-wild");
  }

  const exact = catalog.find(
    (card): card is MonopolyDealCardByType<"rent"> =>
      card.type === "rent" &&
      card.rentColors.length === colors.length &&
      card.rentColors.every((color, index) => color === colors[index]),
  );

  return exact ?? buildFallbackRentCard(colors);
}
