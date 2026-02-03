
import { supabase, showToast } from "./index.tsx";

let activeBotToken = '';
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;
const WEBSITE_URL = window.location.origin;

// Bot sessiyalari (Ariza to'ldirish bosqichlari uchun)
const botSessions: Record<number, { step: string, data: any }> = {};

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px; height: calc(100vh - 180px);">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:24px; padding:20px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="font-weight:900;">Bot Tokenlari</h3>
                        <button class="btn btn-primary" style="height:32px; font-size:0.7rem; width:auto; padding:0 15px;" onclick="openAddBotModal()">QO'SHISH</button>
                    </div>
                    <div id="botConfigsList"></div>
                </div>

                <div class="card" style="border-radius:24px; padding:20px; background:var(--dark); color:white;">
                    <h4 style="font-weight:900; margin-bottom:10px;">Monitoring</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
                            <div style="font-size:0.6rem; opacity:0.6;">HOLAT</div>
                            <div id="botEngineStatus" style="font-size:0.8rem; font-weight:900; color:${isPolling ? 'var(--primary)' : 'var(--danger)'};">${isPolling ? 'RUNNING' : 'STOPPED'}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
                            <div style="font-size:0.6rem; opacity:0.6;">SESSIONS</div>
                            <div style="font-size:0.8rem; font-weight:900;">${Object.keys(botSessions).length} active</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="background:#020617; color:#10b981; font-family:'Fira Code', monospace; padding:20px; border-radius:24px; flex:1; display:flex; flex-direction:column; box-shadow:0 15px 35px rgba(0,0,0,0.3); border:1px solid #1e293b; overflow:hidden;">
                    <div id="botLogsContainer" style="flex:1; overflow-y:auto; font-size:0.75rem; line-height:1.6;">
                        <div style="color:#64748b;">[${new Date().toLocaleTimeString()}] Engine initialized.</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadBotConfigs();
}

async function loadBotConfigs() {
    const listEl = document.getElementById('botConfigsList');
    if(!listEl) return;
    const { data: configs } = await supabase.from('bot_configs').select('*');
    if(!configs) return;
    listEl.innerHTML = configs.map(c => `
        <div style="padding:12px; border-radius:14px; background:#f8fafc; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; font-size:0.85rem;">${c.bot_name}</div>
            <button class="btn" style="width:32px; height:32px; background:${isPolling && activeBotToken === c.token ? 'var(--danger)' : 'var(--primary)'}; color:white; padding:0;" onclick="runThisBot('${c.token}', '${c.bot_name}')">
                <i class="fas ${isPolling && activeBotToken === c.token ? 'fa-stop' : 'fa-play'}"></i>
            </button>
        </div>
    `).join('');
}

(window as any).runThisBot = async (token: string, name: string) => {
    if(isPolling && activeBotToken === token) {
        isPolling = false;
        activeBotToken = '';
    } else {
        isPolling = true;
        activeBotToken = token;
        startPollingLoop();
        setupOrderListener();
    }
    renderAdminBot();
};

