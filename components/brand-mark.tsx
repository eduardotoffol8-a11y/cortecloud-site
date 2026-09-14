import Image from "next/image";

export function BrandMark({ compact = false, loading = false, product = "moveis" }: { compact?: boolean; loading?: boolean; product?: "moveis" | "obra" }) {
  const obra = product === "obra";
  return (
    <div className="flex items-center gap-3">
      <Image src={obra ? "/orcaobra-logo.png" : "/orcamovel-official-192.png"} alt={obra ? "Logo do OrçaObra" : "Logo do OrçaMóvel"} width={48} height={48} priority className={`h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ${loading ? "animate-pulse" : ""}`} />
      {!compact && (
        <div>
          <p className="text-[1.05rem] font-extrabold tracking-[-0.025em] text-[#172321]">{obra ? "OrçaObra" : "OrçaMóvel"}</p>
          <p className="text-xs font-medium text-[#74837f]">{obra ? "Construção e reformas" : "Marcenaria sob medida"}</p>
        </div>
      )}
    </div>
  );
}
