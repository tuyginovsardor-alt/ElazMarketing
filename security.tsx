
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

export const openProfileSecurity = () => {
    const placeholder = document.getElementById('profileSecurityPlaceholder');
    if(!placeholder) return;
    
    placeholder.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
            <i class="fas fa-arrow-left" onclick="closeOverlay('profileSecurityOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text);"></i>
            <h2 style="font-weight:900; font-size:1.3rem;">Xavfsizlik sozlamalari</h2>
        </div>

        <div class="card" style="border-radius:24px;">
            <h3 style="font-size:1rem; font-weight:800; margin-bottom:15px;">Parolni yangilash</h3>
            <label>Yangi parol</label>
            <input type="password" id="newPass" placeholder="••••••••">
            <label>Parolni tasdiqlang</label>
            <input type="password" id="newPassConfirm" placeholder="••••••••">
            <button class="btn btn-dark" style="margin-top:1rem; width:100%;" onclick="updateUserPassword()">PAROLNI YANGILASH</button>
        </div>

        <div class="card" style="border-color:var(--danger); background:#fff5f5; border-radius:24px; margin-top:20px;">
            <h3 style="color:var(--danger); font-size:1rem; font-weight:800;">Xavfli hudud</h3>
            <p style="font-size:0.8rem; color:#666; margin:10px 0;">Akkauntni o'chirib yuborsangiz, barcha ma'lumotlaringiz qayta tiklanmaydi.</p>
            <button class="btn btn-outline" style="border-color:var(--danger); color:var(--danger); width:100%;" onclick="deleteMyAccount()">AKKAUNTNI O'CHIRISH</button>
        </div>
    `;
    openOverlay('profileSecurityOverlay');
};

(window as any).openProfileSecurity = openProfileSecurity;

(window as any).updateUserPassword = async () => {
    const p1 = (document.getElementById('newPass') as HTMLInputElement).value;
    const p2 = (document.getElementById('newPassConfirm') as HTMLInputElement).value;
    if(p1 !== p2) return showToast("Parollar mos kelmadi");
    if(p1.length < 6) return showToast("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if(error) showToast("Xatolik: " + error.message);
    else {
        showToast("Parol muvaffaqiyatli o'zgartirildi!");
        closeOverlay('profileSecurityOverlay');
    }
};

(window as any).deleteMyAccount = () => {
    if(confirm("Haqiqatan ham akkauntingizni o'chirmoqchimisiz?")) {
        showToast("Ushbu amal hozircha cheklangan. Admin bilan bog'laning.");
    }
};
