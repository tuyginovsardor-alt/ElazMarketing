
import { supabase, profile, showToast, openOverlay, loadProfileData, closeOverlay } from "./index.tsx";

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

    placeholder.innerHTML = `
        <div style="padding-bottom:100px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('profileEditOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding: 5px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Profilni tahrirlash</h2>
            </div>

            <div style="text-align:center; margin-bottom:30px;">
                <div style="position:relative; width:120px; height:120px; margin:0 auto;">
                    <div style="width:120px; height:120px; border-radius:40px; background:#f8fafc; overflow:hidden; border:4px solid white; box-shadow:var(--shadow-lg); display:flex; align-items:center; justify-content:center;">
                        <img id="editAvatarPreview" src="${profile.avatar_url || 'https://via.placeholder.com/150?text=Avatar'}" style="width:100%; height:100%; object-fit:cover;">
                        <div id="avatarLoading" style="display:none; position:absolute; inset:0; background:rgba(255,255,255,0.7); align-items:center; justify-content:center; border-radius:40px;">
                            <i class="fas fa-sync fa-spin" style="color:var(--primary); font-size:1.5rem;"></i>
                        </div>
                    </div>
                    <label for="avatarInput" style="position:absolute; bottom:-5px; right:-5px; width:40px; height:40px; border-radius:15px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; border:3px solid white; box-shadow:var(--shadow-sm);">
                        <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" id="avatarInput" accept="image/*" style="display:none;" onchange="handleAvatarUpload(this)">
                </div>
            </div>

            <div class="card" style="border-radius: 35px; padding: 25px; border:1.5px solid #f1f5f9; background:white;">
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Ismingiz</label>
                    <input type="text" id="editFName" value="${profile.first_name || ''}" placeholder="Ism" style="height:62px; font-weight:700;">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Familiyangiz</label>
                    <input type="text" id="editLName" value="${profile.last_name || ''}" placeholder="Familiya" style="height:62px; font-weight:700;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Telefon raqami</label>
                    <input type="tel" id="editPhone" value="${profile.phone || ''}" placeholder="+998" style="height:62px; font-weight:700;">
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

(window as any).handleAvatarUpload = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file || !profile) return;

    if(file.size > 2 * 1024 * 1024) return showToast("Rasm hajmi 2MB dan kichik bo'lishi kerak");

    const loading = document.getElementById('avatarLoading');
    if(loading) loading.style.display = 'flex';

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Supabase-da 'products' bucket ishlatilyapti
        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file, {
            upsert: true
        });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        
        const preview = document.getElementById('editAvatarPreview') as HTMLImageElement;
        if(preview) preview.src = publicUrl;
        
        (window as any).tempAvatarUrl = publicUrl;
        showToast("Rasm tayyor! Saqlash tugmasini bosing.");

    } catch (e: any) {
        console.error("Upload Error:", e);
        showToast("Rasm yuklashda xato! (RLS bo'lishi mumkin)");
    } finally {
        if(loading) loading.style.display = 'none';
    }
};

(window as any).saveProfileChanges = async () => {
    const btn = document.getElementById('btnSaveProfile') as HTMLButtonElement;
    const first_name = (document.getElementById('editFName') as HTMLInputElement).value.trim();
    const last_name = (document.getElementById('editLName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('editPhone') as HTMLInputElement).value.trim();
    const mahalla = (document.getElementById('editMahalla') as HTMLSelectElement).value;
    const avatar_url = (window as any).tempAvatarUrl || profile.avatar_url;

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
        
        if(error) throw error;

        showToast("Ma'lumotlar saqlandi! ✨");
        await loadProfileData();
        closeOverlay('profileEditOverlay');
        const { renderProfileView } = await import("./profile.tsx");
        renderProfileView(profile);
    } catch (e: any) {
        console.error("Update Profile Error:", e);
        showToast("Saqlashda xato: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};
