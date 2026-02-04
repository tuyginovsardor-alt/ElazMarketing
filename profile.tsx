
import { profile, user, openOverlay, closeOverlay, showToast, handleSignOut, supabase, loadProfileData } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isBotLinked = !!data?.telegram_id;
    const isAdmin = data?.role === 'admin' || data?.role === 'staff';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- USER HEADER (SKRINSHOTDAGI KO'RINISH) -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <!-- AVATAR (DOIRA) -->
                    <div style="width:90px; height:90px; border-radius:30px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(0,0,0,0.15); transition: 0.3s;" onclick="openProfileEdit()">
                        ${data?.avatar_url ? 
                            `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : 
                            `<div style="width:100%; height:100%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; color:var(--primary);">
                                <i class="fas fa-user-circle" style="font-size:3rem;"></i>
                             </div>`
                        }
                    </div>
                    
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.7rem; margin-bottom:8px; letter-spacing:-0.5px; text-transform: lowercase;">${data?.first_name || 'foydalanuvchi'}</h2>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.2); padding:5px 15px; border-radius:12px; text-transform:uppercase; letter-spacing:0.8px;">
                                ${data?.role || 'user'}
                            </span>
                            <i class="fas fa-sun" style="color:#fbbf24; font-size:1rem;"></i>
                        </div>
                    </div>

                    <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="openProfileEdit()">
                        <i class="fas fa-pen-nib" style="font-size:1rem;"></i>
                    </div>
                </div>
            </div>

            <!-- BOSHQRUV PANELI (DARK CARD) -->
            ${isAdmin ? `
                <div class="card" style="padding:22px 25px; border-radius:30px; border:none; background:var(--dark); color:white; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 12px 24px rgba(0,0,0,0.15);" onclick="enterAdminPanel()">
                    <div style="display:flex; align-items:center; gap:18px;">
                        <div style="width:50px; height:50px; background:var(--primary); border-radius:15px; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-shield-halved" style="font-size:1.4rem;"></i>
                        </div>
                        <div>
                            <h4 style="font-weight:900; font-size:1rem; letter-spacing:0.5px; text-transform:uppercase;">BOSHQARUV PANELI</h4>
                            <p style="font-size:0.75rem; opacity:0.6; font-weight:600;">Sklad va Buyurtmalar nazorati</p>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="opacity:0.4; font-size:1.2rem;"></i>
                </div>
            ` : ''}

            <!-- STATS (BALANS VA ARXIV) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                <div class="card" onclick="openPaymentView()" style="padding:25px; border-radius:32px; text-align:left; border:1.5px solid #f1f5f9; background:white;">
                    <div style="width:50px; height:50px; background:var(--primary-light); color:var(--primary); border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:15px;">
                        <i class="fas fa-wallet" style="font-size:1.4rem;"></i>
                    </div>
                    <div style="font-size:0.75rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:8px;">BALANS</div>
                    <div style="font-weight:900; font-size:1.4rem; color:var(--text);">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.8rem; font-weight:700;">UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:25px; border-radius:32px; text-align:left; border:1.5px solid #f1f5f9; background:white;">
                    <div style="width:50px; height:50px; background:#eff6ff; color:#3b82f6; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:15px;">
                        <i class="fas fa-archive" style="font-size:1.4rem;"></i>
                    </div>
                    <div style="font-size:0.75rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:8px;">BUYURTMALAR</div>
                    <div style="font-weight:900; font-size:1.4rem; color:var(--text);">ARXIV</div>
                </div>
            </div>

            <!-- TELEGRAM BOT (DASHED BORDER) -->
            <div style="padding:25px; border-radius:35px; border:2px dashed var(--primary); background:var(--primary-light); margin-bottom:25px; position:relative;">
                <div style="display:flex; align-items:center; gap:18px; margin-bottom:15px;">
                    <div style="width:48px; height:48px; background:white; border-radius:15px; display:flex; align-items:center; justify-content:center; color:var(--primary); box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                        <i class="fab fa-telegram-plane" style="font-size:1.6rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <h4 style="font-weight:900; font-size:1.05rem; color:var(--text);">Telegramga ulangan ✅</h4>
                        <p style="font-size:0.75rem; color:var(--gray); font-weight:600;">Push xabarnomalar olish uchun</p>
                    </div>
                </div>
                ${!isBotLinked ? `
                    <button class="btn btn-primary" id="btnGenerateBot" style="height:55px; width:100%; border-radius:20px; font-size:0.9rem;" onclick="generateBotLink()">
                        ULASHNI BOSHLASH <i class="fas fa-link" style="margin-left:8px;"></i>
                    </button>
                ` : `
                    <div style="background:white; border-radius:15px; padding:12px; text-align:center; font-family:monospace; font-weight:900; color:var(--primary); font-size:1.3rem; letter-spacing:1.5px;">TG-ID: ${data.telegram_id}</div>
                `}
            </div>

            <!-- MENU LIST -->
            <div class="card" style="padding:10px; border-radius:32px; margin-bottom:25px; border:1.5px solid #f1f5f9; background:white;">
                <div onclick="openProfileEdit()" style="display:flex; align-items:center; gap:15px; padding:20px 25px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-user-gear"></i></div>
                    <span style="flex:1; font-weight:800; font-size:1rem;">Ma'lumotlarni tahrirlash</span>
                    <i class="fas fa-chevron-right" style="font-size:0.9rem; color:#cbd5e1;"></i>
                </div>
                <div onclick="openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:20px 25px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-shield-check"></i></div>
                    <span style="flex:1; font-weight:800; font-size:1rem;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="font-size:0.9rem; color:#cbd5e1;"></i>
                </div>
                <div onclick="openPaymentView()" style="display:flex; align-items:center; gap:15px; padding:20px 25px; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-credit-card"></i></div>
                    <span style="flex:1; font-weight:800; font-size:1rem;">Hamyonni to'ldirish</span>
                    <i class="fas fa-chevron-right" style="font-size:0.9rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; color:var(--danger); border-color:#fee2e2; height:68px; border-radius:28px; font-weight:800; background:white;" onclick="handleSignOut()">
                HISOBDAN CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:12px;"></i>
            </button>
        </div>
    `;
}

// Global functions for events
import { openProfileEdit } from "./profileEdit.tsx";
import { openProfileSecurity } from "./security.tsx";
import { openPaymentView } from "./payment.tsx";

(window as any).openProfileEdit = openProfileEdit;
(window as any).openProfileSecurity = openProfileSecurity;
(window as any).openPaymentView = openPaymentView;

(window as any).generateBotLink = async () => {
    const btn = document.getElementById('btnGenerateBot') as HTMLButtonElement;
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> GENERATSIYA...';
    }

    try {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = new Date(Date.now() + 10 * 60000).toISOString(); 

        const { error: updateError } = await supabase.from('profiles').update({ 
            link_token: token, 
            link_token_expires: expires 
        }).eq('id', user.id);

        if (updateError) throw updateError;

        const { data: config, error: configError } = await supabase.from('bot_configs').select('bot_name').eq('is_active', true).maybeSingle();
        
        if (configError || !config) {
            showToast("Bot topilmadi!");
            throw new Error("Bot not configured");
        }

        const botUsername = config.bot_name.replace('@', '').trim();
        const finalUrl = `https://t.me/${botUsername}?start=v_${token}`;
        
        window.open(finalUrl, '_blank');
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = 'BOTGA O\'TILDI ✅';
        }
    } catch (e: any) {
        showToast("Xato: " + e.message);
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = 'QAYTA URINISH';
        }
    }
};
