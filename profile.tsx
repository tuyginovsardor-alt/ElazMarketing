
import { user, supabase, showToast } from "./index.tsx";

export async function renderProfileView(profileData: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;
    
    const isAdmin = profileData?.role === 'admin' || profileData?.role === 'staff';
    const isCourier = profileData?.role === 'courier';
    const isLinked = !!profileData?.telegram_id;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- AVATAR CARD -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:90px; height:90px; border-radius:32px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center;">
                        ${profileData?.avatar_url ? `<img src="${profileData.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-circle" style="font-size:3.5rem; color:var(--primary);"></i>`}
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h2 style="font-weight:900; font-size:1.5rem;">${profileData?.first_name || 'Mijoz'}</h2>
                            <i class="fas fa-edit" onclick="window.openProfileEdit()" style="font-size:0.9rem; cursor:pointer; opacity:0.8;"></i>
                        </div>
                        <div style="font-size:0.75rem; font-weight:700; opacity:0.9;">${user.email}</div>
                    </div>
                </div>
            </div>

            <!-- BOT LINKING (YANGILANGAN TUGMA) -->
            ${!isLinked ? `
                <div onclick="window.generateBotLink()" class="card" style="background:#eff6ff; border:1.5px solid #dbeafe; padding:20px; border-radius:30px; margin-bottom:25px; display:flex; align-items:center; gap:20px; cursor:pointer; transition: 0.3s active; transform: scale(1);" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
                    <div style="width:55px; height:55px; border-radius:20px; background:white; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 8px 20px rgba(59,130,246,0.15);"><i class="fab fa-telegram"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:1rem; color:#1e40af;">Botni hoziroq ulash</div>
                        <p style="font-size:0.7rem; color:#3b82f6; font-weight:700;">Yangi havola yaratish uchun bosing</p>
                    </div>
                    <i class="fas fa-sync-alt" id="botLinkIcon" style="color:#3b82f6; opacity:0.5;"></i>
                </div>
            ` : `
                <div class="card" style="background:#f0fdf4; border:1.5px solid #dcfce7; padding:15px; border-radius:25px; margin-bottom:25px; text-align:center; display:flex; align-items:center; justify-content:center; gap:10px;">
                    <i class="fas fa-check-circle" style="color:#16a34a;"></i>
                    <div style="color:#16a34a; font-weight:900; font-size:0.75rem;">BOT MUVAFFAQIYATLI ULANGAN</div>
                </div>
            `}

            <!-- MENU -->
            <div class="card" style="padding:10px; border-radius:35px; background:white; margin-bottom:25px; box-shadow:var(--shadow-sm);">
                ${isAdmin ? `
                    <div onclick="window.enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:42px; height:42px; border-radius:14px; background:#1e293b; color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:800;">Admin Panel</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                    </div>
                ` : ''}

                <div onclick="window.openPayment()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#f0fdf4; color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-wallet"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:800;">Hamyon</div>
                        <div style="font-size:0.7rem; color:var(--primary); font-weight:900;">${(profileData?.balance || 0).toLocaleString()} UZS</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                </div>

                <div onclick="window.navTo('orders')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#f1f5f9; color:#64748b; display:flex; align-items:center; justify-content:center;"><i class="fas fa-receipt"></i></div>
                    <span style="flex:1; font-weight:800;">Buyurtmalar tarixi</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                </div>

                ${isCourier ? `
                    <div onclick="window.openCourierDashboard()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:42px; height:42px; border-radius:14px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-motorcycle"></i></div>
                        <span style="flex:1; font-weight:800;">Kuryer Ish Joyi</span>
                        <span style="background:var(--primary); color:white; padding:2px 8px; border-radius:8px; font-size:0.6rem; font-weight:900;">LIVE</span>
                    </div>
                ` : `
                    <div onclick="window.openCourierRegistration()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:42px; height:42px; border-radius:14px; background:#fff7ed; color:#f97316; display:flex; align-items:center; justify-content:center;"><i class="fas fa-truck-fast"></i></div>
                        <span style="flex:1; font-weight:800;">Kuryer bo'lish</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                    </div>
                `}

                <div onclick="window.openSupportCenter()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center;"><i class="fas fa-headset"></i></div>
                    <span style="flex:1; font-weight:800;">Yordam markazi</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                </div>

                <div onclick="window.openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:42px; height:42px; border-radius:14px; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                    <span style="flex:1; font-weight:800;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:900; background:white;" onclick="window.handleSignOut()">
                <i class="fas fa-power-off"></i> TIZIMDAN CHIQISH
            </button>
        </div>
    `;
}

(window as any).generateBotLink = async () => {
    const icon = document.getElementById('botLinkIcon');
    if(icon) icon.className = 'fas fa-sync-alt fa-spin';
    
    try {
        const { loadProfileData } = await import("./index.tsx");
        const currentProfile = await loadProfileData();
        if(!currentProfile) return showToast("Profil yuklanmadi");

        showToast("Yangi havola yaratilmoqda...");
        
        // Mutlaqo yangi va vaqtinchalik token
        const linkToken = 'LNK' + Date.now() + Math.random().toString(36).substring(7);
        
        // Bazaga yozishni kutamiz (await)
        const { error: updError } = await supabase
            .from('profiles')
            .update({ link_token: linkToken })
            .eq('id', currentProfile.id);

        if(updError) throw updError;

        // Aktiv botni bazadan olamiz
        const { data: botConfig } = await supabase
            .from('bot_configs')
            .select('username')
            .eq('is_active', true)
            .maybeSingle();

        const username = botConfig?.username || "my_test_marketbot";
        
        // Redirect
        showToast("Telegramga o'tilmoqda...");
        setTimeout(() => {
            window.location.href = `https://t.me/${username}?start=${linkToken}`;
        }, 500);

    } catch (e: any) {
        console.error("Bot Link Error:", e);
        showToast("Xatolik yuz berdi. Qayta urinib ko'ring.");
        if(icon) icon.className = 'fas fa-sync-alt';
    }
};
