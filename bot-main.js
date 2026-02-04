
import { supabase, tg, BOT_TOKEN } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastId = 0;

async function router(update) {
    const msg = update.message;
    const cb = update.callback_query;

    if (cb) return handleCallbacks(cb, BOT_TOKEN);
    if (!msg?.text && !msg?.contact) return;

    const chatId = msg.chat?.id || cb?.from.id;
    const text = msg?.text;

    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    // Global Reset
    if (text === "/start" || text === "❌ Chiqish" || text === "❌ Bekor qilish") {
        session.step = 'idle';
        const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if (profile) {
            const kb = profile.role === 'courier' ? KB.courier : KB.user;
            return tg('sendMessage', { chat_id: chatId, text: `👋 Xush kelibsiz, <b>${profile.first_name}</b>!`, parse_mode: 'HTML', reply_markup: kb });
        }
        return tg('sendMessage', { chat_id: chatId, text: "🏪 <b>ELAZ MARKET: Bag'dod</b>\n\nPlatformamizga xush kelibsiz! Botdan to'liq foydalanish uchun tizimga kiring:", parse_mode: 'HTML', reply_markup: KB.welcome });
    }

    // Auth Step-by-Step
    if (session.step !== 'idle' || text === "🔑 Kirish" || text === "📝 Ro'yxatdan o'tish") {
        return handleAuth(chatId, text, session, msg);
    }

    // Main Role Logic
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (profile) {
        if (profile.role === 'courier') return handleCourier(chatId, text, profile);
        return handleUser(chatId, text, profile);
    }
}

async function start() {
    console.log("💎 ELAZ BOT ENGINE V11 (PRO) STARTED...");
    while (true) {
        try {
            const updates = await tg('getUpdates', { offset: lastId, timeout: 30 });
            if (updates.ok && updates.result) {
                for (const u of updates.result) {
                    await router(u);
                    lastId = u.update_id + 1;
                }
            }
        } catch (e) { 
            console.error("Loop Error:", e);
            await new Promise(r => setTimeout(r, 5000)); 
        }
    }
}

start();
