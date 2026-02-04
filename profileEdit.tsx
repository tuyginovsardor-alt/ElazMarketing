
import { supabase, profile, showToast, openOverlay, loadProfileData, closeOverlay } from "./index.tsx";

export const BAGDOD_MAHALLALARI = ["Tuman Markazi", "Guliston shahri", "Markaz", "Guliston", "Istiqlol", "Bog'dod", "Samarqand", "Tinchlik", "Navoiy", "Paxtaobod", "Zafar", "Nurafshon", "Do'stlik", "Ahillik", "Obod", "Farovon", "Yangi hayot"];

export const openProfileEdit = () => {
    if(!profile) return showToast("Profil yuklanmagan");
    const placeholder = document.getElementById('profileEditPlaceholder');
    if(!placeholder) return;
    
    const districtParts = profile.district ? profile.district.split(', ') : ['', ''];
    const currentMahalla = districtParts[1] || districtParts[0] || '';

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('profileEditOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding: 5px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Profilni tahrirlash</h2>
            </div>

            <div class="card" style="border-radius: 32px; padding: 25px; border:1px solid #f1f5f9; background:white; box-shadow:var(--shadow-sm);">
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Ism</label>
                    <input type="text" id="editFName" value="${profile.first_name || ''}" placeholder="Ismingiz" style="height:62px; font-weight:700; font-size:1rem; border-radius:18px;">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Familiya</label>
                    <input type="text" id="editLName" value="${profile.last_name || ''}" placeholder="Familiyangiz" style="height:62px; font-weight:700; font-size:1rem; border-radius:18px;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Telefon raqami</label>
                    <input type="tel" id="editPhone" value="${profile.phone || ''}" placeholder="+998 90 123 45 67" style="height:62px; font-weight:700; font-size:1rem; border-radius:18px;">
                </div>

                <div style="margin-bottom:30px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Hududni tanlang</label>
                    <select id="editMahalla" style="height:62px; font-weight:700; font-size:1rem; border-radius:18px; border-color:var(--primary); background:var(--primary-light);">
                        <option value="">Tanlang...</option>
                        ${BAGDOD_MAHALLALARI.map(m => `<option value="${m}" ${currentMahalla.includes(m) ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>

                <button class="btn btn-primary" id="btnSaveProfile" style="width: 100%; height:65px; font-size:1.1rem; border-radius:22px; box-shadow:0 10px 25px rgba(34,197,94,0.25);" onclick="saveProfileChanges()">
                    SAQLASH <i class="fas fa-save" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>
    `;
    openOverlay('profileEditOverlay');
};

(window as any).saveProfileChanges = async () => {
    const btn = document.getElementById('btnSaveProfile') as HTMLButtonElement;
    const first_name = (document.getElementById('editFName') as HTMLInputElement).value.trim();
    const last_name = (document.getElementById('editLName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('editPhone') as HTMLInputElement).value.trim();
    const mahalla = (document.getElementById('editMahalla') as HTMLSelectElement).value;

    if(!first_name || !phone) return showToast("Ism va telefon raqami majburiy");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAQLANMOQDA...';
    
    const fullDistrict = `Bag'dod, ${mahalla || 'Markaz'}`;

    try {
        const { error } = await supabase.from('profiles').update({ 
            first_name, 
            last_name, 
            phone, 
            district: fullDistrict 
        }).eq('id', profile.id);
        
        if(!error) {
            showToast("Ma'lumotlar muvaffaqiyatli yangilandi! ✨");
            await loadProfileData();
            closeOverlay('profileEditOverlay');
            const { renderProfileView } = await import("./profile.tsx");
            renderProfileView(profile);
        } else throw error;
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};
