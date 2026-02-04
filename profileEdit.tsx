
import { supabase, profile, showToast, openOverlay, loadProfileData, closeOverlay } from "./index.tsx";

export const BAGDOD_MAHALLALARI = ["Tuman Markazi", "Guliston shahri", "Markaz", "Guliston", "Istiqlol", "Bog'dod", "Samarqand", "Tinchlik", "Navoiy", "Paxtaobod", "Zafar", "Nurafshon", "Do'stlik", "Ahillik", "Obod", "Farovon", "Yangi hayot"];

export const openProfileEdit = () => {
    if(!profile) return showToast("Profil ma'lumotlari mavjud emas");
    const placeholder = document.getElementById('profileEditPlaceholder');
    if(!placeholder) return;
    
    const districtParts = profile.district ? profile.district.split(', ') : ['', ''];
    const currentMahalla = districtParts[1] || districtParts[0] || '';

    placeholder.innerHTML = `
        <div style="padding-bottom:50px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('profileEditOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding: 5px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Profilni tahrirlash</h2>
            </div>

            <div class="card" style="border-radius: 35px; padding: 25px; border:1.5px solid #f1f5f9; background:white; box-shadow:var(--shadow-sm);">
                
                <!-- AVATAR PREVIEW & INPUT -->
                <div style="text-align:center; margin-bottom:30px;">
                    <div style="width:100px; height:100px; border-radius:35px; background:#f8fafc; margin:0 auto 15px; overflow:hidden; border:3px solid var(--primary-light); display:flex; align-items:center; justify-content:center;">
                        <img id="editAvatarPreview" src="${profile.avatar_url || 'https://via.placeholder.com/150'}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Profil rasm URL manzili</label>
                    <input type="text" id="editAvatarUrl" value="${profile.avatar_url || ''}" placeholder="https://rasm-manzili.jpg" 
                           style="height:55px; font-weight:700; font-size:0.9rem; border-radius:16px;"
                           oninput="document.getElementById('editAvatarPreview').src = this.value || 'https://via.placeholder.com/150'">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Ismingiz</label>
                    <input type="text" id="editFName" value="${profile.first_name || ''}" placeholder="Masalan: Azizbek" style="height:62px; font-weight:700; font-size:1rem; border-radius:18px;">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Familiyangiz</label>
                    <input type="text" id="editLName" value="${profile.last_name || ''}" placeholder="Masalan: To'rayev" style="height:62px; font-weight:700; font-size:1rem; border-radius:18px;">
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

                <button class="btn btn-primary" id="btnSaveProfile" style="width: 100%; height:65px; font-size:1.1rem; border-radius:24px; box-shadow:0 12px 24px rgba(34,197,94,0.3);" onclick="saveProfileChanges()">
                    O'ZGARISHLARNI SAQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
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
    const avatar_url = (document.getElementById('editAvatarUrl') as HTMLInputElement).value.trim();
    const mahalla = (document.getElementById('editMahalla') as HTMLSelectElement).value;

    if(!first_name || !phone) return showToast("Ism va telefon raqami majburiy!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> SAQLANMOQDA...';
    
    const fullDistrict = `Bag'dod, ${mahalla || 'Markaz'}`;

    try {
        const { error } = await supabase.from('profiles').update({ 
            first_name, 
            last_name, 
            phone, 
            avatar_url,
            district: fullDistrict 
        }).eq('id', profile.id);
        
        if(!error) {
            showToast("Ma'lumotlar yangilandi! ✨");
            await loadProfileData();
            closeOverlay('profileEditOverlay');
            const { renderProfileView } = await import("./profile.tsx");
            renderProfileView(profile);
        } else throw error;
    } catch (e: any) {
        showToast("Xatolik: " + e.message);
        btn.disabled = false;
        btn.innerText = "QAYTA URINISH";
    }
};
