
import { supabase, showToast } from "./index.tsx";

let settingsMap: any = null;
let settingsMarker: any = null;

export async function renderAdminSettings() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; align-items: start; animation: fadeIn 0.3s ease-out;">
            <!-- DOSTAVKA TARIFLARI -->
            <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-truck-fast" style="color:var(--primary);"></i> Dostavka Tariflari
                </h3>
                
                <div id="ratesContainer">
                    <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                </div>
                
                <button class="btn btn-primary" id="btnSaveRates" style="width:100%; height:55px; margin-top:20px; border-radius:18px;" onclick="window.saveAdminDeliveryRates()">
                    TARIFLARNI SAQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
                </button>
            </div>

            <!-- OFIS VA HUDUD -->
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-map-location-dot" style="color:var(--danger);"></i> Markaziy Ofis (Sklad)
                    </h3>
                    <p style="font-size:0.7rem; color:var(--gray); margin-bottom:15px; font-weight:700;">Dostavka masofasi ushbu nuqtadan avtomatik hisoblanadi.</p>
                    
                    <div id="settingsLocationMap" style="height:250px; width:100%; border-radius:20px; margin-bottom:20px; border:2px solid #f1f5f9; background:#f8fafc;"></div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                        <div>
                            <label style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase;">LATITUDE</label>
                            <input type="number" id="s_off_lat" step="0.000001" style="height:50px; margin:0; font-size:0.8rem;">
                        </div>
                        <div>
                            <label style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase;">LONGITUDE</label>
                            <input type="number" id="s_off_lng" step="0.000001" style="height:50px; margin:0; font-size:0.8rem;">
                        </div>
                    </div>
                    
                    <button class="btn btn-dark" style="width:100%; height:55px; border-radius:18px;" onclick="window.saveAdminOfficeLoc()">
                        MANZILNI SAQLASH <i class="fas fa-location-dot" style="margin-left:8px;"></i>
                    </button>
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
    const office = settings?.find(s => s.key === 'office_location')?.value || { lat: 40.4851, lng: 71.2188 };

    (document.getElementById('s_off_lat') as HTMLInputElement).value = office.lat;
    (document.getElementById('s_off_lng') as HTMLInputElement).value = office.lng;

    ratesCont.innerHTML = `
        <div style="background:#f8fafc; padding:18px; border-radius:20px; margin-bottom:15px; border:1.5px solid #f1f5f9;">
            <p style="font-size:0.7rem; font-weight:900; color:var(--primary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-walking"></i> PIYODA / VELOSIPED
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_walking_base" value="${deliveryRates.walking_base}" style="height:48px; margin:0; font-size:0.9rem;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_walking_km" value="${deliveryRates.walking_km}" style="height:48px; margin:0; font-size:0.9rem;">
                </div>
            </div>
        </div>

        <div style="background:#f0f9ff; padding:18px; border-radius:20px; border:1.5px solid #e0f2fe;">
            <p style="font-size:0.7rem; font-weight:900; color:#0ea5e9; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-car-side"></i> AVTOMOBIL
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_car_base" value="${deliveryRates.car_base}" style="height:48px; margin:0; font-size:0.9rem;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_car_km" value="${deliveryRates.car_km}" style="height:48px; margin:0; font-size:0.9rem;">
                </div>
            </div>
        </div>
    `;

    // Xaritani ishga tushirish
    setTimeout(() => {
        initSettingsMap(office.lat, office.lng);
    }, 100);
}

function initSettingsMap(lat: number, lng: number) {
    const mapEl = document.getElementById('settingsLocationMap');
    if(!mapEl || (window as any).L === undefined) return;

    // @ts-ignore
    settingsMap = L.map('settingsLocationMap').setView([lat, lng], 15);
    
    // @ts-ignore
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(settingsMap);
    
    // @ts-ignore
    settingsMarker = L.marker([lat, lng], { draggable: true }).addTo(settingsMap);
    
    settingsMarker.on('dragend', () => {
        const pos = settingsMarker.getLatLng();
        (document.getElementById('s_off_lat') as HTMLInputElement).value = pos.lat.toFixed(6);
        (document.getElementById('s_off_lng') as HTMLInputElement).value = pos.lng.toFixed(6);
    });
}

(window as any).saveAdminDeliveryRates = async () => {
    const val = {
        walking_base: Number((document.getElementById('s_walking_base') as HTMLInputElement).value),
        walking_km: Number((document.getElementById('s_walking_km') as HTMLInputElement).value),
        car_base: Number((document.getElementById('s_car_base') as HTMLInputElement).value),
        car_km: Number((document.getElementById('s_car_km') as HTMLInputElement).value)
    };
    const { error } = await supabase.from('app_settings').upsert({ key: 'delivery_rates', value: val });
    if(!error) showToast("Tariflar saqlandi! 🚚");
};

(window as any).saveAdminOfficeLoc = async () => {
    const val = {
        lat: Number((document.getElementById('s_off_lat') as HTMLInputElement).value),
        lng: Number((document.getElementById('s_off_lng') as HTMLInputElement).value)
    };
    const { error } = await supabase.from('app_settings').upsert({ key: 'office_location', value: val });
    if(!error) showToast("Ofis manzili muvaffaqiyatli yangilandi! 📍");
};
