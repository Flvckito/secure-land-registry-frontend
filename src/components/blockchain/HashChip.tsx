import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HashChipProps {
  hash: string;
  label?: string;
  className?: string;
  truncate?: number;
}

export function HashChip({ hash, label, className, truncate = 10 }: HashChipProps) {
  const [copied, setCopied] = useState(false);
  const short =
    hash.length > truncate * 2 + 2 ? `${hash.slice(0, truncate)}…${hash.slice(-truncate)}` : hash;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      toast.success(`${label ?? "Hash"} copied`);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title={hash}
      className={cn(
        "group inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs text-foreground/85 transition hover:border-primary/40 hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Link2 className="h-3.5 w-3.5 shrink-0 text-primary-glow" />
      {label && (
        <span className="font-sans font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
          {label}
        </span>
      )}
      <span className="truncate">{short}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
      )}
    </button>
  );
}
