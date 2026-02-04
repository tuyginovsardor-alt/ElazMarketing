
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// .env faylini yuklaymiz (zaxira uchun)
const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local')
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        break;
    }
}

export const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const VITE_SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

export const supabase = createClient(VITE_SUPABASE_URL || '', VITE_SUPABASE_KEY || '');
export const SITE_URL = "https://elaz-market.vercel.app";

// Dinamik token o'zgaruvchisi
export let BOT_TOKEN = process.env.BOT_TOKEN;

/**
 * Bazadan tokenni yuklash
 */
export async function refreshBotToken() {
    try {
        console.log("🔍 [DB] Bot tokenini bazadan qidiryapman...");
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'bot_token')
            .maybeSingle();

        if (error) throw error;

        if (data && data.value) {
            BOT_TOKEN = data.value;
            console.log("✅ [DB] Token muvaffaqiyatli yuklandi!");
            return BOT_TOKEN;
        } else {
            console.warn("⚠️ [DB] Bazada 'bot_token' topilmadi. .env ishlatiladi.");
            return BOT_TOKEN;
        }
    } catch (e) {
        console.error("❌ [DB ERROR] Tokenni yuklashda xato:", e.message);
        return BOT_TOKEN;
    }
}

/**
 * Telegram API so'rovi
 */
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
        return result;
    } catch (e) {
        return { ok: false, description: e.message };
    }
}
