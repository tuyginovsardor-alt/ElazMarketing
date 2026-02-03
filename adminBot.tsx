
import { supabase, showToast } from "./index.tsx";

let activeBotToken = '';
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;
const WEBSITE_URL = window.location.origin;

const botSessions: Record<number, { step: string, data: any }> = {};

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px; height: calc(100vh - 180px);">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:24px; padding:20px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="font-weight:900;">Bot Sozlamalari</h3>
                        <button class="btn btn-primary" style="height:32px; font-size:0.7rem; width:auto; padding:0 15px;" onclick="startGlobalBot()">BOTNI YOQISH</button>
                    </div>
                    <p style="font-size:0.75rem; color:var(--gray);">Token: <code id="activeTokenDisplay">...</code></p>
                </div>

                <div class="card" style="border-radius:24px; padding:20px; background:var(--dark); color:white;">
                    <h4 style="font-weight:900; margin-bottom:10px;">Monitoring</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
                            <div style="font-size:0.6rem; opacity:0.6;">HOLAT</div>
                            <div id="botEngineStatus" style="font-size:0.8rem; font-weight:900; color:var(--primary);">ACTIVE</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
                            <div style="font-size:0.6rem; opacity:0.6;">POLLING</div>
                            <div id="pollingStatus" style="font-size:0.8rem; font-weight:900;">...</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="background:#020617; color:#10b981; font-family:'Fira Code', monospace; padding:20px; border-radius:24px; display:flex; flex-direction:column; box-shadow:0 15px 35px rgba(0,0,0,0.3); border:1px solid #1e293b; overflow:hidden;">
                <div id="botLogsContainer" style="flex:1; overflow-y:auto; font-size:0.75rem; line-height:1.6; height:400px;">
                    <div style="color:#64748b;">[${new Date().toLocaleTimeString()}] Bot engine tayyor.</div>
                </div>
            </div>
        </div>
    `;

    // Avtomatik tokenni olish
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'bot_config').single();
    if(data?.value?.token) {
        activeBotToken = data.value.token;
        document.getElementById('activeTokenDisplay')!.innerText = activeBotToken.substring(0,10) + '...';
    }
}

(window as any).startGlobalBot = () => {
    if(!activeBotToken) return showToast("Bot tokeni sozlamalarda ko'rsatilmagan!");
    if(isPolling) return showToast("Bot allaqachon ishlamoqda");
    isPolling = true;
    document.getElementById('pollingStatus')!.innerText = "RUNNING";
    startPollingLoop();
    setupOrderListener();
    showToast("Bot polling ishga tushdi! 🤖");
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
        } catch(e) { console.error("Polling error", e); }
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handleBotUpdate(update: any) {
    const msg = update.message;
    const callback = update.callback_query;
    
    const chatId = msg ? msg.chat.id : callback.message.chat.id;
    const text = msg?.text;
    const data = callback?.data;

    const mainKeyboard = {
        keyboard: [[{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }], [{ text: "👤 Profil" }, { text: "📦 Buyurtmalarim" }]],
        resize_keyboard: true
    };

    // --- 1. Buyurtmani qabul qilish (Callback) ---
    if (data && data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        addBotLog('SYS', `Order ${orderId} accept request from ${chatId}`);
        
        // Kuryerni topish
        const { data: courier } = await supabase.from('profiles').select('id, full_name').eq('telegram_id', chatId).single();
        if(!courier) return answerCallback(callback.id, "Profilingiz topilmadi!");

        // Buyurtmani band qilish
        const { data: order } = await supabase.from('orders').select('status, courier_id').eq('id', orderId).single();
        if(order && order.courier_id) return answerCallback(callback.id, "Bu buyurtma allaqachon olingan!");

        const { error } = await supabase.from('orders').update({ 
            courier_id: courier.id, 
            status: 'delivering' 
        }).eq('id', orderId);

        if(!error) {
            sendMessage(chatId, `✅ <b>Buyurtma #ORD-${orderId} qabul qilindi!</b>\n\nManzil sari yo'lga chiqing. Yetkazib bo'lgach "YETKAZDIM" tugmasini bosing.`, {
                inline_keyboard: [[{ text: "🏁 YETKAZDIM", callback_data: `finish_${orderId}` }]]
            });
            answerCallback(callback.id, "Muvaffaqiyatli!");
        } else {
            answerCallback(callback.id, "Xatolik yuz berdi");
        }
        return;
    }

    // --- 2. Buyurtmani yakunlash (Callback) ---
    if (data && data.startsWith('finish_')) {
        const orderId = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('delivery_cost').eq('id', orderId).single();
        
        const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
        if(!error) {
            // Balansni yangilash
            const { data: courier } = await supabase.from('profiles').select('id, balance').eq('telegram_id', chatId).single();
            await supabase.from('profiles').update({ balance: (courier.balance || 0) + (order.delivery_cost || 5000) }).eq('id', courier.id);
            
            sendMessage(chatId, `🎉 <b>Barakalla!</b>\n\nBuyurtma #ORD-${orderId} yakunlandi. Daromad: ${order.delivery_cost.toLocaleString()} so'm hamyoningizga qo'shildi.`);
            answerCallback(callback.id, "Yakunlandi!");
        }
        return;
    }

    // --- 3. Statusni o'zgartirish ---
    if (text === "🟢 Ishga tushish") {
        const { error } = await supabase.from('profiles').update({ active_status: true, telegram_id: chatId }).eq('telegram_id', chatId);
        if(!error) sendMessage(chatId, "🟢 Siz <b>ONLAYN</b> holatdasiz. Buyurtmalar kutavering!", mainKeyboard);
        else sendMessage(chatId, "❌ Profil bog'lanmagan. Ilovada ro'yxatdan o'ting.");
        return;
    }

    if (text === "🔴 Dam olish") {
        await supabase.from('profiles').update({ active_status: false }).eq('telegram_id', chatId);
        sendMessage(chatId, "🔴 Siz <b>OFFLINE</b> holatdasiz.", mainKeyboard);
        return;
    }

    // --- 4. Start ---
    if (text === '/start') {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if(p) {
            sendMessage(chatId, `Assalomu alaykum, <b>${p.first_name}</b>!\n\nHolatingiz: ${p.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}`, mainKeyboard);
        } else {
            sendMessage(chatId, "Assalomu alaykum! Ilovadagi <b>Telegram ID</b>ingizni ushbu botga bog'lash uchun profilingizga kiring.");
        }
    }
}

