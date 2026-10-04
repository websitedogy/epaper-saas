export function NewspaperPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="absolute -inset-6 rounded-[36px] bg-[#12324a]/10 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(18,50,74,0.18)]">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d9b48a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#c9c3b8]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#c9c3b8]" />
          <div className="ml-3 flex-1 rounded-full bg-white px-3 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
            herald.dogy.press / today
          </div>
        </div>

        <article className="bg-[#f7f3ea] px-5 py-5 sm:px-7 sm:py-6">
          <header className="border-b border-[#12324a]/20 pb-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8a6a32]">Morning edition · 30 Sep 2026</p>
            <h3 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[#12324a] sm:text-4xl">The Daily Herald</h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">Vol. 118 · 24 pages · City &amp; nation</p>
          </header>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a32]">Lead story</p>
              <h4 className="font-display mt-1 text-2xl leading-tight text-[#14110c]">City council opens the riverfront to a new public quarter</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Overnight votes cleared the last planning barrier, putting a 40-acre civic precinct on track for spring. Editors published the full spread before dawn.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {["Politics", "Markets", "Sport"].map((label) => (
                  <div key={label} className="rounded-lg bg-white/80 px-2 py-3 ring-1 ring-[#12324a]/10">
                    <p className="font-display text-lg text-[#12324a]">{label === "Politics" ? "12" : label === "Markets" ? "08" : "04"}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-xl bg-[linear-gradient(160deg,#12324a_0%,#2d5d7a_48%,#d9b48a_100%)] p-4 text-white">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">Front page</p>
                <p className="font-display mt-10 text-xl leading-snug">A reader built for print people.</p>
              </div>
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-[#12324a]/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Today&apos;s desk</p>
                <p className="mt-1 text-sm text-slate-700">PDF uploaded at 04:12 · 24 pages extracted · Live on herald.dogy.press</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
