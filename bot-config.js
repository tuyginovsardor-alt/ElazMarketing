
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const VITE_SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!BOT_TOKEN || !VITE_SUPABASE_URL) {
    console.error("❌ XATOLIK: .env faylini tekshiring (BOT_TOKEN yoki Supabase keylari yo'q)!");
}

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);
export const SITE_URL = "https://elaz-market.vercel.app";

export async function tg(method, body) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (!result.ok) console.warn(`[TG ERROR] ${method}:`, result.description);
        return result;
    } catch (e) {
        console.error(`[FETCH ERROR] ${method}:`, e.message);
        return { ok: false };
    }
}
