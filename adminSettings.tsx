
import { supabase, showToast } from "./index.tsx";

export async function renderAdminSettings() {
    const container = document.getElementById('admin_tab_settings');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: settings } = await supabase.from('app_settings').select('*');
    const getVal = (key: string) => settings?.find(s => s.key === key)?.value || {};

    const deliveryRates = getVal('delivery_rates');
    const office = getVal('office_location');
    const botConfig = getVal('bot_config');

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-robot" style="color:#3b82f6;"></i> Bot Sozlamalari</h3>
                    <label style="font-size:0.75rem; font-weight:900; color:var(--gray);">TELEGRAM BOT TOKEN (API)</label>
                    <input type="password" id="s_bot_token" value="${botConfig.token || ''}" placeholder="Masalan: 8286953925:AAFv..." style="height:55px; border-radius:15px;">
                    <p style="font-size:0.7rem; color:var(--gray); margin-top:-8px; font-weight:600;">Tokenni @BotFather orqali olasiz. Bu token kuryerlar bilan aloqa qilish uchun ishlatiladi.</p>
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

                <button class="btn btn-primary" style="height:65px; border-radius:25px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="saveAdminSettings()">
                    <i class="fas fa-save"></i> BARCHA O'ZGARISHLARNI SAQLASH
                </button>
            </div>
        </div>
    `;
}

(window as any).saveAdminSettings = async () => {
    const btn = document.querySelector('.btn-primary') as HTMLButtonElement;
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

    const bot_config = {
        token: (document.getElementById('s_bot_token') as HTMLInputElement).value.trim()
    };

    const { error } = await supabase.from('app_settings').upsert([
        { key: 'delivery_rates', value: delivery_rates },
        { key: 'office_location', value: office_location },
        { key: 'bot_config', value: bot_config }
    ]);

    if (!error) {
        showToast("Sozlamalar saqlandi! ✅");
        renderAdminSettings();
    } else {
        showToast("Xatolik: " + error.message);
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};
