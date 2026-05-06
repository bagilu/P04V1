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

const VALID_TYPES = new Set([1, 2, 3, 4]);

async function resolveSmilerNickname(supabase: any, smilerAccount: string) {
  const { data: responderHit } = await supabase
    .from(TABLE_SMILE_EVENTS)
    .select("responder_nickname, created_at")
    .eq("responder_account", smilerAccount)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const responderNickname = normalizeNickname(responderHit?.responder_nickname);
  if (responderNickname) return responderNickname;

  const { data: smilerHit } = await supabase
    .from(TABLE_SMILE_EVENTS)
    .select("smiler_nickname, created_at")
    .eq("smiler_account", smilerAccount)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const smilerNickname = normalizeNickname(smilerHit?.smiler_nickname);
  if (smilerNickname) return smilerNickname;

  return "（尚未設定暱稱）";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const smilerAccount = normalizeAccount(body?.smiler_account);
    const responderAccount = normalizeAccount(body?.responder_account);
    const responderNickname = normalizeNickname(body?.responder_nickname);
    const smileType = Number(body?.smile_type);

    if (!isValidAccount(smilerAccount) || !isValidAccount(responderAccount)) {
      return jsonResponse({ success: false, code: "INVALID_INPUT", message: "帳號格式不正確。" }, 400);
    }
    if (!isValidNickname(responderNickname, 20)) {
      return jsonResponse({ success: false, code: "INVALID_INPUT", message: "暱稱格式不正確。" }, 400);
    }
    if (!VALID_TYPES.has(smileType)) {
      return jsonResponse({ success: false, code: "INVALID_INPUT", message: "表達方式不正確。" }, 400);
    }
    if (smilerAccount === responderAccount) {
      return jsonResponse({ success: false, code: "SELF_NOT_ALLOWED", message: "不能對自己送出肯定。" }, 400);
    }

    const supabase = getServiceClient();
    const eventDate = todayTaipeiDate();
    const smilerNickname = await resolveSmilerNickname(supabase, smilerAccount);

    const { data, error } = await supabase
      .from(TABLE_SMILE_EVENTS)
      .insert({
        smiler_account: smilerAccount,
        smiler_nickname: smilerNickname,
        responder_account: responderAccount,
        responder_nickname: responderNickname,
        smile_type: smileType,
        event_date: eventDate,
      })
      .select("id, created_at, event_date")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonResponse({ success: false, code: "DUPLICATE_TODAY", message: "今天已經表達過。" }, 409);
      }
      return jsonResponse({ success: false, code: error.code, message: error.message, details: error.details }, 500);
    }

    return jsonResponse({ success: true, row: data, event_date: eventDate, smiler_nickname: smilerNickname });
  } catch (error) {
    return jsonResponse({ success: false, message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
