
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY, BOT_TOKEN } = process.env;
export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);
export const SITE_URL = "https://elaz-market.vercel.app";

export async function tg(method, body) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) { return { ok: false }; }
}
