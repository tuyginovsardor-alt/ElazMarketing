
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client-platform',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Body bo'sh bo'lsa xato bermasligi uchun
    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        body = {};
    }

    const rawToken = Deno.env.get('TSPAY_TOKEN');
    const token = rawToken ? rawToken.trim() : null;

    if (!token) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "API Token topilmadi (TSPAY_TOKEN set qilinmagan)." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // --- 1. WEBHOOK (To'lov tasdiqlanganda TsPay ushbu qismga murojaat qiladi) ---
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
        
        // Komment ichidan User ID (UUID) ni qidirib olamiz
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          // Baza rpc funksiyasini chaqiramiz (balansni yangilash uchun)
          await supabaseAdmin.rpc('record_tspay_success', { 
              u_id: userId, 
              amt: amount, 
              o_id: Number(orderId) 
          });
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // --- 2. TO'LOV YARATISH (Frontenddan kelgan so'rov) ---
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      const TSPAY_API_URL = 'https://tspay.uz/api/v1/transactions/create/';

      const tsResponse = await fetch(TSPAY_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json' 
        },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          // Branding yangilandi: Anilo.uz -> ELAZ MARKET
          comment: `ELAZ MARKET: ${body.user_id}`,
          redirect_url: 'https://elaz-market.uz/profile'
        })
      });
      
      const data = await tsResponse.json().catch(() => ({}));

      const findUrlDeep = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          const priorityKeys = ['pay_url', 'url', 'payment_url', 'link', 'pay_link', 'payment_page_url', 'checkout_url'];
          for (const key of priorityKeys) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('http')) return obj[key];
          }
          for (const key in obj) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('https://checkout.tspay.uz')) return obj[key];
              if (typeof obj[key] === 'object') {
                  const found = findUrlDeep(obj[key]);
                  if (found) return found;
              }
          }
          return null;
      };

      const payUrl = findUrlDeep(data);
      const transactionId = data.id || (data.data && data.data.id) || data.cheque_id;

      if ((tsResponse.status === 200 || tsResponse.status === 201) && payUrl) {
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: transactionId } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          const errorMsg = data.message || data.error || `TsPay xatosi: ${tsResponse.status}`;
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: errorMsg
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  }
})
