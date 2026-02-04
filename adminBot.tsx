
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

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i><p style="margin-top:10px; font-size:0.8rem; color:var(--gray); font-weight:800;">BOT_CONFIGS YUKLANMOQDA...</p></div>`;

    // Skrinshotdagi 'bot_configs' jadvalidan ma'lumotlarni olamiz
    const { data: bots, error } = await supabase.from('bot_configs').select('*').order('created_at', { ascending: true });
    
    if (error) {
        addBotLog('ERR', "Baza xatosi: " + error.message);
    }

    botInstances = bots || [];

    if (botInstances.length === 0) {
        container.innerHTML = `
            <div style="max-width:500px; margin: 0 auto; padding: 40px; background:white; border-radius:30px; box-shadow:var(--shadow-sm); text-align:center;">
                <div style="width:80px; height:80px; background:var(--primary-light); color:var(--primary); border-radius:25px; display:inline-flex; align-items:center; justify-content:center; font-size:2.5rem; margin-bottom:20px;">
                    <i class="fas fa-robot"></i>
                </div>
                <h2 style="font-weight:900; margin-bottom:10px;">Botlar topilmadi</h2>
                <p style="color:var(--gray); font-size:0.85rem; margin-bottom:25px;">Kuryerlarni boshqarish uchun kamida bitta bot tokenini kiriting.</p>
                
                <input type="text" id="quickBotName" placeholder="Bot nomi (masalan: Asosiy Bot)" style="height:55px; margin-bottom:12px;">
                <input type="password" id="quickBotToken" placeholder="Bot Token (HTTP API)" style="height:55px; margin-bottom:20px;">
                
                <button class="btn btn-primary" id="btnQuickAddBot" style="width:100%;" onclick="quickAddBot()">
                    BOTNI QO'SHISH VA BOSHLASH
                </button>
            </div>
        `;
        return;
    }

    const currentBot = botInstances[activeBotIndex];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 300px 1fr; gap:25px; height: calc(100vh - 200px);">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:0.9rem; margin-bottom:15px; color:var(--gray);">BOTLAR RO'YXATI</h3>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px; max-height:250px; overflow-y:auto;">
                        ${botInstances.map((bot, idx) => `
                            <div onclick="switchBotInstance(${idx})" style="padding:12px; border-radius:15px; border:2px solid ${activeBotIndex === idx ? 'var(--primary)' : '#f1f5f9'}; background:${activeBotIndex === idx ? 'var(--primary-light)' : 'white'}; cursor:pointer; position:relative;">
                                <div style="font-weight:800; font-size:0.75rem;">${bot.bot_name}</div>
                                <div style="font-size:0.6rem; color:var(--gray); overflow:hidden; text-overflow:ellipsis;">${bot.token.substring(0,20)}...</div>
                                ${bot.is_active ? '<div style="position:absolute; top:12px; right:12px; width:8px; height:8px; border-radius:50%; background:#10b981;"></div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" style="width:100%; height:50px; font-size:0.8rem;" onclick="toggleBotPolling()">
                        ${isPolling ? '<i class="fas fa-stop"></i> TO\'XTATISH' : '<i class="fas fa-play"></i> ISHGA TUSHIRISH'}
                    </button>
                </div>

                <div class="card" style="padding:20px; border-radius:24px; background:var(--dark); color:white; border:none;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:10px; height:10px; border-radius:50%; background:${isPolling ? '#10b981' : '#ef4444'}; box-shadow:0 0 10px ${isPolling ? '#10b981' : '#ef4444'};"></div>
                        <span style="font-size:0.8rem; font-weight:800;">${isPolling ? 'ENGINE RUNNING' : 'ENGINE STOPPED'}</span>
                    </div>
                </div>
            </div>

            <div class="card" style="background:#020617; border-radius:28px; border:1px solid #1e293b; display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:15px 25px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#94a3b8; font-family:monospace; font-size:0.7rem; font-weight:700;">
                        <i class="fas fa-terminal"></i> ${currentBot ? currentBot.bot_name.toUpperCase() : 'BOT'}.LOG
                    </span>
                    <button style="background:none; border:none; color:#64748b; cursor:pointer;" onclick="clearBotLogs()"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div id="botTerminalLogs" style="flex:1; padding:20px; overflow-y:auto; font-family:'Fira Code', monospace; font-size:0.75rem; line-height:1.6; color:#cbd5e1;">
                    ${logs.length === 0 ? '<div style="color:#475569; font-style:italic;">Xabarlar kutilmoqda...</div>' : ''}
                </div>
            </div>
        </div>
    `;

    renderLogs();
}

(window as any).quickAddBot = async () => {
    const bot_name = (document.getElementById('quickBotName') as HTMLInputElement).value || 'Yangi Bot';
    const token = (document.getElementById('quickBotToken') as HTMLInputElement).value.trim();
    if(!token) return showToast("Token kiriting!");

    const { error } = await supabase.from('bot_configs').insert([{ bot_name, token, is_active: true }]);
    if(!error) {
        showToast("Bot qo'shildi! ✅");
        renderAdminBot();
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).switchBotInstance = (idx: number) => {
    if(isPolling) return showToast("Avval botni to'xtating!");
    activeBotIndex = idx;
    renderAdminBot();
};

(window as any).toggleBotPolling = () => {
    const currentBot = botInstances[activeBotIndex];
    if(!currentBot?.token) return showToast("Token topilmadi!");
    
    if(isPolling) {
        isPolling = false;
        addBotLog('SYS', 'Engine to\'xtatildi.');
    } else {
        isPolling = true;
        addBotLog('SYS', `Engine [${currentBot.bot_name}] ishga tushirildi...`);
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
            addBotLog('ERR', 'Telegram API ulanishda xato.');
        }
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handleBotUpdate(update: any, token: string) {
    const msg = update.message;
    const callback = update.callback_query;
    const chatId = msg ? msg.chat.id : callback.message.chat.id;
    const text = msg?.text;
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
}

async function sendMessage(chatId: number, text: string, token: string, markup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: markup })
        });
        addBotLog('OUT', `Yuborildi -> ${chatId}`);
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
    if(!couriers || couriers.length === 0) return addBotLog('WARN', 'Xabardor qilish uchun onlayn kuryerlar yo\'q.');

    const text = `📦 <b>YANGI BUYURTMA! #ORD-${order.id}</b>\n\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n📍 Manzil: ${order.address_text}`;
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
