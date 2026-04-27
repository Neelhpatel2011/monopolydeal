type WinnerCrownIconProps = {
  className?: string;
};

export function WinnerCrownIcon({ className }: WinnerCrownIconProps) {
  return (
    <svg
      viewBox="0 0 32 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 20 2.5 7.5l6.5 4.75L16 3l7 9.25 6.5-4.75L28 20H4Zm2.8-2.75h18.4l.75-6.3-3.9 2.85L16 5.75l-6.05 8.05-3.9-2.85.75 6.3Z"
        fill="currentColor"
      />
      <path d="M5 21.5h22v2H5z" fill="currentColor" />
    </svg>
  );
}
