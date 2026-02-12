
// Supabase Edge Function: Eskiz.uz SMS Handler

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
    const { phone, message } = await req.json()
    
    // Supabase Secrets-dan olinadigan Eskiz ma'lumotlari
    const ESKIZ_TOKEN = Deno.env.get('ESKIZ_TOKEN')
    
    if (!ESKIZ_TOKEN) {
      throw new Error("ESKIZ_TOKEN environment variable topilmadi")
    }

    // Telefon raqamni tozalash (faqat raqamlar: 998901234567)
    const cleanPhone = phone.replace(/\D/g, '')

    // Eskiz.uz API ga so'rov yuborish
    const formData = new FormData()
    formData.append('mobile_phone', cleanPhone)
    formData.append('message', message || "Tasdiqlash kodi: ")
    formData.append('from', '4545') // Eskiz tomonidan berilgan sender nomi

    const eskizResponse = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ESKIZ_TOKEN}`
      },
      body: formData
    })

    const result = await eskizResponse.json()
    console.log(`[SMS LOG] To: ${cleanPhone}, Eskiz Response:`, result)

    return new Response(JSON.stringify({ 
      status: 'success', 
      data: result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[OTP ERROR]", error.message)
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})