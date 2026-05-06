
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "P04_submit_smile_event working"
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
});
