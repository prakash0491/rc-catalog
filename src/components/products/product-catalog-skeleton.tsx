export function ProductCatalogSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-4 w-52 animate-pulse rounded-full bg-slate-200" />
        <div className="h-10 w-72 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded-full bg-slate-200" />
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
          <div className="h-12 animate-pulse rounded-full bg-slate-100" />
          <div className="h-12 animate-pulse rounded-full bg-slate-100" />
          <div className="h-12 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            <div className="h-64 animate-pulse bg-slate-100" />
            <div className="space-y-3 p-6">
              <div className="h-5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-10 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
