
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

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i><p style="margin-top:10px; font-weight:800;">ELAZ ENGINE STARTING...</p></div>`;

    const { data: bots } = await supabase.from('bot_configs').select('*').eq('is_active', true);
    botInstances = bots || [];

    if (botInstances.length === 0) {
        container.innerHTML = `
            <div style="max-width:500px; margin: 0 auto; padding: 40px; background:white; border-radius:30px; box-shadow:var(--shadow-sm); text-align:center;">
                <i class="fas fa-robot fa-3x" style="color:var(--primary); margin-bottom:20px;"></i>
                <h2 style="font-weight:900;">Bot topilmadi</h2>
                <p style="color:var(--gray); margin-bottom:20px;">Iltimos, avval Sozlamalar bo'limida bot tokenini kiriting.</p>
                <button class="btn btn-primary" style="width:100%;" onclick="switchAdminTab('settings')">SOZLAMALARGA O'TISH</button>
            </div>
        `;
        return;
    }

    const currentBot = botInstances[activeBotIndex];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:25px; height: calc(100vh - 200px);">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:0.9rem; margin-bottom:15px; color:var(--gray);">FAOL BOTLAR</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${botInstances.map((bot, idx) => `
                            <div onclick="switchBotInstance(${idx})" style="padding:15px; border-radius:18px; border:2px solid ${activeBotIndex === idx ? 'var(--primary)' : '#f1f5f9'}; background:${activeBotIndex === idx ? 'var(--primary-light)' : 'white'}; cursor:pointer;">
                                <div style="font-weight:900; font-size:0.8rem;">${bot.bot_name}</div>
                                <div style="font-size:0.6rem; color:var(--gray);">v3.0 Ultra • Running</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm); flex:1;">
                    <h4 style="font-weight:900; font-size:0.8rem; margin-bottom:15px;">ENGINE STATUS</h4>
                    <button class="btn ${isPolling ? 'btn-outline' : 'btn-primary'}" style="width:100%; height:55px;" onclick="toggleBotPolling()">
                        ${isPolling ? '<i class="fas fa-stop-circle"></i> TO\'XTATISH' : '<i class="fas fa-play-circle"></i> ISHGA TUSHIRISH'}
                    </button>
                    <p style="margin-top:15px; font-size:0.65rem; color:var(--gray); text-align:center; font-weight:700;">
                        ${isPolling ? 'Bot hozirda real-vaqt rejimida buyurtmalarni kuzatmoqda va mijozlarga xizmat ko\'rsatmoqda.' : 'Bot to\'xtatilgan. Buyurtma bildirishnomalari yuborilmaydi.'}
                    </p>
                </div>
            </div>

            <div class="card" style="background:#020617; border-radius:28px; border:1px solid #1e293b; display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:15px 25px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#94a3b8; font-family:monospace; font-size:0.7rem; font-weight:700;">TRAFFIC_MONITOR.LOG</span>
                    <button style="background:none; border:none; color:#64748b; cursor:pointer;" onclick="clearBotLogs()"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div id="botTerminalLogs" style="flex:1; padding:20px; overflow-y:auto; font-family:'Fira Code', monospace; font-size:0.75rem; line-height:1.6; color:#cbd5e1;">
                    <div style="color:#475569;">[SYSTEM] Bot kernel initialized. Ready to poll.</div>
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
    if(isPolling) {
        isPolling = false;
        if(orderListener) supabase.removeChannel(orderListener);
        addBotLog('SYS', 'Engine manually stopped.');
    } else {
        isPolling = true;
        addBotLog('SYS', `Engine [${currentBot.bot_name}] started.`);
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
                    await handleBotUpdate(u, token);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch(e) {}
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handleBotUpdate(update: any, token: string) {
    const msg = update.message;
    const callback = update.callback_query;

    if (callback) {
        await handleCallbackQuery(callback, token);
        return;
    }

    if(!msg || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const from = msg.from.first_name;

    addBotLog('IN', `${from}: ${text}`);

    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    if (text === "/start") {
        if (!profile) {
            await sendMessage(chatId, `Assalomu alaykum, <b>${from}</b>!\n\nSiz hali tizimda ro'yxatdan o'tmadingiz. Ilovamizga kiring va Profil qismida ushbu ID ni kiriting: <code>${chatId}</code>`, token, {
                inline_keyboard: [[{ text: "🌐 ILOVANI OCHISH", url: "https://elaz-marketing.vercel.app" }]]
            });
        } else {
            if (profile.role === 'courier') {
                await sendCourierMenu(chatId, from, token, profile);
            } else {
                await sendUserMenu(chatId, from, token);
            }
        }
    } else if (profile?.role === 'courier') {
        if (text === "🟢 Ishga tushish") {
            await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
            await sendMessage(chatId, "🟢 <b>ONLAYN.</b> Yangi buyurtmalarni kutavering!", token);
        } else if (text === "🔴 Dam olish") {
            await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
            await sendMessage(chatId, "🔴 <b>OFFLINE.</b> Dam oling!", token);
        } else if (text === "👤 Profil") {
            await sendMessage(chatId, `👤 <b>KURER MA'LUMOTLARI:</b>\n\nIsm: ${profile.first_name}\nBalans: ${profile.balance.toLocaleString()} UZS\nReyting: ⭐ ${profile.rating || 5.0}`, token);
        }
    } else if (profile?.role === 'user') {
        if (text === "🛒 Savatim") {
            await sendMessage(chatId, "Sizning savatingizdagi mahsulotlarni ilovadan ko'rishingiz mumkin.", token, {
                inline_keyboard: [[{ text: "🛒 SAVATNI KO'RISH", url: "https://elaz-marketing.vercel.app/view=cart" }]]
            });
        } else if (text === "🛵 Kuryer bo'lish") {
            await sendMessage(chatId, "Kuryerlikka ariza berish uchun ilovadagi Profil bo'limiga o'ting.", token, {
                inline_keyboard: [[{ text: "🛵 ARIZA BERISH", url: "https://elaz-marketing.vercel.app/view=profile" }]]
            });
        } else if (text === "🏢 Saytni ochish") {
            await sendMessage(chatId, "ELAZ MARKET platformasining rasmiy sayti:", token, {
                inline_keyboard: [[{ text: "🌐 SAYTNI OCHISH", url: "https://elaz-marketing.vercel.app" }]]
            });
        }
    }
}

async function handleCallbackQuery(callback: any, token: string) {
    const chatId = callback.message.chat.id;
    const data = callback.data;
    const fromId = callback.from.id;

    if (data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        
        // Kurer profilini olish
        const { data: courier } = await supabase.from('profiles').select('*').eq('telegram_id', fromId).single();
        
        if (!courier || courier.role !== 'courier') {
            await answerCallbackQuery(callback.id, "Siz kurer emassiz!", token);
            return;
        }

        // Buyurtmani band qilish
        const { data: order, error } = await supabase.from('orders')
            .update({ courier_id: courier.id, status: 'delivering' })
            .eq('id', orderId)
            .is('courier_id', null)
            .select()
            .single();

        if (error || !order) {
            await answerCallbackQuery(callback.id, "Kechikdingiz! Buyurtma allaqachon olingan.", token);
            await editMessageText(chatId, callback.message.message_id, "❌ Ushbu buyurtma allaqachon olingan.", token);
        } else {
            await answerCallbackQuery(callback.id, "Muvaffaqiyatli qabul qilindi! ✅", token);
            await editMessageText(chatId, callback.message.message_id, `✅ <b>BUYURTMA #ORD-${orderId} QABUL QILINDI</b>\n\nManzil: ${order.address_text}\nTel: ${order.phone_number}`, token);
            addBotLog('SYS', `Order #${orderId} accepted by ${courier.first_name}`);
        }
    }
}

function setupRealtimeOrderListener(token: string) {
    orderListener = supabase.channel('order_monitor')
        .on('postgres_changes', { event: 'INSERT', table: 'orders' }, payload => {
            if(payload.new.status === 'confirmed') {
                notifyOnlineCouriers(payload.new, token);
            }
        })
        .subscribe();
}

async function notifyOnlineCouriers(order: any, token: string) {
    const { data: couriers } = await supabase.from('profiles').select('telegram_id').eq('role', 'courier').eq('active_status', true);
    
    if (!couriers || couriers.length === 0) {
        addBotLog('WARN', 'New order, but no online couriers found.');
        return;
    }

    const text = `📦 <b>YANGI BUYURTMA! #ORD-${order.id}</b>\n\n💰 Summa: ${order.total_price.toLocaleString()} UZS\n📍 Manzil: ${order.address_text}\n🛵 Dostavka: ${order.delivery_cost.toLocaleString()} UZS`;
    const markup = {
        inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }]]
    };

    for(const c of couriers) {
        if(c.telegram_id) await sendMessage(c.telegram_id, text, token, markup);
    }
    addBotLog('SYS', `New order notification sent to ${couriers.length} couriers.`);
}

