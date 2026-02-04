
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

            <!-- WALLET & HISTORY QUICK STATS -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="import('./payment.tsx').then(m => m.openPaymentView())" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; cursor:pointer; background:white;">
                    <i class="fas fa-wallet" style="color:var(--primary); margin-bottom:12px; font-size:1.2rem;"></i>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Hamyon</div>
                    <div style="font-weight:900; font-size:1.1rem;">${(data?.balance || 0).toLocaleString()} <small>UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; cursor:pointer; background:white;">
                    <i class="fas fa-history" style="color:#3b82f6; margin-bottom:12px; font-size:1.2rem;"></i>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Tarix</div>
                    <div style="font-weight:900; font-size:1.1rem;">Buyurtmalar</div>
                </div>
            </div>

            <!-- ACTION SECTIONS -->
            <div class="card" style="padding:10px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px;">
                ${isAdmin ? `
                    <div onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:38px; height:38px; border-radius:12px; background:var(--dark); color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.9rem;">Admin Panel</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                ` : ''}

                ${!isCourier ? `
                    <div onclick="import('./courierRegistration.tsx').then(m => m.openCourierRegistrationForm())" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:38px; height:38px; border-radius:12px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-motorcycle"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.9rem;">Kuryer bo'lish</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                ` : `
                    <div onclick="import('./courierDashboard.tsx').then(m => m.renderCourierDashboard())" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:38px; height:38px; border-radius:12px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-route"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.9rem;">Kuryer Ish Joyi</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                `}

                <div onclick="import('./supportView.tsx').then(m => m.renderSupportView())" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-headset"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Yordam markazi</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div onclick="import('./legal.tsx').then(m => m.openLegal('offer'))" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-file-contract"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Ommaviy oferta</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div onclick="import('./legal.tsx').then(m => m.openLegal('privacy'))" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-user-shield"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Maxfiylik siyosati</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div onclick="import('./legal.tsx').then(m => m.openLegal('rules'))" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-list-check"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Foydalanish qoidalari</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>

                <div onclick="import('./security.tsx').then(m => m.openProfileSecurity())" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:38px; height:38px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-lock"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:800; background:white; margin-top:10px; margin-bottom:30px;" onclick="handleSignOut()">
                CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:8px;"></i>
            </button>

            <!-- FOOTER -->
            <footer style="padding:35px 20px; background:#f8fafc; border-radius:35px; text-align:center; border:1px solid #f1f5f9;">
                <div style="font-weight:900; font-size:1.4rem;">ELAZ<span style="color:var(--primary)">MARKET</span></div>
                <p style="font-size:0.8rem; color:var(--gray); margin-top:10px;">Bag'dod tumanidagi eng yaxshi xizmat.</p>
                <div style="margin-top:15px; display:flex; justify-content:center; gap:20px; font-size:1.2rem; color:var(--gray);">
                    <i class="fab fa-telegram"></i>
                    <i class="fab fa-instagram"></i>
                    <i class="fab fa-facebook"></i>
                </div>
            </footer>
        </div>
    `;
}

(window as any).handleSignOut = async () => {
    if(confirm("Haqiqatan ham chiqmoqchimisiz?")) {
        await supabase.auth.signOut();
        window.location.reload();
    }
};
