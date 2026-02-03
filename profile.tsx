
import { profile, user, openOverlay, showToast, handleSignOut, loadProfileData, supabase, closeOverlay } from "./index.tsx";

export async function renderProfileView(data) {
    const container = document.getElementById('profileView');
    if(!container) return;

    if(!user) {
        container.innerHTML = `<div style="text-align:center; padding:5rem 2rem;"><h3>Kirish talab etiladi</h3></div>`;
        return;
    }

    const email = user.email;
    const avatar = data?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email;
    const isAdmin = data?.role === 'admin' || data?.role === 'staff';
    const isCourier = data?.role === 'courier';
    const referralCode = data?.id?.substring(0, 8).toUpperCase() || "ELAZ-USER";

    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- ADMIN PANEL CARD -->
            ${isAdmin ? `
                <div style="background:#1e293b; color:white; padding:22px; border-radius:28px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 10px 25px rgba(0,0,0,0.15);">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:48px; height:48px; background:rgba(255,255,255,0.1); border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--primary);">
                            <i class="fas fa-user-shield" style="font-size:1.3rem;"></i>
                        </div>
                        <div>
                            <div style="font-size:0.95rem; font-weight:800;">Boshqaruv Paneli</div>
                            <div style="font-size:0.75rem; opacity:0.6; font-weight:600;">Tizimni nazorat qilish</div>
                        </div>
                    </div>
                    <button class="btn" style="height:40px; padding:0 18px; font-size:0.75rem; background:var(--primary); color:white; width:auto; border:none; border-radius:12px; font-weight:900;" onclick="enterAdminPanel()">
                        O'TISH <i class="fas fa-external-link-alt" style="font-size:0.6rem; margin-left:5px;"></i>
                    </button>
                </div>
            ` : ''}

            <!-- USER HEADER -->
            <div style="display:flex; align-items:center; gap:22px; margin-bottom:30px; position:relative;">
                <div style="position:relative; cursor:pointer;" onclick="document.getElementById('avatarInput').click()">
                    <div style="width:110px; height:110px; border-radius:35px; background:#1e293b; padding:4px; box-shadow:var(--shadow-lg);">
                        <img id="profileAvatarImg" src="${avatar}" 
                             style="width:100%; height:100%; border-radius:31px; object-fit:cover; background:white;">
                    </div>
                    <div style="position:absolute; bottom:0; right:0; width:36px; height:36px; background:var(--primary); color:white; border-radius:12px; display:flex; align-items:center; justify-content:center; border:4px solid white; font-size:0.9rem;">
                        <i class="fas fa-camera"></i>
                    </div>
                    <input type="file" id="avatarInput" style="display:none;" onchange="uploadAvatar(this)">
                </div>
                <div style="flex:1;">
                    <h2 style="font-weight:900; font-size:1.6rem; color:var(--text); letter-spacing:-0.5px;">${data?.first_name || 'Foydalanuvchi'} ${data?.last_name || ''}</h2>
                    <p style="font-size:0.9rem; color:var(--gray); font-weight:700; margin-top:2px;">${email}</p>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px; color:var(--primary); font-weight:800; font-size:0.9rem;">
                        <i class="fas fa-phone"></i> ${data?.phone || 'Raqam kiritilmagan'}
                    </div>
                </div>
            </div>

            <!-- REFERRAL CARD -->
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 25px; border-radius: 30px; margin-bottom: 25px; color: white; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(99, 102, 241, 0.25);">
                <div style="position: relative; z-index: 2;">
                    <h4 style="font-weight: 900; font-size: 1.1rem; margin-bottom: 5px;">Do'stlarni taklif qiling 🎁</h4>
                    <p style="font-size: 0.75rem; opacity: 0.85; font-weight: 600; margin-bottom: 15px;">Har bir taklif uchun 5 000 so'm oling!</p>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1; background: rgba(255,255,255,0.15); padding: 12px; border-radius: 12px; font-family: monospace; font-weight: 900; text-align: center; border: 1px dashed rgba(255,255,255,0.3); font-size: 1.1rem;">
                            ${referralCode}
                        </div>
                        <button class="btn" style="width: 50px; height: 50px; background: white; color: #6366f1; padding: 0; border: none; border-radius: 12px;" onclick="copyReferralCode('${referralCode}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <i class="fas fa-gift" style="position: absolute; right: -20px; bottom: -20px; font-size: 8rem; opacity: 0.1; transform: rotate(-15deg);"></i>
            </div>

            <!-- STATS CARDS -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div style="background:#22c55e; color:white; padding:22px; border-radius:28px; box-shadow: 0 10px 30px rgba(34,197,94,0.18);">
                    <p style="font-size:0.7rem; font-weight:800; opacity:0.8; letter-spacing:1px; text-transform:uppercase;">BALANS</p>
                    <h3 style="font-size:1.6rem; font-weight:900; margin-top:8px;">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.8rem; font-weight:600;">so'm</small></h3>
                </div>
                <div style="background:white; border:1px solid #f1f5f9; padding:22px; border-radius:28px; box-shadow: var(--shadow-sm);">
                    <p style="font-size:0.7rem; font-weight:800; color:var(--gray); letter-spacing:1px; text-transform:uppercase;">BUYURTMALAR</p>
                    <h3 style="font-size:1.6rem; font-weight:900; margin-top:8px; color:var(--text);">${ordersCount || 0} <small style="font-size:0.8rem; font-weight:600; color:var(--gray);">ta</small></h3>
                </div>
            </div>

            <!-- MENU LIST -->
            <div class="card" style="padding:10px; border-radius:30px; border:1px solid #f1f5f9; margin-bottom:25px; overflow:hidden; background:white; box-shadow:var(--shadow-sm);">
                <div class="menu-item" onclick="handleMenuClick('profileEdit')" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#f0fdf4; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-user-edit" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Ma'lumotlarni tahrirlash</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>
                
                <div class="menu-item" onclick="handleMenuClick('security')" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#fff1f2; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--danger);"><i class="fas fa-shield-alt" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Xavfsizlik</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div class="menu-item" onclick="handleMenuClick('payment')" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#eff6ff; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#3b82f6;"><i class="fas fa-wallet" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Hamyon va To'lovlar</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                ${!isCourier ? `
                <div class="menu-item" onclick="handleMenuClick('courierApply')" style="display:flex; align-items:center; gap:18px; padding:20px; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#fefce8; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#eab308;"><i class="fas fa-motorcycle" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Kuryerlikka ariza berish</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>
                ` : ''}
            </div>

            <button class="btn btn-outline" style="width:100%; color:var(--danger); border:2px solid #fee2e2; background:#fffcfc; height:65px; border-radius:24px; font-weight:900;" onclick="handleSignOut()">
                <i class="fas fa-sign-out-alt"></i> CHIQISH
            </button>
        </div>
    `;
}

(window as any).copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Kod nusxalandi! Do'stlaringizga yuboring 🚀");
};

(window as any).uploadAvatar = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file || !user) return;
    
    showToast("Avatar yuklanmoqda...");
    const fileName = `avatars/${user.id}-${Date.now()}.jpg`;
    
    try {
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if(uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        
        const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        if(updateError) throw updateError;

        showToast("Avatar yangilandi! ✨");
        await loadProfileData();
        renderProfileView(profile);
    } catch (e: any) {
        showToast("Yuklashda xato: " + e.message);
    }
};

(window as any).handleMenuClick = async (type: string) => {
    try {
        if(type === 'profileEdit') {
            const m = await import("./profileEdit.tsx");
            m.openProfileEdit();
        } else if(type === 'security') {
            const m = await import("./security.tsx");
            m.openProfileSecurity();
        } else if(type === 'payment') {
            const m = await import("./payment.tsx");
            m.openPaymentView();
        } else if(type === 'courierApply') {
            const m = await import("./courierRegistration.tsx");
            m.openCourierRegistrationForm();
        }
    } catch (e) {
        console.error("Menu Error:", e);
        showToast("Sahifani yuklashda xatolik yuz berdi");
    }
};
