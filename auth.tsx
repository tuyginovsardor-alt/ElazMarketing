
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
            <!-- LOGO SECTION -->
            <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
                <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 12px 24px rgba(34,197,94,0.25); margin-bottom: 12px; transform: rotate(-5deg);">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1.2px; color: var(--text);">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <!-- TAB SWITCHER -->
            ${!isVerify ? `
                <div style="display: flex; background: #f1f5f9; padding: 5px; border-radius: 18px; margin-bottom: 25px;">
                    <button onclick="renderAuthView('phone')" style="flex: 1; height: 45px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; background: ${isPhone ? 'white' : 'transparent'}; color: ${isPhone ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${isPhone ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};">TELEFON</button>
                    <button onclick="renderAuthView('email')" style="flex: 1; height: 45px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; background: ${isEmail ? 'white' : 'transparent'}; color: ${isEmail ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${isEmail ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};">EMAIL</button>
                </div>
            ` : ''}

            <div style="margin-bottom: 25px; text-align: center;">
                <h2 style="font-size: 1.6rem; font-weight: 900; color: var(--text); line-height: 1.2;">
                    ${isVerify ? 'Kodni kiriting 📩' : 'Xush kelibsiz! 👋'}
                </h2>
                <p style="color: var(--gray); margin-top: 8px; font-size: 0.9rem; font-weight: 600;">
                    ${isVerify ? `${extraData?.phone}ga kod yubordik.` : 'Tizimga kirish usulini tanlang.'}
                </p>
            </div>

            <div style="background: white; border-radius: 32px;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    
                    <!-- PHONE MODE -->
                    ${isPhone ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Telefon raqami</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text);">+998</span>
                                <input type="tel" id="authPhone" placeholder="(90) 000-00-00" maxlength="14"
                                    style="width: 100%; height: 60px; padding-left: 62px;" oninput="window.maskPhone(this)">
                            </div>
                        </div>
                    ` : ''}

                    <!-- EMAIL MODE -->
                    ${isEmail ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Gmail manzilingiz</label>
                            <input type="email" id="authEmail" placeholder="example@gmail.com" style="height: 60px;">
                        </div>
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Parol</label>
                            <input type="password" id="authPassword" placeholder="••••••••" style="height: 60px;">
                        </div>
                    ` : ''}

                    <!-- VERIFY MODE -->
                    ${isVerify ? `
                        <div class="input-group" style="text-align: center;">
                            <input type="number" id="authOtp" placeholder="000000" maxlength="6" 
                                style="width: 100%; height: 75px; border-radius: 20px; border: 3px solid var(--primary); font-size: 2.2rem; font-weight: 900; text-align: center; letter-spacing: 8px;">
                        </div>
                    ` : ''}

                    <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 10px; width: 100%; height: 65px; border-radius: 22px; font-size: 1.1rem;" 
                        onclick="executeAuth('${mode}', '${extraData?.phone || ''}')">
                        ${isVerify ? 'TASDIQLASH' : 'DAVOM ETISH'} <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                    </button>

                    <!-- SOCIAL LOGIN (Faqat asosiy sahifada) -->
                    ${!isVerify ? `
                        <div style="display: flex; align-items: center; margin: 15px 0;">
                            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                            <span style="padding: 0 15px; font-size: 0.7rem; font-weight: 800; color: #94a3b8;">YOKI</span>
                            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                        </div>

                        <button onclick="window.signInWithGoogle()" style="width: 100%; height: 60px; border-radius: 20px; border: 2px solid #f1f5f9; background: white; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 800; cursor: pointer; transition: 0.2s;">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22">
                            Google orqali kirish
                        </button>
                    ` : ''}
                </div>

                <div style="text-align: center; margin-top: 25px; padding-bottom: 20px;">
                    <p style="font-weight: 700; color: var(--gray); font-size: 0.9rem;">
                        ${isVerify ? 'Kodni olmadingizmi?' : 'Yordam kerakmi?'} 
                        <span style="color: var(--primary); cursor: pointer; font-weight: 900; text-decoration: underline; margin-left: 5px;" 
                            onclick="${isVerify ? `renderAuthView('phone')` : `window.openSupportCenter()`}">
                            ${isVerify ? 'Qayta yuborish' : 'Aloqa'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    `;
}

(window as any).maskPhone = (input: HTMLInputElement) => {
    let x = input.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (!x) return;
    input.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '') + (x[4] ? '-' + x[4] : '');
};

(window as any).signInWithGoogle = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (err: any) {
        showToast(err.message);
    }
};

(window as any).executeAuth = async (mode: AuthMode, currentPhone?: string) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>...';

    try {
        if (mode === 'phone') {
            const rawPhone = (document.getElementById('authPhone') as HTMLInputElement).value.replace(/\D/g, '');
            if (rawPhone.length < 9) throw new Error("Telefon raqami noto'g'ri!");
            const fullPhone = '+998' + rawPhone;

            const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
            if (error) throw error;

            showToast("SMS kod yuborildi! 📲");
            renderAuthView('verify', { phone: fullPhone });
        } 
        else if (mode === 'email') {
            const email = (document.getElementById('authEmail') as HTMLInputElement).value.trim();
            const password = (document.getElementById('authPassword') as HTMLInputElement).value;
            
            if (!email || !password) throw new Error("Email va parolni kiriting!");

            // Avval kirishga urinib ko'ramiz
            const { data: signData, error: signError } = await supabase.auth.signInWithPassword({ email, password });
            
            if (signError) {
                // Agar akkaunt bo'lmasa, ro'yxatdan o'tkazamiz
                if (signError.message.includes("Invalid login credentials")) {
                    const { error: signUpErr } = await supabase.auth.signUp({ email, password });
                    if (signUpErr) throw signUpErr;
                    showToast("Ro'yxatdan o'tdingiz! Gmailni tasdiqlang yoki qayta kiring.");
                } else {
                    throw signError;
                }
            } else {
                showToast("Xush kelibsiz! 🔓");
                await checkAuth();
            }
        }
        else if (mode === 'verify') {
            const token = (document.getElementById('authOtp') as HTMLInputElement).value;
            if (token.length < 6) throw new Error("Kodni to'liq kiriting!");

            const { error } = await supabase.auth.verifyOtp({ 
                phone: currentPhone, 
                token, 
                type: 'sms' 
            });
            if (error) throw error;

            showToast("Muvaffaqiyatli! 🎉");
            await checkAuth();
        }
    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
        btn.innerText = "QAYTA URINISH";
    }
};
