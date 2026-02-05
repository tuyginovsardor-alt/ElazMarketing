
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client-platform',
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

    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        body = {};
    }

    const rawToken = Deno.env.get('TSPAY_TOKEN');
    const token = rawToken ? rawToken.trim() : null;

    // DEBUG: Supabase Logs-da qaysi token ishlatilayotganini ko'rish uchun (faqat boshlanishi)
    if (token) {
        console.log(`[AUTH] TSPAY_TOKEN picked up. Prefix: ${token.substring(0, 6)}...`);
    } else {
        console.error("[AUTH] TSPAY_TOKEN is missing in environment variables!");
    }

    if (!token) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "To'lov tizimi sozlanmagan (Token missing)." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // --- 1. WEBHOOK HANDLING ---
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
        
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          await supabaseAdmin.rpc('record_tspay_success', { 
              u_id: userId, 
              amt: amount, 
              o_id: Number(orderId) 
          });
          console.log(`[SUCCESS] Balance updated for user: ${userId}, Amount: ${amount}`);
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // --- 2. PAYMENT CREATION ---
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      if (amount < 5000) throw new Error("Minimal summa 5000 so'm");

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
          comment: `ELAZ_MARKET_TOPUP: ${body.user_id}`,
          redirect_url: 'https://elaz-market.uz/profile'
        })
      });
      
      const data = await tsResponse.json().catch(() => ({}));
      console.log(`[TSPAY RESPONSE] Status: ${tsResponse.status}`, data);

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
      if (payUrl) {
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: data.message || "To'lov havolasini olib bo'lmadi"
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Unknown action' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
    });

  } catch (error: any) {
    console.error("[CRITICAL ERROR]", error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });
  }
})
