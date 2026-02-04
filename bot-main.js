
import { supabase, tg, refreshBotToken } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastId = 0;

async function router(update) {
    if (update.callback_query) return handleCallbacks(update.callback_query);
    const msg = update.message;
    if (!msg?.text && !msg?.contact) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    // --- DEEP LINKING (/start TOKEN) ---
    if (text?.startsWith("/start ")) {
        const token = text.split(" ")[1];
        if (token) {
            console.log(`[LINKING] User trying to connect with token: ${token}`);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('link_token', token)
                .maybeSingle();

            if (profile) {
                // Bog'lashni amalga oshirish
                await supabase.from('profiles').update({ 
                    telegram_id: chatId, 
                    link_token: null // Tokenni o'chiramiz
                }).eq('id', profile.id);

                return tg('sendMessage', { 
                    chat_id: chatId, 
                    text: `✅ <b>TABRIKLAYMIZ!</b>\n\nProfilingiz (<b>${profile.first_name}</b>) muvaffaqiyatli botga ulandi. Endi xabarnomalar shu yerga keladi.`, 
                    parse_mode: 'HTML', 
                    reply_markup: profile.role === 'courier' ? KB.courier : KB.user 
                });
            } else {
                return tg('sendMessage', { chat_id: chatId, text: "❌ <b>Xatolik:</b> Token yaroqsiz yoki eskirgan.", parse_mode: 'HTML' });
            }
        }
    }

    if (text === "/start" || text === "❌ Chiqish" || text === "❌ Bekor qilish") {
        session.step = 'idle';
        const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if (profile) {
            const kb = profile.role === 'courier' ? KB.courier : KB.user;
            return tg('sendMessage', { chat_id: chatId, text: `👋 Xush kelibsiz, <b>${profile.first_name}</b>!`, parse_mode: 'HTML', reply_markup: kb });
        }
        return tg('sendMessage', { chat_id: chatId, text: "🏪 <b>ELAZ MARKET: Bag'dod</b>\n\nPlatformaga xush kelibsiz! Botdan foydalanish uchun tizimga kiring yoki sayt orqali ulaning:", parse_mode: 'HTML', reply_markup: KB.welcome });
    }

    if (session.step !== 'idle' || text === "🔑 Kirish" || text === "📝 Ro'yxatdan o'tish") {
        return handleAuth(chatId, text, session, msg);
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (profile) {
        if (profile.role === 'courier') return handleCourier(chatId, text, profile);
        return handleUser(chatId, text, profile);
    }
}

async function start() {
    console.log("💎 ELAZ BOT ENGINE V12 (ULTIMATE) STARTING...");
    const token = await refreshBotToken();
    if (!token) {
        console.error("⛔ [CRITICAL] BOT_TOKEN topilmadi!");
        process.exit(1);
    }
    console.log("🚀 Polling started...");
    while (true) {
        try {
            const res = await tg('getUpdates', { offset: lastId, timeout: 30 });
            if (res && res.ok && res.result.length) {
                for (const u of res.result) {
                    await router(u);
                    lastId = u.update_id + 1;
                }
            } else if (res && !res.ok) {
                await new Promise(r => setTimeout(r, 5000));
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}
start();
