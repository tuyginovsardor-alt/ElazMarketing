
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register' | 'verify';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    const content = {
        login: {
            title: "Xush kelibsiz!",
            sub: "Profilingizga kiring va qulay xaridlarni boshlang.",
            btn: "TIZIMGA KIRISH",
            linkText: "Hisobingiz yo'qmi?",
            linkAction: "Ro'yxatdan o'tish",
            nextMode: 'register'
        },
        register: {
            title: "Ro'yxatdan o'ting",
            sub: "ELAZ MARKET oilasiga qo'shiling.",
            btn: "RO'YXATDAN O'TISH",
            linkText: "Hisobingiz bormi?",
            linkAction: "Kirish",
            nextMode: 'login'
        },
        verify: {
            title: "Emailni tasdiqlang",
            sub: `${extraData?.email || 'Gmail'} manzilingizga kod yubordik.`,
            btn: "TASDIQLASH",
            linkText: "Orqaga qaytish",
            linkAction: "Kirish",
            nextMode: 'login'
        }
    }[mode];

    container.innerHTML = `
        <div style="padding-top: 1rem; display: flex; flex-direction: column; height: 100%; max-width: 400px; margin: 0 auto; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 22px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 10px 20px rgba(34,197,94,0.2); margin-bottom: 1rem;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1px;">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text);">${content.title}</h2>
                <p style="color: var(--gray); margin-top: 0.4rem; font-size: 0.95rem; font-weight: 500;">${content.sub}</p>
            </div>

            <div class="auth-card">
                ${mode !== 'verify' ? `
                    <button class="btn btn-outline" style="width:100%; height:60px; margin-bottom:20px; border-radius:16px; border-color:#e2e8f0; font-weight:800; gap:10px;" onclick="signInWithGoogle()">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20"> GOOGLE BILAN KIRISH
                    </button>
                    
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px; color:#cbd5e1;">
                        <div style="flex:1; height:1px; background:#f1f5f9;"></div>
                        <span style="font-size:0.7rem; font-weight:800;">YOKI</span>
                        <div style="flex:1; height:1px; background:#f1f5f9;"></div>
                    </div>
                ` : ''}

                ${mode === 'register' ? `
                    <div class="input-group">
                        <label>Ism</label>
                        <input type="text" id="regFName" placeholder="Ali" class="custom-input">
                    </div>
                ` : ''}

                ${mode !== 'verify' ? `
                    <div class="input-group" style="margin-top: 1rem;">
                        <label>Email manzil</label>
                        <input type="email" id="authEmail" value="${extraData?.email || ''}" placeholder="nom@email.com" class="custom-input">
                    </div>
                    <div class="input-group" style="margin-top: 1rem;">
                        <label>Parol</label>
                        <input type="password" id="authPass" placeholder="••••••••" class="custom-input">
                    </div>
                ` : `
                    <div class="input-group" style="text-align: center;">
                        <label>6 xonali tasdiqlash kodi</label>
                        <input type="number" id="authOtp" placeholder="000000" class="custom-input" style="text-align: center; font-size: 2rem; height: 70px;">
                    </div>
                `}

                <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 2rem; width: 100%; height: 60px;" onclick="executeAuth('${mode}', '${extraData?.email || ''}')">
                    ${content.btn}
                </button>

                <div style="text-align: center; margin-top: 2rem; padding-bottom: 2rem;">
                    <p style="font-weight: 600; color: var(--gray); font-size: 0.9rem;">
                        ${content.linkText} 
                        <span style="color: var(--primary); cursor: pointer; font-weight: 800;" onclick="window.renderAuthView('${content.nextMode}')">
                            ${content.linkAction}
                        </span>
                    </p>
                </div>
            </div>
        </div>
        <style>
            .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase; }
            .custom-input { width: 100%; height: 54px; padding: 0 16px; border-radius: 14px; border: 2px solid #f1f5f9; background: #f8fafc; font-size: 1rem; font-weight: 600; outline: none; }
        </style>
    `;
}

(window as any).signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) showToast("Google xatoligi: " + error.message);
};

(window as any).executeAuth = async (mode: AuthMode, currentEmail?: string) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    const email = (document.getElementById('authEmail') as HTMLInputElement)?.value.trim();
    const password = (document.getElementById('authPass') as HTMLInputElement)?.value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> KUTING...';

    try {
        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else if (mode === 'register') {
            const fName = (document.getElementById('regFName') as HTMLInputElement).value.trim();
            const { error } = await supabase.auth.signUp({ 
                email, password, 
                options: { data: { first_name: fName } } 
            });
            if (error) throw error;
            showToast("Tasdiqlash kodi yuborildi");
            return renderAuthView('verify', { email });
        } else if (mode === 'verify') {
            const token = (document.getElementById('authOtp') as HTMLInputElement).value;
            const { error } = await supabase.auth.verifyOtp({ email: currentEmail, token, type: 'signup' });
            if (error) throw error;
        }
        await checkAuth();
    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
        btn.innerText = "QAYTA URINISH";
    }
};
