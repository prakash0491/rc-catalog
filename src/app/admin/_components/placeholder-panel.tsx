import Link from 'next/link';

interface PlaceholderPanelProps {
  title: string;
  description: string;
  backLinkLabel?: string;
  backLinkHref?: string;
}

export function PlaceholderPanel({ title, description, backLinkLabel = 'Back to dashboard', backLinkHref = '/admin' }: PlaceholderPanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-sm">
      <div className="space-y-4">
        <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
          Placeholder
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <Link href={backLinkHref} className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
          {backLinkLabel}
        </Link>
      </div>
    </section>
  );
}
