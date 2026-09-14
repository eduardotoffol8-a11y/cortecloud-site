import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const source = "https://drive.google.com/uc?export=download&id=1ck_V9DzEomhS-37jrTraAN7X1H-xDvYz";

export async function GET(request: NextRequest) {
  const range = request.headers.get("range");
  const response = await fetch(source, {
    headers: range ? { range } : undefined,
    redirect: "follow",
  });

  if (!response.ok || !response.body) {
    return new Response("Vídeo indisponível.", { status: 502 });
  }

  const headers = new Headers();
  headers.set("content-type", response.headers.get("content-type") || "video/mp4");
  headers.set("cache-control", "public, max-age=3600");
  headers.set("accept-ranges", response.headers.get("accept-ranges") || "bytes");

  for (const name of ["content-length", "content-range"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status === 206 ? 206 : 200,
    headers,
  });
}
