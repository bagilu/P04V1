
import { serve } from "https://deno.land/std/http/server.ts";

serve(async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "P04_get_recent_notice working"
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
});