async function startPollingLoop() {
    while(isPolling) {
        try {
            const r = await fetch(`https://api.telegram.org/bot${activeBotToken}/getUpdates?offset=${lastUpdateId}&timeout=15`);
            const d = await r.json();
            if(d.ok && d.result) {
                for(const u of d.result) {
                    await handleBotUpdate(u);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch(e) {}
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handleBotUpdate(update: any) {
    const msg = update.message || update.callback_query?.message;
    if(!msg) return;
    const chatId = msg.chat.id;
    const text = update.message?.text;
    const data = update.callback_query?.data;

    const mainKeyboard = {
        keyboard: [[{ text: "👤 Profil" }, { text: "🛒 Savatim" }], [{ text: "🌏 Saytni ochish" }], [{ text: "🛵 Kuryerlikka ariza" }]],
        resize_keyboard: true
    };

    // 1. Kuryerlik arizasi logic (Step-by-step)
    if (text === "🛵 Kuryerlikka ariza") {
        const { data: p } = await supabase.from('profiles').select('role, is_approved').eq('telegram_id', chatId).maybeSingle();
        if (p?.role === 'courier') return sendMessage(chatId, "✅ Siz allaqachon kuryersiz!");
        
        botSessions[chatId] = { step: 'ask_transport', data: {} };
        sendMessage(chatId, "🛵 <b>Kuryerlikka ariza berish</b>\n\nTransport turini tanlang:", {
            inline_keyboard: [[{ text: "🚶 Piyoda", callback_data: "apply_walking" }, { text: "🚲 Velo", callback_data: "apply_bicycle" }, { text: "🚗 Mashina", callback_data: "apply_car" }]]
        });
        return;
    }

    if (data && data.startsWith('apply_')) {
        const transport = data.split('_')[1];
        botSessions[chatId].data.transport = transport;
        botSessions[chatId].step = 'ask_zone';
        sendMessage(chatId, `Siz tanladingiz: <b>${transport}</b>\n\nEndi xizmat ko'rsatish hududingizni tanlang:`, {
            inline_keyboard: [[{ text: "📍 Tuman Markazi", callback_data: "zone_markaz" }], [{ text: "🏙️ Guliston shahri", callback_data: "zone_guliston" }]]
        });
        return;
    }

    if (data && data.startsWith('zone_')) {
        const zone = data.split('_')[1];
        botSessions[chatId].data.zone = zone;
        
        // Arizani bazaga saqlash
        const { data: uProfile } = await supabase.from('profiles').select('id, first_name, last_name, phone').eq('telegram_id', chatId).maybeSingle();
        if (!uProfile) return sendMessage(chatId, "❌ Avval saytda ro'yxatdan o'ting!");

        await supabase.from('courier_applications').insert({
            user_id: uProfile.id,
            full_name: `${uProfile.first_name} ${uProfile.last_name || ''}`,
            transport_type: botSessions[chatId].data.transport,
            phone: uProfile.phone,
            status: 'pending'
        });

        delete botSessions[chatId];
        sendMessage(chatId, "✅ <b>Arizangiz qabul qilindi!</b>\n\nAdminlar ko'rib chiqib sizni kuryerlar ro'yxatiga qo'shishadi. Tasdiqlangach sizga xabar yuboramiz.");
        return;
    }

    // 2. Savatim logic (Bot ichida ro'yxat)
    if (text === "🛒 Savatim") {
        const { data: u } = await supabase.from('profiles').select('id').eq('telegram_id', chatId).maybeSingle();
        if (!u) return sendMessage(chatId, "❌ Profil bog'lanmagan.");

        const { data: items } = await supabase.from('cart_items').select('quantity, products(name, price)').eq('user_id', u.id);
        if (!items || items.length === 0) return sendMessage(chatId, "🛒 Savatchangiz hozircha bo'sh.");

        let cartText = "🛒 <b>SAVATCHANGIZ:</b>\n\n";
        let total = 0;
        items.forEach((item: any, i) => {
            const sum = item.quantity * item.products.price;
            total += sum;
            cartText += `${i+1}. ${item.products.name} x ${item.quantity} = ${sum.toLocaleString()} so'm\n`;
        });
        cartText += `\n<b>JAMI: ${total.toLocaleString()} so'm</b>\n\nRasmiylashtirish uchun saytga o'ting: ${WEBSITE_URL}/?view=cart`;
        sendMessage(chatId, cartText);
        return;
    }

    // 3. Profil va Statistika
    if (text === "👤 Profil") {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if (!p) return sendMessage(chatId, "❌ Profil topilmadi.");

        let profileText = `👤 <b>PROFILINGIZ:</b>\n\nIsm: ${p.first_name}\nBalans: ${p.balance.toLocaleString()} so'm\n`;
        
        if (p.role === 'courier') {
            const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('courier_id', p.id).eq('status', 'delivered');
            profileText += `Rol: 🛵 KURYER\nBajarilgan buyurtmalar: 📦 ${count || 0} ta\nHolat: ${p.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}`;
        } else {
            profileText += `Rol: 👤 Mijoz`;
        }
        
        sendMessage(chatId, profileText, mainKeyboard);
        return;
    }

    if (text === '/start') {
        sendMessage(chatId, `🏢 <b>ELAZ MARKET Rasmiy Boti</b>\n\nXush kelibsiz! Kerakli bo'limni tanlang:`, mainKeyboard);
    }
}

async function sendMessage(chatId: number, text: string, replyMarkup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup })
        });
    } catch(e) {}
}

async function answerCallback(id: string, text: string) {
    fetch(`https://api.telegram.org/bot${activeBotToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: id, text })
    });
}

function setupOrderListener() {
    if(orderListener) supabase.removeChannel(orderListener);
    orderListener = supabase.channel('orders')
        .on('postgres_changes', { event: 'UPDATE', table: 'orders', filter: 'status=eq.confirmed' }, payload => {
            if(!payload.new.courier_id) notifyCouriers(payload.new);
        })
        .subscribe();
}

async function notifyCouriers(order: any) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if(!couriers) return;
    const msgText = `📦 <b>YANGI BUYURTMA! #${order.id}</b>\n💰 Summa: ${order.total_price.toLocaleString()} so'm\n📍 Manzil: ${order.address_text}`;
    const keyboard = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
    for(const c of couriers) {
        if(c.telegram_id) sendMessage(c.telegram_id, msgText, keyboard);
    }
}

function addBotLog(type: string, msg: string) {
    const logEl = document.getElementById('botLogsContainer');
    if(!logEl) return;
    logEl.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
}