async function sendCourierMenu(chatId: number, name: string, token: string, p: any) {
    const text = `🚛 <b>KURER DASHBOARD</b>\n\nXush kelibsiz, <b>${name}</b>!\nHolatingiz: ${p.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}\nBalans: ${p.balance.toLocaleString()} UZS`;
    const markup = {
        keyboard: [[{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }], [{ text: "📦 Buyurtmalar" }, { text: "👤 Profil" }]],
        resize_keyboard: true
    };
    await sendMessage(chatId, text, token, markup);
}

async function sendUserMenu(chatId: number, name: string, token: string) {
    const text = `🛒 <b>ELAZ MARKET MIJOZI</b>\n\nXush kelibsiz, <b>${name}</b>!\nPlatformamiz orqali qulay xaridlar qiling.`;
    const markup = {
        keyboard: [[{ text: "🛒 Savatim" }, { text: "🏢 Saytni ochish" }], [{ text: "🛵 Kuryer bo'lish" }, { text: "👤 Profil" }]],
        resize_keyboard: true
    };
    await sendMessage(chatId, text, token, markup);
}

async function sendMessage(chatId: number, text: string, token: string, markup: any = {}) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: markup })
    });
}

async function editMessageText(chatId: number, messageId: number, text: string, token: string) {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' })
    });
}

async function answerCallbackQuery(callbackId: string, text: string, token: string) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: true })
    });
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
