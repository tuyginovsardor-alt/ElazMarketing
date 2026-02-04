
import { supabase, showToast } from "./index.tsx";
import { sendMessage, editMessage, answerCallback } from "./botAPI.tsx";
import { USER_MENU, COURIER_MENU, handleUserActions, handleCourierActions } from "./botHandlers.tsx";

let botInstances: any[] = [];
let activeBotIndex = 0;
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;
const logs: {time: string, type: string, msg: string}[] = [];

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    const { data: bots } = await supabase.from('bot_configs').select('*').eq('is_active', true);
    botInstances = bots || [];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:25px; height: calc(100vh - 200px);">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:20px; border-radius:24px; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:0.9rem; margin-bottom:15px; color:var(--gray);">BOT ENGINE v3.5</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${botInstances.map((bot, idx) => `
                            <div style="padding:15px; border-radius:18px; border:2px solid ${activeBotIndex === idx ? 'var(--primary)' : '#f1f5f9'}; background:white;">
                                <div style="font-weight:900;">${bot.bot_name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card" style="padding:20px; border-radius:24px; background:white; flex:1;">
                    <button class="btn ${isPolling ? 'btn-outline' : 'btn-primary'}" style="width:100%;" onclick="toggleBotPolling()">
                        ${isPolling ? 'TO\'XTATISH' : 'ISHGA TUSHIRISH'}
                    </button>
                    <div id="botStatusIndicator" style="margin-top:15px; text-align:center; font-size:0.7rem; font-weight:800;">
                        ${isPolling ? '<span style="color:var(--primary);">● ONLINE</span>' : '<span style="color:var(--danger);">○ OFFLINE</span>'}
                    </div>
                </div>
            </div>

            <div class="card" style="background:#020617; border-radius:28px; display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:15px 25px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#94a3b8; font-family:monospace; font-size:0.7rem;">ELAZ_TRAFFIC_MONITOR.LOG</span>
                    <button style="background:none; border:none; color:#64748b;" onclick="clearBotLogs()"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div id="botTerminalLogs" style="flex:1; padding:20px; overflow-y:auto; font-family:monospace; font-size:0.75rem; color:#cbd5e1;"></div>
            </div>
        </div>
    `;
    renderLogs();
}

(window as any).toggleBotPolling = () => {
    const currentBot = botInstances[activeBotIndex];
    if(isPolling) {
        isPolling = false;
        if(orderListener) supabase.removeChannel(orderListener);
    } else {
        isPolling = true;
        startPollingLoop(currentBot.token);
        setupRealtimeOrderListener(currentBot.token);
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
                    await routeUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch(e) {}
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function routeUpdate(update: any, token: string) {
    const msg = update.message;
    const callback = update.callback_query;

    if (callback) {
        await handleBotCallback(callback, token);
        return;
    }

    if (!msg || !msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text;

    addBotLog('IN', `${msg.from.first_name}: ${text}`);

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    if (text === "/start") {
        if (!profile) {
            await sendMessage(chatId, `Xush kelibsiz! Ilovada ro'yxatdan o'ting va ID ni kiriting: <code>${chatId}</code>`, token, {
                inline_keyboard: [[{ text: "🌐 SAYTGA O'TISH", url: "https://elaz-marketing.vercel.app" }]]
            });
        } else {
            const menu = profile.role === 'courier' ? COURIER_MENU : USER_MENU;
            await sendMessage(chatId, `Xush kelibsiz, <b>${profile.first_name}</b>!`, token, menu);
        }
        return;
    }

    if (profile) {
        if (profile.role === 'courier') await handleCourierActions(chatId, text, token, profile);
        else await handleUserActions(chatId, text, token, profile);
    }
}

async function handleBotCallback(callback: any, token: string) {
    const data = callback.data;
    const fromId = callback.from.id;

    if (data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        const { data: courier } = await supabase.from('profiles').select('*').eq('telegram_id', fromId).single();
        
        if (courier?.role === 'courier') {
            const { data: order } = await supabase.from('orders').update({ courier_id: courier.id, status: 'delivering' }).eq('id', orderId).is('courier_id', null).select().single();
            
            if (order) {
                await answerCallback(callback.id, "Buyurtma qabul qilindi! ✅", token);
                await editMessage(callback.message.chat.id, callback.message.message_id, `✅ <b>#ORD-${orderId} SIZDA!</b>\n\nManzil: ${order.address_text}`, token);
            } else {
                await answerCallback(callback.id, "Xato: Buyurtma band qilingan.", token);
            }
        }
    }
}

function setupRealtimeOrderListener(token: string) {
    orderListener = supabase.channel('orders')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') notifyCouriers(payload.new, token);
        }).subscribe();
}

async function notifyCouriers(order: any, token: string) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if (!couriers?.length) return;

    const text = `📦 <b>YANGI BUYURTMA!</b>\n\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n📍 Manzil: ${order.address_text}`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };

    for(const c of couriers) {
        if(c.telegram_id) await sendMessage(c.telegram_id, text, token, markup);
    }
}

function addBotLog(type: string, msg: string) {
    logs.unshift({ time: new Date().toLocaleTimeString(), type, msg });
    if(logs.length > 50) logs.pop();
    renderLogs();
}

function renderLogs() {
    const term = document.getElementById('botTerminalLogs');
    if(!term) return;
    term.innerHTML = logs.map(l => `<div style="margin-bottom:4px;"><span style="color:#475569;">[${l.time}]</span> <b>${l.type}:</b> ${l.msg}</div>`).join('');
}
