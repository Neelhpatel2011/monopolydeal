import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { boardCardSurfacePresets } from "../../../components/cards/boardCardSurfaces";
import { getHandRenderCard } from "../../../components/cards/boardCardAdapters";
import type { LocalHandCard } from "../../board/model/localPlayer";

type HandCardProps = {
  card: LocalHandCard;
  isSelected: boolean;
  isDragOrigin?: boolean;
  isInvalid?: boolean;
  renderMode?: "interactive" | "ghost";
  style?: CSSProperties;
  onPress: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function HandCard({
  card,
  isSelected,
  isDragOrigin = false,
  isInvalid = false,
  renderMode = "interactive",
  style,
  onPress,
  onPointerDown,
}: HandCardProps) {
  const renderCard = getHandRenderCard(card);
  const surfacePreset = boardCardSurfacePresets.hand;
  const className =
    `hand-card` +
    `${isSelected ? " hand-card--selected" : ""}` +
    `${isDragOrigin ? " hand-card--drag-origin" : ""}` +
    `${isInvalid ? " hand-card--invalid" : ""}` +
    `${renderMode === "ghost" ? " hand-card--drag-preview" : ""}`;

  const body = (
    <ScaledMonopolyCard
      card={renderCard}
      size={surfacePreset.size}
      scale={surfacePreset.scale}
      className="hand-card__scaled-card"
      surfaceClassName="hand-card__scaled-card-surface"
    />
  );

  if (renderMode === "ghost") {
    return (
      <div className={className} aria-hidden="true" style={style}>
        {body}
      </div>
    );
  }

  return (
    <button
      className={className}
      type="button"
      draggable={false}
      aria-pressed={isSelected}
      aria-label={`${card.label}${isSelected ? ", selected" : ""}`}
      onClick={onPress}
      onPointerDown={onPointerDown}
      onDragStart={(event) => event.preventDefault()}
    >
      {body}
    </button>
  );
}
