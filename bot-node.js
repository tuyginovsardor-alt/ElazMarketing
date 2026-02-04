
/**
 * ELAZ MARKET - PROFESSIONAL BOT ENGINE V9.0
 * Node.js & Supabase Integration
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } = process.env;
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);

const sessions = {}; // { chatId: { step, data } }
let lastUpdateId = 0;

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

// --- KEYBOARDS ---
const WELCOME_KB = {
    keyboard: [[{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }], [{ text: "🌐 Online Platforma" }]],
    resize_keyboard: true
};

const USER_KB = {
    keyboard: [[{ text: "🛒 Savatim" }, { text: "👤 Profil" }], [{ text: "🛵 Kuryer bo'lish" }, { text: "🏢 Saytga o'tish" }], [{ text: "❌ Chiqish" }]],
    resize_keyboard: true
};

const COURIER_KB = {
    keyboard: [
        [{ text: "📦 Bo'sh buyurtmalar" }, { text: "🚀 Faol buyurtmalar" }],
        [{ text: "🟢 Onlayn" }, { text: "🔴 Oflayn" }],
        [{ text: "👤 Profil" }, { text: "📊 Tarix" }],
        [{ text: "❌ Chiqish" }]
    ],
    resize_keyboard: true
};

async function handleUpdate(update, token) {
    const msg = update.message;
    const callback = update.callback_query;
    
    if (callback) return handleCallback(callback, token);
    if (!msg?.text && !msg?.contact) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    // --- RESTART ---
    if (text === "/start" || text === "❌ Chiqish") {
        session.step = 'idle';
        const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        
        if (profile) {
            if (profile.role === 'courier') {
                return tg('sendMessage', { chat_id: chatId, text: "Xush kelibsiz, kurer! Ishga tayyormisiz?", reply_markup: COURIER_KB }, token);
            }
            return tg('sendMessage', { chat_id: chatId, text: "Xush kelibsiz! Buyurtmalarni boshlaymizmi?", reply_markup: USER_KB }, token);
        }
        return tg('sendMessage', { chat_id: chatId, text: "Assalomu alaykum! <b>ELAZ MARKET</b> botiga xush kelibsiz.\n\nIltimos, davom etish uchun kirish yoki ro'yxatdan o'tish tugmasini bosing:", parse_mode: 'HTML', reply_markup: WELCOME_KB }, token);
    }

    // --- LOGIN FLOW ---
    if (text === "🔑 Kirish") {
        session.step = 'login_email';
        return tg('sendMessage', { chat_id: chatId, text: "Gmail manzilingizni kiriting:", reply_markup: { keyboard: [[{text: "❌ Bekor qilish"}]], resize_keyboard: true } }, token);
    }
    if (session.step === 'login_email') {
        session.email = text;
        session.step = 'login_pass';
        return tg('sendMessage', { chat_id: chatId, text: "Parolingizni kiriting:" }, token);
    }
    if (session.step === 'login_pass') {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email: session.email, password: text });
        if (error) {
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "❌ Xatolik: " + error.message, reply_markup: WELCOME_KB }, token);
        }
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        session.step = 'idle';
        return tg('sendMessage', { chat_id: chatId, text: "✅ Tizimga muvaffaqiyatli kirdingiz!", reply_markup: USER_KB }, token);
    }

    // --- REGISTER FLOW ---
    if (text === "📝 Ro'yxatdan o'tish") {
        session.step = 'reg_name';
        return tg('sendMessage', { chat_id: chatId, text: "Ismingizni kiriting:", reply_markup: { keyboard: [[{text: "❌ Bekor qilish"}]], resize_keyboard: true } }, token);
    }
    if (session.step === 'reg_name') {
        session.reg_name = text;
        session.step = 'reg_email';
        return tg('sendMessage', { chat_id: chatId, text: "Gmail manzilingiz (faqat haqiqiy):" }, token);
    }
    if (session.step === 'reg_email') {
        session.reg_email = text;
        session.step = 'reg_pass';
        return tg('sendMessage', { chat_id: chatId, text: "Parol o'ylab toping (min 6 ta belgi):" }, token);
    }
    if (session.step === 'reg_pass') {
        const { data: auth, error } = await supabase.auth.signUp({ 
            email: session.reg_email, 
            password: text, 
            options: { data: { first_name: session.reg_name } } 
        });
        if (error) {
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "❌ Ro'yxatdan o'tishda xatolik: " + error.message, reply_markup: WELCOME_KB }, token);
        }
        await supabase.from('profiles').insert({ id: auth.user.id, email: session.reg_email, first_name: session.reg_name, telegram_id: chatId, role: 'user' });
        session.step = 'idle';
        return tg('sendMessage', { chat_id: chatId, text: "✨ Ro'yxatdan o'tdingiz! Endi xarid qilishingiz mumkin.", reply_markup: USER_KB }, token);
    }

    // --- CORE ACTIONS ---
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (!profile) return;

    // --- USER ACTIONS ---
    if (text === "🛒 Savatim") {
        const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
        if (!items?.length) return tg('sendMessage', { chat_id: chatId, text: "Savat bo'sh." }, token);
        let list = "🛒 <b>SAVATINGIZ:</b>\n\n";
        items.forEach(i => list += `• ${i.products.name} (${i.quantity} dona) - <b>${(i.products.price * i.quantity).toLocaleString()} UZS</b>\n`);
        return tg('sendMessage', { chat_id: chatId, text: list, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "Saytda rasmiylashtirish", url: "https://elaz-market.uz/cart" }]] } }, token);
    }

    if (text === "👤 Profil") {
        const stats = `👤 <b>PROFIL</b>\n\nIsm: ${profile.first_name}\nRole: ${profile.role.toUpperCase()}\nBalans: ${profile.balance.toLocaleString()} UZS`;
        return tg('sendMessage', { chat_id: chatId, text: stats, parse_mode: 'HTML' }, token);
    }

    if (text === "🛵 Kuryer bo'lish") {
        await supabase.from('courier_applications').insert({ user_id: profile.id, full_name: profile.first_name, status: 'pending' });
        return tg('sendMessage', { chat_id: chatId, text: "✅ Arizangiz qabul qilindi. Adminlar ko'rib chiqadi." }, token);
    }

    // --- COURIER ACTIONS ---
    if (profile.role === 'courier') {
        if (text === "📦 Bo'sh buyurtmalar") {
            const { data: orders } = await supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null);
            if (!orders?.length) return tg('sendMessage', { chat_id: chatId, text: "Hozircha bo'sh buyurtmalar yo'q." }, token);
            
            for (const o of orders) {
                const txt = `📦 <b>BUYURTMA #${o.id.toString().substring(0,8)}</b>\n📍 Manzil: ${o.address_text}\n💰 Yetkazish: ${o.delivery_cost.toLocaleString()} UZS`;
                await tg('sendMessage', { 
                    chat_id: chatId, 
                    text: txt, 
                    parse_mode: 'HTML', 
                    reply_markup: { inline_keyboard: [[{ text: "✅ Qabul qilish", callback_data: `accept_${o.id}` }]] } 
                }, token);
            }
            return;
        }

        if (text === "🚀 Faol buyurtmalar") {
            const { data: active } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
            if (!active?.length) return tg('sendMessage', { chat_id: chatId, text: "Sizda faol buyurtma yo'q." }, token);
            
            for (const o of active) {
                const txt = `🚚 <b>YETKAZILMOQDA...</b>\n#${o.id.toString().substring(0,8)}\n📞 Tel: ${o.phone_number}\n📍 ${o.address_text}`;
                await tg('sendMessage', { 
                    chat_id: chatId, 
                    text: txt, 
                    parse_mode: 'HTML', 
                    reply_markup: { inline_keyboard: [[{ text: "🏁 Yakunlash", callback_data: `finish_${o.id}` }, { text: "❌ Bekor qilish", callback_data: `reject_${o.id}` }]] } 
                }, token);
            }
            return;
        }

        if (text === "🟢 Onlayn") {
            await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
            return tg('sendMessage', { chat_id: chatId, text: "🟢 Siz ONLAYNsiz. Buyurtmalar kutavering!" }, token);
        }

        if (text === "🔴 Oflayn") {
            await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
            return tg('sendMessage', { chat_id: chatId, text: "🔴 Siz OFLAYNsiz. Dam oling." }, token);
        }
        
        if (text === "📊 Tarix") {
            const { data: hist } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivered');
            return tg('sendMessage', { chat_id: chatId, text: `📊 <b>STATISTIKA</b>\n\nJami bajargan: ${hist?.length || 0} ta\nIshlangan pul: ${hist?.reduce((a,b) => a+b.delivery_cost, 0).toLocaleString()} UZS`, parse_mode: 'HTML' }, token);
        }
    }
}

async function handleCallback(cb, token) {
    const data = cb.data;
    const chatId = cb.from.id;
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).single();
    if (!profile) return;

    if (data.startsWith('accept_')) {
        const oid = data.split('_')[1];
        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if (error) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "❌ Kechikdingiz, boshqa kurer oldi!" }, token);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✅ Buyurtma olindi! Yo'lga chiqing." }, token);
        return tg('sendMessage', { chat_id: chatId, text: "🚀 Buyurtma biriktirildi. 'Faol buyurtmalar' bo'limida ko'rishingiz mumkin.", reply_markup: COURIER_KB }, token);
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost }).eq('id', profile.id);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✨ Baraka toping! Pul balansga o'tdi." }, token);
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "🏁 Buyurtma muvaffaqiyatli yakunlandi!" }, token);
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Buyurtma rad etildi va bo'sh ro'yxatga qaytdi." }, token);
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id }, token);
    }
}

async function start() {
    console.log("🚀 ELAZ Bot Engine V9.0 Started...");
    const { data: config } = await supabase.from('bot_configs').select('token').eq('is_active', true).single();
    if (!config) return console.error("❌ Bot Token Topilmadi!");
    const token = config.token;

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
