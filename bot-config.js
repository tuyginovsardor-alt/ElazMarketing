
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
 * Bazadan tokenni yuklash (bot_configs jadvalidan)
 */
export async function refreshBotToken() {
    try {
        console.log("🔍 [DB] Bot tokenini 'bot_configs' jadvalidan qidiryapman...");
        const { data, error } = await supabase
            .from('bot_configs')
            .select('token')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (data && data.token) {
            BOT_TOKEN = data.token;
            console.log(`✅ [DB] Aktiv token yuklandi: ${BOT_TOKEN.substring(0, 10)}...`);
            return BOT_TOKEN;
        } else {
            console.warn("⚠️ [DB] Aktiv bot topilmadi. .env fayli tekshiriladi.");
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
        return { ok: false, description: "Bot tokeni topilmadi!" };
    }
    
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
        const res = await fetch(url, {
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
