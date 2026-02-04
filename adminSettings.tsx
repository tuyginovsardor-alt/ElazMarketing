
import { supabase, showToast } from "./index.tsx";

let tempBots: any[] = [];

export async function renderAdminSettings() {
    const container = document.getElementById('admin_tab_settings');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: settings } = await supabase.from('app_settings').select('*');
    const { data: bots } = await supabase.from('bot_configs').select('*');

    const getVal = (key: string) => settings?.find(s => s.key === key)?.value;

    const deliveryRates = getVal('delivery_rates') || { walking_base: 5000, walking_km: 2000, car_base: 10000, car_km: 3000 };
    const office = getVal('office_location') || { address: '', lat: 40.5050, lng: 71.2215 };
    
    tempBots = bots || [];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; align-items: start; padding-bottom:50px;">
            <!-- CHAP TOMON -->
            <div style="display:flex; flex-direction:column; gap:25px;">
                <!-- DOSTAVKA TARIFLARI -->
                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-truck" style="color:var(--primary);"></i> Dostavka Tariflari (UZS)</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div><label style="font-size:0.7rem; font-weight:800;">Piyoda: Baza</label><input type="number" id="s_walking_base" value="${deliveryRates.walking_base}" style="height:50px;"></div>
                        <div><label style="font-size:0.7rem; font-weight:800;">Piyoda: + har km</label><input type="number" id="s_walking_km" value="${deliveryRates.walking_km}" style="height:50px;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div><label style="font-size:0.7rem; font-weight:800;">Mashina: Baza</label><input type="number" id="s_car_base" value="${deliveryRates.car_base}" style="height:50px;"></div>
                        <div><label style="font-size:0.7rem; font-weight:800;">Mashina: + har km</label><input type="number" id="s_car_km" value="${deliveryRates.car_km}" style="height:50px;"></div>
                    </div>
                </div>

                <!-- OFIS JOYLASHUVI -->
                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> Market Joylashuvi</h3>
                    <label style="font-size:0.75rem; font-weight:900;">MANZIL MATNI</label>
                    <input type="text" id="s_off_address" value="${office.address || ''}" style="height:50px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div><label style="font-size:0.7rem;">Latitude</label><input type="number" id="s_off_lat" value="${office.lat}" step="0.0001" style="height:50px;"></div>
                        <div><label style="font-size:0.7rem;">Longitude</label><input type="number" id="s_off_lng" value="${office.lng}" step="0.0001" style="height:50px;"></div>
                    </div>
                </div>
            </div>

            <!-- O'NG TOMON -->
            <div style="display:flex; flex-direction:column; gap:25px;">
                <!-- BOTLAR BOSHQARUVI (bot_configs jadvali) -->
                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-weight:900; display:flex; align-items:center; gap:10px;"><i class="fas fa-robot" style="color:#3b82f6;"></i> Telegram Botlar</h3>
                        <button class="btn btn-outline" style="height:35px; width:auto; padding:0 15px; font-size:0.7rem;" onclick="addNewBotRow()">+ QO'SHISH</button>
                    </div>
                    <div id="botsListInputs" style="display:flex; flex-direction:column; gap:12px;">
                        ${tempBots.map((bot, idx) => `
                            <div style="background:#f8fafc; padding:15px; border-radius:18px; border:1px solid #e2e8f0; position:relative;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <input type="text" placeholder="Bot nomi" value="${bot.bot_name}" oninput="updateTempBot(${idx}, 'bot_name', this.value)" style="height:40px; margin:0; font-size:0.8rem; flex:1;">
                                    <div style="margin-left:10px; display:flex; align-items:center; gap:5px;">
                                        <label class="switch" style="transform:scale(0.7);">
                                            <input type="checkbox" ${bot.is_active ? 'checked' : ''} onchange="updateTempBot(${idx}, 'is_active', this.checked)">
                                            <span class="slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <input type="password" placeholder="Token" value="${bot.token}" oninput="updateTempBot(${idx}, 'token', this.value)" style="height:40px; margin:0; font-size:0.8rem;">
                                <button onclick="removeBotRow(${idx}, '${bot.id || ''}')" style="position:absolute; right:-8px; top:-8px; background:white; color:var(--danger); border:none; width:24px; height:24px; border-radius:50%; box-shadow:var(--shadow-sm); cursor:pointer;"><i class="fas fa-times-circle"></i></button>
                            </div>
                        `).join('')}
                        ${tempBots.length === 0 ? '<p style="text-align:center; font-size:0.75rem; color:var(--gray); padding:10px;">Ro\'yxat bo\'sh.</p>' : ''}
                    </div>
                </div>

                <button class="btn btn-primary" id="btnSaveAllSettings" style="height:65px; border-radius:22px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="saveAdminSettings()">
                    <i class="fas fa-save"></i> BARCHA O'ZGARISHLARNI SAQLASH
                </button>
            </div>
        </div>
    `;
}

(window as any).addNewBotRow = () => {
    tempBots.push({ bot_name: 'Yangi Bot', token: '', is_active: true });
    renderAdminSettings();
};

(window as any).removeBotRow = async (idx: number, botId: string) => {
    if (botId) {
        if (!confirm("Haqiqatan ham ushbu botni o'chirmoqchimisiz?")) return;
        await supabase.from('bot_configs').delete().eq('id', botId);
    }
    tempBots.splice(idx, 1);
    renderAdminSettings();
};

(window as any).updateTempBot = (idx: number, field: string, val: any) => {
    tempBots[idx][field] = val;
};

(window as any).saveAdminSettings = async () => {
    const btn = document.getElementById('btnSaveAllSettings') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAQLANMOQDA...';
    
    // 1. App Settings (Dostavka va Ofis)
    const delivery_rates = {
        walking_base: Number((document.getElementById('s_walking_base') as HTMLInputElement).value),
        walking_km: Number((document.getElementById('s_walking_km') as HTMLInputElement).value),
        car_base: Number((document.getElementById('s_car_base') as HTMLInputElement).value),
        car_km: Number((document.getElementById('s_car_km') as HTMLInputElement).value)
    };

    const office_location = {
        address: (document.getElementById('s_off_address') as HTMLInputElement).value,
        lat: Number((document.getElementById('s_off_lat') as HTMLInputElement).value),
        lng: Number((document.getElementById('s_off_lng') as HTMLInputElement).value)
    };

    await supabase.from('app_settings').upsert([
        { key: 'delivery_rates', value: delivery_rates },
        { key: 'office_location', value: office_location }
    ]);

    // 2. Bot Configs (bot_configs jadvali)
    for (const bot of tempBots) {
        if (bot.token.trim() !== '') {
            const { id, bot_name, token, is_active } = bot;
            await supabase.from('bot_configs').upsert([{ id, bot_name, token, is_active }]);
        }
    }

    showToast("Sozlamalar to'liq saqlandi! ✨");
    renderAdminSettings();
};
