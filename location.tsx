
import { supabase, showToast, openOverlay, closeOverlay, loadProfileData, showView, profile } from "./index.tsx";
import { renderHomeView } from "./home.tsx";

// Faqat ruxsat berilgan hududlar
export const UZ_DATA: Record<string, string[]> = {
    "Farg'ona viloyati": ["Bag'dod"]
};

const BAGDOD_MAHALLALARI = ["Tuman Markazi", "Guliston shahri"];

export function openLocationSetup() {
    const container = document.getElementById('locationFormContainer');
    if(!container) return;

    const isFirstTime = !profile?.region;

    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
            ${!isFirstTime ? `<i class="fas fa-arrow-left" onclick="closeOverlay('locationOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text);"></i>` : ''}
            <h2 style="font-weight:900; font-size:1.3rem;">Xizmat ko'rsatish hududi</h2>
        </div>

        <div class="card" style="text-align: left; padding: 25px; border-radius: 28px; border:none; box-shadow:0 10px 30px rgba(0,0,0,0.05);">
            <p style="font-size:0.85rem; color:var(--gray); margin-bottom:20px; font-weight:600;">Hozirda ELAZ MARKET faqat Bag'dod tumani markazi va Guliston shahri hududlarida xizmat ko'rsatadi.</p>
            
            <div style="margin-bottom: 20px;">
                <label style="color:var(--text); font-size:0.85rem;">VILOYAT</label>
                <select id="locRegion" style="height:54px; font-size:1rem; border-color:#e2e8f0; background:#f8fafc;" disabled>
                    <option value="Farg'ona viloyati">Farg'ona viloyati</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color:var(--text); font-size:0.85rem;">TUMAN</label>
                <select id="locDistrict" style="height:54px; font-size:1rem; border-color:#e2e8f0; background:#f8fafc;" disabled>
                    <option value="Bag'dod">Bag'dod tumani</option>
                </select>
            </div>

            <div id="mahallaContainer" style="margin-bottom: 25px;">
                <label style="color:var(--text); font-size:0.85rem;">HUDUDNI TANLANG (MAJBURIIY)</label>
                <select id="locMahalla" style="height:54px; font-size:1rem; border-color:var(--primary); background:white; font-weight:800;">
                    <option value="">Tanlang...</option>
                    ${BAGDOD_MAHALLALARI.map(m => `<option value="${m}" ${profile?.district?.includes(m) ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>

            <button class="btn btn-primary" style="width: 100%; height:60px; border-radius:20px; font-size:1.1rem; letter-spacing:0.5px;" onclick="saveInitialLocation()">
                DAVOM ETISH <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    openOverlay('locationOverlay');
}

(window as any).saveInitialLocation = async () => {
    const region = "Farg'ona viloyati";
    const district = "Bag'dod";
    const mahalla = (document.getElementById('locMahalla') as HTMLSelectElement).value;
    
    if(!mahalla) return showToast("Iltimos, hududni tanlang!");

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if(!authUser) return;

    const fullDistrict = `${district}, ${mahalla}`;
    const { error } = await supabase.from('profiles').update({ 
        region, 
        district: fullDistrict 
    }).eq('id', authUser.id);

    if(!error) {
        showToast("Manzil saqlandi! 📍");
        closeOverlay('locationOverlay');
        await loadProfileData();
        showView('home');
        renderHomeView();
    } else { 
        showToast("Xatolik: " + error.message); 
    }
};
