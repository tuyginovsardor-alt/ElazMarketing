
// Added navTo to imports to fix "Cannot find name 'navTo'" error
import { supabase, profile, showToast, openOverlay, loadProfileData, closeOverlay, navTo } from "./index.tsx";

export const BAGDOD_MAHALLALARI = [
    "Tuman Markazi", "Guliston shahri", "Markaz", "Guliston", "Istiqlol", "Bog'dod", 
    "Samarqand", "Tinchlik", "Navoiy", "Paxtaobod", "Zafar", "Nurafshon", 
    "Do'stlik", "Ahillik", "Obod", "Farovon", "Yangi hayot"
];

export const openProfileEdit = () => {
    if(!profile) return showToast("Profil ma'lumotlari yuklanmoqda...");
    const placeholder = document.getElementById('profileEditPlaceholder');
    if(!placeholder) return;
    
    const districtParts = profile.district ? profile.district.split(', ') : ['', ''];
    const currentMahalla = districtParts[1] || districtParts[0] || '';
    
    // Telefon raqamni formatlash: +998901234567 -> (90) 123-45-67
    let displayPhone = profile.phone ? profile.phone.replace('+998', '') : '';
    if (displayPhone.length === 9) {
        displayPhone = `(${displayPhone.substring(0,2)}) ${displayPhone.substring(2,5)}-${displayPhone.substring(5,7)}-${displayPhone.substring(7,9)}`;
    }

    placeholder.innerHTML = `
        <div style="padding-bottom:100px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('profileEditOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding: 5px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Profilni tahrirlash</h2>
            </div>

            <div class="card" style="border-radius: 35px; padding: 25px; border:1.5px solid #f1f5f9; background:white;">
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Ismingiz</label>
                    <input type="text" id="editFName" value="${profile.first_name || ''}" placeholder="Ism" style="height:62px; font-weight:700;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Telefon raqami</label>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text);">+998</span>
                        <input type="tel" id="editPhone" value="${displayPhone}" placeholder="(90) 000-00-00" maxlength="14"
                            style="height:62px; font-weight:700; padding-left: 60px;" oninput="window.maskPhone(this)">
                    </div>
                </div>

                <div style="margin-bottom:30px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Hudud</label>
                    <select id="editMahalla" style="height:62px; font-weight:700;">
                        <option value="">Tanlang...</option>
                        ${BAGDOD_MAHALLALARI.map(m => `<option value="${m}" ${currentMahalla === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>

                <button class="btn btn-primary" id="btnSaveProfile" style="width: 100%; height:65px; border-radius:24px;" onclick="saveProfileChanges()">
                    SAQLASH <i class="fas fa-check-circle" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>
    `;
    openOverlay('profileEditOverlay');
};

(window as any).openProfileEdit = openProfileEdit;

(window as any).saveProfileChanges = async () => {
    const btn = document.getElementById('btnSaveProfile') as HTMLButtonElement;
    const first_name = (document.getElementById('editFName') as HTMLInputElement).value.trim();
    const phone = '+998' + (document.getElementById('editPhone') as HTMLInputElement).value.replace(/\D/g, '');
    const mahalla = (document.getElementById('editMahalla') as HTMLSelectElement).value;

    if(!first_name || phone.length < 12) return showToast("Ism va telefon raqami to'liq bo'lishi shart!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> SAQLANMOQDA...';
    
    const fullDistrict = `Bag'dod, ${mahalla || 'Markaz'}`;

    try {
        const { error } = await supabase.from('profiles').update({ 
            first_name, 
            phone, 
            district: fullDistrict 
        }).eq('id', profile.id);
        
        if(error) throw error;

        showToast("Ma'lumotlar saqlandi! ✨");
        await loadProfileData();
        closeOverlay('profileEditOverlay');
        navTo('profile');
    } catch (e: any) {
        showToast("Saqlashda xato: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};
