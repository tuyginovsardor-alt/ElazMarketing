
import { supabase, showToast } from "./index.tsx";

let activeBotToken = '';
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;
const WEBSITE_URL = window.location.origin;

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px; height: calc(100vh - 180px);">
            <!-- CHAP TOMON: TOKENLAR RO'YXATI -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:24px; padding:20px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="font-weight:900;">Bot Tokenlari</h3>
                        <button class="btn btn-primary" style="height:32px; font-size:0.7rem; width:auto; padding:0 15px;" onclick="openAddBotModal()">QO'SHISH</button>
                    </div>
                    <div id="botConfigsList" style="display:flex; flex-direction:column; gap:10px;">
                        <!-- Tokenlar bazadan keladi -->
                    </div>
                </div>

                <div class="card" style="border-radius:24px; padding:20px; background:var(--dark); color:white;">
                    <h4 style="font-weight:900; margin-bottom:10px;">Monitoring</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
                            <div style="font-size:0.6rem; opacity:0.6;">HOLAT</div>
                            <div id="botEngineStatus" style="font-size:0.8rem; font-weight:900; color:${isPolling ? 'var(--primary)' : 'var(--danger)'};">${isPolling ? 'RUNNING' : 'STOPPED'}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
                            <div style="font-size:0.6rem; opacity:0.6;">AKTIV BOT</div>
                            <div id="activeBotName" style="font-size:0.8rem; font-weight:900;">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- O'NG TOMON: LOGLAR VA ENGINE -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="background:#020617; color:#10b981; font-family:'Fira Code', monospace; padding:20px; border-radius:24px; flex:1; display:flex; flex-direction:column; box-shadow:0 15px 35px rgba(0,0,0,0.3); border:1px solid #1e293b; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #1e293b; padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div id="botStatusPulse" style="width:10px; height:10px; background:${isPolling ? '#10b981' : '#ef4444'}; border-radius:50%; ${isPolling ? 'animation: pulse 2s infinite;' : ''}"></div>
                            <span style="font-weight:900; color:white; font-size:0.8rem;">ENGINE LOGS</span>
                        </div>
                        <button class="btn" style="height:32px; font-size:0.65rem; background:#1e293b; color:white; width:auto; padding:0 15px;" onclick="clearBotLogs()">CLEAR</button>
                    </div>
                    <div id="botLogsContainer" style="flex:1; overflow-y:auto; font-size:0.75rem; line-height:1.6; padding-right:10px;">
                        <div style="color:#64748b;">[${new Date().toLocaleTimeString()}] System ready.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bot qo'shish modal (overlay) -->
        <div id="botConfigOverlay" class="overlay" style="z-index:9000;">
            <div style="max-width:400px; margin: 100px auto; padding:30px; background:white; border-radius:28px; box-shadow:var(--shadow-lg);">
                <h3 style="font-weight:900; margin-bottom:20px;">Yangi Bot Qo'shish</h3>
                <label>Bot nomi (Masalan: Asosiy Bot)</label>
                <input type="text" id="new_bot_name" placeholder="Asosiy Bot">
                <label>Bot Tokeni (API Key)</label>
                <input type="text" id="new_bot_token" placeholder="8286953925:AAFv...">
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn btn-primary" style="flex:1;" onclick="saveBotConfig()">SAQLASH</button>
                    <button class="btn btn-outline" style="flex:1;" onclick="document.getElementById('botConfigOverlay').style.display='none'">BEKOR QILISH</button>
                </div>
            </div>
        </div>
    `;

    loadBotConfigs();
}

async function loadBotConfigs() {
    const listEl = document.getElementById('botConfigsList');
    if(!listEl) return;

    const { data: configs } = await supabase.from('bot_configs').select('*').order('created_at', { ascending: false });

    if(!configs || configs.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--gray); font-size:0.8rem;">Tokenlar topilmadi.</div>';
        return;
    }

    listEl.innerHTML = configs.map(c => `
        <div style="padding:15px; border-radius:18px; border:1px solid #f1f5f9; background:#f8fafc; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:900; font-size:0.85rem; color:var(--text);">${c.bot_name}</div>
                <div style="font-size:0.65rem; color:var(--gray); overflow:hidden; text-overflow:ellipsis; width:150px;">${c.token.substring(0, 15)}...</div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn" style="width:32px; height:32px; background:${isPolling && activeBotToken === c.token ? 'var(--danger)' : 'var(--primary)'}; color:white; padding:0; border-radius:8px;" onclick="runThisBot('${c.token}', '${c.bot_name}')">
                    <i class="fas ${isPolling && activeBotToken === c.token ? 'fa-stop' : 'fa-play'}"></i>
                </button>
                <button class="btn btn-outline" style="width:32px; height:32px; border:none; color:var(--danger); padding:0;" onclick="deleteBotConfig('${c.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

(window as any).openAddBotModal = () => {
    document.getElementById('botConfigOverlay')!.style.display = 'block';
};

