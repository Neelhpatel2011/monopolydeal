import greedMoneyIcon from "../../assets/greed_money_icon_svg.svg";

type IconProps = {
  className?: string;
  stroke?: string;
  fill?: string;
};

export function PropertyIcon({
  className = "monopoly-card-icon",
  stroke = "currentColor",
  fill = "none",
}: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 11.5L12 4L21 11.5"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 10.5V20H18.5V10.5"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20V14H14.5V20"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoneyIcon({
  className = "monopoly-card-icon",
}: IconProps) {
  return <img src={greedMoneyIcon} className={className} alt="" aria-hidden="true" />;
}

export function RentIcon({
  className = "monopoly-card-icon",
  stroke = "currentColor",
  fill = "none",
}: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6H18" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 12H15" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 18H12" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2.5" stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
}

export function WildIcon({ className = "monopoly-card-icon" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.4" fill="#f4f4f4" />
      <path d="M12 12 L12 2.6 A9.4 9.4 0 0 1 20.1 7.1 Z" fill="#ff8a00" />
      <path d="M12 12 L20.1 7.1 A9.4 9.4 0 0 1 21 15.7 Z" fill="#39e45c" />
      <path d="M12 12 L21 15.7 A9.4 9.4 0 0 1 14.7 21 Z" fill="#42d6ff" />
      <path d="M12 12 L14.7 21 A9.4 9.4 0 0 1 5.9 19.3 Z" fill="#4d52ff" />
      <path d="M12 12 L5.9 19.3 A9.4 9.4 0 0 1 2.8 10.5 Z" fill="#d62dff" />
      <path d="M12 12 L2.8 10.5 A9.4 9.4 0 0 1 12 2.6 Z" fill="#ff2f7d" />
      <circle cx="12" cy="12" r="9.4" fill="none" stroke="#000000" strokeOpacity="0.22" strokeWidth="0.8" />
      <ellipse
        cx="8.1"
        cy="6.4"
        rx="4.4"
        ry="2.7"
        fill="#ffffff"
        fillOpacity="0.35"
        transform="rotate(-22 8.1 6.4)"
      />
    </svg>
  );
}

export function ActionIcon({
  className = "monopoly-card-icon",
  stroke = "currentColor",
}: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3.5L13.8 8.2L18.8 8.8L15 12.1L16.2 17L12 14.2L7.8 17L9 12.1L5.2 8.8L10.2 8.2L12 3.5Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
