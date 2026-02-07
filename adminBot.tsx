
import { supabase, showToast } from "./index.tsx";

export async function renderAdminBot() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px; height: calc(100vh - 200px);">
            <!-- TOKEN QO'SHISH VA HOLAT -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="padding:25px; border-radius:28px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-key" style="color:var(--primary);"></i> Token Qo'shish
                    </h3>
                    <label style="font-size:0.7rem; font-weight:800; color:var(--gray); margin-bottom:8px; display:block;">BOT NOMI (Masalan: @elaz_bot)</label>
                    <input type="text" id="botNameInput" placeholder="@elaz_delivery_bot" style="height:54px; margin-bottom:15px;">
                    
                    <label style="font-size:0.7rem; font-weight:800; color:var(--gray); margin-bottom:8px; display:block;">TG BOT TOKEN</label>
                    <input type="text" id="botTokenInput" placeholder="000000000:AA..." style="height:54px; margin-bottom:20px;">
                    
                    <button class="btn btn-primary" style="width:100%; height:55px;" onclick="saveNewBotToken()">
                        TOKENNI SAQLASH <i class="fas fa-save"></i>
                    </button>
                </div>

                <div class="card" style="padding:25px; border-radius:28px; background:var(--dark); color:white; border:none;">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:15px;">Bot Loglari</h3>
                    <div id="botLogs" style="font-family:monospace; font-size:0.7rem; color:#94a3b8; height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:15px; border-radius:15px;">
                        [System] Bot boshqaruv paneli tayyor.
                    </div>
                </div>
            </div>

            <!-- TOKENLAR RO'YXATI -->
            <div class="card" style="padding:25px; border-radius:28px; background:white; border:none; box-shadow:var(--shadow-sm); overflow-y:auto;">
                <h3 style="font-weight:900; font-size:1rem; margin-bottom:20px;">Barcha Tokenlar</h3>
                <div id="botTokensList" style="display:flex; flex-direction:column; gap:15px;">
                    <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                </div>
            </div>
        </div>
    `;

    loadBotTokens();
}

async function loadBotTokens() {
    const listEl = document.getElementById('botTokensList');
    if(!listEl) return;

    const { data: tokens, error } = await supabase.from('bot_configs').select('*').order('created_at', { ascending: false });

    if(error || !tokens?.length) {
        listEl.innerHTML = `<div style="text-align:center; color:var(--gray); font-weight:700; padding:2rem;">Tokenlar topilmadi.</div>`;
        return;
    }

    listEl.innerHTML = tokens.map(t => `
        <div style="padding:20px; border:2px solid ${t.is_active ? 'var(--primary)' : '#f1f5f9'}; border-radius:22px; background:${t.is_active ? 'var(--primary-light)' : 'white'}; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-weight:900; font-size:0.95rem; color:var(--text);">${t.name || 'Nomsiz Bot'}</div>
                    <div style="font-size:0.65rem; color:var(--gray); font-family:monospace; margin-top:5px; word-break:break-all;">${t.token}</div>
                </div>
                ${t.is_active ? 
                    `<span style="background:var(--primary); color:white; padding:4px 10px; border-radius:10px; font-size:0.6rem; font-weight:900;">AKTIV</span>` : 
                    `<button class="btn btn-outline" style="height:32px; font-size:0.6rem; padding:0 12px;" onclick="activateBotToken(${t.id})">YOQISH</button>`
                }
            </div>
            <div style="margin-top:15px; display:flex; justify-content:flex-end; gap:10px;">
                <button class="btn" style="width:32px; height:32px; background:#fee2e2; color:var(--danger); padding:0; border:none;" onclick="deleteBotToken(${t.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

(window as any).saveNewBotToken = async () => {
    const name = (document.getElementById('botNameInput') as HTMLInputElement).value.trim();
    const token = (document.getElementById('botTokenInput') as HTMLInputElement).value.trim();

    if(!name || !token) return showToast("Barcha maydonlarni to'ldiring!");

    try {
        const { error } = await supabase.from('bot_configs').insert({ name, token, is_active: false });
        if(error) throw error;
        showToast("Token saqlandi! ✅");
        loadBotTokens();
        (document.getElementById('botNameInput') as HTMLInputElement).value = "";
        (document.getElementById('botTokenInput') as HTMLInputElement).value = "";
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
};

(window as any).activateBotToken = async (id: number) => {
    try {
        // Hamma tokenlarni o'chirish
        await supabase.from('bot_configs').update({ is_active: false }).neq('id', -1);
        // Tanlanganini yoqish
        await supabase.from('bot_configs').update({ is_active: true }).eq('id', id);
        
        showToast("Bot almashtirildi! 🚀");
        loadBotTokens();
        const logs = document.getElementById('botLogs');
        if(logs) logs.innerHTML += `<div>[${new Date().toLocaleTimeString()}] New bot activated. Switching engine...</div>`;
    } catch(e: any) {
        showToast("Xato!");
    }
};

(window as any).deleteBotToken = async (id: number) => {
    if(!confirm("Token o'chirilsinmi?")) return;
    await supabase.from('bot_configs').delete().eq('id', id);
    loadBotTokens();
};
