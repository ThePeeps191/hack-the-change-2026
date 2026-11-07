import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none transition-[transform,background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-[0_2px_0_var(--color-accent-strong)] hover:bg-accent-strong",
  secondary: "bg-surface text-ink border border-line hover:bg-sunken",
  quiet: "text-ink-muted hover:text-ink hover:bg-sunken",
  danger: "bg-surface text-danger border border-line hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 rounded-control text-base",
  lg: "min-h-16 px-6 rounded-card text-lg w-full",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
