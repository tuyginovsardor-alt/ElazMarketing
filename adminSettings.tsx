
import { supabase, showToast } from "./index.tsx";

let tempBots: {name: string, token: string}[] = [];

export async function renderAdminSettings() {
    const container = document.getElementById('admin_tab_settings');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: settings } = await supabase.from('app_settings').select('*');
    const getVal = (key: string) => settings?.find(s => s.key === key)?.value;

    const deliveryRates = getVal('delivery_rates') || { walking_base: 5000, walking_km: 2000, car_base: 10000, car_km: 3000 };
    const office = getVal('office_location') || { address: '', lat: 40.5050, lng: 71.2215 };
    const botConfig = getVal('bot_config');

    // Botlarni massivga aylantirish
    if (Array.isArray(botConfig)) {
        tempBots = [...botConfig];
    } else if (botConfig && botConfig.token) {
        tempBots = [{ name: 'Asosiy Bot', token: botConfig.token }];
    } else {
        tempBots = [];
    }

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; align-items: start;">
            <div style="display:flex; flex-direction:column; gap:25px;">
                <!-- MULTI-BOT MANAGEMENT -->
                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-weight:900; display:flex; align-items:center; gap:10px;"><i class="fas fa-robot" style="color:#3b82f6;"></i> Botlar Ro'yxati</h3>
                        <button class="btn btn-outline" style="height:35px; width:auto; padding:0 15px; font-size:0.7rem; border-radius:10px;" onclick="addNewBotRow()">+ QO'SHISH</button>
                    </div>
                    
                    <div id="botsListInputs" style="display:flex; flex-direction:column; gap:15px; margin-bottom:20px;">
                        ${tempBots.map((bot, idx) => `
                            <div style="background:#f8fafc; padding:15px; border-radius:18px; border:1px solid #f1f5f9; position:relative;">
                                <div style="display:grid; grid-template-columns: 1fr 2fr; gap:10px;">
                                    <input type="text" placeholder="Bot nomi" value="${bot.name}" oninput="updateTempBot(${idx}, 'name', this.value)" style="height:45px; margin:0; font-size:0.8rem;">
                                    <input type="password" placeholder="Token" value="${bot.token}" oninput="updateTempBot(${idx}, 'token', this.value)" style="height:45px; margin:0; font-size:0.8rem;">
                                </div>
                                <button onclick="removeBotRow(${idx})" style="position:absolute; -right:10px; -top:10px; width:24px; height:24px; background:var(--danger); color:white; border:none; border-radius:50%; font-size:0.7rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                            </div>
                        `).join('')}
                        ${tempBots.length === 0 ? '<p style="text-align:center; color:var(--gray); font-size:0.8rem; padding:1rem;">Hali bot qo\'shilmagan.</p>' : ''}
                    </div>
                </div>

                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> Market Joylashuvi</h3>
                    <label style="font-size:0.75rem; font-weight:900; color:var(--gray);">OFIS MANZILI (MATN)</label>
                    <input type="text" id="s_off_address" value="${office.address || ''}" style="height:55px; border-radius:15px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div><label style="font-size:0.75rem;">Latitude</label><input type="number" id="s_off_lat" value="${office.lat || ''}" step="0.0001" style="height:55px; border-radius:15px;"></div>
                        <div><label style="font-size:0.75rem;">Longitude</label><input type="number" id="s_off_lng" value="${office.lng || ''}" step="0.0001" style="height:55px; border-radius:15px;"></div>
                    </div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-truck" style="color:var(--primary);"></i> Dostavka Tariflari (UZS)</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div><label style="font-size:0.7rem; font-weight:800;">Piyoda: Baza</label><input type="number" id="s_walking_base" value="${deliveryRates.walking_base || 5000}" style="height:50px; border-radius:12px;"></div>
                        <div><label style="font-size:0.7rem; font-weight:800;">Piyoda: + har km</label><input type="number" id="s_walking_km" value="${deliveryRates.walking_km || 2000}" style="height:50px; border-radius:12px;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div><label style="font-size:0.7rem; font-weight:800;">Mashina: Baza</label><input type="number" id="s_car_base" value="${deliveryRates.car_base || 10000}" style="height:50px; border-radius:12px;"></div>
                        <div><label style="font-size:0.7rem; font-weight:800;">Mashina: + har km</label><input type="number" id="s_car_km" value="${deliveryRates.car_km || 3000}" style="height:50px; border-radius:12px;"></div>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnSaveAllSettings" style="height:65px; border-radius:25px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="saveAdminSettings()">
                    <i class="fas fa-save"></i> BARCHA O'ZGARISHLARNI SAQLASH
                </button>
            </div>
        </div>
    `;
}

(window as any).addNewBotRow = () => {
    tempBots.push({ name: 'Yangi Bot', token: '' });
    renderAdminSettings();
};

(window as any).removeBotRow = (idx: number) => {
    tempBots.splice(idx, 1);
    renderAdminSettings();
};

(window as any).updateTempBot = (idx: number, field: 'name' | 'token', val: string) => {
    tempBots[idx][field] = val;
};

(window as any).saveAdminSettings = async () => {
    const btn = document.getElementById('btnSaveAllSettings') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAQLANMOQDA...';
    
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

    // Botlarni filtrlash (bo'shlarini olib tashlash)
    const bot_config = tempBots.filter(b => b.token.trim() !== '');

    const { error } = await supabase.from('app_settings').upsert([
        { key: 'delivery_rates', value: delivery_rates },
        { key: 'office_location', value: office_location },
        { key: 'bot_config', value: bot_config }
    ]);

    if (!error) {
        showToast("Barcha sozlamalar saqlandi! ✅");
        renderAdminSettings();
    } else {
        showToast("Xatolik: " + error.message);
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};
