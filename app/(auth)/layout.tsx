import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ShieldCheck, GaugeCircle, FileJson } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-faint">
          © {new Date().getFullYear()} Annoting · Sylithe Technologies
        </p>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-14 text-canvas">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-canvas/50">
            Annoting platform
          </p>
          <h2 className="display mt-4 max-w-md text-4xl font-semibold">
            Labeled data, quality guaranteed.
          </h2>
          <p className="mt-5 max-w-md text-canvas/60">
            Upload a dataset, track quality live, and download delivery-ready
            annotations. One workspace for clients, annotators and reviewers.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              { icon: GaugeCircle, t: "Live progress & IoU quality dashboards" },
              { icon: ShieldCheck, t: "Silent honeypot QA on every job" },
              { icon: FileJson, t: "COCO · YOLO · Pascal VOC export" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 text-sm text-canvas/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <f.icon size={18} />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-12 text-sm text-canvas/60 underline-offset-4 hover:text-canvas hover:underline"
          >
            ← Back to annoting.com
          </Link>
        </div>
      </div>
    </div>
  );
}