(window as any).saveBotConfig = async () => {
    const name = (document.getElementById('new_bot_name') as HTMLInputElement).value.trim();
    const token = (document.getElementById('new_bot_token') as HTMLInputElement).value.trim();

    if(!name || !token) return showToast("Barcha maydonlarni to'ldiring");

    const { error } = await supabase.from('bot_configs').insert([{ bot_name: name, token: token }]);
    
    if(!error) {
        showToast("Bot konfiguratsiyasi saqlandi!");
        document.getElementById('botConfigOverlay')!.style.display = 'none';
        loadBotConfigs();
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).deleteBotConfig = async (id: string) => {
    if(!confirm("Ushbu botni o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from('bot_configs').delete().eq('id', id);
    if(!error) {
        if(isPolling) (window as any).runThisBot('', ''); // Stop if running
        loadBotConfigs();
    }
};

(window as any).runThisBot = async (token: string, name: string) => {
    if(isPolling && activeBotToken === token) {
        // Stop currently running bot
        isPolling = false;
        activeBotToken = '';
        addBotLog('sys', `Bot ${name} stopped.`);
        if(orderListener) supabase.removeChannel(orderListener);
    } else {
        // Start bot
        isPolling = false; // Reset existing
        await new Promise(r => setTimeout(r, 500));
        activeBotToken = token;
        isPolling = true;
        addBotLog('sys', `Starting bot: ${name}...`);
        startPollingLoop();
        setupOrderListener();
        
        const nameEl = document.getElementById('activeBotName');
        if(nameEl) nameEl.innerText = name;
    }
    renderAdminBot();
};

async function startPollingLoop() {
    while(isPolling) {
        try {
            const r = await fetch(`https://api.telegram.org/bot${activeBotToken}/getUpdates?offset=${lastUpdateId}&timeout=20`);
            const d = await r.json();
            if(d.ok && d.result) {
                for(const u of d.result) {
                    await handleBotUpdate(u);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch(e) { 
            addBotLog('sys', 'Polling Error. Retrying...');
            await new Promise(res => setTimeout(res, 5000)); 
        }
        await new Promise(res => setTimeout(res, 1000));
    }
}

function setupOrderListener() {
    orderListener = supabase.channel('order-notifications')
        .on('postgres_changes', { event: 'UPDATE', table: 'orders', filter: 'status=eq.confirmed' }, payload => {
            const order = payload.new;
            if(!order.courier_id) notifyOnlineCouriers(order);
        })
        .subscribe();
}

async function notifyOnlineCouriers(order: any) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id, full_name').eq('role', 'courier').eq('active_status', true).not('telegram_id', 'is', null);
    
    if(!couriers || couriers.length === 0) return;

    // Buyurtma mahsulotlarini olish (agar orders jadvalida products JSON bo'lsa)
    const items = order.items_text || "Ma'lumot yo'q";

    const messageText = `
📦 <b>YANGI BUYURTMA! #ORD-${order.id}</b>

📍 <b>Manzil:</b> ${order.address_text}
🛍 <b>Mahsulotlar:</b> ${items}
💰 <b>Summa:</b> ${order.total_price.toLocaleString()} so'm
🚚 <b>Dostavka:</b> ${order.delivery_cost.toLocaleString()} so'm
📝 <b>Izoh:</b> ${order.notes || 'Yo\'q'}

<i>Qabul qilish uchun pastdagi tugmani bosing:</i>
    `;

    for(const courier of couriers) {
        await sendMessage(courier.telegram_id, messageText, {
            inline_keyboard: [[{ text: "✅ BUYURTMANI QABUL QILISH", callback_data: `accept_${order.id}` }]]
        });
    }
    addBotLog('sys', `${couriers.length} kurerga xabar yuborildi.`);
}

async function handleBotUpdate(update: any) {
    const msg = update.message || update.callback_query?.message;
    if(!msg) return;
    const chatId = msg.chat.id;
    const text = update.message?.text;
    const data = update.callback_query?.data;

    if(data && data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('telegram_id', chatId).maybeSingle();
        
        if(!profile) return answerCallback(update.callback_query.id, "Profilingiz ulanmagan!");

        const { data: order } = await supabase.from('orders').select('courier_id, status').eq('id', orderId).single();
        if(order.courier_id) return answerCallback(update.callback_query.id, "Kechirasiz, boshqa kurer qabul qilib bo'lgan.");

        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', orderId);
        
        if(!error) {
            answerCallback(update.callback_query.id, "Qabul qilindi! Omad!");
            sendMessage(chatId, `✅ <b>#ORD-${orderId} buyurtmasi sizga biriktirildi.</b>\nMijoz manzili: ${WEBSITE_URL}/orders`);
            addBotLog('sys', `${profile.full_name} buyurtmani qabul qildi.`);
        }
    }

    if(text === '/start') {
        sendMessage(chatId, `🏢 <b>ELAZ MARKET Kuryer Bot</b>\n\nSiz onlayn holatda bo'lsangiz, buyurtmalar kelishini kuting.\nProfilingiz: ${WEBSITE_URL}/profile`);
    }
}

async function sendMessage(chatId: number, text: string, replyMarkup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup })
        });
        addBotLog('out', `To ${chatId}: Sent.`);
    } catch(e) {}
}

async function answerCallback(id: string, text: string) {
    fetch(`https://api.telegram.org/bot${activeBotToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: id, text })
    });
}

function addBotLog(type: 'in' | 'out' | 'sys' | 'err', msg: string) {
    const logEl = document.getElementById('botLogsContainer');
    if(!logEl) return;
    const time = new Date().toLocaleTimeString();
    const color = { in: '#10b981', out: '#3b82f6', sys: '#64748b', err: '#ef4444' }[type];
    logEl.innerHTML += `<div style="margin-bottom:4px;"><span style="color:#334155;">[${time}]</span> <span style="color:${color}; font-weight:bold;">#</span> ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
}

(window as any).clearBotLogs = () => {
    document.getElementById('botLogsContainer')!.innerHTML = '';
};
