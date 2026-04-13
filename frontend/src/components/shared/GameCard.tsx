import type { CSSProperties } from "react";

type GameCardProps = {
  title: string;
  subtitle?: string;
  accent: string;
  cornerValue?: string;
  variant?: "hand" | "mini";
};

export function GameCard({
  title,
  subtitle,
  accent,
  cornerValue,
  variant = "hand"
}: GameCardProps) {
  const style = { "--card-accent": accent } as CSSProperties;
  const classes = ["game-card", `game-card--${variant}`].join(" ");

  return (
    <article className={classes} style={style}>
      {cornerValue ? <span className="game-card__corner">{cornerValue}</span> : null}
      <span className="game-card__accent" aria-hidden="true" />
      <div className="game-card__body">
        <strong className="game-card__title">{title}</strong>
        {subtitle ? <span className="game-card__subtitle">{subtitle}</span> : null}
      </div>
    </article>
  );
}
