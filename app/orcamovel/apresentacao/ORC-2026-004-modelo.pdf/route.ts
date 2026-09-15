import { readFile } from "node:fs/promises";
import path from "node:path";

const fileName = "ORC-2026-004-Modelo.pdf";

function headers(length: number, range?: string) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${fileName}"`,
    "Content-Length": String(length),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
    ...(range ? { "Content-Range": range } : {}),
  };
}

async function pdfFile() {
  return readFile(path.join(process.cwd(), "public", "orcamovel", "apresentacao", fileName));
}

export async function GET(request: Request) {
  const pdf = await pdfFile();
  const range = request.headers.get("range");
  if (!range) return new Response(pdf, { headers: headers(pdf.length) });

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${pdf.length}` } });

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), pdf.length - 1) : pdf.length - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= pdf.length) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${pdf.length}` } });
  }

  const chunk = pdf.subarray(start, end + 1);
  return new Response(chunk, {
    status: 206,
    headers: headers(chunk.length, `bytes ${start}-${end}/${pdf.length}`),
  });
}

export async function HEAD() {
  const pdf = await pdfFile();
  return new Response(null, { headers: headers(pdf.length) });
}
