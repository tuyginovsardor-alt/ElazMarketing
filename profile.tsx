
import { profile, user, openOverlay, showToast, supabase, loadProfileData, navTo } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isAdmin = data?.role === 'admin' || data?.role === 'staff';
    const isCourier = data?.role === 'courier';
    const isLinked = !!data?.telegram_id;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- AVATAR & INFO -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; width:150px; height:150px; background:rgba(255,255,255,0.1); border-radius:50%;"></div>
                
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:90px; height:90px; border-radius:32px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:var(--shadow-sm);">
                        ${data?.avatar_url ? 
                            `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : 
                            `<i class="fas fa-user-circle" style="font-size:3.5rem; color:var(--primary);"></i>`
                        }
                    </div>
                    
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.7rem; margin-bottom:4px; text-transform: capitalize;">${data?.first_name || 'foydalanuvchi'}</h2>
                        <div style="font-size:0.75rem; font-weight:700; opacity:0.85; display:flex; align-items:center; gap:5px;">
                            <i class="fas fa-envelope" style="font-size:0.6rem;"></i> ${user.email}
                        </div>
                        <div style="margin-top:10px; display:inline-flex; align-items:center; gap:6px; font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.15); padding:5px 12px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fas ${isAdmin ? 'fa-crown' : (isCourier ? 'fa-motorcycle' : 'fa-user')}"></i>
                            ${data?.role || 'USER'} ${isLinked ? '• <i class="fab fa-telegram"></i>' : ''}
                        </div>
                    </div>

                    <div style="width:48px; height:48px; border-radius:16px; background:white; color:var(--primary); display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 15px rgba(0,0,0,0.1); transition:0.3s;" onclick="import('./profileEdit.tsx').then(m => m.openProfileEdit())">
                        <i class="fas fa-user-edit" style="font-size:1.2rem;"></i>
                    </div>
                </div>
            </div>

            <!-- WALLET & HISTORY -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="openPayment()" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; cursor:pointer; background:white; text-align:center; transition:0.3s; position:relative;">
                    <div style="position:absolute; top:12px; right:12px; width:22px; height:22px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:0.7rem; box-shadow:0 4px 8px rgba(34,197,94,0.2);"><i class="fas fa-plus"></i></div>
                    <i class="fas fa-wallet" style="color:var(--primary); margin-bottom:12px; font-size:1.5rem;"></i>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; letter-spacing:0.5px;">Hamyon</div>
                    <div style="font-weight:900; font-size:1.2rem; color:var(--text);">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; cursor:pointer; background:white; text-align:center; transition:0.3s;">
                    <i class="fas fa-receipt" style="color:#3b82f6; margin-bottom:12px; font-size:1.5rem;"></i>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; letter-spacing:0.5px;">Tarix</div>
                    <div style="font-weight:900; font-size:1.2rem; color:var(--text);">Buyurtmalar</div>
                </div>
            </div>

            <!-- BOTGA ULASH -->
            ${!isLinked ? `
                <div onclick="connectToBot()" class="card" style="background:#eff6ff; border:1.5px solid #dbeafe; padding:20px; border-radius:30px; margin-bottom:25px; display:flex; align-items:center; gap:20px; cursor:pointer; transition:0.3s;">
                    <div style="width:50px; height:50px; border-radius:18px; background:white; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.4rem; box-shadow:0 5px 15px rgba(59,130,246,0.1);"><i class="fab fa-telegram"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:1rem; color:#1e40af;">Botni ulang</div>
                        <p style="font-size:0.75rem; color:#3b82f6; font-weight:600; margin-top:2px;">Buyurtma xabarlarini Telegramda oling.</p>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#3b82f6; font-size:0.8rem;"></i>
                </div>
            ` : ''}

            <!-- MAIN MENU -->
            <div class="card" style="padding:8px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px; box-shadow:var(--shadow-sm);">
                
                ${isAdmin ? `
                    <div onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; border-radius:12px; background:var(--dark); color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem;">Admin Panel</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                ` : ''}

                <!-- BALANCE TOP UP MENU ITEM -->
                <div onclick="openPayment()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f0fdf4; color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-plus-circle"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Hisobni to'ldirish</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                ${isCourier ? `
                    <div onclick="openCourierDashboard()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; border-radius:12px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-route"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem;">Kuryer Ish Joyi</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                ` : `
                    <div onclick="openCourierRegistration()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; border-radius:12px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-motorcycle"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem;">Kuryer bo'lish</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                `}

                <div onclick="openSupportCenter()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-headset"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Yordam markazi</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div onclick="openLegal('offer')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-file-contract"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Ommaviy oferta</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div onclick="openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-lock"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:800; background:white; margin-bottom:30px; box-shadow:var(--shadow-sm);" onclick="handleSignOut()">
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
