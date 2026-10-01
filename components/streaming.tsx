import Link from "next/link";

/** Gradientes de fallback p/ tiles sem thumbnail (g1..g6 do mockup). */
const TILE_GRADIENTS = [
  "from-[#6A2C91] to-[#2B0F3D]",
  "from-[#4A3F91] to-[#1A1730]",
  "from-[#7C3AAD] to-[#2E1240]",
  "from-[#5B3E9E] to-[#201735]",
  "from-[#8B4FC9] to-[#2A1440]",
  "from-[#9B3FA0] to-[#2E0F35]",
];

/** Topbar das páginas do aluno (mockup: sem navegação, adicionada p/ web). */
export function StudentNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-st-border bg-st-bg/95">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-2xl tracking-wide text-st-text">
          CURSOSFLIX
        </Link>
        <nav className="flex gap-4 text-sm text-st-dim">
          <Link href="/planos" className="hover:text-st-text">
            Planos
          </Link>
          <Link href="/meus-cursos" className="hover:text-st-text">
            Meus cursos
          </Link>
          <Link href="/certificados" className="hover:text-st-text">
            Certificados
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-4 pb-2 text-sm font-bold text-st-text md:px-0">{children}</h2>;
}

/** Tile 92px do mockup (maior no desktop), com barra de progresso opcional. */
export function CourseTile({
  href,
  title,
  thumbnailUrl,
  progressPercent,
  price,
  gradientIndex = 0,
}: {
  href: string;
  title: string;
  thumbnailUrl?: string | null;
  progressPercent?: number;
  price?: string;
  gradientIndex?: number;
}) {
  return (
    <Link href={href} className="w-[140px] shrink-0 snap-start md:w-[160px]">
      <div
        className={`relative h-[130px] overflow-hidden rounded bg-gradient-to-br md:h-[150px] ${TILE_GRADIENTS[gradientIndex % TILE_GRADIENTS.length]}`}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        {progressPercent !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div className="h-full bg-st-accent" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-tight text-st-text">{title}</p>
      {price && <p className="mt-0.5 text-[11px] font-bold text-st-accent-warm">{price}</p>}
    </Link>
  );
}

/** Linha horizontal com scroll escondido (`.row` do mockup). */
export function TileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">{children}</div>
  );
}
