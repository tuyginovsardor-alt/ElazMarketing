
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
                    <div style="width:90px; height:90px; border-radius:32px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${data?.avatar_url ? `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-circle" style="font-size:3.5rem; color:var(--primary);"></i>`}
                    </div>
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.7rem; margin-bottom:4px; text-transform: capitalize;">${data?.first_name || 'foydalanuvchi'}</h2>
                        <div style="font-size:0.75rem; font-weight:700; opacity:0.85;">${user.email}</div>
                    </div>
                </div>
            </div>

            <!-- BOTGA ULASH (Deep Linking) -->
            ${!isLinked ? `
                <div onclick="generateBotLink()" class="card" style="background:#eff6ff; border:1.5px solid #dbeafe; padding:20px; border-radius:30px; margin-bottom:25px; display:flex; align-items:center; gap:20px; cursor:pointer;">
                    <div style="width:50px; height:50px; border-radius:18px; background:white; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.4rem; box-shadow:0 5px 15px rgba(59,130,246,0.1);"><i class="fab fa-telegram"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:1rem; color:#1e40af;">Botni darhol ulash</div>
                        <p style="font-size:0.75rem; color:#3b82f6; font-weight:600; margin-top:2px;">Login-parolsiz, 1 ta bosishda!</p>
                    </div>
                    <i class="fas fa-magic" style="color:#3b82f6;"></i>
                </div>
            ` : `
                <div class="card" style="background:#f0fdf4; border:1.5px solid #dcfce7; padding:15px; border-radius:25px; margin-bottom:25px; text-align:center;">
                    <div style="color:#16a34a; font-weight:900; font-size:0.8rem;"><i class="fab fa-telegram"></i> BOT MUVAFFAQIYATLI ULANGAN</div>
                </div>
            `}

            <!-- MAIN MENU -->
            <div class="card" style="padding:8px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px;">
                ${isAdmin ? `
                    <div onclick="enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; border-radius:12px; background:var(--dark); color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.95rem;">Admin Panel</span>
                    </div>
                ` : ''}
                <div onclick="window.openPayment()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f0fdf4; color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-wallet"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Hamyon: ${(data?.balance || 0).toLocaleString()} UZS</span>
                </div>
                <div onclick="navTo('orders')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; color:var(--gray); display:flex; align-items:center; justify-content:center;"><i class="fas fa-history"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Buyurtmalar tarixi</span>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:800; background:white;" onclick="handleSignOut()">CHIQISH</button>
        </div>
    `;
}

(window as any).generateBotLink = async () => {
    try {
        showToast("Havola yaratilmoqda...");
        
        // 1. Vaqtinchalik token yaratish
        const linkToken = Math.random().toString(36).substring(2, 15);
        
        // 2. Bazaga saqlash
        await supabase.from('profiles').update({ link_token: linkToken }).eq('id', profile.id);
        
        // 3. Aktiv bot username-ni olish
        const { data: botConfig } = await supabase.from('bot_configs').select('username').eq('is_active', true).maybeSingle();
        const username = botConfig?.username || "elaz_market_bot";
        
        // 4. Telegram havolasini ochish
        window.location.href = `https://t.me/${username}?start=${linkToken}`;
    } catch (e) {
        showToast("Xatolik!");
    }
};

(window as any).handleSignOut = async () => {
    if(confirm("Chiqmoqchimisiz?")) {
        await supabase.auth.signOut();
        window.location.reload();
    }
};
