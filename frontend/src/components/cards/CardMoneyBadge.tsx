type CardMoneyBadgeProps = {
  value: string;
};

export function CardMoneyBadge({ value }: CardMoneyBadgeProps) {
  return (
    <div className="monopoly-card__money-badge">
      <span>{value}</span>
    </div>
  );
}
