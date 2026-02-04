
/**
 * ELAZ MARKET - BOT SERVICE (NODE.JS)
 * Google Cloud VM da 24/7 ishlatish uchun mo'ljallangan.
 * V5.1 - Pending Orders Logic added.
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

let lastUpdateId = 0;
let isRunning = true;

// --- KEYBOARDS ---
const USER_MENU = {
    keyboard: [
        [{ text: "🛒 Savatim" }, { text: "🏢 Saytni ochish" }],
        [{ text: "🛵 Kuryer bo'lish" }, { text: "👤 Profil" }],
        [{ text: "🆘 Yordam markazi" }]
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

// --- API HELPER ---
async function tg(method, body, token) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        console.error(`[Error ${method}]:`, e.message);
        return { ok: false };
    }
}

// --- PENDING ORDERS CHECKER ---
// Kutib turgan buyurtmalarni kurerlarga yuborish
async function checkAndNotifyPendingOrders(token, targetCourierId = null) {
    // 1. Kutib turgan (confirmed) va kurer biriktirilmagan buyurtmalarni olish
    const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'confirmed')
        .is('courier_id', null);

    if (!pendingOrders || pendingOrders.length === 0) return;

    // 2. Qaysi kurerlarga yuborishni aniqlash
    let targetCouriers = [];
    if (targetCourierId) {
        // Faqat bitta kurer onlayn bo'lgan holat uchun
        const { data: c } = await supabase.from('profiles').select('telegram_id').eq('id', targetCourierId).eq('active_status', true).single();
        if (c) targetCouriers = [c];
    } else {
        // Hamma onlayn kurerlar uchun (Bot yonganda)
        const { data: cs } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
        targetCouriers = cs || [];
    }

    if (targetCouriers.length === 0) return;

    // 3. Xabarlarni yuborish
    for (const order of pendingOrders) {
        const text = `📦 <b>KUTIB TURGAN BUYURTMA!</b>\n\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n📍 Manzil: ${order.address_text}\n⏰ Vaqti: ${new Date(order.created_at).toLocaleString()}`;
        const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
        
        for (const courier of targetCouriers) {
            if (courier.telegram_id) {
                await tg('sendMessage', { chat_id: courier.telegram_id, text, parse_mode: 'HTML', reply_markup: markup }, token);
            }
        }
    }
}

// --- BOT LOGIC ---
async function handleUpdate(update, token) {
    const msg = update.message;
    const callback = update.callback_query;
    const chatId = msg ? msg.chat.id : (callback ? callback.message.chat.id : null);

    if (!chatId) return;

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    if (callback) {
        const data = callback.data;
        if (data === "apply_bot" && profile) {
            await supabase.from('courier_applications').insert({ user_id: profile.id, full_name: profile.first_name, status: 'pending' });
            await tg('answerCallbackQuery', { callback_query_id: callback.id, text: "Arizangiz qabul qilindi! ✅", show_alert: true }, token);
        }
        if (data.startsWith('accept_') && profile?.role === 'courier') {
            const orderId = data.split('_')[1];
            const { data: order } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', orderId).is('courier_id', null).select().single();
            if (order) {
                await tg('sendMessage', { chat_id: chatId, text: `✅ <b>BUYURTMA #ORD-${orderId} QABUL QILINDI!</b>\n\n📍 Manzil: ${order.address_text}\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n📞 Tel: ${order.phone_number || 'Saytdan ko\'ring'}`, parse_mode: 'HTML' }, token);
            } else {
                await tg('answerCallbackQuery', { callback_query_id: callback.id, text: "❌ Kechikdingiz, boshqa kurer oldi.", show_alert: true }, token);
            }
        }
        return;
    }

    if (!msg || !msg.text) return;
    const text = msg.text;

    if (text === "/start") {
        if (!profile) {
            await tg('sendMessage', { chat_id: chatId, text: `Assalomu alaykum! ELAZ MARKET botiga xush kelibsiz. Botdan foydalanish uchun saytda ro'yxatdan o'ting va ID ni bog'lang: <code>${chatId}</code>`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🌐 SAYTGA O'TISH", url: "https://elaz-marketing.vercel.app" }]] } }, token);
        } else {
            const menu = profile.role === 'courier' ? COURIER_MENU : USER_MENU;
            await tg('sendMessage', { chat_id: chatId, text: `Xush kelibsiz, <b>${profile.first_name}</b>!`, parse_mode: 'HTML', reply_markup: menu }, token);
        }
        return;
    }

    if (!profile) return;

    if (profile.role === 'courier') {
        if (text.includes("Ishga tushish")) {
            await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
            await tg('sendMessage', { chat_id: chatId, text: "🟢 <b>SIZ ONLAYNSIZ!</b>\nHozirda kutib turgan buyurtmalar tekshirilmoqda...", reply_markup: COURIER_MENU }, token);
            
            // Onlayn bo'lgan zahoti eski zakazlarni yuborish
            await checkAndNotifyPendingOrders(token, profile.id);
        } else if (text.includes("Dam olish")) {
            await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
            await tg('sendMessage', { chat_id: chatId, text: "🔴 <b>SIZ OFLAYNSIZ.</b> Buyurtmalar sizga ko'rinmaydi.", reply_markup: COURIER_MENU }, token);
        } else if (text.includes("Faol buyurtmalar")) {
            const { data: orders } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
            if (!orders?.length) {
                await tg('sendMessage', { chat_id: chatId, text: "Hozircha sizda yetkazilayotgan faol buyurtmalar yo'q.", token });
            } else {
                for (const o of orders) {
                    await tg('sendMessage', { chat_id: chatId, text: `📦 <b>BUYURTMA #ORD-${o.id}</b>\n📍 Manzil: ${o.address_text}\n💰 Summa: ${o.total_price.toLocaleString()} UZS`, token });
                }
            }
        } else if (text.includes("Profil")) {
            await tg('sendMessage', { chat_id: chatId, text: `🚛 <b>KURER PROFILI</b>\n\nIsm: ${profile.first_name}\nBalans: ${profile.balance.toLocaleString()} UZS\nStatus: ${profile.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}`, token });
        }
    } else {
        // User logic... (Savat, Profil etc.)
        if (text.includes("Profil")) {
            await tg('sendMessage', { chat_id: chatId, text: `👤 <b>PROFILINGIZ:</b>\n\nIsm: ${profile.first_name}\nBalans: ${profile.balance.toLocaleString()} UZS\nID: <code>${chatId}</code>`, parse_mode: 'HTML' }, token);
        }
    }
}

// --- MAIN ENGINE ---
async function startBot() {
    console.log("ELAZ Bot Engine started on VM...");
    
    const { data: botConfig } = await supabase.from('bot_configs').select('token').eq('is_active', true).single();
    if (!botConfig) {
        console.error("Active bot token not found!");
        return;
    }
    const token = botConfig.token;

    // Bot yonganda kutib turgan barcha zakazlarni onlayn kurerlarga yuboramiz
    await checkAndNotifyPendingOrders(token);

    // Realtime orders listener (Faqat yangi tushganlar uchun)
    supabase.channel('vm_orders')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, async payload => {
            if (payload.new.status === 'confirmed') {
                const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
                const text = `📦 <b>YANGI BUYURTMA!</b>\n\n💰 Summa: ${payload.new.total_price.toLocaleString()} UZS\n📍 Manzil: ${payload.new.address_text}`;
                const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${payload.new.id}` }]] };
                for (const c of couriers || []) {
                    if (c.telegram_id) await tg('sendMessage', { chat_id: c.telegram_id, text, parse_mode: 'HTML', reply_markup: markup }, token);
                }
            }
        }).subscribe();

    // Polling Loop
    while (isRunning) {
        try {
            const updates = await tg('getUpdates', { offset: lastUpdateId, timeout: 30 }, token);
            if (updates.ok && updates.result) {
                for (const u of updates.result) {
                    await handleUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch (e) {
            console.error("Polling error:", e.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

startBot();
