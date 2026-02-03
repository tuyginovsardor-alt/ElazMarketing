
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

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> Ofis (Market) Joylashuvi</h3>
                    <p style="font-size:0.75rem; color:var(--gray); margin-bottom:15px;">Mijozgacha bo'lgan masofani aniqlash uchun ushbu nuqta boshlang'ich hisoblanadi.</p>
                    
                    <label>Ofis manzili (Matn ko'rinishida)</label>
                    <input type="text" id="s_off_address" value="${office.address || ''}" placeholder="Masalan: Bag'dod tumani, Guliston MFY">
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div><label>Kenglik (Latitude)</label><input type="number" id="s_off_lat" value="${office.lat || ''}" step="0.0001"></div>
                        <div><label>Uzunlik (Longitude)</label><input type="number" id="s_off_lng" value="${office.lng || ''}" step="0.0001"></div>
                    </div>
                    
                    <button class="btn btn-outline" style="width:100%; border-color:var(--primary); color:var(--primary);" onclick="detectOfficeGPS()">
                        <i class="fas fa-crosshairs"></i> JORIY NUQTANI ANIQLASH
                    </button>
                </div>

                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-truck" style="color:var(--primary);"></i> Kuryer Narxlari</h3>
                    <label>Piyoda: Boshlang'ich (UZS)</label>
                    <input type="number" id="s_walking_base" value="${deliveryRates.walking_base}">
                    <label>Piyoda: Har 1 km uchun (UZS)</label>
                    <input type="number" id="s_walking_km" value="${deliveryRates.walking_km}">
                    <hr style="margin:20px 0; border:none; border-top:1px solid #eee;">
                    <label>Mashina: Boshlang'ich (UZS)</label>
                    <input type="number" id="s_car_base" value="${deliveryRates.car_base}">
                    <label>Mashina: Har 1 km uchun (UZS)</label>
                    <input type="number" id="s_car_km" value="${deliveryRates.car_km}">
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-credit-card" style="color:var(--primary);"></i> To'lov Tizimlari</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span style="font-weight:700;">Naqd pul orqali to'lov</span>
                        <label class="switch"><input type="checkbox" id="s_pay_cash" ${payments.cash ? 'checked' : ''}><span class="slider"></span></label>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span style="font-weight:700;">Hisob balansi orqali</span>
                        <label class="switch"><input type="checkbox" id="s_pay_balance" ${payments.balance ? 'checked' : ''}><span class="slider"></span></label>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700;">TsPay.uz (Karta orqali)</span>
                        <label class="switch"><input type="checkbox" id="s_pay_tspay" ${payments.tspay ? 'checked' : ''}><span class="slider"></span></label>
                    </div>
                </div>

                <div class="card" style="border-radius:28px; padding:25px;">
                    <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-clock" style="color:var(--primary);"></i> Yetkazib Berish Vaqti</h3>
                    <label>Oziq-ovqat mahsulotlari</label>
                    <input type="text" id="s_time_grocery" value="${times.grocery}">
                    <label>Viloyatlararo / Uzoq masofa</label>
                    <input type="text" id="s_time_out" value="${times.out_of_town}">
                </div>

                <button class="btn btn-primary" style="height:65px; border-radius:22px; font-size:1.1rem;" onclick="saveAdminSettings()">
                    <i class="fas fa-save"></i> BARCHASINI SAQLASH
                </button>
            </div>
        </div>
    `;
}

(window as any).detectOfficeGPS = () => {
    showToast("GPS aniqlanmoqda...");
    navigator.geolocation.getCurrentPosition((pos) => {
        (document.getElementById('s_off_lat') as HTMLInputElement).value = pos.coords.latitude.toString();
        (document.getElementById('s_off_lng') as HTMLInputElement).value = pos.coords.longitude.toString();
        showToast("Ofis nuqtasi o'rnatildi! ✨");
    }, () => showToast("GPS ruxsati berilmadi"));
};

(window as any).saveAdminSettings = async () => {
    showToast("Saqlanmoqda...");
    
    const delivery_rates = {
        walking_base: Number((document.getElementById('s_walking_base') as HTMLInputElement).value),
        walking_km: Number((document.getElementById('s_walking_km') as HTMLInputElement).value),
        car_base: Number((document.getElementById('s_car_base') as HTMLInputElement).value),
        car_km: Number((document.getElementById('s_car_km') as HTMLInputElement).value)
    };

    const payment_methods = {
        cash: (document.getElementById('s_pay_cash') as HTMLInputElement).checked,
        balance: (document.getElementById('s_pay_balance') as HTMLInputElement).checked,
        tspay: (document.getElementById('s_pay_tspay') as HTMLInputElement).checked
    };

    const delivery_times = {
        grocery: (document.getElementById('s_time_grocery') as HTMLInputElement).value,
        out_of_town: (document.getElementById('s_time_out') as HTMLInputElement).value
    };

    const office_location = {
        address: (document.getElementById('s_off_address') as HTMLInputElement).value,
        lat: Number((document.getElementById('s_off_lat') as HTMLInputElement).value),
        lng: Number((document.getElementById('s_off_lng') as HTMLInputElement).value)
    };

    await supabase.from('app_settings').upsert([
        { key: 'delivery_rates', value: delivery_rates },
        { key: 'payment_methods', value: payment_methods },
        { key: 'delivery_times', value: delivery_times },
        { key: 'office_location', value: office_location }
    ]);

    showToast("Barcha sozlamalar saqlandi! ✅");
};
