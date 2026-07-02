import Image from "next/image";

const LIME = "#c8f000";

// Each tile carries boxes hand-placed on its real objects.
const TILES = [
  {
    src: "/samples/crowd.jpg",
    tag: "person · bbox",
    n: 34,
    boxes: [[34, 49, 20, 45], [44, 69, 20, 31], [79, 41, 13, 24], [14, 45, 10, 17]],
  },
  {
    src: "/samples/car.jpg",
    tag: "vehicle · bbox",
    n: 6,
    boxes: [[1, 37, 98, 51], [4, 66, 16, 22], [79, 65, 16, 23]],
  },
  {
    src: "/samples/retail.jpg",
    tag: "product · bbox",
    n: 48,
    boxes: [[5, 42, 15, 17], [6, 62, 15, 16], [80, 42, 15, 17], [80, 62, 15, 16]],
  },
  {
    src: "/samples/cyclists.jpg",
    tag: "cyclist · bbox",
    n: 12,
    boxes: [[29, 17, 27, 62], [0, 4, 27, 56], [72, 25, 17, 44]],
  },
  {
    src: "/samples/parking.jpg",
    tag: "aerial · bbox",
    n: 9,
    boxes: [[10, 68, 40, 28]],
  },
];

function Tile({ src, tag, n, boxes }: (typeof TILES)[number]) {
  return (
    <div className="relative h-40 w-56 shrink-0 overflow-hidden rounded-xl border border-line">
      <Image src={src} alt={tag} fill sizes="224px" className="object-cover" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {boxes.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke={LIME} strokeWidth="0.9" rx="0.5" />
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <span className="rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[10px] text-white">{tag}</span>
        <span className="rounded-md bg-[#c8f000] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-black">
          {n} labels
        </span>
      </div>
    </div>
  );
}

export function LabelMarquee() {
  const row = [...TILES, ...TILES, ...TILES];
  return (
    <div className="marquee-mask overflow-hidden py-2">
      <div className="flex w-max gap-4 animate-marquee">
        {row.map((t, i) => (
          <Tile key={i} {...t} />
        ))}
        {row.map((t, i) => (
          <Tile key={`dup-${i}`} {...t} />
        ))}
      </div>
    </div>
  );
}
