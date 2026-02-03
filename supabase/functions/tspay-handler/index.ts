
// Bu fayl Supabase Edge Function muhitida (Deno) ishlaydi.
// Uni deploy qilish uchun: supabase functions deploy tspay-handler

// Fix: Added Deno declaration to satisfy TypeScript linter which might not recognize Deno globals
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS so'rovlarini boshqarish
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, amount, cheque_id, user_id } = await req.json()
    
    // Merchant token Supabase Secrets'dan olinadi
    // Dashboard -> Settings -> API -> Edge Function Secrets ga qo'shing: 
    // TSPAY_TOKEN = 293b22e1f58e4aadd0ba8b628562e5a0b05804e72d97c25b5ea8b5aacb97b93a
    const token = Deno.env.get('TSPAY_TOKEN')

    if (action === 'create') {
      const response = await fetch('https://tspay.uz/api/v1/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          comment: `Anilo ID: ${user_id}`,
          redirect_url: 'https://anilo.uz/dashboard'
        })
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'check') {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${cheque_id}/?access_token=${token}`)
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
