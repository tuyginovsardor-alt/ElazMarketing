
// Supabase Edge Function: Telegram OTP Hook Handler
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log("OTP Payload:", JSON.stringify(payload))

    const phone = payload.sms?.phone || payload.phone
    const message = payload.sms?.message || payload.message

    if (!phone || !message) {
      throw new Error("Telefon yoki xabar topilmadi")
    }

    // 1. Profiles jadvalidan ushbu raqamga bog'langan telegram_id ni topamiz
    const cleanPhone = '+' + phone.replace(/\D/g, '')
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('telegram_id, first_name')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (dbError) throw dbError

    // 2. Agar telegram_id bo'lmasa, foydalanuvchiga botga o'tish haqida xato qaytaramiz
    if (!profile || !profile.telegram_id) {
        return new Response(JSON.stringify({ 
            error: "Foydalanuvchi topilmadi. Avval botimizga (@elaz_market_bot) kirib raqamingizni ulashing!",
            code: "no_telegram_id"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }

    // 3. Telegram orqali xabar yuborish
    const BOT_TOKEN = Deno.env.get('BOT_TOKEN') // Supabase dashboardda buni sozlash kerak
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

    const tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: profile.telegram_id,
            text: `🔐 <b>TASDIQLASH KODI</b>\n\nAssalomu alaykum ${profile.first_name || 'Mijoz'}!\n\n${message}\n\nKod hech kimga bermang!`,
            parse_mode: 'HTML'
        })
    })

    const tgData = await tgRes.json()

    if (!tgData.ok) {
        throw new Error(tgData.description || "Telegramga xabar yuborishda xatolik")
    }

    return new Response(JSON.stringify({ status: 'success', provider: 'telegram' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[OTP ERROR]", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
