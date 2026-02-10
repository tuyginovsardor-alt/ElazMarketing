
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register' | 'verify';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    const content = {
        login: { title: "Xush kelibsiz! 👋", sub: "Profilingizga kiring va xaridlarni boshlang.", btn: "TIZIMGA KIRISH", nextMode: 'register', linkText: "Hisobingiz yo'qmi?", linkAction: "Ro'yxatdan o'tish" },
        register: { title: "Ro'yxatdan o'ting ✨", sub: "ELAZ MARKET oilasiga qo'shiling.", btn: "RO'YXATDAN O'TISH", nextMode: 'login', linkText: "Hisobingiz bormi?", linkAction: "Kirish" },
        verify: { title: "Tasdiqlang 📧", sub: "Emailga kod yubordik.", btn: "TASDIQLASH", nextMode: 'login', linkText: "Orqaga", linkAction: "Kirish" }
    }[mode];

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            
            <div class="elaz-logo-container" style="scale:0.7; margin-top:20px; margin-bottom:10px; flex-direction:column;">
                <div class="elaz-main-text">
                    <span class="l-char l-e">E</span>
                    <span class="l-char l-l">L</span>
                    <span class="l-char l-a">A<div class="a-cart-wrap"><i class="fas fa-shopping-basket"></i></div></span>
                    <span class="l-char l-z">Z</span>
                </div>
                <div class="market-label">MARKET</div>
            </div>

            <div style="margin-bottom: 30px; text-align: center;">
                <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text);">${content.title}</h2>
                <p style="color: var(--gray); margin-top: 8px; font-size: 1rem; font-weight: 600;">${content.sub}</p>
            </div>

            <div style="background: white; border-radius: 35px; padding: 5px;">
                ${mode !== 'verify' ? `
                    <button class="btn btn-outline" style="width:100%; height:64px; margin-bottom:20px; border:2.5px solid #f1f5f9; background:white; font-weight:800; border-radius:22px;" onclick="signInWithGoogle()">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="24"> Google bilan kirish
                    </button>
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px; color:#cbd5e1;"><div style="flex:1; height:1.5px; background:#f1f5f9;"></div><span style="font-size:0.75rem; font-weight:900; color:#94a3b8;">YOKI EMAIL</span><div style="flex:1; height:1.5px; background:#f1f5f9;"></div></div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${mode === 'register' ? `<input type="text" id="regFName" placeholder="To'liq ismingiz" style="height:62px; border-radius:20px;">` : ''}
                    ${mode !== 'verify' ? `
                        <input type="email" id="authEmail" value="${extraData?.email || ''}" placeholder="Gmail manzil" style="height:62px; border-radius:20px;">
                        <input type="password" id="authPass" placeholder="Parol" style="height:62px; border-radius:20px;">
                    ` : `<input type="number" id="authOtp" placeholder="000000" style="height:85px; font-size:2.8rem; text-align:center; font-weight:900; border-radius:25px; border:3px solid var(--primary); letter-spacing:10px;">`}

                    <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 10px; width:100%; height:70px; border-radius:25px; font-size:1.15rem; font-weight:900; box-shadow:0 12px 25px rgba(34,197,94,0.3);" onclick="executeAuth('${mode}', '${extraData?.email || ''}')">
                        ${content.btn} <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <div style="text-align: center; margin-top: 30px; padding-bottom: 25px;">
                    <p style="font-weight: 700; color: var(--gray); font-size: 0.95rem;">
                        ${content.linkText} <span style="color: var(--primary); cursor: pointer; font-weight:900; text-decoration:underline; margin-left:5px;" onclick="renderAuthView('${content.nextMode}')">${content.linkAction}</span>
                    </p>
                </div>
            </div>
        </div>
    `;
}
// Logic...
