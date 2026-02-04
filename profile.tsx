
import { profile, user, openOverlay, closeOverlay, showToast, handleSignOut, supabase, loadProfileData } from "./index.tsx";

export async function renderProfileView(data: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isBotLinked = !!data?.telegram_id;
    const isAdmin = data?.role === 'admin' || data?.role === 'staff';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- USER HEADER -->
            <div style="background:var(--gradient); border-radius:35px; padding:30px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; width:120px; height:120px; background:rgba(255,255,255,0.1); border-radius:50%;"></div>
                <div style="display:flex; align-items:center; gap:20px; position:relative; z-index:1;">
                    <div style="width:85px; height:85px; border-radius:28px; background:white; overflow:hidden; border:3px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center;">
                        ${data?.avatar_url ? 
                            `<img src="${data.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : 
                            `<i class="fas fa-user" style="font-size:2.2rem; color:var(--primary);"></i>`
                        }
                    </div>
                    <div style="flex:1;">
                        <h2 style="font-weight:900; font-size:1.5rem; margin-bottom:4px; letter-spacing:-0.5px;">${data?.first_name || 'Foydalanuvchi'}</h2>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.25); padding:4px 12px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px; border:1px solid rgba(255,255,255,0.2);">
                                ${data?.role || 'user'}
                            </span>
                            ${data?.is_approved ? '<i class="fas fa-check-circle" style="color:white; font-size:0.9rem;"></i>' : ''}
                        </div>
                    </div>
                    <i class="fas fa-cog" onclick="openProfileEdit()" style="font-size:1.4rem; opacity:0.8; cursor:pointer; padding:10px;"></i>
                </div>
            </div>

            <!-- ADMIN PANEL ACCESS (Conditional) -->
            ${isAdmin ? `
                <div class="card" style="padding:15px 22px; border-radius:24px; border:none; background:var(--dark); color:white; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 10px 20px rgba(0,0,0,0.15);" onclick="enterAdminPanel()">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:42px; height:42px; background:var(--primary); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-user-shield" style="font-size:1.1rem;"></i>
                        </div>
                        <div>
                            <h4 style="font-weight:900; font-size:0.9rem;">BOSHQARUV PANELI</h4>
                            <p style="font-size:0.65rem; opacity:0.7; font-weight:600;">Admin imkoniyatlari</p>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="opacity:0.5;"></i>
                </div>
            ` : ''}

            <!-- STATS GRID -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="openPaymentView()" style="padding:22px; border-radius:28px; text-align:center; border:1px solid #f1f5f9; background:white;">
                    <div style="width:45px; height:45px; background:var(--primary-light); color:var(--primary); border-radius:15px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                        <i class="fas fa-wallet" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:4px;">Mening balansim</div>
                    <div style="font-weight:900; font-size:1.1rem;">${(data?.balance || 0).toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:22px; border-radius:28px; text-align:center; border:1px solid #f1f5f9; background:white;">
                    <div style="width:45px; height:45px; background:#eff6ff; color:#3b82f6; border-radius:15px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                        <i class="fas fa-receipt" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:4px;">Buyurtmalarim</div>
                    <div style="font-weight:900; font-size:1.1rem;">TARIX</div>
                </div>
            </div>

            <!-- TELEGRAM BOT CONNECTION -->
            <div class="card" style="padding:22px; border-radius:30px; border:none; box-shadow:var(--shadow-sm); background:${isBotLinked ? 'var(--primary-light)' : '#f1f5f9'}; margin-bottom:25px; border:1.5px dashed ${isBotLinked ? 'var(--primary)' : '#cbd5e1'};">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px;">
                    <div style="width:42px; height:42px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; color:${isBotLinked ? 'var(--primary)' : '#0088cc'}; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                        <i class="fab fa-telegram-plane" style="font-size:1.3rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <h4 style="font-weight:900; font-size:0.95rem; color:var(--text);">${isBotLinked ? 'Bot ulangan ✅' : 'Botni ulang'}</h4>
                        <p style="font-size:0.7rem; color:var(--gray); font-weight:600;">${isBotLinked ? 'Xabarnomalar Telegramga keladi' : 'Xaridlar haqida xabar olish uchun'}</p>
                    </div>
                </div>
                ${!isBotLinked ? `
                    <button class="btn btn-primary" style="height:50px; width:100%; border-radius:16px; font-size:0.85rem;" onclick="generateBotLink()">
                        BOTGA ULASH <i class="fas fa-link" style="margin-left:8px;"></i>
                    </button>
                ` : `
                    <div style="font-size:0.85rem; font-weight:900; color:var(--primary); text-align:center; padding:5px 0; letter-spacing:1px;">ID: ${data.telegram_id}</div>
                `}
            </div>

            <!-- MAIN SETTINGS MENU -->
            <div class="card" style="padding:10px; border-radius:30px; margin-bottom:25px; border:1.5px solid #f1f5f9;">
                <div class="menu-item" onclick="openProfileEdit()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <i class="fas fa-user-edit" style="color:var(--gray); width:20px;"></i>
                    <span style="flex:1; font-weight:700; font-size:0.9rem;">Profilni tahrirlash</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div class="menu-item" onclick="openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <i class="fas fa-shield-alt" style="color:var(--gray); width:20px;"></i>
                    <span style="flex:1; font-weight:700; font-size:0.9rem;">Xavfsizlik sozlamalari</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
                <div class="menu-item" onclick="openPaymentView()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <i class="fas fa-credit-card" style="color:var(--gray); width:20px;"></i>
                    <span style="flex:1; font-weight:700; font-size:0.9rem;">Hamyonni to'ldirish</span>
                    <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                </div>
            </div>

            <!-- APP INFO SECTION -->
            <div style="margin-bottom:30px;">
                <h4 style="font-weight:900; font-size:0.8rem; color:var(--gray); text-transform:uppercase; letter-spacing:1px; margin-left:15px; margin-bottom:15px;">Ilova haqida</h4>
                <div class="card" style="padding:10px; border-radius:30px; border:1.5px solid #f1f5f9;">
                    <div class="menu-item" onclick="openLegal('offer')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <i class="fas fa-file-contract" style="color:var(--gray); width:20px;"></i>
                        <span style="flex:1; font-weight:700; font-size:0.9rem;">Ommaviy oferta</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                    <div class="menu-item" onclick="openLegal('privacy')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <i class="fas fa-user-shield" style="color:var(--gray); width:20px;"></i>
                        <span style="flex:1; font-weight:700; font-size:0.9rem;">Maxfiylik siyosati</span>
                        <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#cbd5e1;"></i>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px; padding:18px 20px; opacity:0.6;">
                        <i class="fas fa-info-circle" style="color:var(--gray); width:20px;"></i>
                        <span style="flex:1; font-weight:700; font-size:0.9rem;">Ilova versiyasi</span>
                        <b style="font-size:0.75rem;">v5.2.0</b>
                    </div>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; color:var(--danger); border-color:#fee2e2; height:65px; border-radius:22px; font-weight:800;" onclick="handleSignOut()">
                CHIQISH <i class="fas fa-power-off" style="margin-left:8px;"></i>
            </button>
        </div>
    `;

    if (!data?.phone) {
        setTimeout(() => openPhoneConfirmation(), 1000);
    }
}

// Global funksiyalarni bog'lash
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
        <div style="padding:10px 0; text-align:center;">
            <div style="width:70px; height:70px; background:var(--primary-light); color:var(--primary); border-radius:24px; display:inline-flex; align-items:center; justify-content:center; font-size:1.8rem; margin-bottom:20px;">
                <i class="fas fa-phone-alt"></i>
            </div>
            <h2 style="font-weight:900;">Raqamni tasdiqlang</h2>
            <p style="font-size:0.85rem; color:var(--gray); margin-top:8px; font-weight:600; line-height:1.5;">Kuryerlarimiz buyurtma bo'yicha bog'lanishi uchun telefon raqamingiz kerak.</p>
            
            <div style="margin:25px 0;">
                <input type="tel" id="confirmPhone" placeholder="+998 90 123 45 67" value="${profile?.phone || ''}" style="height:65px; font-size:1.3rem; font-weight:900; border-color:var(--primary); text-align:center; border-radius:20px;">
            </div>
            
            <div style="background:#f0f9ff; padding:18px; border-radius:20px; margin-bottom:30px; border:1px dashed #0ea5e9;">
                <p style="font-size:0.75rem; color:#0369a1; font-weight:700; line-height:1.5;">
                    <i class="fas fa-info-circle"></i> Raqamingiz faqat kuryer uchun bog'lanish maqsadida ishlatiladi.
                </p>
            </div>
            
            <button class="btn btn-primary" style="width:100%; height:65px; border-radius:22px; font-size:1.1rem;" onclick="saveConfirmedPhone()">SAQLASH</button>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).saveConfirmedPhone = async () => {
    const phone = (document.getElementById('confirmPhone') as HTMLInputElement).value.trim();
    if (phone.length < 9) return showToast("To'g'ri raqam kiriting");
    
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', user.id);
    if (!error) {
        showToast("Raqam muvaffaqiyatli saqlandi! ✨");
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
