
/**
 * ELAZ MARKET - BOT SERVICE (NODE.JS)
 * Optimized for Google Cloud VM & Tmux
 * V7.0 - Fixed Button Recognition & Full Profile Integration
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

// Foydalanuvchi bosqichlarini eslab qolish uchun
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
        const result = await res.json();
        return result;
    } catch (e) {
        return { ok: false };
    }
}

async function sendMenu(chatId, text, menu, token) {
    return await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: menu }, token);
}

// --- MAIN HANDLER ---
async function handleUpdate(update, token) {
    const msg = update.message;
    const cb = update.callback_query;
    const chatId = msg ? msg.chat.id : (cb ? cb.message.chat.id : null);
    if (!chatId) return;

    // Foydalanuvchini bazadan qidirish (har doim yangi ma'lumotni olamiz)
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    // CALLBACK QUERY (Kurer buyurtmani qabul qilishi)
    if (cb) {
        const data = cb.data;
        if (data.startsWith('accept_')) {
            if (!profile || profile.role !== 'courier') {
                return await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Faqat kurerlar qabul qilishi mumkin!", show_alert: true }, token);
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
                    text: `✅ <b>BUYURTMA QABUL QILINDI!</b>\n\n📍 Manzil: ${order.address_text}\n📞 Tel: ${order.phone_number || 'Saytdan ko\'ring'}\n💰 Summa: ${order.total_price.toLocaleString()} UZS`,
                    parse_mode: 'HTML'
                }, token);
                await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Muvaffaqiyatli qabul qilindi!" }, token);
            } else {
                await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Kechikdingiz yoki buyurtma endi mavjud emas.", show_alert: true }, token);
            }
        }
        return;
    }

    if (!msg?.text) return;
    const text = msg.text;

    // 1. GLOBAL COMMANDS
    if (text === "/start" || text === "❌ Bekor qilish") {
        delete sessions[chatId];
        if (profile) {
            const menu = profile.role === 'courier' ? COURIER_MENU : USER_MENU;
            return await sendMenu(chatId, `Xush kelibsiz, <b>${profile.first_name}</b>!\nRolingiz: ${profile.role === 'courier' ? '🛵 Kurer' : '🛍 Mijoz'}`, menu, token);
        } else {
            return await sendMenu(chatId, "Assalomu alaykum! <b>ELAZ MARKET</b> botiga xush kelibsiz.\n\nDavom etish uchun tizimga kiring yoki ro'yxatdan o'ting:", WELCOME_MENU, token);
        }
    }

    // 2. AUTH FLOW (Login/Register)
    const session = sessions[chatId];

    if (text === "📝 Ro'yxatdan o'tish") {
        sessions[chatId] = { step: 'REG_NAME' };
        return await sendMenu(chatId, "Ism va familiyangizni kiriting:", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_NAME') {
        sessions[chatId].name = text;
        sessions[chatId].step = 'REG_PHONE';
        return await sendMenu(chatId, "Telefon raqamingizni kiriting (+998XXXXXXXXX):", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_PHONE') {
        sessions[chatId].phone = text;
        sessions[chatId].step = 'REG_EMAIL';
        return await sendMenu(chatId, "Gmail manzilingizni kiriting:", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_EMAIL') {
        sessions[chatId].email = text;
        sessions[chatId].step = 'REG_PASS';
        return await sendMenu(chatId, "Parol yarating (min. 6 belgi):", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_PASS') {
        const s = sessions[chatId];
        await tg('sendMessage', { chat_id: chatId, text: "⏳ Ro'yxatdan o'tkazilmoqda..." }, token);
        const { data: auth, error } = await supabase.auth.signUp({ email: s.email, password: text });
        if (error) return await sendMenu(chatId, "❌ Xatolik: " + error.message, WELCOME_MENU, token);
        
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
        return await sendMenu(chatId, "✅ Tabriklaymiz! Muvaffaqiyatli ro'yxatdan o'tdingiz.", USER_MENU, token);
    }

    if (text === "🔑 Kirish") {
        sessions[chatId] = { step: 'LOGIN_EMAIL' };
        return await sendMenu(chatId, "Gmail manzilingizni kiriting:", CANCEL_MENU, token);
    }
    if (session?.step === 'LOGIN_EMAIL') {
        sessions[chatId].email = text;
        sessions[chatId].step = 'LOGIN_PASS';
        return await sendMenu(chatId, "Parolingizni kiriting:", CANCEL_MENU, token);
    }
    if (session?.step === 'LOGIN_PASS') {
        const email = sessions[chatId].email;
        await tg('sendMessage', { chat_id: chatId, text: "⏳ Tekshirilmoqda..." }, token);
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password: text });
        if (error) return await sendMenu(chatId, "❌ Email yoki parol noto'g'ri!", WELCOME_MENU, token);
        
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
        delete sessions[chatId];
        const menu = newProfile.role === 'courier' ? COURIER_MENU : USER_MENU;
        return await sendMenu(chatId, `✅ Xush kelibsiz, <b>${newProfile.first_name}</b>!`, menu, token);
    }

    // 3. MAIN COMMANDS (Agar profile bo'lsa)
    if (profile) {
        // PROFIL TUGMASI (Hamma uchun)
        if (text.includes("Profil")) {
            const stats = `👤 <b>PROFILINGIZ:</b>\n\n` +
                          `<b>Ism:</b> ${profile.first_name}\n` +
                          `<b>Rol:</b> ${profile.role.toUpperCase()}\n` +
                          `<b>Hamyon:</b> ${profile.balance.toLocaleString()} UZS\n` +
                          `<b>Email:</b> ${profile.email}\n` +
                          `<b>ID:</b> <code>${chatId}</code>`;
            return await tg('sendMessage', { chat_id: chatId, text: stats, parse_mode: 'HTML' }, token);
        }

        // MIJOZ TUGMALARI
        if (profile.role === 'user') {
            if (text.includes("Market")) {
                return await sendMenu(chatId, "Marketni ochish uchun pastdagi tugmani bosing:", {
                    inline_keyboard: [[{ text: "🌐 ELAZ MARKETNI OCHISH", web_app: { url: "https://elaz-marketing.vercel.app" } }]]
                }, token);
            }
            if (text.includes("Savatim")) {
                const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
                if (!items?.length) {
                    return await tg('sendMessage', { chat_id: chatId, text: "🛒 <b>Savatingiz bo'sh.</b>\nMahsulot qo'shish uchun Marketga kiring.", parse_mode: 'HTML' }, token);
                }
                let list = "🛒 <b>SAVATDAGI MAHSULOTLAR:</b>\n\n";
                let total = 0;
                items.forEach((item, i) => {
                    const sub = item.products.price * item.quantity;
                    total += sub;
                    list += `${i + 1}. ${item.products.name} - ${item.quantity} x ${item.products.price.toLocaleString()} = ${sub.toLocaleString()} UZS\n`;
                });
                list += `\n💰 <b>JAMI: ${total.toLocaleString()} UZS</b>`;
                return await sendMenu(chatId, list, {
                    inline_keyboard: [[{ text: "💳 TO'LOV QILISH", url: "https://elaz-marketing.vercel.app/view=cart" }]]
                }, token);
            }
            if (text.includes("Kuryer bo'lish")) {
                return await sendMenu(chatId, "🛵 <b>KURER BO'LIB ISHLASH</b>\n\nArizangizni sayt orqali yuboring yoki biz bilan bog'laning.", {
                    inline_keyboard: [[{ text: "📝 ARIZA TOPSHIRISH", url: "https://elaz-marketing.vercel.app/apply=true" }]]
                }, token);
            }
            if (text.includes("Yordam")) {
                return await tg('sendMessage', { chat_id: chatId, text: "🆘 <b>YORDAM MARKAZI</b>\n\nAdmin bilan bog'lanish: @elaz_admin\nCall Center: +998901234567", parse_mode: 'HTML' }, token);
            }
        }

        // KURER TUGMALARI
        if (profile.role === 'courier') {
            if (text.includes("Ishga tushish")) {
                await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
                return await tg('sendMessage', { chat_id: chatId, text: "🟢 <b>ONLAYNSIZ!</b>\nYangi buyurtmalar haqida darhol xabar beramiz.", parse_mode: 'HTML' }, token);
            }
            if (text.includes("Dam olish")) {
                await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
                return await tg('sendMessage', { chat_id: chatId, text: "🔴 <b>OFFLINESIZ.</b>\nSizga buyurtmalar yuborilmaydi.", parse_mode: 'HTML' }, token);
            }
            if (text.includes("Faol buyurtmalar")) {
                const { data: active } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
                if (!active?.length) {
                    return await tg('sendMessage', { chat_id: chatId, text: "Hozirda sizda faol buyurtmalar yo'q.", parse_mode: 'HTML' }, token);
                }
                for (const o of active) {
                    await tg('sendMessage', { chat_id: chatId, text: `📦 <b>BUYURTMA #ORD-${o.id}</b>\n\n📍 Manzil: ${o.address_text}\n💰 Summa: ${o.total_price.toLocaleString()} UZS\n📞 Tel: ${o.phone_number || 'Noma\'lum'}`, parse_mode: 'HTML' }, token);
                }
            }
        }
    }
}

// --- REALTIME ORDER NOTIFICATION ---
async function notifyNewOrder(order, token) {
    // Faqat 'confirmed' holatidagi va onlayn kurerlarga yuboramiz
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if (!couriers?.length) return;

    const text = `🚚 <b>YANGI BUYURTMA TUSHDI!</b>\n\n` +
                 `📍 Manzil: ${order.address_text}\n` +
                 `💰 Summa: ${order.total_price.toLocaleString()} UZS\n` +
                 `🛵 Dostavka: ${order.delivery_cost.toLocaleString()} UZS\n\n` +
                 `Buyurtmani olish uchun quyidagi tugmani bosing:`;
    
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };

    for (const c of couriers) {
        if (c.telegram_id) await tg('sendMessage', { chat_id: c.telegram_id, text, parse_mode: 'HTML', reply_markup: markup }, token);
    }
}

// --- START ENGINE ---
async function start() {
    console.log("🚀 ELAZ Bot Engine v7.0 starting...");
    const { data: config } = await supabase.from('bot_configs').select('token').eq('is_active', true).single();
    if (!config) return console.error("❌ Bot token topilmadi!");
    const token = config.token;

    // Real-time listener for new orders
    supabase.channel('public:orders')
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
            console.error("Polling Error:", e);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

start();
