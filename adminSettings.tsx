
import { supabase, showToast } from "./index.tsx";

let settingsMap: any = null;
let settingsMarker: any = null;
// Markaziy ofis (Cerova, Bag'dod) koordinatalari
const DEFAULT_OFFICE = { lat: 40.5186, lng: 71.2185 };

export async function renderAdminSettings() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; align-items: start; animation: fadeIn 0.3s ease-out;">
            <div class="card" style="border-radius:30px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-truck-fast" style="color:var(--primary);"></i> Dostavka Tariflari
                </h3>
                
                <div id="ratesContainer">
                    <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                </div>
                
                <button class="btn btn-primary" id="btnSaveRates" style="width:100%; height:55px; margin-top:20px; border-radius:18px; background:var(--gradient);" onclick="window.saveAdminDeliveryRates()">
                    TARIFLARNI SAQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
                </button>
            </div>

            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:30px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="font-weight:900; font-size:1.1rem; display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-map-location-dot" style="color:var(--danger);"></i> Sklad (Ofis)
                        </h3>
                        <button onclick="window.locateMeForSettings()" style="background:#f0fdf4; border:none; color:var(--primary); width:40px; height:40px; border-radius:10px; cursor:pointer;" title="Mening joylashuvim">
                            <i class="fas fa-location-crosshairs"></i>
                        </button>
                    </div>
                    
                    <div id="settingsLocationMap" style="height:350px; width:100%; border-radius:24px; margin-bottom:20px; border:2px solid #f1f5f9; background:#f8fafc; z-index:1;"></div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                        <div>
                            <label style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase;">LATITUDE</label>
                            <input type="number" id="s_off_lat" step="0.000001" style="height:50px; margin:0; font-size:0.8rem; border-radius:12px;">
                        </div>
                        <div>
                            <label style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase;">LONGITUDE</label>
                            <input type="number" id="s_off_lng" step="0.000001" style="height:50px; margin:0; font-size:0.8rem; border-radius:12px;">
                        </div>
                    </div>
                    
                    <button class="btn btn-dark" style="width:100%; height:55px; border-radius:18px;" onclick="window.saveAdminOfficeLoc()">
                        OFISNI SAQLASH <i class="fas fa-floppy-disk" style="margin-left:8px;"></i>
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
        car_base: 12000, car_km: 4000 
    };
    const office = settings?.find(s => s.key === 'office_location')?.value || DEFAULT_OFFICE;

    const latInput = document.getElementById('s_off_lat') as HTMLInputElement;
    const lngInput = document.getElementById('s_off_lng') as HTMLInputElement;
    if(latInput) latInput.value = office.lat;
    if(lngInput) lngInput.value = office.lng;

    ratesCont.innerHTML = `
        <div style="background:#f8fafc; padding:20px; border-radius:22px; margin-bottom:15px; border:1.5px solid #f1f5f9;">
            <p style="font-size:0.7rem; font-weight:900; color:var(--primary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-walking"></i> PIYODA
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_walking_base" value="${deliveryRates.walking_base || 5000}" style="height:48px; margin:0; font-size:0.9rem; border-radius:12px;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_walking_km" value="${deliveryRates.walking_km || 2000}" style="height:48px; margin:0; font-size:0.9rem; border-radius:12px;">
                </div>
            </div>
        </div>

        <div style="background:#f0fdf4; padding:20px; border-radius:22px; margin-bottom:15px; border:1.5px solid #dcfce7;">
            <p style="font-size:0.7rem; font-weight:900; color:#16a34a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-bicycle"></i> VELOSIPED
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_bicycle_base" value="${deliveryRates.bicycle_base || 7000}" style="height:48px; margin:0; font-size:0.9rem; border-radius:12px;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_bicycle_km" value="${deliveryRates.bicycle_km || 2500}" style="height:48px; margin:0; font-size:0.9rem; border-radius:12px;">
                </div>
            </div>
        </div>

        <div style="background:#f0f9ff; padding:20px; border-radius:22px; border:1.5px solid #e0f2fe;">
            <p style="font-size:0.7rem; font-weight:900; color:#0ea5e9; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-car-side"></i> AVTOMOBIL
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">BAZA (UZS)</label>
                    <input type="number" id="s_car_base" value="${deliveryRates.car_base || 12000}" style="height:48px; margin:0; font-size:0.9rem; border-radius:12px;">
                </div>
                <div>
                    <label style="font-size:0.6rem; font-weight:800; color:var(--gray);">+1 KM UCHUN</label>
                    <input type="number" id="s_car_km" value="${deliveryRates.car_km || 4000}" style="height:48px; margin:0; font-size:0.9rem; border-radius:12px;">
                </div>
            </div>
        </div>
    `;

    setTimeout(() => { initSettingsMap(office.lat, office.lng); }, 200);
}

