import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/card";

const groups = [
  {
    title: "Platform",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/register", label: "Start a project" },
    ],
  },
  {
    title: "Capabilities",
    links: [
      { href: "/#capabilities", label: "Image annotation" },
      { href: "/#capabilities", label: "Video annotation" },
      { href: "/#features", label: "Automated QA" },
    ],
  },
  {
    title: "Formats",
    links: [
      { href: "/#features", label: "COCO JSON" },
      { href: "/#features", label: "YOLO TXT" },
      { href: "/#features", label: "Pascal VOC XML" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Labeled data, quality guaranteed. The operations layer that turns
              raw image datasets into delivery-ready annotations.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-sm font-medium text-ink">{g.title}</p>
              <ul className="mt-3 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-sm text-faint sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Annoting · Sylithe Technologies Pvt. Ltd.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            All systems operational
          </p>
        </div>
      </Container>
    </footer>
  );
}
