import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const logo = new URL("/orcaobra-logo.png", request.url).toString();
  return new ImageResponse(
    <div style={{ width: "512px", height: "512px", display: "flex", background: "#ffffff" }}>
      <img src={logo} width="512" height="512" alt="" style={{ width: "512px", height: "512px", objectFit: "cover" }} />
    </div>,
    { width: 512, height: 512 },
  );
}
