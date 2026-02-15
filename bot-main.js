
import { supabase, tg, refreshBotToken, BOT_TOKEN } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastId = 0;
let currentActiveToken = "";
let isMonitoring = false;

// --- OTP WATCHER ---
async function startOtpWatcher() {
    console.log("🔍 OTP Watcher started...");
    setInterval(async () => {
        try {
            // 'pending' holatidagi barcha yangi OTP so'rovlarini olamiz
            const { data: requests, error } = await supabase
                .from('profiles')
                .select('id, phone, telegram_id, otp_code, first_name')
                .eq('otp_status', 'pending')
                .limit(5);

            if (error) return;

            for (const req of requests) {
                if (req.telegram_id) {
                    // Telegram ID bor - xabar yuboramiz
                    const res = await tg('sendMessage', {
                        chat_id: req.telegram_id,
                        text: `🔐 <b>TASDIQLASH KODI</b>\n\nAssalomu alaykum ${req.first_name || 'Mijoz'}!\n\nSizning kirish kodingiz: <code>${req.otp_code}</code>\n\nKodni hech kimga bermang!`,
                        parse_mode: 'HTML'
                    });

                    if (res.ok) {
                        await supabase.from('profiles').update({ otp_status: 'sent' }).eq('id', req.id);
                    } else {
                        await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                    }
                } else {
                    // Telegram ID yo'q - demak botga hali ulanmagan
                    await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                }
            }
        } catch (e) {
            console.error("Watcher Error:", e);
        }
    }, 3000);
}

async function router(update) {
    if (update.callback_query) return handleCallbacks(update.callback_query);
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (msg.contact) {
        const phone = '+' + msg.contact.phone_number.replace(/\D/g, '');
        const { data, error } = await supabase
            .from('profiles')
            .update({ telegram_id: chatId })
            .eq('phone', phone)
            .select();

        return tg('sendMessage', { 
            chat_id: chatId, 
            text: `✅ <b>Raqamingiz ulandi!</b>\n\nEndi saytda kirish kodi Telegramdan keladi.`,
            parse_mode: 'HTML',
            reply_markup: data?.length ? (data[0].role === 'courier' ? KB.courier : KB.user) : KB.welcome
        });
    }

    if (!text) return;
    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    if (text === "/start" || text === "❌ Chiqish" || text === "❌ Bekor qilish") {
        session.step = 'idle';
        const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if (profile) {
            const welcomeMsg = profile.role === 'courier' ? `🛵 <b>KURER TERMINALI</b>` : `🛒 <b>ELAZ MARKET</b>`;
            return tg('sendMessage', { chat_id: chatId, text: welcomeMsg, parse_mode: 'HTML', reply_markup: profile.role === 'courier' ? KB.courier : KB.user });
        }
        return tg('sendMessage', { chat_id: chatId, text: "🏪 <b>ELAZ MARKET</b>\n\nSaytga kirish kodi Telegramdan kelishi uchun pastdagi tugmani bosing:", parse_mode: 'HTML', reply_markup: KB.welcome });
    }

    if (session.step !== 'idle' || text === "🔑 Kirish" || text === "📝 Ro'yxatdan o'tish") {
        return handleAuth(chatId, text, session, msg);
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (profile) {
        profile.role === 'courier' ? handleCourier(chatId, text, profile) : handleUser(chatId, text, profile);
    }
}

async function start() {
    console.log("🚀 ELAZ BOT ENGINE V12.0 (TELEGRAM OTP) STARTED...");
    startOtpWatcher();
    
    if(!isMonitoring) {
        isMonitoring = true;
        setInterval(async () => {
            const newToken = await refreshBotToken();
            if (newToken && newToken !== currentActiveToken) {
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
            if (res?.ok && res.result.length) {
                for (const u of res.result) {
                    await router(u);
                    lastId = u.update_id + 1;
                }
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 500));
    }
}

start();
