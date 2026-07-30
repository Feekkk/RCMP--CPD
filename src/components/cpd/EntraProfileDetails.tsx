import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type EntraProfile = {
  oid: string | null;
  name: string | null;
  email: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
};

type EntraProfileDetailsProps = {
  profile?: EntraProfile | null;
  fetchedAt?: string | null;
  pending?: boolean;
  fallbackInitials?: string;
};

function FieldValue({
  value,
  pending,
  className,
  skeletonClassName,
}: {
  value?: string | null;
  pending?: boolean;
  className?: string;
  skeletonClassName?: string;
}) {
  if (pending) return <Skeleton className={cn("h-4 w-28", skeletonClassName)} />;
  return <span className={className}>{value?.trim() ? value : "—"}</span>;
}

function initialsFromName(name: string | null | undefined, fallback: string) {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function EntraProfileDetails({
  profile,
  fetchedAt,
  pending = false,
  fallbackInitials = "ST",
}: EntraProfileDetailsProps) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
        {pending ? (
          <Skeleton className="h-14 w-14 rounded-full" />
        ) : (
          <Avatar className="h-14 w-14 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initialsFromName(profile?.name, fallbackInitials)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 space-y-2">
          {pending ? (
            <>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-52" />
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold tracking-tight">
                {profile?.name?.trim() ? profile.name : "—"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {profile?.email?.trim() ? profile.email : "—"}
              </p>
              {fetchedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last updated {new Date(fetchedAt).toLocaleString()}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entra ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden lg:table-cell">Office Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="max-w-[12rem] sm:max-w-none">
                <FieldValue
                  value={profile?.oid}
                  pending={pending}
                  className="break-all font-mono text-xs sm:text-sm"
                  skeletonClassName="h-4 w-36"
                />
              </TableCell>
              <TableCell>
                <FieldValue value={profile?.name} pending={pending} className="font-medium" skeletonClassName="h-4 w-32" />
              </TableCell>
              <TableCell>
                <FieldValue
                  value={profile?.email}
                  pending={pending}
                  className="break-all"
                  skeletonClassName="h-4 w-44"
                />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <FieldValue value={profile?.officeLocation} pending={pending} skeletonClassName="h-4 w-28" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Office location</p>
          <div className="mt-1">
            <FieldValue value={profile?.officeLocation} pending={pending} className="text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
