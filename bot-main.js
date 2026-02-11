
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

    // --- GLOBAL RESET ---
    if (text === "/start" || text === "❌ Chiqish" || text === "❌ Bekor qilish") {
        session.step = 'idle';
        // Bazadan profilni rolini ham qo'shib olish
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        
        if (profile) {
            console.log(`[BOT] Recognized user: ${profile.first_name}, Role: ${profile.role}`);
            const kb = profile.role === 'courier' ? KB.courier : KB.user;
            const welcomeMsg = profile.role === 'courier' ? 
                `🛵 <b>KURER TERMINALI</b>\n\nXush kelibsiz, <b>${profile.first_name}</b>!\nBugun xizmatga tayyormisiz?` : 
                `🛒 <b>ELAZ MARKET</b>\n\nXush kelibsiz, <b>${profile.first_name}</b>!`;
            return tg('sendMessage', { chat_id: chatId, text: welcomeMsg, parse_mode: 'HTML', reply_markup: kb });
        }
        
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: "🏪 <b>ELAZ MARKET</b>\n\nBag'dod tumanidagi eng tezkor savdo platformasi botiga xush kelibsiz! Davom etish uchun tizimga kiring:", 
            parse_mode: 'HTML', 
            reply_markup: KB.welcome 
        });
    }

    // --- AUTH FLOW ---
    if (session.step !== 'idle' || text === "🔑 Kirish" || text === "📝 Ro'yxatdan o'tish") {
        return handleAuth(chatId, text, session, msg);
    }

    // --- LOGGED IN ROUTING ---
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (profile) {
        if (profile.role === 'courier') {
            return handleCourier(chatId, text, profile);
        } else {
            return handleUser(chatId, text, profile);
        }
    } else {
        // Agar profil topilmasa startga qaytarish
        return tg('sendMessage', { chat_id: chatId, text: "Siz tizimga kirmagansiz. /start bosing.", reply_markup: KB.welcome });
    }
}

async function start() {
    console.log("🚀 ELAZ BOT ENGINE V10.5 (RECOGNITION FIX) STARTED...");
    
    if(!isMonitoring) {
        isMonitoring = true;
        setInterval(async () => {
            const newToken = await refreshBotToken();
            if (newToken && newToken !== currentActiveToken) {
                console.log("🔄 NEW TOKEN SYNCED...");
                currentActiveToken = newToken;
                lastId = 0; 
            }
        }, 5000);
    }

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
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 5000));
        }
        await new Promise(r => setTimeout(r, 200));
    }
}

start();
