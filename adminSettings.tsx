
import { supabase, showToast } from "./index.tsx";

export async function renderAdminSettings() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; align-items: start;">
            <!-- DOSTAVKA TARIFLARI -->
            <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-truck-fast" style="color:var(--primary);"></i> Dostavka Tariflari
                </h3>
                
                <div id="ratesContainer">
                    <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i></div>
                </div>
                
                <button class="btn btn-primary" id="btnSaveRates" style="width:100%; height:55px; margin-top:20px;" onclick="window.saveAdminDeliveryRates()">
                    TARIFLARNI SAQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
                </button>
            </div>

            <!-- OFIS VA HUDUD -->
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-map-location-dot" style="color:var(--danger);"></i> Markaziy Ofis (Sklad)
                    </h3>
                    <p style="font-size:0.7rem; color:var(--gray); margin-bottom:15px; font-weight:700;">Dostavka masofasi ushbu koordinatadan hisoblanadi.</p>
                    
                    <label style="font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">LATITUDE</label>
                    <input type="number" id="s_off_lat" step="0.0001" style="height:50px; margin-bottom:15px;">
                    
                    <label style="font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">LONGITUDE</label>
                    <input type="number" id="s_off_lng" step="0.0001" style="height:50px; margin-bottom:20px;">
                    
                    <button class="btn btn-dark" style="width:100%; height:55px;" onclick="window.saveAdminOfficeLoc()">
                        MANZILNI SAQLASH
                    </button>
                </div>

                <div class="card" style="border-radius:28px; padding:25px; background:var(--dark); color:white; border:none;">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:10px;">Xavfsizlik</h3>
                    <p style="font-size:0.7rem; opacity:0.6; margin-bottom:20px;">Tizim parametrlarini ehtiyotkorlik bilan o'zgartiring.</p>
                    <button class="btn" style="width:100%; background:rgba(255,255,255,0.1); color:white; border:none;" onclick="showToast('Hozircha ochiq emas')">Keshni tozalash</button>
                </div>
            </div>
        </div>
    `;

    loadSettingsData();
}

async function loadSettingsData() {
    const ratesCont = document.getElementById('ratesContainer');
    if(!ratesCont) return;

    const { data: settings } = await supabase.from('app_settings').select('*');
    
    const deliveryRates = settings?.find(s => s.key === 'delivery_rates')?.value || { 
        walking_base: 5000, walking_km: 2000, 
        bicycle_base: 7000, bicycle_km: 2500,
        car_base: 10000, car_km: 3000 
    };
    const office = settings?.find(s => s.key === 'office_location')?.value || { lat: 40.5050, lng: 71.2215 };

    (document.getElementById('s_off_lat') as HTMLInputElement).value = office.lat;
    (document.getElementById('s_off_lng') as HTMLInputElement).value = office.lng;

    ratesCont.innerHTML = `
        <div style="background:#f8fafc; padding:15px; border-radius:18px; margin-bottom:15px; border:1px solid #f1f5f9;">
            <p style="font-size:0.7rem; font-weight:900; color:var(--primary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-walking"></i> PIYODA / VELO
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_walking_base" value="${deliveryRates.walking_base}" style="height:45px; margin:0; font-size:0.85rem;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_walking_km" value="${deliveryRates.walking_km}" style="height:45px; margin:0; font-size:0.85rem;">
                </div>
            </div>
        </div>

        <div style="background:#f0f9ff; padding:15px; border-radius:18px; border:1px solid #e0f2fe;">
            <p style="font-size:0.7rem; font-weight:900; color:#0ea5e9; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-car-side"></i> AVTOMOBIL
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_car_base" value="${deliveryRates.car_base}" style="height:45px; margin:0; font-size:0.85rem;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_car_km" value="${deliveryRates.car_km}" style="height:45px; margin:0; font-size:0.85rem;">
                </div>
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
    const { error } = await supabase.from('app_settings').upsert({ key: 'delivery_rates', value: val });
    if(!error) showToast("Tariflar yangilandi! 🚚");
};

(window as any).saveAdminOfficeLoc = async () => {
    const val = {
        lat: Number((document.getElementById('s_off_lat') as HTMLInputElement).value),
        lng: Number((document.getElementById('s_off_lng') as HTMLInputElement).value)
    };
    const { error } = await supabase.from('app_settings').upsert({ key: 'office_location', value: val });
    if(!error) showToast("Ofis koordinatalari saqlandi! 📍");
};
