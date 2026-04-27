import type { ReactNode } from "react";

type CardChipProps = {
  children: ReactNode;
  className?: string;
};

export function CardChip({ children, className }: CardChipProps) {
  return <span className={`monopoly-card__chip${className ? ` ${className}` : ""}`}>{children}</span>;
}
