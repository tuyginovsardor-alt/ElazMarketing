
// Supabase Edge Function: Eskiz.uz SMS Hook Handler
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS uchun OPTIONS so'rovini boshqarish
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase Auth yuborgan ma'lumotlarni olish
    const payload = await req.json()
    console.log("Supabase dan kelgan Payload:", JSON.stringify(payload))

    // Supabase odatda xabarni 'sms' obyekti ichida yuboradi
    const phone = payload.sms?.phone || payload.phone
    let message = payload.sms?.message || payload.message

    if (!phone || !message) {
      throw new Error("Telefon yoki xabar topilmadi")
    }

    const ESKIZ_TOKEN = Deno.env.get('ESKIZ_TOKEN')
    if (!ESKIZ_TOKEN) throw new Error("ESKIZ_TOKEN topilmadi")

    // Raqamni faqat raqamlardan iborat qilish (Eskiz formati: 998901234567)
    const cleanPhone = phone.replace(/\D/g, '')

    /* 
      MUHIM: Agar Eskiz hisobingiz test holatida bo'lsa, 
      ixtiyoriy matn yuborib bo'lmaydi. Lekin bizga OTP kod kerak.
      Agar xabar Eskiz test talablariga mos kelmasa, API 422 xato beradi.
    */
    
    const formData = new FormData()
    formData.append('mobile_phone', cleanPhone)
    formData.append('message', message)
    formData.append('from', '4546') // Eskiz test kodi

    console.log(`Eskizga yuborilmoqda. Tel: ${cleanPhone}, Xabar: ${message}`)

    const eskizResponse = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ESKIZ_TOKEN.trim()}` 
      },
      body: formData
    })

    const result = await eskizResponse.json()
    console.log("Eskiz API javobi:", result)

    // Agar Eskiz xato qaytargan bo'lsa (masalan xabar matni noto'g'ri bo'lsa)
    if (!eskizResponse.ok) {
        console.error("Eskiz API xatosi:", result)
        // Supabasega xatoni tushunarli formatda qaytaramiz
        return new Response(JSON.stringify({ 
            error: result.message || "Eskiz API xatosi",
            details: result 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }

    // SUPABASE UCHUN MUVAFFAQIYATLI JAVOB
    // Supabase Custom SMS provider funksiyadan status: 200 va JSON kutadi
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[CRITICAL ERROR]", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
