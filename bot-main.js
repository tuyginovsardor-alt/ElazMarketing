
import { supabase, tg, refreshBotToken } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastUpdateId = 0;

/**
 * OTP WATCHER: Bu funksiya bazani kuzatib turadi.
 * Agar profiles jadvalida otp_status = 'pending' bo'lgan qator chiqsa,
 * foydalanuvchiga kodni yuboradi.
 */
async function startOtpWatcher() {
    console.log("🔍 [OTP WATCHER] Monitoring profiles for pending OTPs...");
    
    setInterval(async () => {
        try {
            const { data: requests, error } = await supabase
                .from('profiles')
                .select('id, phone, telegram_id, otp_code, first_name')
                .eq('otp_status', 'pending')
                .limit(5);

            if (error) {
                console.error("Watcher DB Error:", error.message);
                return;
            }

            if (!requests || requests.length === 0) return;

            for (const req of requests) {
                if (req.telegram_id) {
                    // Telegram orqali kodni yuboramiz
                    const msgText = `🔐 <b>ELAZ MARKET: TASDIQLASH KODI</b>\n\nAssalomu alaykum ${req.first_name || 'Foydalanuvchi'}!\n\nSizning kirish kodingiz: <code>${req.otp_code}</code>\n\nKodni saytga kiriting. Uni hech kimga bermang!`;
                    
                    const res = await tg('sendMessage', {
                        chat_id: req.telegram_id,
                        text: msgText,
                        parse_mode: 'HTML'
                    });

                    if (res.ok) {
                        await supabase.from('profiles').update({ otp_status: 'sent' }).eq('id', req.id);
                        console.log(`✅ [OTP SENT] Raqam: ${req.phone} -> TG_ID: ${req.telegram_id}`);
                    } else {
                        // Agar bot bloklangan bo'lsa yoki boshqa xato
                        await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                        console.error(`❌ [OTP BLOCKED] TG_ID: ${req.telegram_id} botni bloklagan bo'lishi mumkin.`);
                    }
                } else {
                    // Agar telegram_id ulanmagan bo'lsa
                    await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                    console.warn(`⚠️ [NO TG_ID] ${req.phone} raqam botga ulanmagan.`);
                }
            }
        } catch (e) {
            console.error("Watcher Critical Error:", e.message);
        }
    }, 2000); // Har 2 soniyada tekshiradi
}

async function router(update) {
    if (update.callback_query) return handleCallbacks(update.callback_query);
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    // KONTAKT ULASH (Foydalanuvchi botga kirib raqamini yuborganda)
    if (msg.contact) {
        const phone = '+' + msg.contact.phone_number.replace(/\D/g, '');
        const { data: existing } = await supabase.from('profiles').select('*').eq('phone', phone).maybeSingle();
        
        if (existing) {
            await supabase.from('profiles').update({ telegram_id: chatId }).eq('phone', phone);
        } else {
            await supabase.from('profiles').insert({ 
                phone: phone, 
                telegram_id: chatId, 
                role: 'user', 
                balance: 0 
            });
        }

        return tg('sendMessage', { 
            chat_id: chatId, 
            text: `✅ <b>RAQAM MUAFFAQIYATLI ULANDI!</b>\n\nEndi saytda ro'yxatdan o'tayotganingizda tasdiqlash kodlari shu yerga keladi.`,
            parse_mode: 'HTML',
            reply_markup: KB.user
        });
    }

    if (!text) return;
    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    if (text === "/start" || text === "❌ Chiqish") {
        session.step = 'idle';
        const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if (profile) {
            const welcomeMsg = profile.role === 'courier' ? `🛵 <b>KURER TERMINALI</b>` : `🛒 <b>ELAZ MARKET</b>`;
            return tg('sendMessage', { chat_id: chatId, text: welcomeMsg, parse_mode: 'HTML', reply_markup: profile.role === 'courier' ? KB.courier : KB.user });
        }
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: "🏪 <b>ELAZ MARKET BOTIGA XUSH KELIBSIZ!</b>\n\nSaytda kodlarni olish uchun pastdagi tugma orqali raqamingizni ulang:", 
            parse_mode: 'HTML', 
            reply_markup: KB.welcome 
        });
    }

    // Boshqa handlerlar (Auth, User, Courier)
    if (session.step.startsWith('login') || session.step.startsWith('reg')) {
        return handleAuth(chatId, text, session, msg);
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (!profile) return;

    if (profile.role === 'courier') return handleCourier(chatId, text, profile);
    return handleUser(chatId, text, profile);
}

async function start() {
    console.log("🚀 [ELAZ ENGINE] Bot starting...");
    await refreshBotToken();
    
    // OTP Watcher-ni alohida jarayon sifatida boshlaymiz
    startOtpWatcher();

    while (true) {
        try {
            const updates = await tg('getUpdates', { offset: lastUpdateId, timeout: 30 });
            if (updates.ok && updates.result) {
                for (const u of updates.result) {
                    await router(u);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch (e) {
            console.error("Polling Error:", e.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

start();
