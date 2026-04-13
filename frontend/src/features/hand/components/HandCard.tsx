import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { LocalHandCard } from "../../board/model/localPlayer";

type HandCardProps = {
  card: LocalHandCard;
  isSelected: boolean;
  isDragOrigin?: boolean;
  renderMode?: "interactive" | "ghost";
  style?: CSSProperties;
  onPress: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

type HandCardPresentation = {
  kind: "action" | "property" | "wild";
  title: string;
  eyebrow: string;
  tone: string;
  value?: string;
};

function getHandCardPresentation(label: string): HandCardPresentation {
  if (label === "Wild") {
    return {
      kind: "wild",
      title: "WILD",
      eyebrow: "Flexible",
      tone: "wild",
    };
  }

  if (label.includes("Property")) {
    const tone =
      label.startsWith("Brown")
        ? "brown"
        : label.startsWith("Light Blue")
          ? "light-blue"
          : "property";

    const title = label.replace(" Property", "");

    return {
      kind: "property",
      title,
      eyebrow: "Property",
      tone,
      value: tone === "brown" ? "2" : "1",
    };
  }

  if (label === "Rent") {
    return {
      kind: "action",
      title: "Rent",
      eyebrow: "Action",
      tone: "sky",
      value: "1",
    };
  }

  if (label === "Just Say No!") {
    return {
      kind: "action",
      title: "Just Say No!",
      eyebrow: "Action",
      tone: "paper",
      value: "5",
    };
  }

  return {
    kind: "action",
    title: label,
    eyebrow: "Action",
    tone: "rose",
    value: "5",
  };
}

function renderHandCardBody(presentation: HandCardPresentation) {
  if (presentation.kind === "property") {
    return (
      <>
        <div className="hand-card__property-band" aria-hidden="true" />
        <div className="hand-card__property-window" aria-hidden="true" />
        <div className="hand-card__content">
          <span className="hand-card__eyebrow">{presentation.eyebrow}</span>
          <strong className="hand-card__title">{presentation.title}</strong>
        </div>
        <span className="hand-card__value-pill">{presentation.value}</span>
      </>
    );
  }

  if (presentation.kind === "wild") {
    return (
      <>
        <span className="hand-card__wild-dot hand-card__wild-dot--top" aria-hidden="true" />
        <div className="hand-card__wild-mark" aria-hidden="true">
          <span>WILD</span>
        </div>
        <div className="hand-card__content hand-card__content--wild">
          <span className="hand-card__eyebrow">{presentation.eyebrow}</span>
          <strong className="hand-card__title">{presentation.title}</strong>
        </div>
        <span className="hand-card__wild-dot hand-card__wild-dot--bottom" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <span className="hand-card__corner-value hand-card__corner-value--top">
        {presentation.value}
      </span>
      <div className="hand-card__content hand-card__content--action">
        <span className="hand-card__eyebrow">{presentation.eyebrow}</span>
        <strong className="hand-card__title">{presentation.title}</strong>
      </div>
      <span className="hand-card__corner-value hand-card__corner-value--bottom">
        {presentation.value}
      </span>
    </>
  );
}

export function HandCard({
  card,
  isSelected,
  isDragOrigin = false,
  renderMode = "interactive",
  style,
  onPress,
  onPointerDown,
}: HandCardProps) {
  const presentation = getHandCardPresentation(card.label);
  const className =
    `hand-card hand-card--${presentation.tone}` +
    `${presentation.kind === "property" ? " hand-card--property" : ""}` +
    `${presentation.kind === "action" ? " hand-card--action" : ""}` +
    `${presentation.kind === "wild" ? " hand-card--wild" : ""}` +
    `${isSelected ? " hand-card--selected" : ""}` +
    `${isDragOrigin ? " hand-card--drag-origin" : ""}` +
    `${renderMode === "ghost" ? " hand-card--drag-preview" : ""}`;

  const body = renderHandCardBody(presentation);

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
