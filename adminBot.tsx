
import { supabase, showToast } from "./index.tsx";

const BOT_TOKEN = '8286953925:AAFvDeDbdNzCD7g8Jg72QVK3qNbVFBWHqP0';
const WEBSITE_URL = 'https://elazmarket.vercel.app';
let isPolling = false;
let lastUpdateId = 0;

// Foydalanuvchi holatlari (Session)
const userSessions: Record<number, { 
    step: string, 
    data: any, 
    cart: any[],
    history: string[] 
}> = {};

export async function renderAdminBot() {
    const container = document.getElementById('admin_tab_bot');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:25px; height: calc(100vh - 180px);">
            <!-- LOG TERMINAL -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="background:#020617; color:#10b981; font-family:'Fira Code', monospace; padding:20px; border-radius:24px; flex:1; display:flex; flex-direction:column; box-shadow:0 15px 35px rgba(0,0,0,0.3); border:1px solid #1e293b; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1e293b; padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div id="botStatusPulse" style="width:10px; height:10px; background:${isPolling ? '#10b981' : '#64748b'}; border-radius:50%; ${isPolling ? 'animation: pulse 2s infinite;' : ''}"></div>
                            <span style="font-weight:900; color:white; font-size:0.8rem;">ELAZ BOT CORE v3.0</span>
                        </div>
                        <button class="btn" id="btnToggleBot" style="height:30px; font-size:0.6rem; background:${isPolling ? 'var(--danger)' : 'var(--primary)'}; color:white; width:auto; padding:0 15px; border-radius:8px; border:none;" onclick="toggleBotEngine()">
                            ${isPolling ? 'STOP ENGINE' : 'START ENGINE'}
                        </button>
                    </div>
                    <div id="botLogsContainer" style="flex:1; overflow-y:auto; font-size:0.75rem; line-height:1.6;">
                        <div style="color:#64748b;">[${new Date().toLocaleTimeString()}] System ready. Press START to begin polling.</div>
                    </div>
                </div>
            </div>

            <!-- ANALYTICS & QUICK ACTIONS -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:24px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; margin-bottom:15px;">Bot Analitikasi</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div style="background:#f8fafc; padding:15px; border-radius:18px;">
                            <div style="font-size:0.6rem; font-weight:800; color:var(--gray);">FAOL SESSIONS</div>
                            <div id="statSessions" style="font-size:1.4rem; font-weight:900; color:var(--primary);">0</div>
                        </div>
                        <div style="background:#f8fafc; padding:15px; border-radius:18px;">
                            <div style="font-size:0.6rem; font-weight:800; color:var(--gray);">BUGUNGI ARIZALAR</div>
                            <div id="statApps" style="font-size:1.4rem; font-weight:900; color:var(--primary);">0</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="border-radius:24px; padding:25px; background:var(--gradient); color:white; border:none;">
                    <h4 style="font-weight:900;">Tezkor Havola</h4>
                    <p style="font-size:0.75rem; opacity:0.8; margin-bottom:15px;">Botni Telegramda ochish:</p>
                    <a href="https://t.me/elaz_market_bot" target="_blank" style="display:block; background:rgba(255,255,255,0.2); padding:12px; border-radius:12px; text-align:center; color:white; text-decoration:none; font-weight:800; font-size:0.8rem;">@elaz_market_bot</a>
                </div>
            </div>
        </div>
    `;
    if(isPolling) startPollingLoop();
}

// Bot Logikasining asosi
async function handleBotUpdate(update: any) {
    const msg = update.message || update.callback_query?.message;
    if(!msg) return;
    const chatId = msg.chat.id;
    const text = update.message?.text;
    const data = update.callback_query?.data;

    if(!userSessions[chatId]) {
        userSessions[chatId] = { step: 'start', data: {}, cart: [], history: [] };
    }
    const session = userSessions[chatId];

    // Global buyruqlar
    if(text === '/start' || text === '❌ Bekor qilish') {
        session.step = 'main_menu';
        return sendWelcome(chatId);
    }

    if(text === '⬅️ Orqaga') {
        const lastStep = session.history.pop() || 'main_menu';
        session.step = lastStep;
        // Orqaga qaytganda tegishli menyuni chiqarish
        if(lastStep === 'main_menu') return sendWelcome(chatId);
    }

    // STATE MACHINE
    switch(session.step) {
        case 'main_menu':
            if(text === '🔑 Kirish') {
                session.step = 'login_email';
                session.history.push('main_menu');
                return sendMessage(chatId, "📧 <b>Kirish:</b> Gmail manzilingizni yuboring:", keyboards.back);
            }
            if(text === '📝 Ro\'yxatdan o\'tish') {
                session.step = 'reg_email';
                session.history.push('main_menu');
                return sendMessage(chatId, "📩 <b>Ro'yxatdan o'tish:</b> Gmail manzilingizni yuboring:", keyboards.back);
            }
            if(text === '📦 Maxsulotlar') return sendProducts(chatId);
            if(text === '🛒 Savatim') return sendCart(chatId);
            if(text === '🛵 Kuryerlikka ariza') {
                session.step = 'courier_name';
                session.history.push('main_menu');
                return sendMessage(chatId, "👤 <b>Kurerlikka ariza:</b> Ism va familiyangizni kiriting:", keyboards.back);
            }
            if(text === '🌐 Saytga o\'tish') {
                return sendMessage(chatId, "ELAZ MARKET veb-versiyasiga o'tish uchun quyidagi tugmani bosing:", {
                    inline_keyboard: [[{ text: "Saytni ochish 🌍", url: WEBSITE_URL }]]
                });
            }
            break;

        case 'login_email':
            session.data.email = text;
            session.step = 'login_pass';
            return sendMessage(chatId, "🔐 Parolingizni kiriting:", keyboards.back);

        case 'login_pass':
            return handleLogin(chatId, session.data.email, text);

        case 'reg_email':
            session.data.email = text;
            session.step = 'reg_name';
            return sendMessage(chatId, "👤 Ism va familiyangizni kiriting:", keyboards.back);

        case 'reg_name':
            session.data.name = text;
            session.step = 'reg_phone';
            return sendMessage(chatId, "📱 Telefon raqamingizni yuboring yoki yozing:", keyboards.contact);

        case 'reg_phone':
            const phone = update.message.contact?.phone_number || text;
            session.data.phone = phone;
            return handleRegister(chatId, session.data);

        case 'courier_name':
            session.data.courier_name = text;
            session.step = 'courier_transport';
            return sendMessage(chatId, "🚛 Transport turini tanlang:", keyboards.transport);

        case 'courier_transport':
            session.data.transport = text;
            session.step = 'courier_location';
            return sendMessage(chatId, "📍 Hozirgi joylashuvingizni yuboring (Masofa hisoblash uchun):", keyboards.location);
    }

    // Callback Query (Inline tugmalar) handling
    if(data) {
        if(data.startsWith('add_')) {
            const pId = data.split('_')[1];
            session.cart.push(pId);
            return answerCallback(update.callback_query.id, "Savatga qo'shildi! 🛒");
        }
        
        // Fix: Handle cart clearing
        if(data === 'clear_cart') {
            session.cart = [];
            answerCallback(update.callback_query.id, "Savat tozalandi! 🗑");
            return sendMessage(chatId, "🛒 Savatingiz tozalandi.", keyboards.main);
        }
    }
}

// Yordamchi Funksiyalar
async function sendWelcome(chatId: number) {
    const welcomeText = `
👋 <b>ELAZ MARKET tizimiga xush kelibsiz!</b>

Bu yerda siz:
✅ Sifatli mahsulotlarni buyurtma qilishingiz
✅ Kurer sifatida daromad topishingiz
✅ Buyurtmalaringizni kuzatib borishingiz mumkin.

<i>Davom etish uchun quyidagi menyudan foydalaning:</i>
    `;
    return sendMessage(chatId, welcomeText, keyboards.main);
}

const keyboards = {
    main: {
        keyboard: [
            [{ text: "📦 Maxsulotlar" }, { text: "🛒 Savatim" }],
            [{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }],
            [{ text: "🛵 Kuryerlikka ariza" }, { text: "🌐 Saytga o'tish" }]
        ],
        resize_keyboard: true
    },
    back: {
        keyboard: [[{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]],
        resize_keyboard: true
    },
    contact: {
        keyboard: [[{ text: "📱 Kontaktni ulashish", request_contact: true }], [{ text: "⬅️ Orqaga" }]],
        resize_keyboard: true
    },
    location: {
        keyboard: [[{ text: "📍 Joylashuvni yuborish", request_location: true }], [{ text: "⬅️ Orqaga" }]],
        resize_keyboard: true
    },
    transport: {
        keyboard: [[{ text: "🚗 Mashina" }, { text: "🚶 Piyoda" }], [{ text: "⬅️ Orqaga" }]],
        resize_keyboard: true
    }
};

async function sendMessage(chatId: number, text: string, replyMarkup: any = {}) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup })
        });
        addBotLog('out', `To ${chatId}: ${text.substring(0, 40)}...`);
    } catch(e) { console.error(e); }
}

async function answerCallback(id: string, text: string) {
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: id, text })
    });
}

async function handleLogin(chatId: number, email: string, pass: string) {
    addBotLog('sys', `Auth attempt: ${email}`);
    // Supabase login logic...
    sendMessage(chatId, "✅ <b>Muvaffaqiyatli kirdingiz!</b>", keyboards.main);
    userSessions[chatId].step = 'main_menu';
}

async function handleRegister(chatId: number, data: any) {
    // 6 xonali kod logikasi (simulyatsiya)
    sendMessage(chatId, "📩 Emailingizga 6 xonali tasdiqlash kodi yuborildi. Kiriting:", keyboards.back);
    userSessions[chatId].step = 'reg_confirm';
}

async function sendProducts(chatId: number) {
    const { data: prods } = await supabase.from('products').select('*').limit(5);
    if(!prods) return;
    
    for(const p of prods) {
        const text = `<b>${p.name}</b>\n💰 Narxi: ${p.price.toLocaleString()} so'm\n📦 Sklad: ${p.stock_qty} dona`;
        await sendMessage(chatId, text, {
            inline_keyboard: [[{ text: "Savatga qo'shish 🛒", callback_data: `add_${p.id}` }]]
        });
    }
}

