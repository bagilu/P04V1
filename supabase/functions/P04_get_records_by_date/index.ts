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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed" }, 405);

  try {
    const adminCodeHeader = req.headers.get("x-admin-code")?.trim();
    const adminCodeSecret = Deno.env.get("ADMIN_ACCESS_CODE")?.trim();
    if (!adminCodeSecret || adminCodeHeader !== adminCodeSecret) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return jsonResponse({ success: false, message: "管理密碼不正確。" }, 403);
    }

    const body = await req.json();
    const eventDate = String(body?.event_date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return jsonResponse({ success: false, message: "日期格式不正確。" }, 400);
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE_SMILE_EVENTS)
      .select("created_at, event_date, smiler_account, smiler_nickname, responder_account, responder_nickname, smile_type")
      .eq("event_date", eventDate)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) return jsonResponse({ success: false, code: error.code, message: error.message }, 500);
    return jsonResponse({ success: true, rows: data ?? [] });
  } catch (error) {
    return jsonResponse({ success: false, message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
