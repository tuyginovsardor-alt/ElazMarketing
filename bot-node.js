
/**
 * ELAZ MARKET - BOT ENGINE V8.0
 * Full Auth Flow & Profile Integration
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } = process.env;
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);

// Foydalanuvchi sessiyalarini vaqtinchalik xotirada saqlash
const sessions = {};
let lastUpdateId = 0;

// --- KEYBOARDS ---
const WELCOME_MENU = {
    keyboard: [
        [{ text: "🔑 Kirish (Bot orqali)" }, { text: "📝 Ro'yxatdan o'tish" }],
        [{ text: "🌐 Saytga o'tish" }]
    ],
    resize_keyboard: true
};

const USER_MENU = {
    keyboard: [
        [{ text: "🛍 Market" }, { text: "🛒 Savatim" }],
        [{ text: "🛵 Kuryer bo'lish" }, { text: "👤 Profil" }],
        [{ text: "🆘 Yordam" }, { text: "❌ Chiqish" }]
    ],
    resize_keyboard: true
};

const COURIER_MENU = {
    keyboard: [
        [{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }],
        [{ text: "📦 Faol buyurtmalar" }, { text: "👤 Profil" }],
        [{ text: "❌ Chiqish" }]
    ],
    resize_keyboard: true
};

const CANCEL_MENU = {
    keyboard: [[{ text: "🔙 Orqaga / Bekor qilish" }]],
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
    } catch (e) { return { ok: false }; }
}

async function sendMenu(chatId, text, menu, token) {
    return await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: menu }, token);
}

// --- MAIN LOGIC ---
async function handleUpdate(update, token) {
    const msg = update.message;
    const cb = update.callback_query;
    const chatId = msg ? msg.chat.id : (cb ? cb.message.chat.id : null);
    if (!chatId) return;

    // Har bir xabarda foydalanuvchini tekshiramiz
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    // CALLBACKLAR (Inline tugmalar uchun)
    if (cb) {
        const data = cb.data;
        if (data.startsWith('accept_')) {
            if (!profile || profile.role !== 'courier') {
                return await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Siz kurer emassiz!", show_alert: true }, token);
            }
            const orderId = data.split('_')[1];
            const { data: order } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', orderId).is('courier_id', null).select().single();
            if (order) {
                await tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: `✅ <b>BUYURTMA OLINDI!</b>\n\nManzil: ${order.address_text}\nSumma: ${order.total_price.toLocaleString()} UZS`, parse_mode: 'HTML' }, token);
                await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Qabul qilindi!" }, token);
            } else {
                await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Kechikdingiz, boshqa kurer oldi.", show_alert: true }, token);
            }
        }
        return;
    }

    if (!msg?.text) return;
    const text = msg.text;

    // GLOBAL COMMANDS
    if (text === "/start" || text === "🔙 Orqaga / Bekor qilish") {
        delete sessions[chatId];
        if (profile) {
            const menu = profile.role === 'courier' ? COURIER_MENU : USER_MENU;
            return await sendMenu(chatId, `Xush kelibsiz, <b>${profile.first_name}</b>!`, menu, token);
        } else {
            return await sendMenu(chatId, "Assalomu alaykum! <b>ELAZ MARKET</b> botiga xush kelibsiz. Tizimga kirish uchun tanlang:", WELCOME_MENU, token);
        }
    }

    if (text === "❌ Chiqish") {
        await supabase.from('profiles').update({ telegram_id: null }).eq('telegram_id', chatId);
        delete sessions[chatId];
        return await sendMenu(chatId, "Tizimdan chiqdingiz. Akkaunt Telegramdan uzildi.", WELCOME_MENU, token);
    }

    // --- AUTH FLOW ---
    const session = sessions[chatId];

    // LOGIN
    if (text === "🔑 Kirish (Bot orqali)") {
        sessions[chatId] = { step: 'LOGIN_EMAIL' };
        return await sendMenu(chatId, "Tizimdagi <b>Gmail</b> manzilingizni yuboring:", CANCEL_MENU, token);
    }
    if (session?.step === 'LOGIN_EMAIL') {
        session.email = text.trim();
        session.step = 'LOGIN_PASS';
        return await sendMenu(chatId, "Endi <b>Parolingizni</b> yuboring:", CANCEL_MENU, token);
    }
    if (session?.step === 'LOGIN_PASS') {
        const email = session.email;
        await tg('sendMessage', { chat_id: chatId, text: "⏳ Kirilmoqda..." }, token);
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password: text });
        if (error) return await sendMenu(chatId, "❌ Xatolik: Email yoki parol noto'g'ri!", WELCOME_MENU, token);
        
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
        delete sessions[chatId];
        const menu = newProfile.role === 'courier' ? COURIER_MENU : USER_MENU;
        return await sendMenu(chatId, `✅ Xush kelibsiz, <b>${newProfile.first_name}</b>!`, menu, token);
    }

    // REGISTER
    if (text === "📝 Ro'yxatdan o'tish") {
        sessions[chatId] = { step: 'REG_NAME' };
        return await sendMenu(chatId, "Ism va familiyangizni kiriting:", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_NAME') {
        session.name = text;
        session.step = 'REG_PHONE';
        return await sendMenu(chatId, "Telefon raqamingizni yuboring (+998XXXXXXXXX):", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_PHONE') {
        session.phone = text;
        session.step = 'REG_EMAIL';
        return await sendMenu(chatId, "Yangi Gmail manzil kiriting:", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_EMAIL') {
        session.email = text;
        session.step = 'REG_PASS';
        return await sendMenu(chatId, "Xavfsiz parol yarating (min 6 belgi):", CANCEL_MENU, token);
    }
    if (session?.step === 'REG_PASS') {
        const s = session;
        await tg('sendMessage', { chat_id: chatId, text: "⏳ Akkaunt yaratilmoqda..." }, token);
        const { data: auth, error } = await supabase.auth.signUp({ email: s.email, password: text });
        if (error) return await sendMenu(chatId, "❌ " + error.message, WELCOME_MENU, token);
        
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
        return await sendMenu(chatId, "✅ Ro'yxatdan o'tdingiz! Endi xarid qilishingiz mumkin.", USER_MENU, token);
    }

    // --- LOGGED IN ACTIONS ---
    if (profile) {
        // PROFIL
        if (text.includes("Profil")) {
            const stats = `👤 <b>SHAXSIY MA'LUMOTLAR:</b>\n\n` +
                          `<b>Ism:</b> ${profile.first_name}\n` +
                          `<b>Email:</b> ${profile.email}\n` +
                          `<b>Tel:</b> ${profile.phone || 'Kiritilmagan'}\n` +
                          `<b>Rol:</b> ${profile.role.toUpperCase()}\n` +
                          `<b>Hamyon:</b> ${profile.balance.toLocaleString()} UZS\n` +
                          `<b>Hudud:</b> ${profile.district || 'Markaz'}\n` +
                          `<b>ID:</b> <code>${chatId}</code>`;
            return await tg('sendMessage', { chat_id: chatId, text: stats, parse_mode: 'HTML' }, token);
        }

        // MARKET & WEBAPP
        if (text.includes("Market") || text.includes("Sayt")) {
            return await sendMenu(chatId, "ELAZ MARKET platformasiga xush kelibsiz:", {
                inline_keyboard: [[{ text: "🌐 MARKETNI OCHISH", web_app: { url: "https://elaz-marketing.vercel.app" } }]]
            }, token);
        }

        // SAVAT
        if (text.includes("Savatim")) {
            const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
            if (!items?.length) return await tg('sendMessage', { chat_id: chatId, text: "🛒 Savatingiz hozircha bo'sh." }, token);
            let res = "🛒 <b>SAVATINGIZDAGI MAHSULOTLAR:</b>\n\n";
            let total = 0;
            items.forEach((it, i) => {
                total += it.products.price * it.quantity;
                res += `${i+1}. ${it.products.name} - ${it.quantity} ta\n`;
            });
            res += `\n💰 <b>JAMI: ${total.toLocaleString()} UZS</b>`;
            return await sendMenu(chatId, res, { inline_keyboard: [[{ text: "💳 TO'LOV QILISH", url: "https://elaz-marketing.vercel.app/view=cart" }]] }, token);
        }

        // KURER ARIZASI
        if (text.includes("Kuryer bo'lish")) {
            const { data: app } = await supabase.from('courier_applications').select('*').eq('user_id', profile.id).maybeSingle();
            if (app) return await tg('sendMessage', { chat_id: chatId, text: `Sizning arizangiz holati: <b>${app.status.toUpperCase()}</b>`, parse_mode: 'HTML' }, token);
            
            await supabase.from('courier_applications').insert({ user_id: profile.id, full_name: profile.first_name, phone: profile.phone, status: 'pending' });
            return await tg('sendMessage', { chat_id: chatId, text: "✅ Arizangiz adminlarga yuborildi. Tez orada ko'rib chiqiladi!" }, token);
        }

        // KURER TUGMALARI
        if (profile.role === 'courier') {
            if (text.includes("Ishga tushish")) {
                await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
                return await tg('sendMessage', { chat_id: chatId, text: "🟢 <b>ONLAYNSIZ.</b> Yangi buyurtmalar kelishini kutavering!" }, token);
            }
            if (text.includes("Dam olish")) {
                await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
                return await tg('sendMessage', { chat_id: chatId, text: "🔴 <b>OFFLINESIZ.</b> Buyurtmalar to'xtatildi." }, token);
            }
            if (text.includes("Faol buyurtmalar")) {
                const { data: acts } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
                if (!acts?.length) return await tg('sendMessage', { chat_id: chatId, text: "Sizda faol buyurtmalar yo'q." }, token);
                for (const o of acts) {
                    await tg('sendMessage', { chat_id: chatId, text: `📦 #ORD-${o.id}\n📍 Manzil: ${o.address_text}\n💰 Summa: ${o.total_price.toLocaleString()} UZS`, parse_mode: 'HTML' }, token);
                }
            }
        }
    }
}

// --- REALTIME NOTIFICATIONS ---
async function notifyNewOrder(order, token) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if (!couriers?.length) return;
    const text = `🚚 <b>YANGI BUYURTMA!</b>\n\n📍 Manzil: ${order.address_text}\n💰 Summa: ${order.total_price.toLocaleString()} UZS`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
    for (const c of couriers) { if (c.telegram_id) await tg('sendMessage', { chat_id: c.telegram_id, text, parse_mode: 'HTML', reply_markup: markup }, token); }
}

async function start() {
    console.log("🚀 ELAZ Bot Engine V8.0 is running...");
    const { data: config } = await supabase.from('bot_configs').select('token').eq('is_active', true).single();
    if (!config) return console.error("❌ Bot Token Topilmadi!");
    const token = config.token;

    supabase.channel('public:orders').on('postgres_changes', { event: 'INSERT', table: 'orders' }, p => {
        if (p.new.status === 'confirmed') notifyNewOrder(p.new, token);
    }).subscribe();

    while (true) {
        try {
            const updates = await tg('getUpdates', { offset: lastUpdateId, timeout: 30 }, token);
            if (updates.ok && updates.result) {
                for (const u of updates.result) {
                    await handleUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch (e) { await new Promise(r => setTimeout(r, 5000)); }
    }
}

start();
