import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: files } = await admin.from("project_attachments").select("storage_path").eq("user_id", user.id);
  const paths = (files || []).map((file) => file.storage_path);
  if (paths.length) await admin.storage.from("project-files").remove(paths);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return Response.json({ error: "Delete failed" }, { status: 500, headers: cors });
  return Response.json({ deleted: true }, { headers: cors });
});
