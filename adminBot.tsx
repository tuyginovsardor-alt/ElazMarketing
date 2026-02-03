
import { supabase, showToast } from "./index.tsx";

let activeBotToken = '';
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;
const logs: {time: string, type: string, msg: string}[] = [];

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    // Bazadan tokenni olish
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'bot_config').maybeSingle();
    activeBotToken = data?.value?.token || '';

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 350px 1fr; gap:25px; height: calc(100vh - 200px);">
            <!-- Panel Control -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:25px; border-radius:28px; border:none; box-shadow:var(--shadow-sm); background:white;">
                    <h3 style="font-weight:900; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-robot" style="color:var(--primary);"></i> ELAZ Engine
                    </h3>
                    <div style="font-size:0.75rem; color:var(--gray); margin-bottom:20px; line-height:1.5;">
                        Telegram Bot tizimi kuryerlarni yangi buyurtmalardan xabardor qilish va buyurtmalarni qabul qilish uchun javobgar.
                    </div>
                    
                    <div style="padding:15px; background:#f8fafc; border-radius:18px; margin-bottom:20px; border:1px solid #f1f5f9;">
                        <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Hozirgi Token:</div>
                        <div style="font-family:monospace; font-size:0.75rem; color:var(--text); word-break:break-all;">
                            ${activeBotToken ? activeBotToken.substring(0, 15) + '...' : '<span style="color:var(--danger);">Token topilmadi!</span>'}
                        </div>
                    </div>

                    <button class="btn ${isPolling ? 'btn-outline' : 'btn-primary'}" style="width:100%; height:55px;" onclick="toggleBotPolling()">
                        ${isPolling ? '<i class="fas fa-stop-circle"></i> BOTNI TO\'XTATISH' : '<i class="fas fa-play-circle"></i> BOTNI ISHGA TUSHIRISH'}
                    </button>
                    
                    <div id="pollingIndicator" style="margin-top:15px; text-align:center; font-size:0.75rem; font-weight:800; color:${isPolling ? 'var(--primary)' : 'var(--danger)'}">
                        ${isPolling ? '🟢 SISTEMA ONLINE' : '🔴 SISTEMA OFFLINE'}
                    </div>
                </div>

                <div class="card" style="padding:20px; border-radius:24px; background:var(--dark); color:white; border:none;">
                    <h4 style="font-size:0.8rem; font-weight:900; margin-bottom:12px;">STATISTIKA</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:14px;">
                            <div style="font-size:0.6rem; opacity:0.6;">KURYERLAR</div>
                            <div id="activeCouriersCount" style="font-weight:900; font-size:1.1rem;">0</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:14px;">
                            <div style="font-size:0.6rem; opacity:0.6;">SO'ROVLAR</div>
                            <div id="totalRequestsCount" style="font-weight:900; font-size:1.1rem;">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bot Terminal Logs -->
            <div class="card" style="background:#020617; border-radius:28px; border:1px solid #1e293b; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.2);">
                <div style="padding:15px 25px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                    <div style="color:#94a3b8; font-family:monospace; font-size:0.75rem; font-weight:700;">
                        <i class="fas fa-terminal" style="margin-right:8px;"></i> SYSTEM_LOGS.EXE
                    </div>
                    <button style="background:none; border:none; color:#64748b; cursor:pointer;" onclick="clearBotLogs()"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div id="botTerminalLogs" style="flex:1; padding:20px; overflow-y:auto; font-family:'Fira Code', monospace; font-size:0.8rem; line-height:1.6;">
                    <!-- Logs go here -->
                </div>
            </div>
        </div>
    `;

    renderLogs();
    updateBotStats();
}

async function updateBotStats() {
    const { count: cCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'courier').eq('active_status', true);
    document.getElementById('activeCouriersCount')!.innerText = (cCount || 0).toString();
}

(window as any).toggleBotPolling = () => {
    if(!activeBotToken) return showToast("Iltimos, avval sozlamalardan Bot Tokenni kiriting!");
    
    if(isPolling) {
        isPolling = false;
        addBotLog('SYS', 'Engine to\'xtatildi.');
    } else {
        isPolling = true;
        addBotLog('SYS', 'Engine ishga tushirildi. Polling boshlandi...');
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
            addBotLog('ERR', 'Polling xatosi: ' + e.message);
        }
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handleBotUpdate(update: any) {
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
        sendMessage(chatId, `Assalomu alaykum, <b>${from}</b>!\n\nID: <code>${chatId}</code>\nUshbu ID ni ilovadagi profil tahrirlash qismiga kiriting.`, menu);
    } else if (text === "🟢 Ishga tushish") {
        await supabase.from('profiles').update({ active_status: true, telegram_id: chatId }).eq('telegram_id', chatId);
        sendMessage(chatId, "🟢 Siz <b>ONLAYN</b> holatdasiz. Yangi buyurtmalar kutavering!", menu);
    } else if (text === "🔴 Dam olish") {
        await supabase.from('profiles').update({ active_status: false }).eq('telegram_id', chatId);
        sendMessage(chatId, "🔴 Siz <b>OFFLINE</b> holatdasiz. Dam oling.", menu);
    }

    if (data && data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        addBotLog('SYS', `Order #${orderId} accept request from ${from}`);
        
        const { data: courier } = await supabase.from('profiles').select('id').eq('telegram_id', chatId).single();
        if(courier) {
            const { error } = await supabase.from('orders').update({ 
                courier_id: courier.id, 
                status: 'delivering' 
            }).eq('id', orderId).is('courier_id', null);

            if(!error) {
                sendMessage(chatId, `✅ <b>Buyurtma #ORD-${orderId} qabul qilindi!</b>\n\nIlovada manzillar bilan tanishib yo'lga chiqing.`);
                addBotLog('SYS', `Order #${orderId} assigned to ${from}`);
            } else {
                sendMessage(chatId, `❌ Xatolik: Buyurtma allaqachon boshqa kuryer tomonidan olingan bo'lishi mumkin.`);
            }
        }
    }
}

async function sendMessage(chatId: number, text: string, markup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: markup })
        });
        addBotLog('OUT', `To ${chatId}: ${text.substring(0, 30)}...`);
    } catch(e) {}
}

function setupOrderListener() {
    if(orderListener) supabase.removeChannel(orderListener);
    orderListener = supabase.channel('order_events')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') {
                addBotLog('SYS', `Yangi buyurtma keldi (#ORD-${payload.new.id}). Kuryerlarni qidirish...`);
                notifyCouriers(payload.new);
            }
        })
        .subscribe();
}

async function notifyCouriers(order: any) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    
    if(!couriers || couriers.length === 0) {
        addBotLog('WARN', 'Hozirda onlayn kuryerlar yo\'q.');
        return;
    }

    const text = `📦 <b>YANGI BUYURTMA! #ORD-${order.id}</b>\n\n💰 Summa: <b>${order.total_price.toLocaleString()} so'm</b>\n📍 Manzil: ${order.address_text}\n🚲 Yetkazish haqi: ${order.delivery_cost.toLocaleString()} so'm`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };
    
    couriers.forEach(c => {
        if(c.telegram_id) sendMessage(c.telegram_id, text, markup);
    });
    updateBotStats();
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
