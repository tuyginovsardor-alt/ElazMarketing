
import { profile, user, openOverlay, closeOverlay, showToast, handleSignOut, supabase, loadProfileData } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isBotLinked = !!data?.telegram_id;
    const isAdmin = data?.role === 'admin' || data?.role === 'staff';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- USER HEADER -->
            <div style="background:var(--gradient); border-radius:35px; padding:35px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; width:120px; height:120px; background:rgba(255,255,255,0.1); border-radius:50%;"></div>
                <div style="display:flex; align-items:center; gap:22px; position:relative; z-index:1;">
                    <!-- AVATAR CONTAINER -->
                    <div style="width:90px; height:90px; border-radius:30px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(0,0,0,0.15); transition: 0.3s;" onclick="openProfileEdit()">
                        ${data?.avatar_url ? 
                            `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : 
                            `<div style="width:100%; height:100%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; color:var(--primary);">
                                <i class="fas fa-user-circle" style="font-size:3rem;"></i>
                             </div>`
                        }
                    </div>
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.6rem; margin-bottom:6px; letter-spacing:-0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${data?.first_name || 'Foydalanuvchi'}</h2>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.2); padding:5px 14px; border-radius:12px; text-transform:uppercase; letter-spacing:0.8px; border:1px solid rgba(255,255,255,0.15); backdrop-filter:blur(4px);">
                                ${data?.role || 'Mijoz'}
                            </span>
                            ${data?.is_approved ? '<i class="fas fa-certificate" style="color:#fbbf24; font-size:0.95rem; filter: drop-shadow(0 0 5px rgba(251,191,36,0.5));"></i>' : ''}
                        </div>
                    </div>
                    <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(10px);" onclick="openProfileEdit()">
                        <i class="fas fa-pen-nib" style="font-size:1rem; opacity:0.9;"></i>
                    </div>
                </div>
            </div>

            <!-- ADMIN PANEL ACCESS -->
            ${isAdmin ? `
                <div class="card" style="padding:18px 22px; border-radius:26px; border:none; background:var(--dark); color:white; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 12px 24px rgba(0,0,0,0.2);" onclick="enterAdminPanel()">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:45px; height:45px; background:var(--primary); border-radius:14px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(34,197,94,0.3);">
                            <i class="fas fa-shield-halved" style="font-size:1.2rem;"></i>
                        </div>
                        <div>
                            <h4 style="font-weight:900; font-size:1rem; letter-spacing:0.5px;">BOSHQARUV PANELI</h4>
                            <p style="font-size:0.7rem; opacity:0.6; font-weight:600;">Sklad va Buyurtmalar nazorati</p>
                        </div>
                    </div>
                    <i class="fas fa-angle-right" style="opacity:0.4; font-size:1.2rem;"></i>
                </div>
            ` : ''}

            <!-- STATS GRID -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="openPaymentView()" style="padding:22px; border-radius:28px; text-align:center; border:1.5px solid #f1f5f9; background:white; transition: 0.3s active:scale(0.95);">
                    <div style="width:50px; height:50px; background:var(--primary-light); color:var(--primary); border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                        <i class="fas fa-wallet" style="font-size:1.4rem;"></i>
                    </div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Balans</div>
                    <div style="font-weight:900; font-size:1.2rem; color:var(--text);">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:22px; border-radius:28px; text-align:center; border:1.5px solid #f1f5f9; background:white;">
                    <div style="width:50px; height:50px; background:#eff6ff; color:#3b82f6; border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                        <i class="fas fa-box-open" style="font-size:1.4rem;"></i>
                    </div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Buyurtmalar</div>
                    <div style="font-weight:900; font-size:1.2rem; color:var(--text);">ARXIV</div>
                </div>
            </div>

            <!-- TELEGRAM BOT -->
            <div class="card" style="padding:22px; border-radius:30px; border:none; box-shadow:var(--shadow-sm); background:${isBotLinked ? 'var(--primary-light)' : '#f8fafc'}; margin-bottom:25px; border:2px dashed ${isBotLinked ? 'var(--primary)' : '#e2e8f0'}; position:relative; overflow:hidden;">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px;">
                    <div style="width:45px; height:45px; background:white; border-radius:14px; display:flex; align-items:center; justify-content:center; color:${isBotLinked ? 'var(--primary)' : '#0088cc'}; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                        <i class="fab fa-telegram-plane" style="font-size:1.4rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <h4 style="font-weight:900; font-size:1rem; color:var(--text);">${isBotLinked ? 'Telegramga ulangan' : 'Botni ulang'}</h4>
                        <p style="font-size:0.7rem; color:var(--gray); font-weight:600;">Push xabarnomalar olish uchun</p>
                    </div>
                </div>
                ${!isBotLinked ? `
                    <button class="btn btn-primary" style="height:54px; width:100%; border-radius:18px; font-size:0.9rem;" onclick="generateBotLink()">
                        ULASHNI BOSHLASH <i class="fas fa-link" style="margin-left:8px;"></i>
                    </button>
                ` : `
                    <div style="background:white; border-radius:12px; padding:8px; text-align:center; font-family:monospace; font-weight:900; color:var(--primary); font-size:1rem; letter-spacing:1px;">TG-ID: ${data.telegram_id}</div>
                `}
            </div>

            <!-- MENU LIST -->
            <div class="card" style="padding:8px; border-radius:30px; margin-bottom:25px; border:1.5px solid #f1f5f9; background:white;">
                <div class="menu-item" onclick="openProfileEdit()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:36px; height:36px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-user-gear"></i></div>
                    <span style="flex:1; font-weight:700; font-size:0.95rem;">Ma'lumotlarni tahrirlash</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div class="menu-item" onclick="openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:36px; height:36px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-shield-check"></i></div>
                    <span style="flex:1; font-weight:700; font-size:0.95rem;">Xavfsizlik</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div class="menu-item" onclick="openPaymentView()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:36px; height:36px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--gray);"><i class="fas fa-credit-card"></i></div>
                    <span style="flex:1; font-weight:700; font-size:0.95rem;">Hamyonni to'ldirish</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <!-- INFO SECTION -->
            <div style="margin-bottom:30px;">
                <h4 style="font-weight:900; font-size:0.75rem; color:var(--gray); text-transform:uppercase; letter-spacing:1.5px; margin-left:18px; margin-bottom:15px; opacity:0.8;">HUQUQIY MA'LUMOTLAR</h4>
                <div class="card" style="padding:8px; border-radius:30px; border:1.5px solid #f1f5f9; background:white;">
                    <div class="menu-item" onclick="openLegal('offer')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <i class="fas fa-scroll" style="color:var(--gray); width:20px; text-align:center;"></i>
                        <span style="flex:1; font-weight:700; font-size:0.9rem;">Ommaviy oferta</span>
                    </div>
                    <div class="menu-item" onclick="openLegal('privacy')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                        <i class="fas fa-user-shield" style="color:var(--gray); width:20px; text-align:center;"></i>
                        <span style="flex:1; font-weight:700; font-size:0.9rem;">Maxfiylik siyosati</span>
                    </div>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; color:var(--danger); border-color:#fee2e2; height:65px; border-radius:24px; font-weight:800; background:white; box-shadow:0 4px 12px rgba(239,68,68,0.05);" onclick="handleSignOut()">
                HISOBDAN CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:8px;"></i>
            </button>
        </div>
    `;

    if (!data?.phone) {
        setTimeout(() => openPhoneConfirmation(), 1000);
    }
}

