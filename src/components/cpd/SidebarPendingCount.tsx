import { cn } from "@/lib/utils";

export function SidebarPendingCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold tabular-nums text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