// Fix: Implemented missing sendCart function
async function sendCart(chatId: number) {
    const session = userSessions[chatId];
    if(!session || !session.cart || session.cart.length === 0) {
        return sendMessage(chatId, "🛒 <b>Savat bo'sh!</b>\n\nIltimos, mahsulotlar bo'limidan mahsulot tanlang.", keyboards.main);
    }

    const { data: prods } = await supabase.from('products').select('*').in('id', session.cart);
    
    if(!prods || prods.length === 0) {
        return sendMessage(chatId, "🛒 <b>Savat bo'sh!</b>", keyboards.main);
    }

    const counts = session.cart.reduce((acc: any, id: any) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {});

    let text = "<b>🛒 SAVATINGIZDAGI MAHSULOTLAR:</b>\n\n";
    let total = 0;

    for(const p of prods) {
        const qty = counts[p.id];
        const subtotal = p.price * qty;
        total += subtotal;
        text += `🔹 <b>${p.name}</b>\n${qty} x ${p.price.toLocaleString()} = ${subtotal.toLocaleString()} so'm\n\n`;
    }

    text += `➖➖➖➖➖➖➖➖\n<b>JAMI: ${total.toLocaleString()} so'm</b>`;
    
    return sendMessage(chatId, text, {
        inline_keyboard: [
            [{ text: "Savatni tozalash 🗑", callback_data: "clear_cart" }]
        ]
    });
}

// Botni boshqarish
(window as any).toggleBotEngine = () => {
    isPolling = !isPolling;
    renderAdminBot();
    if(isPolling) {
        addBotLog('sys', 'ELAZ BOT ENGINE STARTED...');
        startPollingLoop();
    }
};

async function startPollingLoop() {
    while(isPolling) {
        try {
            const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId}&timeout=20`);
            const d = await r.json();
            if(d.ok && d.result) {
                for(const u of d.result) {
                    await handleBotUpdate(u);
                    lastUpdateId = u.update_id + 1;
                }
            }
        } catch(e) { await new Promise(res => setTimeout(res, 5000)); }
        await new Promise(res => setTimeout(res, 1000));
    }
}

function addBotLog(type: 'in' | 'out' | 'sys', msg: string) {
    const logEl = document.getElementById('botLogsContainer');
    if(!logEl) return;
    const time = new Date().toLocaleTimeString();
    const color = { in: '#10b981', out: '#3b82f6', sys: '#64748b' }[type];
    logEl.innerHTML += `<div style="margin-bottom:4px;"><span style="color:#334155;">[${time}]</span> <span style="color:${color}; font-weight:bold;">${type==='in'?'<<<':'>>>'}</span> ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
}
