import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const TABLE_SMILE_EVENTS = "tblp04smileevents";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-code",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeAccount(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeNickname(value: unknown): string {
  return String(value ?? "").trim();
}

function isValidAccount(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+$/.test(normalizeAccount(value));
}

function isValidNickname(value: string, maxLength = 20): boolean {
  const nickname = normalizeNickname(value);
  return nickname.length > 0 && nickname.length <= maxLength;
}

function todayTaipeiDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Please set Edge Function secrets.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function smileTypeLabel(type: unknown): string {
  switch (Number(type)) {
    case 1: return "微笑";
    case 2: return "問候";
    case 3: return "鼓勵";
    case 4: return "幫助";
    default: return "善意";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const smilerAccount = normalizeAccount(body?.smiler_account);
    const since = String(body?.since ?? "").trim();
    if (!isValidAccount(smilerAccount)) {
      return jsonResponse({ success: false, code: "INVALID_INPUT", message: "帳號格式不正確。" }, 400);
    }

    const supabase = getServiceClient();
    let query = supabase
      .from(TABLE_SMILE_EVENTS)
      .select("created_at, responder_account, responder_nickname, smile_type")
      .eq("smiler_account", smilerAccount)
      .order("created_at", { ascending: false })
      .limit(5);

    if (since) query = query.gt("created_at", since);

    const { data, error } = await query;
    if (error) return jsonResponse({ success: false, code: error.code, message: error.message }, 500);

    const rows = (data ?? []).map((row: any) => ({
      created_at: row.created_at,
      responder_account: row.responder_account,
      responder_nickname: row.responder_nickname || row.responder_account,
      smile_type: row.smile_type,
      smile_type_label: smileTypeLabel(row.smile_type),
    }));
    return jsonResponse({ success: true, rows });
  } catch (error) {
    return jsonResponse({ success: false, message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
