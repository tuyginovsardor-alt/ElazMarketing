
import { profile, user, openOverlay, closeOverlay, showToast, handleSignOut, supabase, loadProfileData } from "./index.tsx";

export async function renderProfileView(data) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;

    const isBotLinked = !!data?.telegram_id;
    const isCourier = data?.role === 'courier';

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- USER HEADER -->
            <div style="background:var(--gradient); border-radius:35px; padding:30px 25px; box-shadow:var(--shadow-lg); margin-bottom:25px; color:white;">
                <div style="display:flex; align-items:center; gap:20px;">
                    <div style="width:75px; height:75px; border-radius:22px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.3);">
                        <i class="fas fa-user" style="font-size:1.8rem;"></i>
                    </div>
                    <div>
                        <h2 style="font-weight:900; font-size:1.4rem; margin-bottom:4px;">${data?.first_name || 'Foydalanuvchi'}</h2>
                        <span style="font-size:0.65rem; font-weight:900; background:rgba(0,0,0,0.2); padding:4px 10px; border-radius:10px; text-transform:uppercase;">${data?.role}</span>
                    </div>
                </div>
            </div>

            <!-- TELEGRAM BOT CONNECTION -->
            <div class="card" style="padding:22px; border-radius:28px; border:none; box-shadow:var(--shadow-sm); background:${isBotLinked ? '#f0fdf4' : '#eff6ff'}; margin-bottom:25px; border:1.5px dashed ${isBotLinked ? 'var(--primary)' : '#3b82f6'};">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px;">
                    <div style="width:40px; height:40px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; color:${isBotLinked ? 'var(--primary)' : '#3b82f6'};">
                        <i class="fab fa-telegram-plane" style="font-size:1.2rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <h4 style="font-weight:900; font-size:0.9rem; color:var(--text);">${isBotLinked ? 'Bot ulangan ✅' : 'Botni ulang'}</h4>
                        <p style="font-size:0.7rem; color:var(--gray); font-weight:600;">${isBotLinked ? 'Sizga buyurtmalar botga keladi' : 'Xabarnomalarni botda olish uchun'}</p>
                    </div>
                </div>
                ${!isBotLinked ? `
                    <button class="btn btn-primary" style="height:48px; width:100%; border-radius:14px; font-size:0.85rem;" onclick="generateBotLink()">
                        BOTGA ULASH <i class="fas fa-link" style="margin-left:5px;"></i>
                    </button>
                ` : `
                    <div style="font-size:0.8rem; font-weight:800; color:var(--primary); text-align:center;">TG ID: ${data.telegram_id}</div>
                `}
            </div>

            <!-- STATS GRID -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" onclick="handleMenuClick('payment')" style="padding:20px; border-radius:24px; text-align:center;">
                    <i class="fas fa-wallet" style="color:var(--primary); font-size:1.2rem; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Balans</div>
                    <div style="font-weight:900;">${(data?.balance || 0).toLocaleString()} <small>UZS</small></div>
                </div>
                <div class="card" onclick="navTo('orders')" style="padding:20px; border-radius:24px; text-align:center;">
                    <i class="fas fa-receipt" style="color:#3b82f6; font-size:1.2rem; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Tarix</div>
                    <div style="font-weight:900;">BUYURTMALAR</div>
                </div>
            </div>

            <!-- INFO LIST -->
            <div class="card" style="padding:20px; border-radius:28px; margin-bottom:25px;">
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding-bottom:8px; border-bottom:1px solid #f8fafc;">
                        <span style="color:var(--gray); font-weight:600;">Gmail</span>
                        <b>${data?.email}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                        <span style="color:var(--gray); font-weight:600;">Tel:</span>
                        <b>${data?.phone || 'Kiritilmagan'}</b>
                    </div>
                </div>
            </div>

            <button class="btn btn-outline" style="width:100%; color:var(--danger); border-color:#fee2e2; height:60px;" onclick="handleSignOut()">
                CHIQISH <i class="fas fa-power-off"></i>
            </button>
        </div>
    `;

    // Agar raqam yo'q bo'lsa (Google Authdan keyin), majburiy so'rash
    if (!data?.phone) {
        setTimeout(() => openPhoneConfirmation(), 500);
    }
}

async function openPhoneConfirmation() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;
    placeholder.innerHTML = `
        <div style="padding:10px 0;">
            <h2 style="font-weight:900; margin-bottom:10px;">Raqamni tasdiqlang</h2>
            <p style="font-size:0.85rem; color:var(--gray); margin-bottom:20px; font-weight:600;">Buyurtmalar bo'yicha bog'lanish uchun telefon raqamingizni kiriting.</p>
            <input type="tel" id="confirmPhone" placeholder="+998 90 123 45 67" value="${profile?.phone || ''}" style="height:60px; font-size:1.1rem;">
            <p style="font-size:0.7rem; color:var(--gray); margin-bottom:20px;">* SMS kod yuborilmaydi, faqat aloqa uchun kerak.</p>
            <button class="btn btn-primary" style="width:100%; height:60px;" onclick="saveConfirmedPhone()">TASDIQLASH</button>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).saveConfirmedPhone = async () => {
    const phone = (document.getElementById('confirmPhone') as HTMLInputElement).value.trim();
    if (phone.length < 9) return showToast("To'g'ri raqam kiriting");
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', user.id);
    if (!error) {
        showToast("Raqam saqlandi! ✨");
        // closeOverlay was missing from imports
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
        const { data: config } = await supabase.from('bot_configs').select('bot_name').eq('is_active', true).single();
        const botUsername = config?.bot_name.replace('@', '') || "elaz_market_bot";
        window.open(`https://t.me/${botUsername}?start=v_${token}`, '_blank');
        showToast("Telegramga yo'naltirilmoqda...");
    }
};