// Imports for context
import { openProfileEdit } from "./profileEdit.tsx";
import { openProfileSecurity } from "./security.tsx";
import { openPaymentView } from "./payment.tsx";
import { openLegal } from "./legal.tsx";

(window as any).openProfileEdit = openProfileEdit;
(window as any).openProfileSecurity = openProfileSecurity;
(window as any).openPaymentView = openPaymentView;
(window as any).openLegal = openLegal;

async function openPhoneConfirmation() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;
    placeholder.innerHTML = `
        <div style="padding:15px 0; text-align:center;">
            <div style="width:80px; height:80px; background:var(--primary-light); color:var(--primary); border-radius:28px; display:inline-flex; align-items:center; justify-content:center; font-size:2rem; margin-bottom:20px; border:2px solid var(--primary);">
                <i class="fas fa-mobile-screen"></i>
            </div>
            <h2 style="font-weight:900; font-size:1.4rem;">Raqam kiritilmagan</h2>
            <p style="font-size:0.85rem; color:var(--gray); margin-top:10px; font-weight:600; line-height:1.6; padding:0 15px;">Kuryer siz bilan bog'lanishi uchun amaldagi telefon raqamingizni kiriting.</p>
            
            <div style="margin:30px 0;">
                <input type="tel" id="confirmPhone" placeholder="+998 90 123 45 67" value="${profile?.phone || ''}" style="height:70px; font-size:1.5rem; font-weight:900; border:3px solid var(--primary); text-align:center; border-radius:22px; background:#f0fdf4;">
            </div>
            
            <button class="btn btn-primary" style="width:100%; height:65px; border-radius:24px; font-size:1.1rem;" onclick="saveConfirmedPhone()">RAQAMNI TASDIQLASH</button>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).saveConfirmedPhone = async () => {
    const phone = (document.getElementById('confirmPhone') as HTMLInputElement).value.trim();
    if (phone.length < 9) return showToast("Iltimos, to'g'ri raqam kiriting");
    
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', user.id);
    if (!error) {
        showToast("Muvaffaqiyatli saqlandi! ✨");
        closeOverlay('checkoutOverlay');
        await loadProfileData();
        renderProfileView(profile);
    }
};

(window as any).generateBotLink = async () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { error } = await supabase.from('profiles').update({ 
        link_token: token, 
        link_token_expires: new Date(Date.now() + 10 * 60000).toISOString() 
    }).eq('id', user.id);

    if (!error) {
        const { data: config } = await supabase.from('bot_configs').select('bot_name').eq('is_active', true).maybeSingle();
        const botUsername = config?.bot_name.replace('@', '') || "elaz_market_bot";
        window.open(`https://t.me/${botUsername}?start=v_${token}`, '_blank');
        showToast("Telegramga o'naltirilmoqda...");
    }
};
