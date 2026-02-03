
import { supabase, showToast } from "./index.tsx";

export async function renderAdminSettings() {
    const container = document.getElementById('admin_tab_settings');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: settings } = await supabase.from('app_settings').select('*');
    const getVal = (key: string) => settings?.find(s => s.key === key)?.value || {};

    const deliveryRates = getVal('delivery_rates');
    const payments = getVal('payment_methods');
    const times = getVal('delivery_times');
    const office = getVal('office_location');
    const botConfig = getVal('bot_config');

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-robot" style="color:#3b82f6;"></i> Telegram Bot Sozlamalari</h3>
                    <label>Telegram Bot Token (API)</label>
                    <input type="text" id="s_bot_token" value="${botConfig.token || ''}" placeholder="Masalan: 8286953925:AAFv...">
                    <p style="font-size:0.7rem; color:var(--gray); margin-top:-8px; margin-bottom:15px;">Bot tokenini @BotFather orqali olasiz.</p>
                </div>

                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> Ofis (Market) Joylashuvi</h3>
                    <label>Ofis manzili (Matn)</label>
                    <input type="text" id="s_off_address" value="${office.address || ''}">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div><label>Latitude</label><input type="number" id="s_off_lat" value="${office.lat || ''}" step="0.0001"></div>
                        <div><label>Longitude</label><input type="number" id="s_off_lng" value="${office.lng || ''}" step="0.0001"></div>
                    </div>
                    <button class="btn btn-outline" style="width:100%; border-color:var(--primary); color:var(--primary);" onclick="detectOfficeGPS()">
                        <i class="fas fa-crosshairs"></i> JORIY NUQTANI ANIQLASH
                    </button>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-truck" style="color:var(--primary);"></i> Dostavka Tariflari (UZS)</h3>
                    <label>Piyoda: Boshlang'ich</label><input type="number" id="s_walking_base" value="${deliveryRates.walking_base || 5000}">
                    <label>Piyoda: + har km uchun</label><input type="number" id="s_walking_km" value="${deliveryRates.walking_km || 2000}">
                    <label>Mashina: Boshlang'ich</label><input type="number" id="s_car_base" value="${deliveryRates.car_base || 10000}">
                    <label>Mashina: + har km uchun</label><input type="number" id="s_car_km" value="${deliveryRates.car_km || 3000}">
                </div>

                <button class="btn btn-primary" style="height:65px; border-radius:22px; font-size:1.1rem;" onclick="saveAdminSettings()">
                    <i class="fas fa-save"></i> SOZLAMALARNI SAQLASH
                </button>
            </div>
        </div>
    `;
}

(window as any).saveAdminSettings = async () => {
    showToast("Saqlanmoqda...");
    
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
        // Bot tokeni o'zgargan bo'lsa botni qayta yuklash kerak bo'lishi mumkin
    } else {
        showToast("Xatolik: " + error.message);
    }
};
