import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const logo = new URL("/orcaobra-logo.png", request.url).toString();
  return new ImageResponse(
    <div style={{ width: "192px", height: "192px", display: "flex", background: "#ffffff" }}>
      <img src={logo} width="192" height="192" alt="" style={{ width: "192px", height: "192px", objectFit: "cover" }} />
    </div>,
    { width: 192, height: 192 },
  );
}