function initSettingsMap(lat: number, lng: number) {
    const mapEl = document.getElementById('settingsLocationMap');
    if(!mapEl || (window as any).L === undefined) return;
    if(settingsMap) settingsMap.remove();

    settingsMap = (window as any).L.map('settingsLocationMap', { zoomControl: false }).setView([lat, lng], 15);
    (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(settingsMap);
    settingsMarker = (window as any).L.marker([lat, lng], { draggable: true }).addTo(settingsMap);
    
    settingsMarker.on('dragend', () => {
        const pos = settingsMarker.getLatLng();
        const latInput = document.getElementById('s_off_lat') as HTMLInputElement;
        const lngInput = document.getElementById('s_off_lng') as HTMLInputElement;
        if(latInput) latInput.value = pos.lat.toFixed(6);
        if(lngInput) lngInput.value = pos.lng.toFixed(6);
    });
}

(window as any).locateMeForSettings = () => {
    if (!navigator.geolocation) return showToast("Geolokatsiya qo'llab-quvvatlanmaydi.");
    showToast("Aniqlanmoqda...");
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if(settingsMap && settingsMarker) {
            settingsMap.setView([latitude, longitude], 16);
            settingsMarker.setLatLng([latitude, longitude]);
            const latInput = document.getElementById('s_off_lat') as HTMLInputElement;
            const lngInput = document.getElementById('s_off_lng') as HTMLInputElement;
            if(latInput) latInput.value = latitude.toFixed(6);
            if(lngInput) lngInput.value = longitude.toFixed(6);
            showToast("📍 Koordinatalar yangilandi!");
        }
    }, () => showToast("Aniqlab bo'lmadi."));
};

(window as any).saveAdminDeliveryRates = async () => {
    const btn = document.getElementById('btnSaveRates') as HTMLButtonElement;
    if(btn) btn.disabled = true;

    try {
        const val = {
            walking_base: Number((document.getElementById('s_walking_base') as HTMLInputElement).value),
            walking_km: Number((document.getElementById('s_walking_km') as HTMLInputElement).value),
            bicycle_base: Number((document.getElementById('s_bicycle_base') as HTMLInputElement).value),
            bicycle_km: Number((document.getElementById('s_bicycle_km') as HTMLInputElement).value),
            car_base: Number((document.getElementById('s_car_base') as HTMLInputElement).value),
            car_km: Number((document.getElementById('s_car_km') as HTMLInputElement).value)
        };
        
        const { error } = await supabase.from('app_settings').upsert({ key: 'delivery_rates', value: val }, { onConflict: 'key' });
        
        if(error) throw error;
        showToast("Tariflar saqlandi! 🚚");
    } catch (e: any) {
        showToast("Xato: " + e.message);
    } finally {
        if(btn) btn.disabled = false;
    }
};

(window as any).saveAdminOfficeLoc = async () => {
    try {
        const val = {
            lat: Number((document.getElementById('s_off_lat') as HTMLInputElement).value),
            lng: Number((document.getElementById('s_off_lng') as HTMLInputElement).value)
        };
        const { error } = await supabase.from('app_settings').upsert({ key: 'office_location', value: val }, { onConflict: 'key' });
        if(error) throw error;
        showToast("📍 Ofis manzili saqlandi!");
    } catch (e: any) {
        showToast("Xato: " + e.message);
    }
};
