
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
                <div style="width:80px; height:80px; border-radius:25px; background:var(--dark); overflow:hidden;">
                    <img src="${data?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+user.email}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="flex:1;">
                    <h2 style="font-weight:900;">${data?.first_name || 'Foydalanuvchi'}</h2>
                    <p style="font-size:0.8rem; color:var(--gray);">${user.email}</p>
                    <div style="margin-top:5px;">
                        <span style="background:var(--primary-light); color:var(--primary); padding:3px 10px; border-radius:8px; font-size:0.6rem; font-weight:900;">${data?.role?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" style="padding:20px; text-align:center;">
                    <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">BALANS</div>
                    <div style="font-weight:900; font-size:1.2rem; color:var(--primary);">${(data?.balance || 0).toLocaleString()}</div>
                </div>
                <div class="card" style="padding:20px; text-align:center;">
                    <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">TELEGRAM ID</div>
                    <div style="font-weight:900; font-size:1.2rem;">${data?.telegram_id || 'Ulanmagan'}</div>
                </div>
            </div>

            <div class="card" style="padding:5px; border-radius:24px; overflow:hidden; margin-bottom:20px;">
                ${isCourier ? `
                    <div class="menu-item" onclick="navTo('courier')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f1f5f9;">
                        <i class="fas fa-motorcycle" style="color:var(--primary);"></i>
                        <b style="flex:1;">Kuryerlik Paneli</b>
                        <span style="font-size:0.7rem; color:${isOnline ? 'var(--primary)' : 'var(--danger)'};">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                ` : ''}

                ${isAdmin ? `
                    <div class="menu-item" onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f1f5f9;">
                        <i class="fas fa-user-shield" style="color:var(--dark);"></i>
                        <b style="flex:1;">Admin Panel</b>
                    </div>
                ` : ''}

                <div class="menu-item" onclick="handleMenuClick('profileEdit')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f1f5f9;">
                    <i class="fas fa-user-edit"></i>
                    <b style="flex:1;">Ma'lumotlarni tahrirlash</b>
                </div>

                <div class="menu-item" onclick="handleMenuClick('payment')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f1f5f9;">
                    <i class="fas fa-wallet" style="color:#3b82f6;"></i>
                    <b style="flex:1;">Hamyon</b>
                </div>

                <div class="menu-item" onclick="handleMenuClick('security')" style="display:flex; align-items:center; gap:15px; padding:18px;">
                    <i class="fas fa-shield-alt"></i>
                    <b style="flex:1;">Xavfsizlik</b>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; border-color:#fee2e2; color:var(--danger);" onclick="handleSignOut()">
                <i class="fas fa-sign-out-alt"></i> CHIQISH
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
