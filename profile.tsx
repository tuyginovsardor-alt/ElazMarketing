
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
                    <p style="font-size:0.75rem; color:var(--gray); font-weight:600; margin-top:5px;"><i class="fas fa-map-marker-alt" style="font-size:0.65rem;"></i> ${data?.district || 'Manzil yo\'q'}</p>
                </div>
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
                <div class="menu-item" onclick="import('./profileEdit.tsx').then(m => m.openProfileEdit())" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#f0fdf4; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-user-edit" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Ma'lumotlarni tahrirlash</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>
                
                <div class="menu-item" onclick="import('./payment.tsx').then(m => m.openPaymentView())" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#eff6ff; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#3b82f6;"><i class="fas fa-wallet" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Hamyon va To'lovlar</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div class="menu-item" onclick="import('./security.tsx').then(m => m.openProfileSecurity())" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#f5f3ff; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#8b5cf6;"><i class="fas fa-shield-alt" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Xavfsizlik</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div class="menu-item" onclick="openAppInfo()" style="display:flex; align-items:center; gap:18px; padding:20px; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#f8fafc; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-info-circle" style="font-size:1.1rem;"></i></div>
                    <div style="flex:1; font-weight:800; font-size:1rem; color:var(--text);">Ilova haqida</div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; color:var(--danger); border:2px solid #fee2e2; background:#fffcfc; height:65px; border-radius:24px; font-weight:900;" onclick="handleSignOut()">
                <i class="fas fa-sign-out-alt"></i> CHIQISH
            </button>
        </div>

        <div id="appInfoOverlay" class="overlay" style="padding:0; background:white;">
            <div style="padding:25px; min-height:100vh;">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:30px;">
                    <i class="fas fa-arrow-left" onclick="closeOverlay('appInfoOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding:5px;"></i>
                    <h2 style="font-weight:900; font-size:1.5rem;">Ilova haqida</h2>
                </div>
                
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="width:95px; height:95px; background:var(--gradient); border-radius:28px; display:inline-flex; align-items:center; justify-content:center; color:white; font-size:2.8rem; box-shadow:0 15px 35px rgba(34,197,94,0.2); margin-bottom:20px;">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <h3 style="font-weight:900; font-size:1.6rem;">ELAZ MARKET</h3>
                    <p style="color:var(--gray); font-size:0.85rem; font-weight:700;">Versiya 1.0.8 (Pro)</p>
                </div>

                <div class="card" style="padding:8px; border-radius:28px; border:1px solid #f1f5f9; background:white; box-shadow:var(--shadow-sm);">
                    <div onclick="openLegalView('offer')" style="display:flex; align-items:center; gap:18px; padding:20px; border-bottom:1px solid #f1f5f9; cursor:pointer;">
                        <div style="width:42px; height:42px; background:var(--primary-light); color:var(--primary); border-radius:12px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-file-contract"></i></div>
                        <span style="font-weight:800; flex:1; font-size:1rem; color:var(--text);">Ommaviy oferta</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>
                    <div onclick="openLegalView('privacy')" style="display:flex; align-items:center; gap:18px; padding:20px; cursor:pointer;">
                        <div style="width:42px; height:42px; background:#eff6ff; color:#3b82f6; border-radius:12px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-user-shield"></i></div>
                        <span style="font-weight:800; flex:1; font-size:1rem; color:var(--text);">Maxfiylik siyosati</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
}

(window as any).openAppInfo = () => openOverlay('appInfoOverlay');
(window as any).openLegalView = (type: string) => {
    import('./legal.tsx').then(m => m.openLegal(type as any));
};

(window as any).uploadAvatar = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file || !user) return;
    showToast("Yuklanmoqda...");
    const fileName = `avatars/${user.id}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
    if(uploadError) return showToast("Yuklashda xato");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    await loadProfileData();
    renderProfileView(profile);
};
