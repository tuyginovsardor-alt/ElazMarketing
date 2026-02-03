
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
                            <div id="activeBotName" style="font-size:0.8rem; font-weight:900;">${activeBotToken ? 'ACTIVE' : '-'}</div>
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
                        <div style="color:#64748b;">[${new Date().toLocaleTimeString()}] Engine initialized. Waiting for task...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bot qo'shish modal -->
        <div id="botConfigOverlay" class="overlay" style="z-index:9000;">
            <div style="max-width:400px; margin: 100px auto; padding:30px; background:white; border-radius:28px; box-shadow:var(--shadow-lg);">
                <h3 style="font-weight:900; margin-bottom:20px;">Yangi Bot Qo'shish</h3>
                <label>Bot nomi</label>
                <input type="text" id="new_bot_name" placeholder="Asosiy Bot">
                <label>Bot Tokeni</label>
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
                <div style="font-size:0.65rem; color:var(--gray);">${c.token.substring(0, 15)}...</div>
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

(window as any).runThisBot = async (token: string, name: string) => {
    if(isPolling && activeBotToken === token) {
        isPolling = false;
        activeBotToken = '';
        addBotLog('sys', `Bot ${name} engine stopped.`);
    } else {
        isPolling = false;
        await new Promise(r => setTimeout(r, 300));
        activeBotToken = token;
        isPolling = true;
        addBotLog('sys', `Bot engine started: ${name}`);
        startPollingLoop();
        setupOrderListener();
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
            await new Promise(res => setTimeout(res, 5000)); 
        }
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
        keyboard: [
            [{ text: "👤 Profil" }, { text: "🛒 Savatim" }],
            [{ text: "🌏 Saytni ochish" }],
            [{ text: "🛵 Kuryerlikka ariza" }]
        ],
        resize_keyboard: true
    };

    if(data && data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('telegram_id', chatId).maybeSingle();
        if(!profile) return answerCallback(update.callback_query.id, "Profilingiz ulanmagan!");
        const { data: order } = await supabase.from('orders').select('courier_id').eq('id', orderId).single();
        if(order?.courier_id) return answerCallback(update.callback_query.id, "Boshqa kuryer qabul qilib bo'ldi.");
        
        await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', orderId);
        answerCallback(update.callback_query.id, "Qabul qilindi!");
        sendMessage(chatId, `✅ <b>Buyurtma #ORD-${orderId} sizga biriktirildi.</b>\nManzil: ${WEBSITE_URL}/orders`);
        addBotLog('sys', `${profile.full_name} accepted order #${orderId}`);
    }

    if(text === '/start') {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if(p && p.role === 'courier') {
            sendMessage(chatId, `🏢 <b>ELAZ MARKET Kuryer Boti</b>\n\nSiz onlayn holatda bo'lsangiz, buyurtmalar kelishini kuting.\nProfilingiz: ${WEBSITE_URL}/?view=profile`, mainKeyboard);
        } else {
            sendMessage(chatId, `🏢 <b>ELAZ MARKET Rasmiy Boti</b>\n\nXaridlar va kuryerlik tizimiga xush kelibsiz! Quyidagi menyudan foydalaning:`, mainKeyboard);
        }
    } 
    else if(text === "👤 Profil") {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if(p) {
            sendMessage(chatId, `👤 <b>PROFILINGIZ:</b>\n\nIsm: ${p.first_name}\nRol: ${p.role.toUpperCase()}\nBalans: ${p.balance.toLocaleString()} so'm\nHolat: ${p.is_approved ? '✅ Tasdiqlangan' : '⏳ Kutilmoqda'}\n\nSaytda ko'rish: ${WEBSITE_URL}/?view=profile`);
        } else {
            sendMessage(chatId, `❌ Profilingiz topilmadi. Avval saytdan ro'yxatdan o'ting va Telegram ID ni bog'lang: ${WEBSITE_URL}/?apply=true`);
        }
    }
    else if(text === "🛒 Savatim") {
        sendMessage(chatId, `🛒 Savatchangizni ko'rish uchun saytga o'ting:\n${WEBSITE_URL}/?view=cart`);
    }
    else if(text === "🌏 Saytni ochish") {
        sendMessage(chatId, `🌐 ELAZ MARKET asosiy sahifasi:\n${WEBSITE_URL}`);
    }
    else if(text === "🛵 Kuryerlikka ariza") {
        sendMessage(chatId, `🛵 Kuryer bo'lib ishlash uchun arizani sayt orqali yuboring:\n${WEBSITE_URL}/?apply=true`);
    }
}

async function sendMessage(chatId: number, text: string, replyMarkup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup })
        });
        addBotLog('out', `Msg to ${chatId}`);
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

(window as any).saveBotConfig = async () => {
    const name = (document.getElementById('new_bot_name') as HTMLInputElement).value.trim();
    const token = (document.getElementById('new_bot_token') as HTMLInputElement).value.trim();
    if(!name || !token) return showToast("To'ldiring");
    await supabase.from('bot_configs').insert([{ bot_name: name, token }]);
    document.getElementById('botConfigOverlay')!.style.display = 'none';
    loadBotConfigs();
};

(window as any).clearBotLogs = () => { document.getElementById('botLogsContainer')!.innerHTML = ''; };
