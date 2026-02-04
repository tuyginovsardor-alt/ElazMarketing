
import { profile, user, openOverlay, showToast, handleSignOut, supabase } from "./index.tsx";

export async function renderProfileView(data) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isCourier = data?.role === 'courier';
    const isAdmin = data?.role === 'admin' || data?.role === 'staff';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- PROFESSIONAL HEADER -->
            <div style="background:var(--gradient); border-radius:35px; padding:30px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; position:relative; overflow:hidden; color:white;">
                <div style="position:absolute; top:-20px; right:-20px; width:150px; height:150px; background:rgba(255,255,255,0.1); border-radius:50%;"></div>
                
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:85px; height:85px; border-radius:28px; background:rgba(255,255,255,0.2); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.3);">
                        <i class="fas ${isCourier ? 'fa-motorcycle' : 'fa-user'}" style="font-size:2rem;"></i>
                    </div>
                    <div>
                        <h2 style="font-weight:900; font-size:1.5rem; margin-bottom:4px;">${data?.first_name} ${data?.last_name || ''}</h2>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.2); padding:5px 12px; border-radius:12px; text-transform:uppercase;">${data?.role}</span>
                            <span style="font-size:0.65rem; font-weight:900; background:rgba(255,255,255,0.2); padding:5px 12px; border-radius:12px;">ID: ${data?.telegram_id || 'Ulanmagan'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DASHBOARD GRID -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="handleMenuClick('payment')" style="padding:22px; border-radius:28px; text-align:center; border:none; box-shadow:var(--shadow-sm); background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; background:var(--primary-light); color:var(--primary); border-radius:14px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
                        <i class="fas fa-wallet" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:4px;">Mening Balansim</div>
                    <div style="font-weight:900; color:var(--text); font-size:1.2rem;">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                </div>
                
                <div class="card" onclick="navTo('orders')" style="padding:22px; border-radius:28px; text-align:center; border:none; box-shadow:var(--shadow-sm); background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; background:#eff6ff; color:#3b82f6; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
                        <i class="fas fa-shopping-bag" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:4px;">Buyurtmalar</div>
                    <div style="font-weight:900; color:var(--text); font-size:1.2rem;">TARIX</div>
                </div>
            </div>

            <!-- FULL INFO LIST -->
            <div class="card" style="padding:20px; border-radius:30px; border:none; background:white; box-shadow:var(--shadow-sm); margin-bottom:25px;">
                <h4 style="font-weight:900; font-size:0.9rem; margin-bottom:15px; padding-left:5px; color:var(--gray); text-transform:uppercase;">Ma'lumotlar</h4>
                
                <div style="display:flex; flex-direction:column; gap:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #f8fafc;">
                        <span style="font-size:0.85rem; color:var(--gray); font-weight:600;">Gmail Manzil</span>
                        <b style="font-size:0.85rem;">${data?.email}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #f8fafc;">
                        <span style="font-size:0.85rem; color:var(--gray); font-weight:600;">Telefon</span>
                        <b style="font-size:0.85rem;">${data?.phone || 'Kiritilmagan'}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #f8fafc;">
                        <span style="font-size:0.85rem; color:var(--gray); font-weight:600;">Hudud</span>
                        <b style="font-size:0.85rem;">${data?.district || 'Tanlanmagan'}</b>
                    </div>
                    ${isCourier ? `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.85rem; color:var(--gray); font-weight:600;">Kurer Reytingi</span>
                        <b style="font-size:0.85rem; color:#eab308;"><i class="fas fa-star"></i> ${data?.rating || '5.0'}</b>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- ACTION MENU -->
            <div class="card" style="padding:8px; border-radius:32px; border:none; background:white; box-shadow:var(--shadow-sm); margin-bottom:25px;">
                
                <div class="menu-item" onclick="handleMenuClick('profileEdit')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#eff6ff; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#3b82f6;"><i class="fas fa-user-edit"></i></div>
                    <b style="flex:1; font-size:0.9rem;">👤 Profilni tahrirlash</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>

                <div class="menu-item" onclick="handleMenuClick('security')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#f1f5f9; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--dark);"><i class="fas fa-shield-alt"></i></div>
                    <b style="flex:1; font-size:0.9rem;">🔐 Xavfsizlik</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>

                ${!isCourier ? `
                <div class="menu-item" onclick="handleMenuClick('courierApply')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#fff7ed; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#ea580c;"><i class="fas fa-motorcycle"></i></div>
                    <b style="flex:1; font-size:0.9rem;">🛵 Kuryer bo'lib ishlash</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>
                ` : `
                <div class="menu-item" onclick="navTo('courier')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:44px; height:44px; background:#f0fdf4; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-tachometer-alt"></i></div>
                    <b style="flex:1; font-size:0.9rem;">📦 Kuryer Boshqaruvi</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>
                `}

                <div class="menu-item" onclick="handleMenuClick('support')" style="display:flex; align-items:center; gap:15px; padding:18px; ${isAdmin ? 'border-bottom:1px solid #f8fafc;' : ''} cursor:pointer;">
                    <div style="width:44px; height:44px; background:#fff1f2; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#f43f5e;"><i class="fas fa-headset"></i></div>
                    <b style="flex:1; font-size:0.9rem;">🆘 Yordam markazi</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>

                ${isAdmin ? `
                <div class="menu-item" onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px; cursor:pointer;">
                    <div style="width:44px; height:44px; background:var(--dark); border-radius:14px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fas fa-user-shield"></i></div>
                    <b style="flex:1; font-size:0.9rem;">⚙️ Admin Panel</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>
                ` : ''}
            </div>

            <button class="btn btn-outline" style="width:100%; border-color:#fee2e2; color:var(--danger); height:65px; border-radius:24px; font-weight:800; background:white; transition:0.3s;" onclick="handleSignOut()">
                <i class="fas fa-power-off"></i> TIZIMDAN CHIQISH
            </button>
        </div>
    `;
}

(window as any).handleMenuClick = async (type: string) => {
    if(type === 'profileEdit') { const m = await import("./profileEdit.tsx"); m.openProfileEdit(); }
    if(type === 'security') { const m = await import("./security.tsx"); m.openProfileSecurity(); }
    if(type === 'support') { const m = await import("./supportView.tsx"); m.renderSupportView(); }
    if(type === 'courierApply') { const m = await import("./courierRegistration.tsx"); m.openCourierRegistrationForm(); }
    if(type === 'payment') { const m = await import("./payment.tsx"); m.openPaymentView(); }
};
