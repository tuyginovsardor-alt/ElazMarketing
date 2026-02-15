
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'phone' | 'email' | 'verify';

export function renderAuthView(mode: AuthMode = 'phone', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    const isPhone = mode === 'phone';
    const isEmail = mode === 'email';
    const isVerify = mode === 'verify';

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
                <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 12px 24px rgba(34,197,94,0.25); margin-bottom: 12px; transform: rotate(-5deg);">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1.2px; color: var(--text);">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            ${!isVerify ? `
                <div style="display: flex; background: #f1f5f9; padding: 5px; border-radius: 18px; margin-bottom: 25px;">
                    <button onclick="renderAuthView('phone')" style="flex: 1; height: 45px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; background: ${isPhone ? 'white' : 'transparent'}; color: ${isPhone ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${isPhone ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};">TELEFON</button>
                    <button onclick="renderAuthView('email')" style="flex: 1; height: 45px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; background: ${isEmail ? 'white' : 'transparent'}; color: ${isEmail ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${isEmail ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};">EMAIL</button>
                </div>
            ` : ''}

            <div style="margin-bottom: 25px; text-align: center;">
                <h2 style="font-size: 1.6rem; font-weight: 900; color: var(--text);">
                    ${isVerify ? 'Telegram kodini kiriting 📩' : 'Xush kelibsiz! 👋'}
                </h2>
                <p style="color: var(--gray); margin-top: 8px; font-size: 0.9rem; font-weight: 600;">
                    ${isVerify ? `Bot orqali yuborilgan kodni kiriting.` : 'Tizimga kirish usulini tanlang.'}
                </p>
            </div>

            <div style="background: white; border-radius: 32px;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${isPhone ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Telefon raqami</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text);">+998</span>
                                <input type="tel" id="authPhone" placeholder="(90) 000-00-00" maxlength="14" style="width: 100%; height: 60px; padding-left: 62px;" oninput="window.maskPhone(this)">
                            </div>
                        </div>
                    ` : ''}

                    ${isVerify ? `
                        <div class="input-group" style="text-align: center;">
                            <input type="number" id="authOtp" placeholder="000000" maxlength="6" style="width: 100%; height: 75px; border-radius: 20px; border: 3px solid var(--primary); font-size: 2.2rem; font-weight: 900; text-align: center; letter-spacing: 8px;">
                            <div id="otpStatusDisplay" style="margin-top:10px; font-size:0.75rem; font-weight:800; color:var(--gray);">Kodni yubormoqdamiz...</div>
                        </div>
                    ` : ''}

                    <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 10px; width: 100%; height: 65px; border-radius: 22px;" onclick="executeAuth('${mode}', '${extraData?.phone || ''}')">
                        ${isVerify ? 'TASDIQLASH' : (isEmail ? 'DAVOM ETISH' : 'KODNI OLISH')}
                    </button>

                    ${!isVerify ? `
                        <button onclick="window.signInWithGoogle()" style="width: 100%; height: 60px; border-radius: 20px; border: 2px solid #f1f5f9; background: white; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 800;">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22">
                            Google orqali kirish
                        </button>
                    ` : ''}
                </div>

                <div style="text-align: center; margin-top: 25px; padding-bottom: 20px;">
                    <p style="font-weight: 700; color: var(--gray); font-size: 0.9rem;">
                        ${isVerify ? 'Kod kelmadimi? <span style="color:var(--primary); cursor:pointer;" onclick="renderAuthView(\'phone\')">Qayta urinish</span>' : 'Botimizga a\'zo bo\'ling: <a href="https://t.me/elaz_market_bot" target="_blank" style="color:var(--primary);">@elaz_market_bot</a>'}
                    </p>
                </div>
            </div>
        </div>
    `;

    if(isVerify) {
        startPollingOtpStatus(extraData?.phone);
    }
}

let otpPollInterval: any = null;
function startPollingOtpStatus(phone: string) {
    if(otpPollInterval) clearInterval(otpPollInterval);
    const statusEl = document.getElementById('otpStatusDisplay');

    otpPollInterval = setInterval(async () => {
        const { data, error } = await supabase.from('profiles').select('otp_status').eq('phone', phone).maybeSingle();
        if(data && statusEl) {
            if(data.otp_status === 'sent') {
                statusEl.innerText = "✅ Kod Telegram botingizga yuborildi!";
                statusEl.style.color = "var(--primary)";
                clearInterval(otpPollInterval);
            } else if(data.otp_status === 'failed') {
                statusEl.innerHTML = "❌ Botga ulanmagansiz! <br> Avval <a href='https://t.me/elaz_market_bot' target='_blank'>Botga kirib</a> 'Raqamni ulash' tugmasini bosing.";
                statusEl.style.color = "var(--danger)";
                clearInterval(otpPollInterval);
            }
        }
    }, 2000);
}

(window as any).executeAuth = async (mode: AuthMode, currentPhone?: string) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    btn.disabled = true;

    try {
        if (mode === 'phone') {
            const rawPhone = (document.getElementById('authPhone') as HTMLInputElement).value.replace(/\D/g, '');
            if (rawPhone.length < 9) throw new Error("Raqam xato!");
            const fullPhone = '+998' + rawPhone;
            
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Profilni qidiramiz yoki OTP kodni yangilaymiz
            const { data: p } = await supabase.from('profiles').select('id').eq('phone', fullPhone).maybeSingle();
            
            const { error } = await supabase.from('profiles').upsert({
                phone: fullPhone,
                otp_code: otpCode,
                otp_status: 'pending',
                otp_updated_at: new Date().toISOString()
            }, { onConflict: 'phone' });

            if (error) throw error;
            renderAuthView('verify', { phone: fullPhone });
        } 
        else if (mode === 'verify') {
            const code = (document.getElementById('authOtp') as HTMLInputElement).value;
            const { data: profile, error } = await supabase.from('profiles')
                .select('*')
                .eq('phone', currentPhone)
                .eq('otp_code', code)
                .maybeSingle();

            if (!profile) throw new Error("Kod noto'g'ri!");

            // Bu yerda foydalanuvchini auth tizimidan ham o'tkazish kerak. 
            // Demo rejimida biz shunchaki profilni tasdiqlaymiz va load qilamiz.
            // Haqiqiy tizimda Service Role orqali auth.users yaratiladi.
            showToast("Xush kelibsiz! 🎉");
            await checkAuth();
        }
    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
    }
};

(window as any).renderAuthView = renderAuthView;
