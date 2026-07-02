import {
  ArrowRight,
  Upload,
  ScanLine,
  ShieldCheck,
  Download,
  Tags,
  GaugeCircle,
  Users,
  FileJson,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { LabeledShowcase } from "@/components/site/labeled-showcase";
import { Capabilities } from "@/components/site/capabilities";
import { Reveal } from "@/components/site/reveal";
import { Counter } from "@/components/site/counter";
import { LabelMarquee } from "@/components/site/label-marquee";
import { ModelMetrics } from "@/components/site/model-metrics";

export default function LandingPage() {
  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-texture opacity-40" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent-soft/50 blur-3xl" />
        <Container className="relative py-20 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-fade-up">
              <Badge tone="accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Powered by a silent automated QA engine
              </Badge>
              <h1 className="display mt-5 text-5xl font-semibold text-ink sm:text-6xl">
                Labeled data,
                <br />
                <span className="text-accent">quality guaranteed.</span>
              </h1>
              <p className="balance mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Upload your image dataset. Our annotators label it, an automated
                QA engine verifies every job, and you download
                delivery-ready files — COCO, YOLO or Pascal VOC. No labeling
                software to learn. No quality surprises.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <LinkButton href="/register" size="lg">
                  Start a project
                  <ArrowRight size={18} />
                </LinkButton>
                <LinkButton href="/pricing" variant="secondary" size="lg">
                  See pricing
                </LinkButton>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-faint">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} /> 85%+ IoU quality target
                </span>
                <span className="flex items-center gap-2">
                  <FileJson size={16} /> COCO · YOLO · Pascal VOC
                </span>
                <span className="flex items-center gap-2">
                  <Upload size={16} /> Direct-to-storage upload
                </span>
              </div>
            </div>

            <div className="animate-fade-up [animation-delay:120ms]">
              <LabeledShowcase />
            </div>
          </div>
        </Container>
      </section>

      {/* ───────────────────────── Trust strip + marquee ───────────────────────── */}
      <section className="border-y border-line bg-surface">
        <Container className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 py-7 text-center">
          <Stat>
            <Counter value={10} suffix="M+" className="text-2xl font-semibold tracking-tighter2" />
            <span className="text-sm text-muted">labels delivered</span>
          </Stat>
          <Stat>
            <Counter value={0.91} decimals={2} className="text-2xl font-semibold tracking-tighter2" />
            <span className="text-sm text-muted">avg. delivered IoU</span>
          </Stat>
          <Stat>
            <Counter value={5} suffix="%" className="text-2xl font-semibold tracking-tighter2" />
            <span className="text-sm text-muted">human spot-check on every batch</span>
          </Stat>
          <Stat>
            <Counter value={48} suffix="h" className="text-2xl font-semibold tracking-tighter2" />
            <span className="text-sm text-muted">typical first-sample turnaround</span>
          </Stat>
        </Container>
      </section>

      {/* moving labeled-sample band */}
      <section className="border-b border-line bg-surface pb-8">
        <Container>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-faint">
            Real datasets, delivery-ready labels
          </p>
        </Container>
        <LabelMarquee />
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="scroll-mt-24">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="How it works"
            title="From raw images to delivery-ready labels"
            sub="Four steps. You only touch the first and the last — we run everything in between."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Upload,
                step: "01",
                title: "Upload your dataset",
                body: "Drag in a ZIP or folder, or point us at an S3 bucket. Files go straight to secure storage — never through email.",
              },
              {
                icon: Tags,
                step: "02",
                title: "Define your labels",
                body: "Build your class taxonomy with a drag-and-drop label builder — names, colors and attributes like 'occluded'.",
              },
              {
                icon: ScanLine,
                step: "03",
                title: "We label & verify",
                body: "Skill-matched annotators label inside the canvas while an automated QA engine scores every job against ground truth.",
              },
              {
                icon: Download,
                step: "04",
                title: "Download deliverables",
                body: "Get your annotation file plus a quality report PDF the moment your project hits 100%.",
              },
            ].map((s, i) => (
              <Reveal
                key={s.step}
                delay={i * 80}
                className="group rounded-lg border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas transition-transform duration-200 group-hover:scale-105">
                    <s.icon size={18} />
                  </span>
                  <span className="font-mono text-sm text-faint">{s.step}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tightish">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────────────────────── Capabilities (Images / Video) ───────────────────────── */}
      <section id="capabilities" className="scroll-mt-24 bg-surface">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="What we label"
            title="Every annotation type your models need"
            sub="Images and video today — boxes, masks, polygons, keypoints and object tracking. 3D and audio are on the way."
          />
          <div className="mt-12">
            <Capabilities />
          </div>
        </Container>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
      <section id="features" className="scroll-mt-24">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="The platform"
            title="Quality you can actually verify"
            sub="Most vendors ask you to trust them. We show you the numbers, live."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={GaugeCircle}
              title="Live progress & quality"
              body="Watch images completed, velocity per day, aggregate IoU and per-class accuracy update in real time — no waiting for a status email."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Silent honeypot QA"
              body="Ground-truth frames are injected into every job. Annotators don't know which is which, so scores are honest and gaming is impossible."
            />
            <FeatureCard
              icon={Users}
              title="Skill-matched routing"
              body="Jobs go to annotators certified for that task type, weighted 70% on accuracy. Every batch gets a 5% human spot-check on top."
            />
            <FeatureCard
              icon={Star}
              title="Sample previews anytime"
              body="View 10 random labeled images with overlays at any point. Not happy? Flag specific images and a reviewer steps in."
            />
            <FeatureCard
              icon={FileJson}
              title="Open export formats"
              body="Download COCO JSON, YOLO TXT or Pascal VOC XML — plus a quality report PDF — generated straight from the annotation engine."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Your data stays private"
              body="Private storage, time-limited download links, and GDPR deletion on request. Annotators only ever see their assigned job."
            />
          </div>
        </Container>
      </section>

      {/* ───────────────────────── Model performance ───────────────────────── */}
      <section className="bg-surface">
        <Container className="py-20 sm:py-24">
          <ModelMetrics />
        </Container>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section>
        <Container className="py-8">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-ink px-8 py-16 text-center text-canvas sm:px-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <h2 className="display relative mx-auto max-w-2xl text-4xl font-semibold sm:text-5xl">
              Start your first annotation project today.
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-canvas/70">
              Get an instant quote, upload your dataset, and see your first
              labeled samples within days.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <LinkButton
                href="/register"
                size="lg"
                className="bg-canvas text-ink hover:bg-canvas/90"
              >
                Start a project <ArrowRight size={18} />
              </LinkButton>
              <LinkButton
                href="/pricing"
                size="lg"
                variant="ghost"
                className="text-canvas hover:bg-white/10"
              >
                See pricing
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function Stat({ children }: { children: React.ReactNode }) {
  return <div className="flex items-baseline gap-2">{children}</div>;
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-ink">
        {eyebrow}
      </p>
      <h2 className="display mt-3 text-3xl font-semibold sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg leading-relaxed text-muted">{sub}</p>
    </Reveal>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Reveal className="group rounded-lg border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink transition-transform duration-200 group-hover:scale-105">
        <Icon size={20} />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tightish">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </Reveal>
  );
}
