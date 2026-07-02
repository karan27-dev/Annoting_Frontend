import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-semibold tracking-tighter2 text-ink",
        className,
      )}
      aria-label="Annoting home"
    >
      <span className="relative flex h-7 w-7 items-center justify-center rounded-[9px] bg-ink text-canvas">
        {/* bracket mark — the "annotation frame" */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M5.5 2.5H3.5A1 1 0 0 0 2.5 3.5V5.5M10.5 2.5H12.5A1 1 0 0 1 13.5 3.5V5.5M5.5 13.5H3.5A1 1 0 0 1 2.5 12.5V10.5M10.5 13.5H12.5A1 1 0 0 0 13.5 12.5V10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="1.6" fill="var(--accent)" />
        </svg>
      </span>
      <span className="text-[17px]">Annoting</span>
    </Link>
  );
}
