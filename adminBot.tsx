
import { supabase, showToast } from "./index.tsx";

let activeBotToken = '';
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px;">
            <div class="card" style="padding:20px;">
                <h3 style="font-weight:900; margin-bottom:15px;">Bot Engine</h3>
                <button class="btn btn-primary" onclick="startGlobalBot()">BOTNI YOQISH</button>
                <div id="pollingStatus" style="margin-top:15px; font-weight:800; color:var(--primary);">HOLAT: TO'XTATILGAN</div>
            </div>
            <div class="card" style="background:#020617; color:#10b981; font-family:monospace; padding:20px; height:400px; overflow-y:auto;" id="botLogsContainer">
                [SYSTEM] Bot engine tayyor.
            </div>
        </div>
    `;

    const { data } = await supabase.from('app_settings').select('value').eq('key', 'bot_config').single();
    if(data?.value?.token) activeBotToken = data.value.token;
}

(window as any).startGlobalBot = () => {
    if(!activeBotToken) return showToast("Token yo'q!");
    if(isPolling) return;
    isPolling = true;
    document.getElementById('pollingStatus')!.innerText = "HOLAT: ISHLAMOQDA 🟢";
    startPollingLoop();
    setupOrderListener();
    showToast("Bot ishga tushdi! 🤖");
};

async function startPollingLoop() {
    while(isPolling) {
        try {
            const r = await fetch(`https://api.telegram.org/bot${activeBotToken}/getUpdates?offset=${lastUpdateId}&timeout=30`);
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
    const msg = update.message;
    const callback = update.callback_query;
    const chatId = msg ? msg.chat.id : callback.message.chat.id;
    const text = msg?.text;
    const data = callback?.data;

    const menu = {
        keyboard: [[{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }], [{ text: "👤 Profil" }]],
        resize_keyboard: true
    };

    if (text === "🟢 Ishga tushish") {
        await supabase.from('profiles').update({ active_status: true, telegram_id: chatId }).eq('telegram_id', chatId);
        sendMessage(chatId, "🟢 Siz <b>ONLAYN</b> holatdasiz. Buyurtmalarni kutavering!", menu);
    } else if (text === "🔴 Dam olish") {
        await supabase.from('profiles').update({ active_status: false }).eq('telegram_id', chatId);
        sendMessage(chatId, "🔴 Siz <b>OFFLINE</b> holatdasiz. Dam oling.", menu);
    } else if (text === "/start") {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        sendMessage(chatId, `Xush kelibsiz! ID: ${chatId}\nProfilingizni bog'lash uchun ilovada ushbu ID-ni kiriting.`, menu);
    }

    if (data && data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        const { data: courier } = await supabase.from('profiles').select('id').eq('telegram_id', chatId).single();
        const { error } = await supabase.from('orders').update({ courier_id: courier.id, status: 'delivering' }).eq('id', orderId).is('courier_id', null);
        
        if(!error) sendMessage(chatId, `✅ Buyurtma #ORD-${orderId} qabul qilindi!`);
        else sendMessage(chatId, `❌ Xatolik yoki buyurtma allaqachon olingan.`);
    }
}

async function sendMessage(chatId: number, text: string, markup: any = {}) {
    fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: markup })
    });
}

function setupOrderListener() {
    if(orderListener) supabase.removeChannel(orderListener);
    orderListener = supabase.channel('orders')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') notifyCouriers(payload.new);
        })
        .subscribe();
}

async function notifyCouriers(order: any) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if(!couriers) return;

    const text = `📦 <b>YANGI BUYURTMA!</b>\n\n💰 Narxi: ${order.total_price.toLocaleString()} UZS\n📍 Manzil: ${order.address_text}\n🚲 Yetkazish: ${order.delivery_cost.toLocaleString()} UZS`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
    
    couriers.forEach(c => { if(c.telegram_id) sendMessage(c.telegram_id, text, markup); });
}
