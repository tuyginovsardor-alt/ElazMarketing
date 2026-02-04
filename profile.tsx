
import { profile, user, openOverlay, showToast, handleSignOut, supabase } from "./index.tsx";

export async function renderProfileView(data) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isCourier = data?.role === 'courier';
    const isAdmin = data?.role === 'admin' || data?.role === 'staff';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- ROLE HEADER -->
            <div style="background:white; border-radius:30px; padding:25px; box-shadow:var(--shadow-sm); margin-bottom:25px; border:1px solid #f1f5f9; position:relative; overflow:hidden;">
                <div style="position:absolute; top:0; right:0; width:150px; height:150px; background:var(--primary-light); border-radius:50%; margin: -50px -50px 0 0; opacity:0.3; z-index:0;"></div>
                
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:75px; height:75px; border-radius:24px; background:var(--primary-light); display:flex; align-items:center; justify-content:center; border:2px solid var(--primary); color:var(--primary);">
                        <i class="fas ${isCourier ? 'fa-motorcycle' : 'fa-user'}" style="font-size:1.8rem;"></i>
                    </div>
                    <div>
                        <h2 style="font-weight:900; font-size:1.3rem; margin-bottom:4px;">${data?.first_name || 'Foydalanuvchi'}</h2>
                        <div style="display:flex; gap:8px;">
                            <span style="font-size:0.6rem; font-weight:900; background:var(--dark); color:white; padding:4px 10px; border-radius:10px; text-transform:uppercase; letter-spacing:0.5px;">${data?.role}</span>
                            ${isCourier && data?.active_status ? '<span style="font-size:0.6rem; font-weight:900; background:#dcfce7; color:#16a34a; padding:4px 10px; border-radius:10px;">ONLINE 🟢</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- DASHBOARD CARDS -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" style="padding:20px; border-radius:25px; text-align:center; border:none; box-shadow:var(--shadow-sm); background:white;">
                    <div style="width:40px; height:40px; background:var(--primary-light); color:var(--primary); border-radius:12px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px;">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Balans</div>
                    <div style="font-weight:900; color:var(--text); font-size:1.1rem;">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                </div>
                ${isCourier ? `
                    <div class="card" style="padding:20px; border-radius:25px; text-align:center; border:none; box-shadow:var(--shadow-sm); background:white;">
                        <div style="width:40px; height:40px; background:#fff7ed; color:#ea580c; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px;">
                            <i class="fas fa-star"></i>
                        </div>
                        <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Reyting</div>
                        <div style="font-weight:900; color:var(--text); font-size:1.1rem;">${data?.rating || 5.0} <i class="fas fa-star" style="font-size:0.7rem; color:#eab308;"></i></div>
                    </div>
                ` : `
                    <div class="card" style="padding:20px; border-radius:25px; text-align:center; border:none; box-shadow:var(--shadow-sm); background:white;" onclick="navTo('cart')">
                        <div style="width:40px; height:40px; background:#eff6ff; color:#3b82f6; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px;">
                            <i class="fas fa-shopping-basket"></i>
                        </div>
                        <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Savat</div>
                        <div style="font-weight:900; color:var(--text); font-size:1.1rem;">KO'RISH</div>
                    </div>
                `}
            </div>

            <!-- MAIN ACTION MENU -->
            <div class="card" style="padding:8px; border-radius:30px; border:none; background:white; box-shadow:var(--shadow-sm); margin-bottom:25px;">
                
                ${!isCourier ? `
                    <div class="menu-item" onclick="window.open('https://elaz-marketing.vercel.app', '_blank')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc;">
                        <div style="width:44px; height:44px; background:#f0fdf4; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-external-link-alt"></i></div>
                        <div style="flex:1;">
                            <b style="display:block; font-size:0.9rem;">🏢 Saytni ochish</b>
                            <span style="font-size:0.65rem; color:var(--gray); font-weight:600;">elaz-marketing.vercel.app</span>
                        </div>
                        <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                    </div>

                    <div class="menu-item" onclick="handleMenuClick('courierApply')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc;">
                        <div style="width:44px; height:44px; background:#fff7ed; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#ea580c; scale:1.1;"><i class="fas fa-motorcycle"></i></div>
                        <b style="flex:1; font-size:0.9rem;">🛵 Kuryer bo'lib ishlash</b>
                        <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                    </div>
                ` : `
                    <div class="menu-item" onclick="navTo('courier')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc;">
                        <div style="width:44px; height:44px; background:#f0fdf4; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-map-marked-alt"></i></div>
                        <b style="flex:1; font-size:0.9rem;">🚚 Ish boshlash (Kurer paneli)</b>
                        <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                    </div>
                `}

                <div class="menu-item" onclick="handleMenuClick('profileEdit')" style="display:flex; align-items:center; gap:15px; padding:18px; border-bottom:1px solid #f8fafc;">
                    <div style="width:44px; height:44px; background:#eff6ff; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#3b82f6;"><i class="fas fa-user-edit"></i></div>
                    <b style="flex:1; font-size:0.9rem;">👤 Profilni tahrirlash</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>

                <div class="menu-item" onclick="handleMenuClick('support')" style="display:flex; align-items:center; gap:15px; padding:18px; ${isAdmin ? 'border-bottom:1px solid #f8fafc;' : ''}">
                    <div style="width:44px; height:44px; background:#fff1f2; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#f43f5e;"><i class="fas fa-headset"></i></div>
                    <b style="flex:1; font-size:0.9rem;">🆘 Yordam markazi</b>
                    <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                </div>

                ${isAdmin ? `
                    <div class="menu-item" onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px;">
                        <div style="width:44px; height:44px; background:var(--dark); border-radius:14px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fas fa-user-shield"></i></div>
                        <b style="flex:1; font-size:0.9rem;">🔐 Admin Panel</b>
                        <i class="fas fa-chevron-right" style="font-size:0.7rem; color:#cbd5e1;"></i>
                    </div>
                ` : ''}
            </div>

            <button class="btn btn-outline" style="width:100%; border-color:#fee2e2; color:var(--danger); height:65px; border-radius:22px; font-weight:800;" onclick="handleSignOut()">
                <i class="fas fa-power-off"></i> TIZIMDAN CHIQISH
            </button>
        </div>
    `;
}

(window as any).handleMenuClick = async (type: string) => {
    if(type === 'profileEdit') { const m = await import("./profileEdit.tsx"); m.openProfileEdit(); }
    if(type === 'support') { const m = await import("./supportView.tsx"); m.renderSupportView(); }
    if(type === 'courierApply') { const m = await import("./courierRegistration.tsx"); m.openCourierRegistrationForm(); }
};
