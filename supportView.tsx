
import { supabase, profile, openOverlay, showToast, closeOverlay } from "./index.tsx";

export async function renderSupportView() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding:10px;"></i>
                <h2 style="font-weight:900; font-size:1.2rem;">Yordam markazi</h2>
            </div>

            <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm); margin-bottom:25px;">
                <div style="text-align:center; margin-bottom:25px;">
                    <div style="width:70px; height:70px; background:var(--primary-light); color:var(--primary); border-radius:24px; display:inline-flex; align-items:center; justify-content:center; font-size:1.8rem; margin-bottom:15px;">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3 style="font-weight:900; font-size:1.1rem;">Savolingiz bormi?</h3>
                    <p style="font-size:0.8rem; color:var(--gray); margin-top:5px;">Mutaxassislarimiz sizga yordam berishga tayyor.</p>
                </div>

                <label style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Xabar matni</label>
                <textarea id="supportMsgText" placeholder="Muammoingizni batafsil yozing..." style="height:150px; margin-top:10px; border-radius:18px;"></textarea>

                <button class="btn btn-primary" id="btnSendSupport" style="width:100%; margin-top:20px; height:60px; border-radius:20px;" onclick="sendSupportMessage()">
                    YUBORISH <i class="fas fa-paper-plane" style="margin-left:8px;"></i>
                </button>
            </div>

            <div style="background:#f8fafc; border-radius:24px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                <h4 style="font-weight:900; font-size:0.85rem; color:var(--text);">Tezkor aloqa (Telegram):</h4>
                <a href="https://t.me/elaz_market_support" target="_blank" style="display:flex; align-items:center; gap:12px; text-decoration:none; color:var(--text); font-weight:800; background:white; padding:15px; border-radius:15px; border:1px solid #e2e8f0;">
                    <div style="width:36px; height:36px; background:#0088cc; color:white; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fab fa-telegram-plane"></i></div>
                    <span>@elaz_support (Admin)</span>
                </a>
            </div>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).openSupportCenter = renderSupportView;

(window as any).sendSupportMessage = async () => {
    const text = (document.getElementById('supportMsgText') as HTMLTextAreaElement).value.trim();
    if(!text) return showToast("Iltimos, xabar matnini kiriting!");

    const btn = document.getElementById('btnSendSupport') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    try {
        const { error } = await supabase.from('support_messages').insert({
            user_id: profile?.id,
            user_name: profile?.first_name || 'Noma\'lum',
            message: text,
            status: 'pending'
        });

        if(error) throw error;
        showToast("Xabaringiz yuborildi! ✅");
        closeOverlay('checkoutOverlay');
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "YUBORISH";
    }
};
