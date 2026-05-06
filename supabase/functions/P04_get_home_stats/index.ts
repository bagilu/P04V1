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

function buildRanking(rows: any[], rolePrefix: "smiler" | "responder") {
  const counter = new Map<string, number>();
  const latestNicknameByAccount = new Map<string, string>();
  const latestTimeByAccount = new Map<string, string>();

  for (const row of rows) {
    const account = normalizeAccount(row?.[`${rolePrefix}_account`]);
    const nickname = normalizeNickname(row?.[`${rolePrefix}_nickname`]);
    const createdAt = String(row?.created_at ?? "");
    if (!account) continue;
    counter.set(account, (counter.get(account) ?? 0) + 1);
    const existingTime = latestTimeByAccount.get(account) ?? "";
    if (!existingTime || createdAt >= existingTime) {
      latestTimeByAccount.set(account, createdAt);
      latestNicknameByAccount.set(account, nickname || account);
    }
  }

  return Array.from(counter.entries())
    .map(([account, count]) => ({ account, nickname: latestNicknameByAccount.get(account) || account, count }))
    .sort((a, b) => b.count !== a.count ? b.count - a.count : a.account.localeCompare(b.account, "zh-Hant"))
    .slice(0, 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed" }, 405);

  try {
    const supabase = getServiceClient();

    const { count, error: countError } = await supabase
      .from(TABLE_SMILE_EVENTS)
      .select("*", { count: "exact", head: true });
    if (countError) return jsonResponse({ success: false, code: countError.code, message: countError.message }, 500);

    const { data: rows, error: rowsError } = await supabase
      .from(TABLE_SMILE_EVENTS)
      .select("smiler_account, smiler_nickname, responder_account, responder_nickname, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (rowsError) return jsonResponse({ success: false, code: rowsError.code, message: rowsError.message }, 500);

    return jsonResponse({
      success: true,
      totalSmileCount: count ?? 0,
      smilerRanking: buildRanking(rows ?? [], "smiler"),
      responderRanking: buildRanking(rows ?? [], "responder"),
    });
  } catch (error) {
    return jsonResponse({ success: false, message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
