
import { supabase, tg, refreshBotToken, BOT_TOKEN } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastId = 0;
let currentActiveToken = "";

async function router(update) {
    if (update.callback_query) return handleCallbacks(update.callback_query);
    const msg = update.message;
    if (!msg?.text && !msg?.contact) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    // --- DEEP LINKING TIZIMI ---
    if (text?.startsWith("/start ")) {
        const token = text.split(" ")[1];
        if (token) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('link_token', token)
                .maybeSingle();

            if (profile) {
                // Foydalanuvchini botga bog'laymiz
                await supabase.from('profiles').update({ 
                    telegram_id: chatId, 
                    link_token: null 
                }).eq('id', profile.id);

                const kb = profile.role === 'courier' ? KB.courier : KB.user;
                return tg('sendMessage', { 
                    chat_id: chatId, 
                    text: `✅ <b>TABRIKLAYMIZ, ${profile.first_name.toUpperCase()}!</b>\n\nProfilingiz muvaffaqiyatli botga ulandi. Endi barcha bildirishnomalar shu yerga keladi! 🚀`, 
                    parse_mode: 'HTML', 
                    reply_markup: kb 
                });
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
        return tg('sendMessage', { chat_id: chatId, text: "🏪 <b>ELAZ MARKET: Bag'dod</b>\n\nPlatformaga xush kelibsiz! Botni ilova orqali ulashing yoki login qiling:", parse_mode: 'HTML', reply_markup: KB.welcome });
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

async function monitorToken() {
    setInterval(async () => {
        const oldToken = currentActiveToken;
        const newToken = await refreshBotToken();
        if (newToken && newToken !== oldToken) {
            currentActiveToken = newToken;
            lastId = 0;
            tg('sendMessage', { chat_id: 8021115446, text: "🚀 <b>Bot Engine:</b> Token yangilandi va bot username aniqlandi!" }).catch(() => {});
        }
    }, 5000);
}

async function start() {
    const initialToken = await refreshBotToken();
    currentActiveToken = initialToken || "";
    monitorToken();
    
    while (true) {
        if (!currentActiveToken) {
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }
        try {
            const res = await tg('getUpdates', { offset: lastId, timeout: 30 });
            if (res && res.ok && res.result.length) {
                for (const u of res.result) {
                    await router(u);
                    lastId = u.update_id + 1;
                }
            } else if (res && !res.ok && (res.error_code === 401)) {
                currentActiveToken = "";
            }
            await new Promise(r => setTimeout(r, 100));
        } catch (e) {
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}
start();
