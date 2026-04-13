import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ActionButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    quiet?: boolean;
  }
>;

export function ActionButton({
  children,
  className,
  quiet = false,
  type = "button",
  ...props
}: ActionButtonProps) {
  const classes = [
    quiet ? "action-button action-button--quiet" : "action-button",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
