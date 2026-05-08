import { cn } from "@/lib/utils";
import type { TransferStatus } from "@/lib/transfers/types.ts";
import { Clock, CheckCircle2, XCircle, Ban } from "lucide-react";

const map: Record<
  TransferStatus,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Pending",
    className: "bg-warning/15 text-warning-foreground border-warning/40",
    Icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/30",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    Icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
    Icon: Ban,
  },
};

export function TransferStatusBadge({
  status,
  className,
}: {
  status: TransferStatus;
  className?: string;
}) {
  const cfg = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
        className,
      )}
    >
      <cfg.Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}
