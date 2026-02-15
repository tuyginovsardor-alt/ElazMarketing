
import { supabase, tg, refreshBotToken } from './bot-config.js';
import { KB } from './bot-keyboards.js';
import { handleAuth } from './bot-auth.js';
import { handleUser } from './bot-user.js';
import { handleCourier, handleCallbacks } from './bot-courier.js';

const sessions = {};
let lastId = 0;
let currentActiveToken = "";
let isMonitoring = false;

// --- OTP WATCHER (Bazani tekshiruvchi qism) ---
async function startOtpWatcher() {
    console.log("🔍 OTP Watcher started... Monitoring profiles for pending OTPs.");
    setInterval(async () => {
        try {
            // 'pending' holatidagi barcha yangi OTP so'rovlarini olamiz
            const { data: requests, error } = await supabase
                .from('profiles')
                .select('id, phone, telegram_id, otp_code, first_name')
                .eq('otp_status', 'pending')
                .limit(5);

            if (error || !requests) return;

            for (const req of requests) {
                if (req.telegram_id) {
                    // Telegram ID bor - kurer yoki foydalanuvchiga xabar yuboramiz
                    const res = await tg('sendMessage', {
                        chat_id: req.telegram_id,
                        text: `🔐 <b>ELAZ MARKET: TASDIQLASH KODI</b>\n\nAssalomu alaykum ${req.first_name || 'Foydalanuvchi'}!\n\nSizning kirish kodingiz: <code>${req.otp_code}</code>\n\nKodni saytga kiriting. Uni hech kimga bermang!`,
                        parse_mode: 'HTML'
                    });

                    if (res.ok) {
                        // Muvaffaqiyatli yuborilgach statusni yangilaymiz
                        await supabase.from('profiles').update({ otp_status: 'sent' }).eq('id', req.id);
                        console.log(`[OTP SENT] To ${req.phone} (TG: ${req.telegram_id})`);
                    } else {
                        // Bot bloklangan yoki boshqa xato
                        await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                        console.error(`[OTP FAILED] Could not send to TG ID: ${req.telegram_id}`);
                    }
                } else {
                    // Telegram ID yo'q - foydalanuvchi botga kirmagan!
                    await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                    console.warn(`[OTP WARNING] User ${req.phone} has no telegram_id linked.`);
                }
            }
        } catch (e) {
            console.error("Watcher Error:", e);
        }
    }, 2500); // Har 2.5 soniyada bazani tekshiradi
}

async function router(update) {
    if (update.callback_query) return handleCallbacks(update.callback_query);
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    // KONTAKT ULASH (Bu juda muhim qism)
    if (msg.contact) {
        const phone = '+' + msg.contact.phone_number.replace(/\D/g, '');
        // Avval mavjud profilni qidiramiz
        const { data: existing } = await supabase.from('profiles').select('*').eq('phone', phone).maybeSingle();
        
        if (existing) {
            await supabase.from('profiles').update({ telegram_id: chatId }).eq('phone', phone);
        } else {
            // Agar profil bo'lmasa, yangi ochamiz (otp_status null qoladi)
            await supabase.from('profiles').insert({ 
                phone: phone, 
                telegram_id: chatId, 
                role: 'user', 
                balance: 0 
            });
        }

        return tg('sendMessage', { 
            chat_id: chatId, 
            text: `✅ <b>RAQAM MUVAFFAQIYATLI ULANDI!</b>\n\nEndi saytda ro'yxatdan o'tayotganingizda tasdiqlash kodlari shu yerga keladi.\n\nFoydalanishni boshlash uchun saytga qayting.`,
            parse_mode: 'HTML',
            reply_markup: KB.user
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
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: "🏪 <b>ELAZ MARKET BOTIGA XUSH KELIBSIZ!</b>\n\nSaytda ro'yxatdan o'tish va kodlarni olish uchun pastdagi tugma orqali telefon raqamingizni yuboring:", 
            parse_mode: 'HTML', 
            reply_markup: KB.welcome 
        });
    }

    // ... rest of the router logic (handleAuth, handleUser, handleCourier)
}
// ... rest of the file
