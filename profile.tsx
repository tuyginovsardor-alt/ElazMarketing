
import { profile, user, openOverlay, showToast, supabase, loadProfileData, navTo, enterAdminPanel } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isAdmin = data?.role === 'admin' || data?.role === 'staff';
    const isCourier = data?.role === 'courier';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- AVATAR & BASIC INFO -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative;">
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:85px; height:85px; border-radius:30px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${data?.avatar_url ? 
                            `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : 
                            `<i class="fas fa-user-circle" style="font-size:3rem; color:var(--primary);"></i>`
                        }
                    </div>
                    
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.6rem; margin-bottom:5px; text-transform: lowercase;">${data?.first_name || 'foydalanuvchi'}</h2>
                        <div style="font-size:0.75rem; font-weight:800; opacity:0.8;">${user.email}</div>
                        <div style="margin-top:8px; display:inline-block; font-size:0.6rem; font-weight:900; background:rgba(0,0,0,0.1); padding:4px 12px; border-radius:10px; text-transform:uppercase;">
                            ${data?.role || 'USER'}
                        </div>
                    </div>

                    <div style="width:42px; height:42px; border-radius:14px; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="import('./profileEdit.tsx').then(m => m.openProfileEdit())">
                        <i class="fas fa-pen-nib"></i>
                    </div>
                </div>
            </div>

            <!-- PERSONAL DETAILS CARD -->
            <div class="card" style="border-radius:32px; padding:25px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px;">
                <h3 style="font-weight:900; font-size:0.9rem; color:var(--gray); margin-bottom:15px; text-transform:uppercase;">Shaxsiy Ma'lumotlar</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div>
                        <div style="font-size:0.65rem; font-weight:800; color:#94a3b8; margin-bottom:4px;">TELEFON</div>
                        <div style="font-weight:800; font-size:0.9rem;">${data?.phone || 'Kiritilmagan'}</div>
                    </div>
                    <div>
                        <div style="font-size:0.65rem; font-weight:800; color:#94a3b8; margin-bottom:4px;">MANZIL</div>
                        <div style="font-weight:800; font-size:0.85rem;">${data?.district || 'Markaz'}</div>
                    </div>
                </div>
            </div>

            <!-- ADMIN/COURIER QUICK ACTION -->
            ${isAdmin ? `
                <div class="card" style="padding:22px; border-radius:32px; border:none; background:var(--dark); color:white; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="enterAdminPanel()">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:45px; height:45px; background:var(--primary); border-radius:15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                        <div><h4 style="font-weight:900; font-size:0.9rem;">BOSHQARUV PANELI</h4><p style="font-size:0.7rem; opacity:0.6;">Admin funksiyalari</p></div>
                    </div>
                    <i class="fas fa-chevron-right" style="opacity:0.3;"></i>
                </div>
            ` : (!isCourier ? `
                <div class="card" style="padding:22px; border-radius:32px; border:2px dashed var(--primary); background:var(--primary-light); margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="import('./courierRegistration.tsx').then(m => m.openCourierRegistrationForm())">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:45px; height:45px; background:var(--primary); color:white; border-radius:15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-motorcycle"></i></div>
                        <div><h4 style="font-weight:900; font-size:0.9rem; color:var(--text);">KURER BO'LIB ISHLASH</h4><p style="font-size:0.7rem; color:var(--gray);">Ariza topshirish</p></div>
                    </div>
                    <i class="fas fa-arrow-right" style="color:var(--primary);"></i>
                </div>
            ` : `
                <div class="card" style="padding:22px; border-radius:32px; border:none; background:var(--primary); color:white; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="import('./courierDashboard.tsx').then(m => m.renderCourierDashboard())">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:45px; height:45px; background:rgba(255,255,255,0.2); border-radius:15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-route"></i></div>
                        <div><h4 style="font-weight:900; font-size:0.9rem;">KURER PANELI</h4><p style="font-size:0.7rem; opacity:0.8;">Buyurtmalarni yetkazish</p></div>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `)}

            <!-- WALLET & HISTORY -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="import('./payment.tsx').then(m => m.openPaymentView())" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; cursor:pointer;">
                    <i class="fas fa-wallet" style="color:var(--primary); margin-bottom:12px; font-size:1.2rem;"></i>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Balans</div>
                    <div style="font-weight:900; font-size:1.2rem;">${(data?.balance || 0).toLocaleString()} <small>UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; cursor:pointer;">
                    <i class="fas fa-clock-rotate-left" style="color:#3b82f6; margin-bottom:12px; font-size:1.2rem;"></i>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Tarix</div>
                    <div style="font-weight:900; font-size:1.2rem;">Xaridlar</div>
                </div>
            </div>

            <!-- APP SERVICES -->
            <div class="card" style="padding:10px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px;">
                <div onclick="import('./supportView.tsx').then(m => m.renderSupportView())" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-headset"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Yordam markazi</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div onclick="import('./security.tsx').then(m => m.openProfileSecurity())" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-shield-halved"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:800; background:white;" onclick="handleSignOut()">
                CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:8px;"></i>
            </button>
        </div>
    `;
}

(window as any).handleSignOut = async () => {
    if(confirm("Haqiqatan ham chiqmoqchimisiz?")) {
        await supabase.auth.signOut();
        window.location.reload();
    }
};
