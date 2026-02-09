
import { profile, user, openOverlay, showToast, supabase, loadProfileData, navTo } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;
    
    let profileData = data;
    if (!profileData) {
        const { profile: globalProfile } = await import("./index.tsx");
        profileData = globalProfile;
    }

    const isAdmin = profileData?.role === 'admin' || profileData?.role === 'staff';
    const isCourier = profileData?.role === 'courier';
    const isLinked = !!profileData?.telegram_id;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- AVATAR & INFO CARD -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; width:150px; height:150px; background:rgba(255,255,255,0.1); border-radius:50%;"></div>
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:90px; height:90px; border-radius:32px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${profileData?.avatar_url ? `<img src="${profileData.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-circle" style="font-size:3.5rem; color:var(--primary);"></i>`}
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h2 style="font-weight:900; font-size:1.5rem; text-transform: capitalize;">${profileData?.first_name || 'Mijoz'}</h2>
                            <i class="fas fa-edit" onclick="openProfileEdit()" style="font-size:0.9rem; opacity:0.7; cursor:pointer;"></i>
                        </div>
                        <div style="font-size:0.75rem; font-weight:700; opacity:0.85; margin-top:2px;">${user.email}</div>
                        <div style="display:inline-block; margin-top:10px; padding:4px 12px; background:rgba(255,255,255,0.2); border-radius:10px; font-size:0.65rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">
                            ${profileData?.role === 'admin' ? '💎 Administrator' : (profileData?.role === 'courier' ? '🛵 Rasmiy Kuryer' : '👤 Mijoz')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- BOTGA ULASH (SMART CONNECT) -->
            ${!isLinked ? `
                <div onclick="generateBotLink()" class="card" style="background:#eff6ff; border:1.5px solid #dbeafe; padding:20px; border-radius:30px; margin-bottom:25px; display:flex; align-items:center; gap:20px; cursor:pointer; transform: scale(1); transition: 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="width:55px; height:55px; border-radius:20px; background:white; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 8px 20px rgba(59,130,246,0.15);"><i class="fab fa-telegram"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:1rem; color:#1e40af;">Telegram botni ulash</div>
                        <p style="font-size:0.7rem; color:#3b82f6; font-weight:700; margin-top:2px;">Xabarnomalar va buyurtmalar uchun</p>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#3b82f6; opacity:0.5;"></i>
                </div>
            ` : `
                <div class="card" style="background:#f0fdf4; border:1.5px solid #dcfce7; padding:15px; border-radius:25px; margin-bottom:25px; text-align:center; display:flex; align-items:center; justify-content:center; gap:10px;">
                    <i class="fas fa-check-circle" style="color:#16a34a;"></i>
                    <div style="color:#16a34a; font-weight:900; font-size:0.75rem; letter-spacing:0.5px;">BOT MUVAFFAQIYATLI ULANGAN</div>
                </div>
            `}

            <!-- MAIN MENU LIST -->
            <div class="card" style="padding:10px; border-radius:35px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px; box-shadow:var(--shadow-sm);">
                
                ${isAdmin ? `
                    <div onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:42px; height:42px; border-radius:14px; background:#1e293b; color:white; display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem; color:#1e293b;">Boshqaruv Paneli (Admin)</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>
                ` : ''}

                <div onclick="window.openPayment()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#f0fdf4; color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-wallet"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:800; font-size:0.95rem;">Mening hamyonim</div>
                        <div style="font-size:0.7rem; color:var(--primary); font-weight:900; margin-top:2px;">${(profileData?.balance || 0).toLocaleString()} UZS</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div onclick="navTo('orders')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#f1f5f9; color:#64748b; display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-shopping-bag"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Buyurtmalar tarixi</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                ${isCourier ? `
                    <div onclick="window.openCourierDashboard()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:42px; height:42px; border-radius:14px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-motorcycle"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem;">Kuryer Ish Joyi</span>
                        <span style="background:var(--primary); color:white; padding:2px 8px; border-radius:8px; font-size:0.6rem; font-weight:900;">LIVE</span>
                    </div>
                ` : `
                    <div onclick="window.openCourierRegistration()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:42px; height:42px; border-radius:14px; background:#fff7ed; color:#f97316; display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-truck-fast"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem;">Kuryer bo'lib ishlash</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>
                `}

                <div onclick="window.openSupportCenter()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-headset"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Yordam markazi</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div onclick="window.openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-shield-halved"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Xavfsizlik va Maxfiylik</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:900; background:white; box-shadow: 0 10px 20px rgba(239,68,68,0.05);" onclick="handleSignOut()">
                <i class="fas fa-power-off"></i> TIZIMDAN CHIQISH
            </button>
        </div>
    `;
}

(window as any).generateBotLink = async () => {
    try {
        const { profile: currentProfile } = await import("./index.tsx");
        showToast("Havola yaratilmoqda...");
        const linkToken = Math.random().toString(36).substring(2, 15);
        await supabase.from('profiles').update({ link_token: linkToken }).eq('id', currentProfile.id);
        
        // BOT_CONFIG JADVALIDAN USERNAME-NI OLISH
        const { data: botConfig } = await supabase.from('bot_configs').select('username').eq('is_active', true).maybeSingle();
        const username = botConfig?.username || "my_test_marketbot";
        
        window.location.href = `https://t.me/${username}?start=${linkToken}`;
    } catch (e) {
        showToast("Xatolik!");
    }
};

(window as any).openProfileEdit = async () => {
    const { openProfileEdit } = await import("./profileEdit.tsx");
    openProfileEdit();
};

(window as any).handleSignOut = async () => {
    if(confirm("Chiqmoqchimisiz?")) {
        await supabase.auth.signOut();
        window.location.reload();
    }
};
