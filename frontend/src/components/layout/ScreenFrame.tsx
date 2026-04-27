import type { PropsWithChildren } from "react";

type ScreenFrameProps = PropsWithChildren<{
  className?: string;
}>;

export function ScreenFrame({ children, className }: ScreenFrameProps) {
  const classes = ["screen-frame", className].filter(Boolean).join(" ");

  return <main className={classes}>{children}</main>;
}
