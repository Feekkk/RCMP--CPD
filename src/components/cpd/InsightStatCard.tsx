import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type InsightStatCardProps = {
  title: string;
  value: ReactNode;
  description?: string;
  icon: LucideIcon;
  featured?: boolean;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
  watermarkClassName?: string;
  onClick?: () => void;
};

export function InsightStatCard({
  title,
  value,
  description,
  icon: Icon,
  featured = false,
  className,
  iconClassName,
  valueClassName,
  watermarkClassName,
  onClick,
}: InsightStatCardProps) {
  const content = (
    <>
      <div className="relative z-10 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            featured ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            featured ? "text-secondary-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </span>
      </div>

      <div className="relative z-10 mt-6 min-w-0">
        <div className={cn("font-display text-3xl font-bold tracking-tight", valueClassName)}>{value}</div>
        {description ? (
          <p
            className={cn(
              "mt-1 text-xs leading-snug",
              featured ? "text-secondary-foreground/75" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      <Icon
        className={cn(
          "pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 origin-bottom-right transition-all duration-500 ease-out",
          "group-hover:-translate-x-1 group-hover:-translate-y-2 group-hover:scale-110 group-hover:-rotate-6",
          featured
            ? "text-secondary-foreground/20 group-hover:text-secondary-foreground/35"
            : "text-foreground/[0.06] group-hover:text-foreground/15",
          watermarkClassName,
        )}
        aria-hidden
      />
    </>
  );

  const styles = cn(
    "group relative overflow-hidden rounded-3xl border p-5 text-left shadow-sm",
    featured ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card",
    onClick && "w-full transition-colors",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={styles}>
        {content}
      </button>
    );
  }

  return <div className={styles}>{content}</div>;
}
