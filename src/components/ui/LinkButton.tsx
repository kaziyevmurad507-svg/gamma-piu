import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { btnClass } from "./Button";

// Link that looks like Button
export function LinkButton({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return <Link className={cn(btnClass(variant), className)} {...props} />;
}
