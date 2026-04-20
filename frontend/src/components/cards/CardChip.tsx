import type { ReactNode } from "react";

type CardChipProps = {
  children: ReactNode;
};

export function CardChip({ children }: CardChipProps) {
  return <span className="monopoly-card__chip">{children}</span>;
}
