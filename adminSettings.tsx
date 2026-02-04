
import { supabase, showToast } from "./index.tsx";

export async function renderAdminSettings() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: settings } = await supabase.from('app_settings').select('*');
    const getVal = (key: string) => settings?.find(s => s.key === key)?.value;

    const deliveryRates = getVal('delivery_rates') || { walking_base: 5000, walking_km: 2000, car_base: 10000, car_km: 3000 };
    const office = getVal('office_location') || { address: '', lat: 40.5050, lng: 71.2215 };

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; align-items: start; padding-bottom:50px;">
            <!-- TARIFLAR -->
            <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-truck" style="color:var(--primary);"></i> Dostavka Tariflari</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <div><label style="font-size:0.65rem; font-weight:800; color:var(--gray);">Piyoda: Baza</label><input type="number" id="s_walking_base" value="${deliveryRates.walking_base}" style="height:50px;"></div>
                    <div><label style="font-size:0.65rem; font-weight:800; color:var(--gray);">Piyoda: +1 km</label><input type="number" id="s_walking_km" value="${deliveryRates.walking_km}" style="height:50px;"></div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div><label style="font-size:0.65rem; font-weight:800; color:var(--gray);">Mashina: Baza</label><input type="number" id="s_car_base" value="${deliveryRates.car_base}" style="height:50px;"></div>
                    <div><label style="font-size:0.65rem; font-weight:800; color:var(--gray);">Mashina: +1 km</label><input type="number" id="s_car_km" value="${deliveryRates.car_km}" style="height:50px;"></div>
                </div>
                <button class="btn btn-primary" id="btnSaveRates" style="width:100%; height:55px;" onclick="saveAdminDeliveryRates()">TARIFLARNI SAQLASH</button>
            </div>

            <!-- JOYLASHUV -->
            <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> Ofis Koordinatalari</h3>
                <label style="font-size:0.65rem; font-weight:800; color:var(--gray);">ASOSIY MANZIL</label>
                <input type="text" id="s_off_address" value="${office.address || ''}" style="height:50px; margin-bottom:15px;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div><label style="font-size:0.65rem; font-weight:800; color:var(--gray);">Latitude</label><input type="number" id="s_off_lat" value="${office.lat}" step="0.0001" style="height:50px;"></div>
                    <div><label style="font-size:0.65rem; font-weight:800; color:var(--gray);">Longitude</label><input type="number" id="s_off_lng" value="${office.lng}" step="0.0001" style="height:50px;"></div>
                </div>
                <button class="btn btn-outline" style="width:100%; height:55px; border-color:var(--danger); color:var(--danger);" onclick="saveAdminOfficeLoc()">MANZILNI SAQLASH</button>
            </div>
        </div>
    `;
}

(window as any).saveAdminDeliveryRates = async () => {
    const val = {
        walking_base: Number((document.getElementById('s_walking_base') as HTMLInputElement).value),
        walking_km: Number((document.getElementById('s_walking_km') as HTMLInputElement).value),
        car_base: Number((document.getElementById('s_car_base') as HTMLInputElement).value),
        car_km: Number((document.getElementById('s_car_km') as HTMLInputElement).value)
    };
    await supabase.from('app_settings').upsert({ key: 'delivery_rates', value: val }, { onConflict: 'key' });
    showToast("Tariflar saqlandi! 🚚");
};

(window as any).saveAdminOfficeLoc = async () => {
    const val = {
        address: (document.getElementById('s_off_address') as HTMLInputElement).value,
        lat: Number((document.getElementById('s_off_lat') as HTMLInputElement).value),
        lng: Number((document.getElementById('s_off_lng') as HTMLInputElement).value)
    };
    await supabase.from('app_settings').upsert({ key: 'office_location', value: val }, { onConflict: 'key' });
    showToast("Ofis manzili yangilandi! 📍");
};
