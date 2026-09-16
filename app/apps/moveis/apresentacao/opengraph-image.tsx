import { ImageResponse } from "next/og";

export const alt = "OrçaMóvel — Orçamentos profissionais para marcenaria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: "linear-gradient(135deg, #f4f8f7 0%, #ffffff 52%, #e8f2ef 100%)",
          color: "#172321",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
            <img
              src="https://cortecloud-site-l4lh.vercel.app/orcamovel-official-512.png"
              width="110"
              height="110"
              alt=""
              style={{ borderRadius: 28 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5 }}>OrçaMóvel</div>
              <div style={{ fontSize: 24, color: "#687875", marginTop: 4 }}>Marcenaria sob medida</div>
            </div>
          </div>
          <div style={{ fontSize: 58, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2.2 }}>
            Orçamentos profissionais no celular e computador.
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.35, color: "#60736e", marginTop: 24 }}>
            Clientes, móveis, valores e PDFs organizados em um só lugar.
          </div>
        </div>
        <div
          style={{
            width: 250,
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 56,
            background: "#0C4D46",
            boxShadow: "0 22px 55px rgba(12, 77, 70, .22)",
          }}
        >
          <img
            src="https://cortecloud-site-l4lh.vercel.app/orcamovel-official-512.png"
            width="190"
            height="190"
            alt=""
            style={{ borderRadius: 38 }}
          />
        </div>
      </div>
    ),
    size,
  );
}
