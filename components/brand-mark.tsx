export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--brand-dark)] text-white shadow-sm">
        <svg viewBox="0 0 40 40" aria-hidden="true" className="h-10 w-10">
          <path d="M11 11.5h18v17H11z" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="M15 11.5v4m5-4v2.5m5-2.5v4M11 23h18" fill="none" stroke="var(--accent)" strokeWidth="1.8" />
        </svg>
      </div>
      {!compact && (
        <div>
          <p className="text-[1.05rem] font-extrabold tracking-[-0.025em] text-[#172321]">OrçaMóvel</p>
          <p className="text-xs font-medium text-[#74837f]">Marcenaria sob medida</p>
        </div>
      )}
    </div>
  );
}
