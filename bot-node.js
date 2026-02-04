
/**
 * ELAZ MARKET - ULTIMATE BOT ENGINE V10.0 (PRO)
 * Real-time Order Management & Courier Dispatch
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } = process.env;
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);

const sessions = {}; // { chatId: { step, email, reg_data... } }
let lastUpdateId = 0;
const SITE_URL = "https://elaz-market.uz"; // Real platforma manzili

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

// --- PROFESSIONAL KEYBOARDS ---
const WELCOME_KB = {
    keyboard: [
        [{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }],
        [{ text: "🌐 ONLINE PLATFORMA", web_app: { url: SITE_URL } }]
    ],
    resize_keyboard: true
};

const USER_KB = {
    keyboard: [
        [{ text: "🛒 Savatim" }, { text: "👤 Profil" }],
        [{ text: "🛵 Kuryer bo'lish" }, { text: "🏢 Saytni ochish", web_app: { url: SITE_URL } }],
        [{ text: "❌ Chiqish" }]
    ],
    resize_keyboard: true
};

const COURIER_KB = {
    keyboard: [
        [{ text: "📦 Bo'sh buyurtmalar" }, { text: "🚀 Faol buyurtmalar" }],
        [{ text: "🟢 Onlayn" }, { text: "🔴 Oflayn" }],
        [{ text: "📊 Tarix" }, { text: "👤 Profil" }],
        [{ text: "❌ Chiqish" }]
    ],
    resize_keyboard: true
};

async function handleUpdate(update, token) {
    const msg = update.message;
    const callback = update.callback_query;
    
    if (callback) return handleCallback(callback, token);
    if (!msg?.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!sessions[chatId]) sessions[chatId] = { step: 'idle' };
    const session = sessions[chatId];

    // --- GLOBAL RESTART ---
    if (text === "/start" || text === "❌ Chiqish") {
        session.step = 'idle';
        const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        
        if (profile) {
            const kb = profile.role === 'courier' ? COURIER_KB : USER_KB;
            const welcomeMsg = profile.role === 'courier' ? 
                `👋 Xush kelibsiz, kurer <b>${profile.first_name}</b>!\nBugun qancha daromad qilamiz?` : 
                `🛒 <b>ELAZ MARKET</b>ga xush kelibsiz, <b>${profile.first_name}</b>!`;
            return tg('sendMessage', { chat_id: chatId, text: welcomeMsg, parse_mode: 'HTML', reply_markup: kb }, token);
        }
        
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: "🏪 <b>ELAZ MARKET: Bag'dod</b>\n\nPlatformaga xush kelibsiz! Bot orqali buyurtmalarni boshqarish va kuryerlik qilish uchun tizimga kiring:", 
            parse_mode: 'HTML', 
            reply_markup: WELCOME_KB 
        }, token);
    }

    // --- MANUAL LOGIN (BOT ORQALI) ---
    if (text === "🔑 Kirish") {
        session.step = 'login_email';
        return tg('sendMessage', { chat_id: chatId, text: "📧 Gmail manzilingizni yuboring:", reply_markup: { keyboard: [[{text: "❌ Bekor qilish"}]], resize_keyboard: true } }, token);
    }
    if (session.step === 'login_email') {
        if(!text.includes('@')) return tg('sendMessage', { chat_id: chatId, text: "⚠️ Iltimos, to'g'ri email kiriting:" }, token);
        session.email = text;
        session.step = 'login_pass';
        return tg('sendMessage', { chat_id: chatId, text: "🔐 Parolingizni kiriting:" }, token);
    }
    if (session.step === 'login_pass') {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email: session.email, password: text });
        if (error) {
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "❌ Xato: " + error.message, reply_markup: WELCOME_KB }, token);
        }
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        session.step = 'idle';
        return tg('sendMessage', { chat_id: chatId, text: "✅ Tizimga muvaffaqiyatli kirdingiz!", reply_markup: USER_KB }, token);
    }

    // --- PROFILE FETCH ---
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (!profile) return;

    // --- USER ACTIONS ---
    if (text === "🛒 Savatim") {
        const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
        if (!items?.length) return tg('sendMessage', { chat_id: chatId, text: "🛒 Savatingiz hozircha bo'sh.", reply_markup: { inline_keyboard: [[{ text: "🛍️ Xarid qilish", web_app: { url: SITE_URL } }]] } }, token);
        
        let list = "🛒 <b>SAVATINGIZ:</b>\n\n";
        let total = 0;
        items.forEach((i, idx) => {
            const sub = i.products.price * i.quantity;
            total += sub;
            list += `${idx+1}. ${i.products.name} (${i.quantity} x ${i.products.price.toLocaleString()})\n`;
        });
        list += `\n💰 <b>JAMI: ${total.toLocaleString()} UZS</b>`;
        return tg('sendMessage', { chat_id: chatId, text: list, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "💳 Rasmiylashtirish", web_app: { url: `${SITE_URL}/cart` } }]] } }, token);
    }

    if (text === "👤 Profil") {
        const txt = `👤 <b>PROFIL MA'LUMOTLARI</b>\n\n<b>Ism:</b> ${profile.first_name}\n<b>Role:</b> ${profile.role.toUpperCase()}\n<b>Balans:</b> ${profile.balance.toLocaleString()} UZS\n<b>Manzil:</b> ${profile.district || 'Markaz'}`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML' }, token);
    }

    // --- COURIER PRO LOGIC ---
    if (profile.role === 'courier') {
        if (text === "📦 Bo'sh buyurtmalar") {
            const { data: orders } = await supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null).limit(10);
            if (!orders?.length) return tg('sendMessage', { chat_id: chatId, text: "📭 Hozircha bo'sh buyurtmalar yo'q." }, token);
            
            for (const o of orders) {
                const txt = `📦 <b>YANGI BUYURTMA</b>\n\n📍 <b>Manzil:</b> ${o.address_text}\n💰 <b>Dostavka:</b> ${o.delivery_cost.toLocaleString()} UZS\n💵 <b>Jami:</b> ${o.total_price.toLocaleString()} UZS`;
                await tg('sendMessage', { 
                    chat_id: chatId, 
                    text: txt, 
                    parse_mode: 'HTML', 
                    reply_markup: { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${o.id}` }]] } 
                }, token);
            }
            return;
        }

        if (text === "🚀 Faol buyurtmalar") {
            const { data: active } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
            if (!active?.length) return tg('sendMessage', { chat_id: chatId, text: "Sizda hozircha faol buyurtma yo'q." }, token);
            
            for (const o of active) {
                const txt = `🚚 <b>YETKAZIB BERISH JARAYONIDA...</b>\n\n🆔 #${o.id.toString().substring(0,8)}\n📞 <b>Tel:</b> ${o.phone_number}\n📍 <b>Manzil:</b> ${o.address_text}`;
                await tg('sendMessage', { 
                    chat_id: chatId, 
                    text: txt, 
                    parse_mode: 'HTML', 
                    reply_markup: { 
                        inline_keyboard: [
                            [{ text: "🏁 YETKAZILDI (PUL OLINDI)", callback_data: `finish_${o.id}` }],
                            [{ text: "❌ BEKOR QILISH (RAD ETISH)", callback_data: `reject_${o.id}` }]
                        ] 
                    } 
                }, token);
            }
            return;
        }

        if (text === "🟢 Onlayn") {
            await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
            return tg('sendMessage', { chat_id: chatId, text: "🟢 <b>Siz ONLAYNsiz.</b> Yangi buyurtmalar haqida xabar beramiz!" }, token);
        }

        if (text === "🔴 Oflayn") {
            await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
            return tg('sendMessage', { chat_id: chatId, text: "🔴 <b>Siz OFLAYNsiz.</b> Bugunga yetadi, dam oling!" }, token);
        }

        if (text === "📊 Tarix") {
            const { data: hist } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivered');
            const totalEarned = hist?.reduce((a, b) => a + b.delivery_cost, 0) || 0;
            return tg('sendMessage', { 
                chat_id: chatId, 
                text: `📊 <b>ISH STATISTIKASI</b>\n\n✅ <b>Bajarildi:</b> ${hist?.length || 0} ta\n💰 <b>Jami daromad:</b> ${totalEarned.toLocaleString()} UZS`, 
                parse_mode: 'HTML' 
            }, token);
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
        if (error) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Kechikdingiz! Buyurtmani boshqa kurer qabul qilib bo'ldi." }, token);
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✅ Buyurtma qabul qilindi! Yo'lga chiqing." }, token);
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "🚀 <b>BUYURTMA SIZGA BIRIKTIRILDI!</b>\n\nIltimos, mijoz bilan bog'laning va manzilga yetib boring.", parse_mode: 'HTML' }, token);
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        if(!order) return;

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost }).eq('id', profile.id);
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✨ Baraka toping! Mablag' balansingizga qo'shildi." }, token);
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "🏁 <b>BUYURTMA YAKUNLANDI!</b>\n\nYana zakazlar qabul qilasizmi?", parse_mode: 'HTML' }, token);
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        // Zakazni yana hamma uchun ochish
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Buyurtma rad etildi va umumiy ro'yxatga qaytdi." }, token);
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id }, token);
    }
}

async function start() {
    console.log("🚀 ELAZ BOT ENGINE V10.0 (PRO) STARTED...");
    // Supabase orqali bot tokenni olish (agar bazada bo'lsa) yoki environmentdan
    const token = process.env.BOT_TOKEN || "8286953925:AAFvDeDbdNzCD7g8Jg72QVK3qNbVFBWHqP0";

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
            console.error("Polling error:", e);
            await new Promise(r => setTimeout(r, 5000)); 
        }
    }
}

start();
