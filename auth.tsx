
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register' | 'verify';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    const content = {
        login: { title: "Xush kelibsiz! 👋", sub: "Profilingizga kiring va qulay xaridlarni boshlang.", btn: "TIZIMGA KIRISH", nextMode: 'register' as AuthMode, linkText: "Hisobingiz yo'qmi?", linkAction: "Ro'yxatdan o'tish" },
        register: { title: "Ro'yxatdan o'ting ✨", sub: "ELAZ MARKET oilasiga qo'shiling.", btn: "RO'YXATDAN O'TISH", nextMode: 'login' as AuthMode, linkText: "Hisobingiz bormi?", linkAction: "Kirish" },
        verify: { title: "Tasdiqlang 📧", sub: "Emailga kod yubordik.", btn: "TASDIQLASH", nextMode: 'login' as AuthMode, linkText: "Orqaga", linkAction: "Kirish" }
    }[mode];

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            
            <div style="text-align:center; margin: 30px 0;">
                <div class="elaz-brand-container" style="scale:0.7; flex-direction:column;">
                    <div class="elaz-letters">
                        <span class="l-char l-e">E</span>
                        <span class="l-char l-l">L</span>
                        <span class="l-char l-a">A<i class="fas fa-shopping-basket a-icon"></i></span>
                        <span class="l-char l-z">Z</span>
                    </div>
                    <div class="market-chip" style="margin-left:0;">MARKET</div>
                </div>
            </div>

            <div style="margin-bottom: 30px; text-align: center;">
                <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text);">${content.title}</h2>
                <p style="color: var(--gray); margin-top: 8px; font-size: 1rem; font-weight: 600;">${content.sub}</p>
            </div>

            <div style="background: white; border-radius: 35px; padding: 5px;">
                ${mode !== 'verify' ? `
                    <button class="btn" style="width:100%; height:62px; margin-bottom:20px; border:2px solid #f1f5f9; background:white; font-weight:800; border-radius:20px; color:var(--text);" onclick="window.signInWithGoogle()">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" style="margin-right:10px;"> Google bilan kirish
                    </button>
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px; color:#cbd5e1;"><div style="flex:1; height:1.5px; background:#f1f5f9;"></div><span style="font-size:0.7rem; font-weight:900;">YOKI EMAIL</span><div style="flex:1; height:1.5px; background:#f1f5f9;"></div></div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${mode === 'register' ? `<input type="text" id="regFName" placeholder="To'liq ismingiz">` : ''}
                    ${mode !== 'verify' ? `
                        <input type="email" id="authEmail" value="${extraData?.email || ''}" placeholder="Gmail manzil">
                        <input type="password" id="authPass" placeholder="Parol">
                    ` : `<input type="number" id="authOtp" placeholder="000000" style="height:80px; font-size:2.5rem; text-align:center; font-weight:900; letter-spacing:10px;">`}

                    <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 10px; width:100%; height:68px; border-radius:22px; font-size:1.1rem; font-weight:900;" onclick="window.executeAuth('${mode}', '${extraData?.email || ''}')">
                        ${content.btn} <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <div style="text-align: center; margin-top: 30px; padding-bottom: 20px;">
                    <p style="font-weight: 700; color: var(--gray); font-size: 0.9rem;">
                        ${content.linkText} <span style="color: var(--primary); cursor: pointer; font-weight:900; text-decoration:underline;" onclick="window.renderAuthView('${content.nextMode}')">${content.linkAction}</span>
                    </p>
                </div>
            </div>
        </div>
    `;
}

(window as any).renderAuthView = renderAuthView;
(window as any).signInWithGoogle = async () => { showToast("Hozircha faqat email orqali"); };
(window as any).executeAuth = async (mode: AuthMode, currentEmail?: string) => {
    showToast("Serverga ulanmoqda...");
    // Auth logic here...
};
