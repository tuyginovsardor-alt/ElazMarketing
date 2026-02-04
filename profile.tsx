
import { profile, user, openOverlay, showToast, supabase, loadProfileData, navTo, enterAdminPanel } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isAdmin = data?.role === 'admin' || data?.role === 'staff';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- HEADER -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:85px; height:85px; border-radius:30px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(0,0,0,0.15); flex-shrink:0;">
                        ${data?.avatar_url ? 
                            `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : 
                            `<div style="width:100%; height:100%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; color:var(--primary);">
                                <i class="fas fa-user-circle" style="font-size:3rem;"></i>
                             </div>`
                        }
                    </div>
                    
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.6rem; margin-bottom:8px; letter-spacing:-0.5px; text-transform: lowercase;">${data?.first_name || 'foydalanuvchi'}</h2>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.15); color:white; padding:5px 15px; border-radius:12px; text-transform:uppercase; letter-spacing:0.8px; border:1px solid rgba(255,255,255,0.2);">
                                ${data?.role || 'USER'}
                            </span>
                            <i class="fas fa-sun" style="color:#fbbf24; font-size:1.1rem;"></i>
                        </div>
                    </div>

                    <div style="width:42px; height:42px; border-radius:14px; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="openOverlay('profileEditOverlay')">
                        <i class="fas fa-pen-nib" style="font-size:1rem;"></i>
                    </div>
                </div>
            </div>

            <!-- BOSHQARUV PANELI (DARK CARD) -->
            ${isAdmin ? `
                <div class="card" style="padding:22px 25px; border-radius:32px; border:none; background:var(--dark); color:white; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 15px 30px rgba(0,0,0,0.12); cursor:pointer;" onclick="enterAdminPanel()">
                    <div style="display:flex; align-items:center; gap:18px;">
                        <div style="width:50px; height:50px; background:var(--primary); border-radius:18px; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-shield-halved" style="font-size:1.4rem;"></i>
                        </div>
                        <div>
                            <h4 style="font-weight:900; font-size:1rem; letter-spacing:0.5px; text-transform:uppercase;">BOSHQARUV PANELI</h4>
                            <p style="font-size:0.75rem; opacity:0.6; font-weight:600;">Sklad va Buyurtmalar nazorati</p>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="opacity:0.4; font-size:1.1rem;"></i>
                </div>
            ` : ''}

            <!-- BALANS -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="openOverlay('paymentOverlay')" style="padding:25px; border-radius:32px; text-align:left; border:1.5px solid #f1f5f9; background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; background:var(--primary-light); color:var(--primary); border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:15px;">
                        <i class="fas fa-wallet" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="font-size:0.75rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:8px;">BALANS</div>
                    <div style="font-weight:900; font-size:1.3rem; color:var(--text);">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.8rem; font-weight:700;">UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:25px; border-radius:32px; text-align:left; border:1.5px solid #f1f5f9; background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; background:#eff6ff; color:#3b82f6; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:15px;">
                        <i class="fas fa-archive" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="font-size:0.75rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:8px;">BUYURTMALAR</div>
                    <div style="font-weight:900; font-size:1.3rem; color:var(--text);">ARXIV</div>
                </div>
            </div>

            <!-- TELEGRAM (DASHED BORDER) -->
            <div style="padding:25px; border-radius:35px; border:2.5px dashed var(--primary); background:var(--primary-light); margin-bottom:25px;">
                <div style="display:flex; align-items:center; gap:18px; margin-bottom:15px;">
                    <div style="width:48px; height:48px; background:white; border-radius:16px; display:flex; align-items:center; justify-content:center; color:var(--primary); box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                        <i class="fab fa-telegram-plane" style="font-size:1.6rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <h4 style="font-weight:900; font-size:1rem; color:var(--text);">Telegramga ulangan ✅</h4>
                        <p style="font-size:0.75rem; color:var(--gray); font-weight:600;">Push xabarnomalar olish uchun</p>
                    </div>
                </div>
                ${data?.telegram_id ? `
                    <div style="background:white; border-radius:15px; padding:15px; text-align:center; font-family:monospace; font-weight:900; color:var(--primary); font-size:1.2rem; letter-spacing:1px; border:1px solid #e2e8f0;">ID: ${data.telegram_id}</div>
                ` : `
                    <button class="btn btn-primary" style="height:55px; width:100%; border-radius:18px;" onclick="generateBotLink()">BOTNI ULASH <i class="fas fa-link" style="margin-left:8px;"></i></button>
                `}
            </div>

            <!-- MENU -->
            <div class="card" style="padding:10px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:25px;">
                <div onclick="openOverlay('profileEditOverlay')" style="display:flex; align-items:center; gap:15px; padding:20px 25px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-user-gear"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Ma'lumotlarni tahrirlash</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div onclick="openOverlay('profileSecurityOverlay')" style="display:flex; align-items:center; gap:15px; padding:20px 25px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-shield-check"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div onclick="openOverlay('paymentOverlay')" style="display:flex; align-items:center; gap:15px; padding:20px 25px; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-credit-card"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.95rem;">Hamyonni to'ldirish</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2px solid #fee2e2; height:68px; border-radius:28px; font-weight:800; background:white;" onclick="handleSignOut()">
                HISOBDAN CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:10px;"></i>
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

(window as any).generateBotLink = async () => {
    const { data: config } = await supabase.from('bot_configs').select('bot_name').eq('is_active', true).maybeSingle();
    const token = Math.random().toString(36).substring(2, 12);
    await supabase.from('profiles').update({ link_token: token }).eq('id', user.id);
    const bot = config?.bot_name?.replace('@', '') || 'elaz_market_bot';
    window.open(`https://t.me/${bot}?start=v_${token}`, '_blank');
};
