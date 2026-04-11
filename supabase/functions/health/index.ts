import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const data = {
    message: "Livora Supabase Backend is online",
    timestamp: new Date().toISOString(),
    status: "healthy"
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
