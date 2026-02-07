
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

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

export const SITE_URL = "https://elaz-marketing.vercel.app";

export let BOT_TOKEN = process.env.BOT_TOKEN;
export let BOT_USERNAME = "";

/**
 * Telegram API so'rovi
 */
export async function tg(method, body) {
    if (!BOT_TOKEN) return { ok: false, description: "Token yo'q" };
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        return { ok: false, description: e.message };
    }
}

/**
 * Aktiv tokenni va bot username-ni yangilash
 */
export async function refreshBotToken() {
    try {
        const { data, error } = await supabase
            .from('bot_configs')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;

        if (data && data.token) {
            BOT_TOKEN = data.token;
            // Bot username-ni Telegramdan olish
            const me = await tg('getMe', {});
            if (me.ok) {
                BOT_USERNAME = me.result.username;
                // Bazada username-ni yangilab qo'yamiz (agar kerak bo'lsa)
                await supabase.from('bot_configs').update({ username: BOT_USERNAME }).eq('id', data.id);
            }
            return BOT_TOKEN;
        }
        return BOT_TOKEN;
    } catch (e) {
        return BOT_TOKEN;
    }
}
