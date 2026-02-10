
import { supabase, profile, openOverlay, showToast, closeOverlay } from "./index.tsx";

export async function renderSupportView() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding:10px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Yordam markazi</h2>
            </div>

            <div class="card" style="border-radius:28px; padding:25px; border:none; background:white; box-shadow:var(--shadow-sm); margin-bottom:25px;">
                <div style="text-align:center; margin-bottom:25px;">
                    <div style="width:70px; height:70px; background:var(--primary-light); color:var(--primary); border-radius:24px; display:inline-flex; align-items:center; justify-content:center; font-size:1.8rem; margin-bottom:15px;">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3 style="font-weight:900;">Qanday yordam bera olamiz?</h3>
                    <p style="font-size:0.8rem; color:var(--gray); margin-top:5px;">Muammo yoki savollaringiz bo'lsa, mutaxassislarimizga yozishingiz mumkin.</p>
                </div>

                <label style="font-size:0.7rem; font-weight:800; color:var(--gray);">XABAR MATNI</label>
                <textarea id="supportMsgText" placeholder="Muammoingizni batafsil yozing..." style="height:150px; margin-top:10px;"></textarea>

                <button class="btn btn-primary" id="btnSendSupport" style="width:100%; margin-top:20px; height:60px; border-radius:20px;" onclick="sendSupportMessage()">
                    XABARNI YUBORISH <i class="fas fa-paper-plane"></i>
                </button>
            </div>

            <div style="background:#f8fafc; border-radius:24px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                <h4 style="font-weight:900; font-size:0.9rem; margin-bottom:5px;">Tezkor aloqa (Telegram):</h4>
                
                <a href="https://t.me/mr1s_tuyginov" target="_blank" style="display:flex; align-items:center; gap:12px; text-decoration:none; color:var(--text); font-weight:700; background:white; padding:15px; border-radius:15px; border:1px solid #e2e8f0; transition:0.2s;">
                    <div style="width:36px; height:36px; background:#0088cc; color:white; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fab fa-telegram-plane"></i></div>
                    <span>@mr1s_tuyginov (Admin)</span>
                </a>

                <a href="https://t.me/sardordev" target="_blank" style="display:flex; align-items:center; gap:12px; text-decoration:none; color:var(--text); font-weight:700; background:white; padding:15px; border-radius:15px; border:1px solid #e2e8f0; transition:0.2s;">
                    <div style="width:36px; height:36px; background:#0088cc; color:white; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fab fa-telegram-plane"></i></div>
                    <span>@sardordev (Developer)</span>
                </a>
            </div>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).sendSupportMessage = async () => {
    const text = (document.getElementById('supportMsgText') as HTMLTextAreaElement).value.trim();
    if(!text) return showToast("Iltimos, xabar matnini kiriting!");

    const btn = document.getElementById('btnSendSupport') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    const { error } = await supabase.from('support_messages').insert({
        user_id: profile?.id,
        user_name: profile?.first_name || 'Noma\'lum',
        message: text,
        status: 'pending'
    });

    if(!error) {
        showToast("Xabaringiz yuborildi! ✅");
        closeOverlay('checkoutOverlay');
    } else {
        showToast("Xato: " + error.message);
        btn.disabled = false;
        btn.innerText = "XABARNI YUBORISH";
    }
};
