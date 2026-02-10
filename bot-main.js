
import { supabase, tg, refreshBotToken, BOT_TOKEN } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastId = 0;
let currentActiveToken = "";
let isMonitoring = false;

async function router(update) {
    if (update.callback_query) return handleCallbacks(update.callback_query);
    const msg = update.message;
    if (!msg?.text && !msg?.contact) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    // --- DEEP LINKING ---
    if (text?.startsWith("/start ")) {
        const token = text.split(" ")[1];
        if (token) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('link_token', token).maybeSingle();
            if (profile) {
                await supabase.from('profiles').update({ telegram_id: chatId, link_token: null }).eq('id', profile.id);
                const kb = profile.role === 'courier' ? KB.courier : KB.user;
                return tg('sendMessage', { 
                    chat_id: chatId, 
                    text: `✅ <b>TABRIKLAYMIZ, ${profile.first_name.toUpperCase()}!</b>\n\nBot muvaffaqiyatli ulandi.`, 
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
        return tg('sendMessage', { chat_id: chatId, text: "🏪 <b>ELAZ MARKET</b>\n\nBotga xush kelibsiz!", parse_mode: 'HTML', reply_markup: KB.welcome });
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
    console.log("🚀 ELAZ BOT ENGINE STARTING...");
    
    // Monitoringni faqat bir marta ishga tushiramiz
    if(!isMonitoring) {
        isMonitoring = true;
        setInterval(async () => {
            const newToken = await refreshBotToken();
            if (newToken && newToken !== currentActiveToken) {
                console.log("🔄 NEW TOKEN DETECTED, RESTARTING POLLER...");
                currentActiveToken = newToken;
                lastId = 0; // Reset offset for new bot
            }
        }, 5000);
    }

    // Polling Loop
    while (true) {
        if (!currentActiveToken) {
            currentActiveToken = await refreshBotToken() || "";
            await new Promise(r => setTimeout(r, 2000));
            continue;
        }

        try {
            const res = await tg('getUpdates', { offset: lastId, timeout: 20 });
            if (res && res.ok && res.result.length) {
                for (const u of res.result) {
                    await router(u);
                    lastId = u.update_id + 1;
                }
            } else if (res && !res.ok && res.error_code === 401) {
                console.error("🚫 TOKEN EXPIRED OR INVALID");
                currentActiveToken = "";
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 5000));
        }
        await new Promise(r => setTimeout(r, 100));
    }
}

start();
