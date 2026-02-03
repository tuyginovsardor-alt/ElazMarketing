
import { profile, user, openOverlay, showToast, handleSignOut, loadProfileData, supabase, closeOverlay } from "./index.tsx";

export async function renderProfileView(data) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isAdmin = data?.role === 'admin' || data?.role === 'staff';
    const isCourier = data?.role === 'courier';
    const isOnline = data?.active_status;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:30px;">
                <div style="width:80px; height:80px; border-radius:25px; background:var(--dark); overflow:hidden; border:4px solid white; box-shadow:var(--shadow-sm);">
                    <img src="${data?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+user.email}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="flex:1;">
                    <h2 style="font-weight:900; font-size:1.5rem;">${data?.first_name || 'Foydalanuvchi'}</h2>
                    <p style="font-size:0.8rem; color:var(--gray); font-weight:600;">${user.email}</p>
                    <div style="margin-top:8px; display:flex; gap:8px;">
                        <span style="background:var(--primary-light); color:var(--primary); padding:4px 12px; border-radius:10px; font-size:0.6rem; font-weight:900; border:1px solid var(--primary);">${data?.role?.toUpperCase()}</span>
                        ${isCourier ? `<span style="background:${isOnline ? 'var(--primary-light)' : '#fef2f2'}; color:${isOnline ? 'var(--primary)' : 'var(--danger)'}; padding:4px 12px; border-radius:10px; font-size:0.6rem; font-weight:900;">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>` : ''}
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" style="padding:20px; text-align:center; border:none; background:white; box-shadow:var(--shadow-sm); border-radius:24px;">
                    <div style="font-size:0.65rem; color:var(--gray); font-weight:800; letter-spacing:1px; margin-bottom:5px;">HAMYON</div>
                    <div style="font-weight:900; font-size:1.3rem; color:var(--primary);">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                </div>
                <div class="card" style="padding:20px; text-align:center; border:none; background:white; box-shadow:var(--shadow-sm); border-radius:24px;">
                    <div style="font-size:0.65rem; color:var(--gray); font-weight:800; letter-spacing:1px; margin-bottom:5px;">TELEGRAM ID</div>
                    <div style="font-weight:900; font-size:1.3rem; color:var(--dark);">${data?.telegram_id || '<span style="color:#cbd5e1; font-size:0.8rem;">Yo\'q</span>'}</div>
                </div>
            </div>

            <div class="card" style="padding:8px; border-radius:28px; border:none; background:white; box-shadow:var(--shadow-sm); margin-bottom:25px; overflow:hidden;">
                ${isCourier ? `
                    <div class="menu-item" onclick="navTo('courier')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; background:#f0fdf4; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-motorcycle"></i></div>
                        <b style="flex:1; font-size:0.95rem;">Kuryerlik Paneli</b>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                ` : `
                    <div class="menu-item" onclick="handleMenuClick('courierApply')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; background:#f0fdf4; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-user-plus"></i></div>
                        <b style="flex:1; font-size:0.95rem;">Kuryer bo'lib ishlash</b>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                `}

                ${isAdmin ? `
                    <div class="menu-item" onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; background:var(--dark); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fas fa-user-shield"></i></div>
                        <b style="flex:1; font-size:0.95rem;">Admin Panel</b>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                ` : ''}

                <div class="menu-item" onclick="handleMenuClick('profileEdit')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; background:#eff6ff; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#3b82f6;"><i class="fas fa-user-edit"></i></div>
                    <b style="flex:1; font-size:0.95rem;">Ma'lumotlarni tahrirlash</b>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div class="menu-item" onclick="handleMenuClick('payment')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; background:#fff7ed; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#f97316;"><i class="fas fa-wallet"></i></div>
                    <b style="flex:1; font-size:0.95rem;">Hamyon va To'lovlar</b>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div class="menu-item" onclick="handleMenuClick('security')" style="display:flex; align-items:center; gap:15px; padding:18px; cursor:pointer;">
                    <div style="width:40px; height:40px; background:#f5f3ff; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#8b5cf6;"><i class="fas fa-shield-alt"></i></div>
                    <b style="flex:1; font-size:0.95rem;">Xavfsizlik</b>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; height:62px; border-radius:22px; border-color:#fee2e2; color:var(--danger); font-weight:900;" onclick="handleSignOut()">
                <i class="fas fa-sign-out-alt"></i> TIZIMDAN CHIQISH
            </button>
        </div>
    `;
}

(window as any).handleMenuClick = async (type: string) => {
    if(type === 'profileEdit') { const m = await import("./profileEdit.tsx"); m.openProfileEdit(); }
    if(type === 'payment') { const m = await import("./payment.tsx"); m.openPaymentView(); }
    if(type === 'security') { const m = await import("./security.tsx"); m.openProfileSecurity(); }
    if(type === 'courierApply') { const m = await import("./courierRegistration.tsx"); m.openCourierRegistrationForm(); }
};
