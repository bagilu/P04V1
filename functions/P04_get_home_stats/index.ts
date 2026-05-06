
import { serve } from "https://deno.land/std/http/server.ts";

serve(async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "P04_get_home_stats working"
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
});
