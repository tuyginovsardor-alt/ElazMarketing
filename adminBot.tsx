
import { supabase, showToast } from "./index.tsx";

export async function renderAdminBot() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px; height: calc(100vh - 200px);">
            <!-- TOKEN QO'SHISH -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:25px; border-radius:28px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-key" style="color:var(--primary);"></i> Token Qo'shish
                    </h3>
                    <p style="font-size:0.7rem; color:var(--gray); margin-bottom:15px; font-weight:700; line-height:1.4;">
                        BotFather dan olingan HTTP API tokenni kiriting. Tizim avtomatik botni tekshiradi.
                    </p>
                    
                    <label style="font-size:0.7rem; font-weight:800; color:var(--gray); margin-bottom:8px; display:block;">BOT NOMI (ICHKI NOM)</label>
                    <input type="text" id="botNameInput" placeholder="Asosiy Bot" style="height:54px; margin-bottom:15px;">
                    
                    <label style="font-size:0.7rem; font-weight:800; color:var(--gray); margin-bottom:8px; display:block;">TG BOT TOKEN</label>
                    <input type="text" id="botTokenInput" placeholder="782345678:AAH..." style="height:54px; margin-bottom:20px;">
                    
                    <button id="btnSaveBot" class="btn btn-primary" style="width:100%; height:55px;" onclick="window.saveNewBotToken()">
                        TEKSHIRISH VA SAQLASH <i class="fas fa-save" style="margin-left:8px;"></i>
                    </button>
                </div>

                <div class="card" style="padding:25px; border-radius:28px; background:var(--dark); color:white; border:none;">
                    <h3 style="font-weight:900; font-size:0.85rem; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                        Bot Engine Loglari
                        <span style="font-size:0.6rem; color:var(--primary); font-weight:900;">ACTIVE POLLING</span>
                    </h3>
                    <div id="botLogs" style="font-family:monospace; font-size:0.65rem; color:#94a3b8; height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:15px; border-radius:15px; line-height:1.6;">
                        <div style="color:var(--primary);">[System] Bot boshqaruv paneli tayyor.</div>
                        <div>[System] Supabase Realtime ulanmoqda...</div>
                    </div>
                </div>
            </div>

            <!-- TOKENLAR RO'YXATI -->
            <div class="card" style="padding:25px; border-radius:28px; background:white; border:none; box-shadow:var(--shadow-sm); overflow-y:auto;">
                <h3 style="font-weight:900; font-size:1rem; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                    Barcha Tokenlar
                    <i class="fas fa-sync-alt" onclick="window.loadBotTokens()" style="cursor:pointer; font-size:0.8rem; color:var(--gray);"></i>
                </h3>
                <div id="botTokensList" style="display:flex; flex-direction:column; gap:15px;">
                    <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i></div>
                </div>
            </div>
        </div>
    `;

    loadBotTokens();
}

async function loadBotTokens() {
    const listEl = document.getElementById('botTokensList');
    if(!listEl) return;

    const { data: tokens } = await supabase.from('bot_configs').select('*').order('created_at', { ascending: false });

    if(!tokens?.length) {
        listEl.innerHTML = `<div style="text-align:center; color:var(--gray); font-weight:700; padding:4rem;">Tokenlar topilmadi.</div>`;
        return;
    }

    listEl.innerHTML = tokens.map(t => `
        <div style="padding:20px; border:2.5px solid ${t.is_active ? 'var(--primary)' : '#f1f5f9'}; border-radius:24px; background:${t.is_active ? 'var(--primary-light)' : 'white'}; position:relative; transition:0.3s;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="font-weight:900; font-size:0.95rem; color:var(--text);">${t.name || 'Nomsiz Bot'}</div>
                        ${t.username ? `<span style="font-size:0.65rem; color:var(--primary); font-weight:800; background:white; padding:2px 8px; border-radius:6px; border:1px solid var(--primary);">@${t.username}</span>` : ''}
                    </div>
                    <div style="font-size:0.6rem; color:var(--gray); font-family:monospace; margin-top:8px; word-break:break-all; opacity:0.6;">${t.token}</div>
                </div>
                ${t.is_active ? 
                    `<span style="background:var(--primary); color:white; padding:5px 12px; border-radius:10px; font-size:0.6rem; font-weight:900;">AKTIV</span>` : 
                    `<button class="btn btn-outline" style="height:35px; font-size:0.65rem; padding:0 15px; border-radius:10px;" onclick="window.activateBotToken(${t.id})">YOQISH</button>`
                }
            </div>
            <div style="margin-top:15px; display:flex; justify-content:flex-end; gap:10px;">
                <button class="btn" style="width:35px; height:35px; border-radius:10px; background:#fee2e2; color:var(--danger); padding:0; border:none;" onclick="window.deleteBotToken(${t.id})">
                    <i class="fas fa-trash-alt" style="font-size:0.8rem;"></i>
                </button>
            </div>
        </div>
    `).join('');
}
(window as any).loadBotTokens = loadBotTokens;

(window as any).saveNewBotToken = async () => {
    const name = (document.getElementById('botNameInput') as HTMLInputElement).value.trim();
    const token = (document.getElementById('botTokenInput') as HTMLInputElement).value.trim();
    const btn = document.getElementById('btnSaveBot') as HTMLButtonElement;

    if(!name || !token) return showToast("Barcha maydonlarni to'ldiring!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> TEKSHIRILMOQDA...';

    try {
        // Telegram API orqali botni tekshirish
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const botData = await res.json();

        if(!botData.ok) throw new Error("Token noto'g'ri yoki Telegramga ulanib bo'lmadi");

        const username = botData.result.username;

        const { error } = await supabase.from('bot_configs').insert({ 
            name, 
            token, 
            username,
            is_active: false 
        });
        
        if(error) throw error;
        
        showToast(`Bot @${username} muvaffaqiyatli saqlandi! ✅`);
        loadBotTokens();
        (document.getElementById('botNameInput') as HTMLInputElement).value = "";
        (document.getElementById('botTokenInput') as HTMLInputElement).value = "";
    } catch(e: any) {
        showToast("Xato: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'TEKSHIRISH VA SAQLASH <i class="fas fa-save" style="margin-left:8px;"></i>';
    }
};

(window as any).activateBotToken = async (id: number) => {
    try {
        showToast("Almashtirilmoqda...");
        // Barchasini o'chirish
        await supabase.from('bot_configs').update({ is_active: false }).neq('id', -1);
        // Tanlanganini yoqish
        await supabase.from('bot_configs').update({ is_active: true }).eq('id', id);
        
        showToast("Yangi bot ishga tushdi! 🚀");
        loadBotTokens();
        
        const logs = document.getElementById('botLogs');
        if(logs) {
            logs.innerHTML += `<div style="color:var(--primary); margin-top:5px;">[${new Date().toLocaleTimeString()}] Bot switching complete. New token injected.</div>`;
            logs.scrollTop = logs.scrollHeight;
        }
    } catch(e: any) {
        showToast("Xato!");
    }
};

(window as any).deleteBotToken = async (id: number) => {
    if(!confirm("Token o'chirilsinmi?")) return;
    await supabase.from('bot_configs').delete().eq('id', id);
    loadBotTokens();
};