async function sendMessage(chatId: number, text: string, replyMarkup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup })
        });
        addBotLog('OUT', `To ${chatId}: ${text.substring(0,30)}...`);
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
    
    // ENDI: Yangi buyurtma yaratilganda (INSERT) va statusi confirmed bo'lganda ishlaydi
    orderListener = supabase.channel('order_notifications')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') {
                notifyCouriers(payload.new);
            }
        })
        .subscribe();
}

async function notifyCouriers(order: any) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if(!couriers || couriers.length === 0) {
        addBotLog('WARN', "Onlayn kuryerlar topilmadi.");
        return;
    }

    const msgText = `📦 <b>YANGI BUYURTMA! #ORD-${order.id}</b>\n\n💰 Summa: ${order.total_price.toLocaleString()} so'm\n📍 Manzil: ${order.address_text}\n🚲 Yetkazish haqi: <b>${order.delivery_cost.toLocaleString()} so'm</b>`;
    const keyboard = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
    
    for(const c of couriers) {
        if(c.telegram_id) sendMessage(c.telegram_id, msgText, keyboard);
    }
    addBotLog('SYS', `Notification sent to ${couriers.length} couriers.`);
}

function addBotLog(type: string, msg: string) {
    const logEl = document.getElementById('botLogsContainer');
    if(!logEl) return;
    logEl.innerHTML += `<div><span style="color:#94a3b8;">[${new Date().toLocaleTimeString()}]</span> <b style="color:${type === 'SYS' ? '#10b981' : '#f43f5e'}">${type}:</b> ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
}
