import Image from "next/image";

export function BrandMark({ compact = false, loading = false }: { compact?: boolean; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image src="/pwa-company-icon-192.png?v=official-20260914" alt="Logo do OrçaMóvel" width={48} height={48} priority className={`h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ${loading ? "animate-pulse" : ""}`} />
      {!compact && (
        <div>
          <p className="text-[1.05rem] font-extrabold tracking-[-0.025em] text-[#172321]">OrçaMóvel</p>
          <p className="text-xs font-medium text-[#74837f]">Marcenaria sob medida</p>
        </div>
      )}
    </div>
  );
}
