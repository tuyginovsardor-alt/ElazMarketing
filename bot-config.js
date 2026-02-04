
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// .env faylini yuklaymiz
const envResult = dotenv.config();

if (envResult.error) {
    console.warn("⚠️ OGOHLANTIRISH: .env fayli topilmadi yoki o'qib bo'lmadi!");
}

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const VITE_SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

// Qaysi biri yetishmayotganini aniq tekshiramiz
if (!BOT_TOKEN) {
    console.error("❌ XATOLIK: .env ichida 'BOT_TOKEN' topilmadi!");
}
if (!VITE_SUPABASE_URL) {
    console.error("❌ XATOLIK: .env ichida 'VITE_SUPABASE_URL' topilmadi!");
}
if (!VITE_SUPABASE_KEY) {
    console.error("❌ XATOLIK: .env ichida 'VITE_SUPABASE_KEY' topilmadi!");
}

export const supabase = createClient(VITE_SUPABASE_URL || '', VITE_SUPABASE_KEY || '');
export const SITE_URL = "https://elaz-market.vercel.app";

export async function tg(method, body) {
    if (!BOT_TOKEN) {
        return { ok: false, description: "Token yo'q" };
    }
    
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (!result.ok) {
            console.error(`[TG API ERROR] ${method}:`, result.description);
        }
        return result;
    } catch (e) {
        console.error(`[NETWORK ERROR] ${method}:`, e.message);
        return { ok: false };
    }
}
