import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const source = path.join(
    process.cwd(),
    "public",
    "orcamovel",
    "apresentacao",
    "ORC-2026-001-exemplo-marrom.pdf.b64",
  );
  const encoded = (await readFile(source, "utf8")).trim();
  const pdf = Buffer.from(encoded, "base64");

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ORC-2026-001-exemplo-marrom.pdf"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
