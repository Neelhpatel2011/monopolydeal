import type { CSSProperties } from "react";
import type { DragPreviewState } from "../../board/model/interaction-types";
import type { LocalHandCard } from "../../board/model/localPlayer";
import { HandCard } from "../../hand/components/HandCard";

type DragPreviewProps = {
  card: LocalHandCard;
  preview: DragPreviewState;
};

export function DragPreview({ card, preview }: DragPreviewProps) {
  const style: CSSProperties = {
    transform: `translate3d(${preview.clientX - preview.offsetX}px, ${preview.clientY - preview.offsetY}px, 0)`,
    width: preview.width,
    height: preview.height,
  };

  return (
    <div className="drag-preview-layer" aria-hidden="true">
      <div className={`drag-preview drag-preview--${preview.pointerType}`} style={style}>
        <HandCard card={card} isSelected={false} renderMode="ghost" onPress={() => undefined} />
      </div>
    </div>
  );
}
