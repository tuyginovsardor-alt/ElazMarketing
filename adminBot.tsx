
import { supabase, showToast } from "./index.tsx";

let botInstances: any[] = [];
let activeBotIndex = 0;
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;
const logs: {time: string, type: string, msg: string}[] = [];

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i><p style="margin-top:10px; font-weight:800; color:var(--gray);">BOT ENGINE YUKLANMOQDA...</p></div>`;

    // Bazadan barcha bot sozlamalarini olish
    const { data: settings } = await supabase.from('app_settings').select('*').eq('key', 'bot_config').maybeSingle();
    
    // Agar bot_config massiv bo'lsa massiv, ob'ekt bo'lsa massivga o'rab olamiz
    const configValue = settings?.value;
    if (Array.isArray(configValue)) {
        botInstances = configValue;
    } else if (configValue && configValue.token) {
        botInstances = [configValue];
    } else {
        botInstances = [];
    }

    const currentBot = botInstances[activeBotIndex];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:25px; height: calc(100vh - 200px);">
            <!-- Sidebar: Bot Instances -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-robot" style="color:var(--primary);"></i> BOT INSTANCES
                    </h3>
                    <div id="botInstancesList" style="display:flex; flex-direction:column; gap:10px; max-height:200px; overflow-y:auto; margin-bottom:15px;">
                        ${botInstances.length > 0 ? botInstances.map((bot, idx) => `
                            <div onclick="switchBotInstance(${idx})" style="padding:12px; border-radius:14px; border:2px solid ${activeBotIndex === idx ? 'var(--primary)' : '#f1f5f9'}; background:${activeBotIndex === idx ? 'var(--primary-light)' : 'white'}; cursor:pointer; transition:0.3s;">
                                <div style="font-weight:800; font-size:0.75rem; color:${activeBotIndex === idx ? 'var(--primary)' : 'var(--text)'};">
                                    ${bot.name || 'Bot #' + (idx + 1)}
                                </div>
                                <div style="font-family:monospace; font-size:0.6rem; color:var(--gray); overflow:hidden; text-overflow:ellipsis;">
                                    ${bot.token.substring(0, 15)}...
                                </div>
                            </div>
                        `).join('') : '<p style="font-size:0.7rem; color:var(--gray); text-align:center;">Botlar topilmadi.</p>'}
                    </div>
                    <button class="btn btn-primary" style="width:100%; height:50px; font-size:0.8rem;" onclick="toggleBotPolling()">
                        ${isPolling ? '<i class="fas fa-stop"></i> TO\'XTATISH' : '<i class="fas fa-play"></i> ISHGA TUSHIRISH'}
                    </button>
                </div>

                <div class="card" style="padding:20px; border-radius:24px; background:var(--dark); color:white; border:none;">
                    <h4 style="font-size:0.75rem; font-weight:900; margin-bottom:12px; opacity:0.6;">ENGINE STATUS</h4>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:10px; height:10px; border-radius:50%; background:${isPolling ? '#10b981' : '#ef4444'}; box-shadow:0 0 10px ${isPolling ? '#10b981' : '#ef4444'};"></div>
                        <b style="font-size:0.85rem;">${isPolling ? 'RUNNING' : 'STANDBY'}</b>
                    </div>
                </div>
            </div>

            <!-- Terminal Area -->
            <div class="card" style="background:#020617; border-radius:28px; border:1px solid #1e293b; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.2);">
                <div style="padding:15px 25px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                    <div style="color:#94a3b8; font-family:monospace; font-size:0.75rem; font-weight:700;">
                        <i class="fas fa-terminal" style="margin-right:8px;"></i> ${currentBot ? currentBot.name || 'BOT_LOGS' : 'TERMINAL'}.SH
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button style="background:none; border:none; color:#64748b; cursor:pointer;" onclick="renderAdminBot()"><i class="fas fa-sync-alt"></i></button>
                        <button style="background:none; border:none; color:#64748b; cursor:pointer;" onclick="clearBotLogs()"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div id="botTerminalLogs" style="flex:1; padding:20px; overflow-y:auto; font-family:'Fira Code', monospace; font-size:0.8rem; line-height:1.6;">
                    ${logs.length === 0 ? '<div style="color:#475569; font-style:italic;">Xabarlar kutilmoqda...</div>' : ''}
                </div>
            </div>
        </div>
    `;

    renderLogs();
}

(window as any).switchBotInstance = (idx: number) => {
    if(isPolling) return showToast("Avval botni to'xtating!");
    activeBotIndex = idx;
    renderAdminBot();
};

