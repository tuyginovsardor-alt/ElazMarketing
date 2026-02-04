
/**
 * ELAZ MARKET - BOT SERVICE (NODE.JS)
 * Optimized for Google Cloud VM & Tmux
 * V6.0 - Full Auth Flow & Session Management
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_KEY) {
    console.error("❌ XATOLIK: .env faylida VITE_SUPABASE_URL yoki VITE_SUPABASE_KEY topilmadi!");
    process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);

// Foydalanuvchi bosqichlarini eslab qolish uchun (In-memory session)
const sessions = {};
let lastUpdateId = 0;

// --- KEYBOARDS ---
const WELCOME_MENU = {
    keyboard: [[{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }]],
    resize_keyboard: true
};

const USER_MENU = {
    keyboard: [
        [{ text: "🛍 Market" }, { text: "🛒 Savatim" }],
        [{ text: "🛵 Kuryer bo'lish" }, { text: "👤 Profil" }],
        [{ text: "🆘 Yordam" }]
    ],
    resize_keyboard: true
};

const COURIER_MENU = {
    keyboard: [
        [{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }],
        [{ text: "📦 Faol buyurtmalar" }, { text: "👤 Profil" }]
    ],
    resize_keyboard: true
};

const CANCEL_MENU = {
    keyboard: [[{ text: "❌ Bekor qilish" }]],
    resize_keyboard: true
};

// --- TG API HELPER ---
async function tg(method, body, token) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        return { ok: false };
    }
}

// --- BOT FUNCTIONS ---
async function sendMenu(chatId, text, menu, token) {
    return await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: menu }, token);
}

// --- MAIN HANDLER ---
async function handleUpdate(update, token) {
    const msg = update.message;
    const cb = update.callback_query;
    const chatId = msg ? msg.chat.id : (cb ? cb.message.chat.id : null);
    if (!chatId) return;

    // Foydalanuvchini bazadan qidirish
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    // CALLBACK QUERY (Masalan: Buyurtmani qabul qilish)
    if (cb) {
        const data = cb.data;
        if (data.startsWith('accept_')) {
            if (!profile || profile.role !== 'courier') {
                return await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Siz kurer emassiz!", show_alert: true }, token);
            }
            const orderId = data.split('_')[1];
            const { data: order, error } = await supabase.from('orders')
                .update({ courier_id: profile.id, status: 'delivering' })
                .eq('id', orderId)
                .is('courier_id', null)
                .select().single();

            if (order) {
                await tg('editMessageText', { 
                    chat_id: chatId, 
                    message_id: cb.message.message_id, 
                    text: `✅ <b>BUYURTMA QABUL QILINDI!</b>\n\nManzil: ${order.address_text}\nTel: ${order.phone_number || 'Ilovadan ko\'ring'}\nSumma: ${order.total_price.toLocaleString()} UZS`,
                    parse_mode: 'HTML'
                }, token);
                await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Muvaffaqiyatli!" }, token);
            } else {
                await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Kechikdingiz! Boshqa kurer olib bo'ldi.", show_alert: true }, token);
            }
        }
        return;
    }

    if (!msg?.text) return;
    const text = msg.text;

    // Bekor qilish mantiqi
    if (text === "❌ Bekor qilish" || text === "/start") {
        delete sessions[chatId];
        if (profile) {
            const menu = profile.role === 'courier' ? COURIER_MENU : USER_MENU;
            return await sendMenu(chatId, `Xush kelibsiz, <b>${profile.first_name}</b>!`, menu, token);
        } else {
            return await sendMenu(chatId, "Assalomu alaykum! ELAZ MARKET botiga xush kelibsiz. Davom etish uchun variantni tanlang:", WELCOME_MENU, token);
        }
    }

    // --- REGISTER FLOW ---
    if (text === "📝 Ro'yxatdan o'tish") {
        sessions[chatId] = { step: 'REG_NAME' };
        return await sendMenu(chatId, "Ism va familiyangizni kiriting:", CANCEL_MENU, token);
    }
    if (sessions[chatId]?.step === 'REG_NAME') {
        sessions[chatId].name = text;
        sessions[chatId].step = 'REG_PHONE';
        return await sendMenu(chatId, "Telefon raqamingizni yuboring (Masalan: +998901234567):", CANCEL_MENU, token);
    }
    if (sessions[chatId]?.step === 'REG_PHONE') {
        sessions[chatId].phone = text;
        sessions[chatId].step = 'REG_EMAIL';
        return await sendMenu(chatId, "Gmail manzilingizni kiriting:", CANCEL_MENU, token);
    }
    if (sessions[chatId]?.step === 'REG_EMAIL') {
        sessions[chatId].email = text;
        sessions[chatId].step = 'REG_PASS';
        return await sendMenu(chatId, "Parol o'ylab toping (min. 6 belgi):", CANCEL_MENU, token);
    }
    if (sessions[chatId]?.step === 'REG_PASS') {
        const s = sessions[chatId];
        await sendMenu(chatId, "⏳ Ro'yxatdan o'tkazilmoqda...", { remove_keyboard: true }, token);
        
        const { data: auth, error } = await supabase.auth.signUp({ email: s.email, password: text });
        if (error) return await sendMenu(chatId, "❌ Xato: " + error.message, WELCOME_MENU, token);
        
        await supabase.from('profiles').insert({
            id: auth.user.id,
            telegram_id: chatId,
            first_name: s.name,
            email: s.email,
            phone: s.phone,
            role: 'user',
            balance: 0
        });
        
        delete sessions[chatId];
        return await sendMenu(chatId, "✅ Tabriklaymiz! Ro'yxatdan o'tdingiz.", USER_MENU, token);
    }

    // --- LOGIN FLOW ---
    if (text === "🔑 Kirish") {
        sessions[chatId] = { step: 'LOGIN_EMAIL' };
        return await sendMenu(chatId, "Gmail manzilingizni kiriting:", CANCEL_MENU, token);
    }
    if (sessions[chatId]?.step === 'LOGIN_EMAIL') {
        sessions[chatId].email = text;
        sessions[chatId].step = 'LOGIN_PASS';
        return await sendMenu(chatId, "Parolingizni kiriting:", CANCEL_MENU, token);
    }
    if (sessions[chatId]?.step === 'LOGIN_PASS') {
        const email = sessions[chatId].email;
        await sendMenu(chatId, "⏳ Tekshirilmoqda...", { remove_keyboard: true }, token);
        
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password: text });
        if (error) return await sendMenu(chatId, "❌ Email yoki parol xato!", WELCOME_MENU, token);
        
        // Telegram ID ni profilga bog'lash
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
        
        delete sessions[chatId];
        const menu = newProfile.role === 'courier' ? COURIER_MENU : USER_MENU;
        return await sendMenu(chatId, `✅ Xush kelibsiz, ${newProfile.first_name}!`, menu, token);
    }

    // --- AUTHENTICATED ACTIONS ---
    if (profile) {
        const cmd = text.replace(/[^\w\sа-яА-Я]/gi, '').trim();

        // Umumiy tugmalar
        if (cmd.includes("Profil")) {
            const stats = `👤 <b>PROFILINGIZ:</b>\n\nIsm: ${profile.first_name}\nRol: ${profile.role.toUpperCase()}\nBalans: ${profile.balance.toLocaleString()} UZS\nID: <code>${chatId}</code>`;
            return await tg('sendMessage', { chat_id: chatId, text: stats, parse_mode: 'HTML' }, token);
        }
        if (cmd.includes("Market")) {
            return await sendMenu(chatId, "Marketga o'tish uchun tugmani bosing:", {
                inline_keyboard: [[{ text: "🌐 SAYTNI OCHISH", web_app: { url: "https://elaz-marketing.vercel.app" } }]]
            }, token);
        }

        // Kurer tugmalari
        if (profile.role === 'courier') {
            if (cmd.includes("Ishga tushish")) {
                await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
                return await tg('sendMessage', { chat_id: chatId, text: "🟢 Siz onlaynsiz! Yangi buyurtmalar kelishi bilan xabar beramiz." }, token);
            }
            if (cmd.includes("Dam olish")) {
                await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
                return await tg('sendMessage', { chat_id: chatId, text: "🔴 Siz dam olish rejimidasiz." }, token);
            }
            if (cmd.includes("Faol buyurtmalar")) {
                const { data: active } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
                if (!active?.length) return await tg('sendMessage', { chat_id: chatId, text: "Hozirda sizda faol buyurtmalar yo'q." }, token);
                for (const o of active) {
                    await tg('sendMessage', { chat_id: chatId, text: `📦 <b>BUYURTMA #ORD-${o.id}</b>\n\nManzil: ${o.address_text}\nSumma: ${o.total_price.toLocaleString()} UZS`, parse_mode: 'HTML' }, token);
                }
            }
        }

        // Mijoz tugmalari
        if (profile.role === 'user') {
            if (cmd.includes("Kuryer bo'lish")) {
                return await sendMenu(chatId, "Kurer bo'lish uchun saytdagi profil bo'limidan ariza qoldiring.", {
                    inline_keyboard: [[{ text: "📝 ARIZA TOPSHIRISH", url: "https://elaz-marketing.vercel.app/apply=true" }]]
                }, token);
            }
            if (cmd.includes("Yordam")) {
                return await tg('sendMessage', { chat_id: chatId, text: "Yordam uchun admin bilan bog'laning: @elaz_admin" }, token);
            }
            if (cmd.includes("Savatim")) {
                return await sendMenu(chatId, "Savatingizni ko'rish va to'lov qilish uchun saytga o'ting:", {
                    inline_keyboard: [[{ text: "🛒 SAVATNI OCHISH", url: "https://elaz-marketing.vercel.app/view=cart" }]]
                }, token);
            }
        }
    }
}

// --- REALTIME NOTIFICATIONS ---
async function notifyNewOrder(order, token) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if (!couriers?.length) return;

    const text = `📦 <b>YANGI BUYURTMA!</b>\n\n📍 Manzil: ${order.address_text}\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n🛵 Masofa: ${order.delivery_cost.toLocaleString()} UZS`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };

    for (const c of couriers) {
        if (c.telegram_id) await tg('sendMessage', { chat_id: c.telegram_id, text, parse_mode: 'HTML', reply_markup: markup }, token);
    }
}

// --- START ENGINE ---
async function start() {
    console.log("🚀 ELAZ Bot Engine v6.0 starting...");
    const { data: config } = await supabase.from('bot_configs').select('token').eq('is_active', true).single();
    if (!config) return console.error("❌ Bot token topilmadi!");
    const token = config.token;

    // Supabase Realtime for Orders
    supabase.channel('orders_channel')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if (payload.new.status === 'confirmed') notifyNewOrder(payload.new, token);
        }).subscribe();

    // Polling Loop
    while (true) {
        try {
            const updates = await tg('getUpdates', { offset: lastUpdateId, timeout: 30 }, token);
            if (updates.ok && updates.result) {
                for (const u of updates.result) {
                    await handleUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

start();
