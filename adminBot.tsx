
import { supabase } from "./index.tsx";
import { sendMessage } from "./botAPI.tsx";
import { USER_MENU, handleUserMessage, handleUserCallback } from "./userBot.tsx";
import { COURIER_MENU, handleCourierMessage, handleCourierCallback } from "./courierBot.tsx";

let botInstances: any[] = [];
let isPolling = false;
let lastUpdateId = 0;
let orderListener: any = null;

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    const { data: bots } = await supabase.from('bot_configs').select('*').eq('is_active', true);
    botInstances = bots || [];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:25px; height: calc(100vh - 200px);">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:20px; border-radius:24px; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:0.9rem; margin-bottom:15px; color:var(--gray);">BOT ENGINE v5.0</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${botInstances.map((bot) => `
                            <div style="padding:15px; border-radius:18px; border:2px solid var(--primary); background:white;">
                                <div style="font-weight:900; font-size:0.8rem;">${bot.bot_name}</div>
                                <div style="font-size:0.6rem; color:var(--primary); font-weight:800;">STATUS: ON</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card" style="padding:20px; border-radius:24px; background:white; flex:1;">
                    <button class="btn ${isPolling ? 'btn-outline' : 'btn-primary'}" style="width:100%; height:55px;" onclick="toggleBotPolling()">
                        ${isPolling ? '<i class="fas fa-stop"></i> TO\'XTATISH' : '<i class="fas fa-play"></i> ISHGA TUSHIRISH'}
                    </button>
                </div>
            </div>

            <div class="card" style="background:#020617; border-radius:28px; display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:15px 25px; background:rgba(255,255,255,0.03); color:#94a3b8; font-family:monospace; font-size:0.7rem;">MASTER_ROUTER_LOGS.EXE</div>
                <div id="botTerminalLogs" style="flex:1; padding:20px; overflow-y:auto; font-family:monospace; font-size:0.75rem; color:#cbd5e1;"></div>
            </div>
        </div>
    `;
}

(window as any).toggleBotPolling = () => {
    const currentBot = botInstances[0];
    if(!currentBot) return alert("Bot konfiguratsiyasi topilmadi!");

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
    const chatId = msg ? msg.chat.id : (callback ? callback.message.chat.id : null);

    if(!chatId) return;

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    if (callback) {
        if (profile?.role === 'courier') await handleCourierCallback(callback, token, profile);
        else if (profile) await handleUserCallback(callback, token, profile);
        return;
    }

    if (msg && msg.text) {
        const text = msg.text;
        if (text === "/start") {
            if (!profile) {
                await sendMessage(chatId, `Assalomu alaykum! ELAZ MARKET botiga xush kelibsiz. Tizimdan foydalanish uchun ID orqali bog'laning: <code>${chatId}</code>`, token, {
                    inline_keyboard: [[{ text: "🌐 SAYTNI OCHISH", url: "https://elaz-marketing.vercel.app" }]]
                });
            } else {
                const menu = profile.role === 'courier' ? COURIER_MENU : USER_MENU;
                await sendMessage(chatId, `Xush kelibsiz, <b>${profile.first_name}</b>!`, token, menu);
            }
            return;
        }

        if (profile) {
            if (profile.role === 'courier') await handleCourierMessage(chatId, text, token, profile);
            else await handleUserMessage(chatId, text, token, profile);
        }
    }
}

function setupRealtimeOrderListener(token: string) {
    orderListener = supabase.channel('bot_orders')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') notifyCouriers(payload.new, token);
        }).subscribe();
}

async function notifyCouriers(order: any, token: string) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    if (!couriers?.length) return;

    const text = `📦 <b>YANGI BUYURTMA!</b>\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n📍 Manzil: ${order.address_text}`;
    const markup = { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]] };

    for(const c of couriers) {
        if(c.telegram_id) await sendMessage(c.telegram_id, text, token, markup);
    }
}