(window as any).toggleBotPolling = () => {
    const currentBot = botInstances[activeBotIndex];
    if(!currentBot || !currentBot.token) return showToast("Sozlamalardan bot tokenini kiriting!");
    
    if(isPolling) {
        isPolling = false;
        addBotLog('SYS', 'Engine to\'xtatildi.');
    } else {
        isPolling = true;
        addBotLog('SYS', `Engine [${currentBot.name || 'Bot'}] uchun ishga tushirildi...`);
        startPollingLoop(currentBot.token);
        setupOrderListener(currentBot.token);
    }
    renderAdminBot();
};

async function startPollingLoop(token: string) {
    while(isPolling) {
        try {
            const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId}&timeout=20`);
            const d = await r.json();
            if(d.ok && d.result) {
                for(const u of d.result) {
                    await handleBotUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch(e) {
            addBotLog('ERR', 'Polling xatosi: ' + e.message);
        }
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handleBotUpdate(update: any, token: string) {
    const msg = update.message;
    const callback = update.callback_query;
    const chatId = msg ? msg.chat.id : callback.message.chat.id;
    const text = msg?.text;
    const data = callback?.data;
    const from = msg ? msg.from.first_name : callback.from.first_name;

    if(text) addBotLog('IN', `${from}: ${text}`);

    const menu = {
        keyboard: [[{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }], [{ text: "👤 Profil" }]],
        resize_keyboard: true
    };

    if (text === "/start") {
        sendMessage(chatId, `Assalomu alaykum, <b>${from}</b>!\n\nID: <code>${chatId}</code>\nUshbu ID ni ilovadagi profil tahrirlash qismiga kiriting.`, token, menu);
    } else if (text === "🟢 Ishga tushish") {
        await supabase.from('profiles').update({ active_status: true, telegram_id: chatId }).eq('telegram_id', chatId);
        sendMessage(chatId, "🟢 Siz <b>ONLAYN</b> holatdasiz. Yangi buyurtmalar kutavering!", token, menu);
    } else if (text === "🔴 Dam olish") {
        await supabase.from('profiles').update({ active_status: false }).eq('telegram_id', chatId);
        sendMessage(chatId, "🔴 Siz <b>OFFLINE</b> holatdasiz. Dam oling.", token, menu);
    }

    if (data && data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        const { data: courier } = await supabase.from('profiles').select('id').eq('telegram_id', chatId).single();
        if(courier) {
            const { error } = await supabase.from('orders').update({ courier_id: courier.id, status: 'delivering' }).eq('id', orderId).is('courier_id', null);
            if(!error) {
                sendMessage(chatId, `✅ <b>Buyurtma #ORD-${orderId} qabul qilindi!</b>`, token);
                addBotLog('SYS', `Order #${orderId} assigned to ${from}`);
            } else {
                sendMessage(chatId, `❌ Buyurtma allaqachon olingan.`, token);
            }
        }
    }
}

async function sendMessage(chatId: number, text: string, token: string, markup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: markup })
        });
        addBotLog('OUT', `Xabar yuborildi: ${chatId}`);
    } catch(e) {}
}

function setupOrderListener(token: string) {
    if(orderListener) supabase.removeChannel(orderListener);
    orderListener = supabase.channel('order_events')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') notifyCouriers(payload.new, token);
        })
        .subscribe();
}

async function notifyCouriers(order: any, token: string) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if(!couriers || couriers.length === 0) return addBotLog('WARN', 'Onlayn kuryerlar yo\'q.');

    const text = `📦 <b>YANGI BUYURTMA! #ORD-${order.id}</b>\n\n💰 Narxi: ${order.total_price.toLocaleString()} so'm\n📍 Manzil: ${order.address_text}`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
    
    couriers.forEach(c => { if(c.telegram_id) sendMessage(c.telegram_id, text, token, markup); });
}

function addBotLog(type: string, msg: string) {
    logs.unshift({ time: new Date().toLocaleTimeString(), type, msg });
    if(logs.length > 50) logs.pop();
    renderLogs();
}

function renderLogs() {
    const term = document.getElementById('botTerminalLogs');
    if(!term) return;
    term.innerHTML = logs.map(l => {
        const color = l.type === 'IN' ? '#10b981' : (l.type === 'OUT' ? '#3b82f6' : (l.type === 'ERR' ? '#ef4444' : '#94a3b8'));
        return `<div style="margin-bottom:6px;"><span style="color:#475569;">[${l.time}]</span> <b style="color:${color}">${l.type}:</b> <span style="color:#cbd5e1">${l.msg}</span></div>`;
    }).join('');
    term.scrollTop = 0;
}

(window as any).clearBotLogs = () => {
    logs.length = 0;
    renderLogs();
};
