
// Supabase Edge Function: Eskiz.uz SMS Hook Handler
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("Supabase Hook Payload:", payload)

    // Supabase Hook quyidagi formatda yuboradi:
    // { "phone": "+998901234567", "message": "Sizning tasdiqlash kodingiz: 123456" }
    const { phone, message } = payload
    
    const ESKIZ_TOKEN = Deno.env.get('ESKIZ_TOKEN')
    if (!ESKIZ_TOKEN) throw new Error("ESKIZ_TOKEN topilmadi")

    const cleanPhone = phone.replace(/\D/g, '')

    // Eskiz.uz API ga yuborish
    const formData = new FormData()
    formData.append('mobile_phone', cleanPhone)
    formData.append('message', message)
    formData.append('from', '4545') // Yoki sizning Eskiz'dagi sender nomingiz

    const eskizResponse = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ESKIZ_TOKEN}` },
      body: formData
    })

    const result = await eskizResponse.json()
    console.log(`[SMS SUCCESS] To: ${cleanPhone}`, result)

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[OTP ERROR]", error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
