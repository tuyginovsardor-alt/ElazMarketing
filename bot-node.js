
/**
 * ELAZ MARKET - BOT ENGINE V8.2
 * Seamless Google Auth & Token Linking
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } = process.env;
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);

const sessions = {};
let lastUpdateId = 0;

// --- TG API HELPER ---
async function tg(method, body, token) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) { return { ok: false }; }
}

async function sendMenu(chatId, text, menu, token) {
    return await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: menu }, token);
}

const USER_MENU = {
    keyboard: [[{ text: "🛍 Market" }, { text: "🛒 Savatim" }], [{ text: "👤 Profil" }, { text: "❌ Chiqish" }]],
    resize_keyboard: true
};

const WELCOME_MENU = {
    keyboard: [[{ text: "🔑 Kirish (Bot orqali)" }], [{ text: "🌐 Saytga o'tish" }]],
    resize_keyboard: true
};

// --- MAIN LOGIC ---
async function handleUpdate(update, token) {
    const msg = update.message;
    const text = msg?.text;
    const chatId = msg?.chat.id;
    if (!chatId || !text) return;

    // --- 1. TOKEN BILAN BOG'LASH (Deep Link) ---
    if (text.startsWith('/start v_')) {
        const linkToken = text.split('v_')[1];
        
        // Token bo'yicha foydalanuvchini qidiramiz
        const { data: profile, error } = await supabase.from('profiles')
            .select('*')
            .eq('link_token', linkToken)
            .maybeSingle();

        if (profile) {
            // Profilni bog'laymiz va tokenni o'chiramiz
            await supabase.from('profiles').update({ 
                telegram_id: chatId, 
                link_token: null, 
                link_token_expires: null 
            }).eq('id', profile.id);

            return await sendMenu(chatId, `✅ <b>MUVAFFAQIYATLI ULASH!</b>\n\nAssalomu alaykum, <b>${profile.first_name}</b>! Saytdagi akkauntingiz bot bilan bog'landi.`, USER_MENU, token);
        } else {
            return await tg('sendMessage', { chat_id: chatId, text: "❌ <b>Xatolik:</b> Havola eskirgan yoki noto'g'ri. Iltimos, saytdan qayta urinib ko'ring." }, token);
        }
    }

    // Har bir xabarda foydalanuvchini tekshiramiz
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    if (text === "/start") {
        if (profile) return await sendMenu(chatId, `Xush kelibsiz, <b>${profile.first_name}</b>!`, USER_MENU, token);
        else return await sendMenu(chatId, "Assalomu alaykum! <b>ELAZ MARKET</b> botiga xush kelibsiz. Tizimga sayt orqali kirgan bo'lsangiz, profilingizdan botni ulashingiz mumkin.", WELCOME_MENU, token);
    }

    if (text.includes("Profil") && profile) {
        const stats = `👤 <b>PROFILINGIZ:</b>\n\nIsm: ${profile.first_name}\nGmail: ${profile.email}\nTel: ${profile.phone}\nBalans: ${profile.balance.toLocaleString()} UZS`;
        return await tg('sendMessage', { chat_id: chatId, text: stats, parse_mode: 'HTML' }, token);
    }
}

async function start() {
    console.log("🚀 ELAZ Bot Engine V8.2 (DeepLink) is running...");
    const { data: config } = await supabase.from('bot_configs').select('token').eq('is_active', true).single();
    if (!config) return console.error("❌ Bot Token Topilmadi!");
    const token = config.token;

    while (true) {
        try {
            const updates = await tg('getUpdates', { offset: lastUpdateId, timeout: 30 }, token);
            if (updates.ok && updates.result) {
                for (const u of updates.result) {
                    await handleUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch (e) { await new Promise(r => setTimeout(r, 5000)); }
    }
}

start();
