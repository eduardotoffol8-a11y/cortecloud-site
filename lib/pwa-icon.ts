const BRAND_ICON_CACHE = "orcamovel-brand-icon-v2";
const ICON_PATHS = [
  { path: "/orcamovel-install-192-v2.png", size: 192 },
  { path: "/orcamovel-install-512-v2.png", size: 512 },
] as const;

function imageFromSource(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível preparar a logo."));
    image.src = source;
  });
}

async function iconBlob(source: string, size: number) {
  const image = await imageFromSource(source);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  const scale = Math.min((size * 0.84) / image.naturalWidth, (size * 0.84) / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao criar o ícone.")), "image/png", 0.95));
}

function refreshInstallMetadata() {
  const revision = Date.now();
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (manifest) manifest.href = `/manifest.webmanifest?brand=${revision}`;
  let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!appleIcon) {
    appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = `/orcamovel-install-192-v2.png?brand=${revision}`;
}

export async function prepareCompanyInstallIcon(logo: string) {
  if (!("caches" in window) || !logo) return;
  const cache = await caches.open(BRAND_ICON_CACHE);
  await Promise.all(ICON_PATHS.map(async ({ path, size }) => {
    const blob = await iconBlob(logo, size);
    await cache.put(path, new Response(blob, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } }));
  }));
  refreshInstallMetadata();
}

export async function useDefaultInstallIcon() {
  if ("caches" in window) await caches.delete(BRAND_ICON_CACHE);
  refreshInstallMetadata();
}

