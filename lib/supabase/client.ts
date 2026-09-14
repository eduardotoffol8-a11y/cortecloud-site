import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dswqqmgadqwvisygnuib.supabase.co";
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_4tv8A3SqS_9KC_Q8nykwlA_ZtX1dFtl";

let browserClient: SupabaseClient | null = null;

function keepArchivedPdfsCurrent(client: SupabaseClient) {
  const storage = client.storage as unknown as {
    from: (bucketId: string) => {
      download: (...args: unknown[]) => Promise<unknown>;
      [key: string]: unknown;
    };
  };
  const originalFrom = storage.from.bind(storage);

  storage.from = (bucketId: string) => {
    const bucket = originalFrom(bucketId);
    if (bucketId !== "quote-pdfs") return bucket;

    return new Proxy(bucket, {
      get(target, property, receiver) {
        if (property === "download") {
          return async () => ({
            data: null,
            error: new Error("Rebuild PDF with current quote and company branding"),
          });
        }
        return Reflect.get(target, property, receiver);
      },
    });
  };
}

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient(projectUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        experimental: { passkey: true },
      },
    });
    keepArchivedPdfsCurrent(browserClient);
  }
  return browserClient;
}
