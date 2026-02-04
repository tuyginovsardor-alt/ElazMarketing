
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register' | 'verify';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    const content = {
        login: {
            title: "Xush kelibsiz! 👋",
            sub: "Profilingizga kiring va qulay xaridlarni boshlang.",
            btn: "TIZIMGA KIRISH",
            linkText: "Hisobingiz yo'qmi?",
            linkAction: "Ro'yxatdan o'tish",
            nextMode: 'register'
        },
        register: {
            title: "Ro'yxatdan o'ting ✨",
            sub: "ELAZ MARKET oilasiga qo'shiling va chegirmalardan foydalaning.",
            btn: "RO'YXATDAN O'TISH",
            linkText: "Hisobingiz bormi?",
            linkAction: "Kirish",
            nextMode: 'login'
        },
        verify: {
            title: "Emailni tasdiqlang 📧",
            sub: `${extraData?.email || 'Gmail'} manzilingizga kod yubordik.`,
            btn: "TASDIQLASH",
            linkText: "Orqaga qaytish",
            linkAction: "Kirish",
            nextMode: 'login'
        }
    }[mode];

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            <!-- LOGO AREA -->
            <div style="text-align: center; margin-bottom: 35px; margin-top: 20px;">
                <div style="width: 80px; height: 80px; background: var(--gradient); border-radius: 26px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2.2rem; box-shadow: 0 15px 30px rgba(34,197,94,0.25); margin-bottom: 15px; transform: rotate(-5deg);">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 2rem; font-weight: 900; letter-spacing: -1.5px; color: var(--text);">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <!-- HEADER TEXT -->
            <div style="margin-bottom: 30px; text-align: center;">
                <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text); line-height: 1.2;">${content.title}</h2>
                <p style="color: var(--gray); margin-top: 10px; font-size: 0.95rem; font-weight: 600; line-height: 1.5;">${content.sub}</p>
            </div>

            <!-- AUTH FORM CARD -->
            <div style="background: white; border-radius: 32px; padding: 5px; position: relative;">
                ${mode !== 'verify' ? `
                    <button class="btn btn-outline" style="width:100%; height:62px; margin-bottom:25px; border-radius:20px; border:2.5px solid #f1f5f9; font-weight:800; gap:12px; font-size:0.95rem; background:white; color:var(--text);" onclick="signInWithGoogle()">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22"> Google bilan davom etish
                    </button>
                    
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; color:#cbd5e1;">
                        <div style="flex:1; height:1.5px; background:#f1f5f9;"></div>
                        <span style="font-size:0.75rem; font-weight:900; letter-spacing:1px; color:#94a3b8;">YOKI EMAIL ORQALI</span>
                        <div style="flex:1; height:1.5px; background:#f1f5f9;"></div>
                    </div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 18px;">
                    ${mode === 'register' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">To'liq ismingiz</label>
                            <input type="text" id="regFName" placeholder="Masalan: Azizbek" style="width: 100%; height: 60px; padding: 0 20px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-size: 1rem; font-weight: 700; outline: none; transition: 0.3s;">
                        </div>
                    ` : ''}

                    ${mode !== 'verify' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Email manzil</label>
                            <input type="email" id="authEmail" value="${extraData?.email || ''}" placeholder="nom@gmail.com" style="width: 100%; height: 60px; padding: 0 20px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-size: 1rem; font-weight: 700; outline: none; transition: 0.3s;">
                        </div>
                        <div class="input-group">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Parol</label>
                            <input type="password" id="authPass" placeholder="••••••••" style="width: 100%; height: 60px; padding: 0 20px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-size: 1rem; font-weight: 700; outline: none; transition: 0.3s;">
                        </div>
                    ` : `
                        <div class="input-group" style="text-align: center;">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 12px; text-transform: uppercase;">Tasdiqlash kodi</label>
                            <input type="number" id="authOtp" placeholder="000000" style="width: 100%; height: 80px; border-radius: 22px; border: 3px solid var(--primary); background: white; font-size: 2.4rem; font-weight: 900; text-align: center; letter-spacing: 8px; outline: none;">
                        </div>
                    `}

                    <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 15px; width: 100%; height: 65px; border-radius: 22px; font-size: 1.1rem; box-shadow: 0 12px 24px rgba(34,197,94,0.3);" onclick="executeAuth('${mode}', '${extraData?.email || ''}')">
                        ${content.btn} <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                    </button>
                </div>

                <!-- SWITCH MODE LINK -->
                <div style="text-align: center; margin-top: 30px; padding-bottom: 30px;">
                    <p style="font-weight: 700; color: var(--gray); font-size: 0.95rem;">
                        ${content.linkText} 
                        <span style="color: var(--primary); cursor: pointer; font-weight: 900; text-decoration: underline; margin-left: 5px;" onclick="renderAuthView('${content.nextMode}')">
                            ${content.linkAction}
                        </span>
                    </p>
                </div>
            </div>
        </div>
        <style>
            input:focus { border-color: var(--primary) !important; background: white !important; box-shadow: 0 0 0 4px var(--primary-light); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    `;
}

// Funksiyani global window ga biriktiramiz
(window as any).renderAuthView = renderAuthView;

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
    const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
    const password = (document.getElementById('authPass') as HTMLInputElement)?.value;

    if (mode !== 'verify' && (!email || !password)) return showToast("Barcha maydonlarni to'ldiring");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> KUTING...';

    try {
        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else if (mode === 'register') {
            const fNameInput = document.getElementById('regFName') as HTMLInputElement;
            const fName = fNameInput ? fNameInput.value.trim() : 'Foydalanuvchi';
            const { error } = await supabase.auth.signUp({ 
                email, password, 
                options: { data: { first_name: fName } } 
            });
            if (error) throw error;
            showToast("Tasdiqlash kodi yuborildi 📥");
            return renderAuthView('verify', { email });
        } else if (mode === 'verify') {
            const token = (document.getElementById('authOtp') as HTMLInputElement).value;
            if (!token) throw new Error("Kodni kiriting");
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
