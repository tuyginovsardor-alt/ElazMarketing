
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'verify';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    const content = {
        login: {
            title: "Xush kelibsiz! 👋",
            sub: "Telefon raqamingizni kiriting va tizimga kiring.",
            btn: "KODNI OLISH",
            linkText: "Muammo bormi?",
            linkAction: "Yordam markazi",
            nextMode: 'login'
        },
        verify: {
            title: "Kodni kiriting 📩",
            sub: `${extraData?.phone || 'Raqamingiz'}ga 6 xonali tasdiqlash kodini yubordik.`,
            btn: "TASDIQLASH",
            linkText: "Kodni olmadingizmi?",
            linkAction: "Qayta yuborish",
            nextMode: 'login'
        }
    }[mode];

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            <div style="text-align: center; margin-bottom: 35px; margin-top: 20px;">
                <div style="width: 80px; height: 80px; background: var(--gradient); border-radius: 26px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2.2rem; box-shadow: 0 15px 30px rgba(34,197,94,0.25); margin-bottom: 15px; transform: rotate(-5deg);">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 2rem; font-weight: 900; letter-spacing: -1.5px; color: var(--text);">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <div style="margin-bottom: 30px; text-align: center;">
                <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text); line-height: 1.2;">${content.title}</h2>
                <p style="color: var(--gray); margin-top: 10px; font-size: 0.95rem; font-weight: 600; line-height: 1.5;">${content.sub}</p>
            </div>

            <div style="background: white; border-radius: 32px; padding: 5px; position: relative;">
                <div style="display: flex; flex-direction: column; gap: 18px;">
                    
                    ${mode === 'login' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Telefon raqami</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text); font-size: 1rem;">+998</span>
                                <input type="tel" id="authPhone" placeholder="(90) 000-00-00" maxlength="14"
                                    style="width: 100%; height: 65px; padding: 0 20px 0 65px; border-radius: 20px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-size: 1.2rem; font-weight: 800; outline: none; transition: 0.3s;"
                                    oninput="window.maskPhone(this)">
                            </div>
                        </div>
                    ` : `
                        <div class="input-group" style="text-align: center;">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 12px; text-transform: uppercase;">Tasdiqlash kodi</label>
                            <input type="number" id="authOtp" placeholder="000000" maxlength="6" 
                                style="width: 100%; height: 80px; border-radius: 22px; border: 3px solid var(--primary); background: white; font-size: 2.4rem; font-weight: 900; text-align: center; letter-spacing: 8px; outline: none;">
                        </div>
                    `}

                    <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 15px; width: 100%; height: 68px; border-radius: 22px; font-size: 1.1rem; box-shadow: 0 12px 24px rgba(34,197,94,0.3);" 
                        onclick="executeAuth('${mode}', '${extraData?.phone || ''}')">
                        ${content.btn} <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                    </button>
                </div>

                <div style="text-align: center; margin-top: 30px; padding-bottom: 30px;">
                    <p style="font-weight: 700; color: var(--gray); font-size: 0.95rem;">
                        ${content.linkText} 
                        <span style="color: var(--primary); cursor: pointer; font-weight: 900; text-decoration: underline; margin-left: 5px;" 
                            onclick="${mode === 'verify' ? `renderAuthView('login')` : `window.openSupportCenter()`}">
                            ${content.linkAction}
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

(window as any).executeAuth = async (mode: AuthMode, currentPhone?: string) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> KUTING...';

    try {
        if (mode === 'login') {
            const rawPhone = (document.getElementById('authPhone') as HTMLInputElement).value.replace(/\D/g, '');
            if (rawPhone.length < 9) throw new Error("Telefon raqami noto'g'ri!");
            const fullPhone = '+998' + rawPhone;

            const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
            if (error) throw error;

            showToast("SMS kod yuborildi! 📲");
            renderAuthView('verify', { phone: fullPhone });
        } else if (mode === 'verify') {
            const token = (document.getElementById('authOtp') as HTMLInputElement).value;
            if (token.length < 6) throw new Error("Kodni to'liq kiriting!");

            const { error } = await supabase.auth.verifyOtp({ 
                phone: currentPhone, 
                token, 
                type: 'sms' 
            });
            if (error) throw error;

            showToast("Xush kelibsiz! 🎉");
            await checkAuth();
        }
    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
        btn.innerText = "QAYTA URINISH";
    }
};
