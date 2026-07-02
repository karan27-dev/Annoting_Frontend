import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { QuoteEstimator } from "@/components/site/quote-estimator";

export const metadata = { title: "Pricing" };

const tiers = [
  {
    name: "Standard",
    tagline: "For teams shipping their first models.",
    price: "Pay per label",
    features: [
      "Bounding box, polygon & classification",
      "85% IoU quality target",
      "Live progress & quality dashboard",
      "COCO / YOLO / Pascal VOC export",
      "Email support",
    ],
    cta: "Start a project",
    highlight: false,
  },
  {
    name: "Priority",
    tagline: "Faster turnaround, tighter QA.",
    price: "Volume rates",
    features: [
      "Everything in Standard",
      "All annotation types incl. segmentation & keypoint",
      "Rush turnaround SLA",
      "10% human spot-check",
      "Dedicated reviewer & revision rounds",
    ],
    cta: "Start a project",
    highlight: true,
  },
  {
    name: "Enterprise",
    tagline: "Large, ongoing labeling pipelines.",
    price: "Custom",
    features: [
      "Everything in Priority",
      "Custom quality target & taxonomy review",
      "Private annotator pool",
      "On-prem / VPC storage options",
      "Invoicing & GST billing",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-texture opacity-40" />
        <Container className="relative py-16 sm:py-20 text-center">
          <Badge tone="accent">Transparent, usage-based pricing</Badge>
          <h1 className="display mx-auto mt-5 max-w-3xl text-4xl font-semibold sm:text-5xl">
            You pay per label — not per promise.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Pricing scales with annotation type, volume and turnaround. Get an
            instant ballpark below, then a firm quote when you upload.
          </p>
        </Container>
      </section>

      <Container className="pb-8">
        <QuoteEstimator />
      </Container>

      <Container className="py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-shadow ${
                t.highlight
                  ? "border-accent bg-surface shadow-lift"
                  : "border-line bg-surface hover:shadow-soft"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-semibold tracking-tightish">{t.name}</h3>
              <p className="mt-1.5 text-sm text-muted">{t.tagline}</p>
              <p className="mt-5 text-2xl font-semibold tracking-tighter2">
                {t.price}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={17} className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <LinkButton
                href="/register"
                variant={t.highlight ? "primary" : "secondary"}
                className="mt-7 w-full"
              >
                {t.cta} <ArrowRight size={16} />
              </LinkButton>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-faint">
          Payments via Razorpay (UPI, cards, net-banking) are{" "}
          <span className="font-medium text-muted">coming soon</span>. For now
          we invoice on delivery.
        </p>
      </Container>
    </>
  );
}
