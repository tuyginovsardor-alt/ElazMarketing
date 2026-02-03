
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
            icon: "fa-right-to-bracket",
            nextMode: 'register'
        },
        register: {
            title: "Ro'yxatdan o'ting",
            sub: "ELAZ MARKET oilasiga qo'shiling va qulayliklardan bahra oling.",
            btn: "KODNI YUBORISH",
            linkText: "Hisobingiz bormi?",
            linkAction: "Kirish",
            icon: "fa-user-plus",
            nextMode: 'login'
        },
        verify: {
            title: "Emailni tasdiqlang",
            sub: `${extraData?.email || 'Gmail'} manzilingizga 6 xonali kod yubordik.`,
            btn: "TASDIQLASH",
            linkText: "Ma'lumotlarni o'zgartirish?",
            linkAction: "Orqaga qaytish",
            icon: "fa-shield-check",
            nextMode: 'register'
        }
    }[mode];

    container.innerHTML = `
        <div style="padding-top: 1rem; display: flex; flex-direction: column; height: 100%; max-width: 400px; margin: 0 auto; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 2rem; animation: fadeIn 0.8s ease-out;">
                <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 22px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 10px 20px rgba(34,197,94,0.2); margin-bottom: 1rem;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1px;">
                    ELAZ<span style="color:var(--primary)">MARKET</span>
                </h1>
            </div>

            <div style="margin-bottom: 1.5rem; animation: slideIn 0.4s ease-out;">
                <h2 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1px; color: var(--text);">
                    ${content.title}
                </h2>
                <p style="color: var(--gray); margin-top: 0.4rem; font-size: 0.95rem; font-weight: 500;">
                    ${content.sub}
                </p>
            </div>

            <div class="auth-card" style="animation: slideInUp 0.5s ease-out;">
                ${mode === 'register' ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="input-group">
                            <label>Ism</label>
                            <input type="text" id="regFName" placeholder="Ali" class="custom-input">
                        </div>
                        <div class="input-group">
                            <label>Familiya</label>
                            <input type="text" id="regLName" placeholder="Valiyev" class="custom-input">
                        </div>
                    </div>
                    <div class="input-group" style="margin-top: 1rem;">
                        <label><i class="fas fa-phone"></i> Telefon raqami</label>
                        <input type="tel" id="regPhone" placeholder="+998 90 123 45 67" class="custom-input">
                    </div>
                ` : ''}

                ${mode !== 'verify' ? `
                    <div class="input-group" style="margin-top: 1rem;">
                        <label><i class="fas fa-envelope"></i> Email manzil</label>
                        <input type="email" id="authEmail" value="${extraData?.email || ''}" placeholder="nom@email.com" class="custom-input">
                    </div>

                    <div class="input-group" style="margin-top: 1rem;">
                        <label><i class="fas fa-lock"></i> Parol</label>
                        <div style="position: relative;">
                            <input type="password" id="authPass" placeholder="••••••••" class="custom-input">
                            <i class="fas fa-eye" id="togglePass" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--gray); cursor: pointer;" onclick="togglePassVisibility()"></i>
                        </div>
                    </div>
                ` : `
                    <div class="input-group" style="margin-top: 1rem; text-align: center;">
                        <label>6 xonali tasdiqlash kodi</label>
                        <input type="number" id="authOtp" placeholder="000000" class="custom-input" style="text-align: center; font-size: 2rem; letter-spacing: 10px; height: 70px;">
                    </div>
                `}

                <button class="btn btn-primary" id="authSubmitBtn" style="margin-top: 2rem; width: 100%; height: 60px; font-size: 1.1rem;" onclick="executeAuth('${mode}', '${extraData?.email || ''}')">
                    ${content.btn}
                </button>

                <div style="text-align: center; margin-top: 2rem; padding-bottom: 2rem;">
                    <p style="font-weight: 600; color: var(--gray); font-size: 0.9rem;">
                        ${content.linkText} 
                        <span style="color: var(--primary); cursor: pointer; font-weight: 800; border-bottom: 2px solid var(--primary-light);" 
                              onclick="window.renderAuthView('${content.nextMode}')">
                            ${content.linkAction}
                        </span>
                    </p>
                </div>
            </div>
        </div>

        <style>
            @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes slideInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .input-group label i { margin-right: 6px; color: var(--primary); }
            .custom-input { width: 100%; height: 54px; padding: 0 16px; border-radius: 14px; border: 2px solid #f1f5f9; background: #f8fafc; font-size: 1rem; font-weight: 600; outline: none; transition: 0.3s; }
            .custom-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px var(--primary-light); }
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        </style>
    `;
}

// Funksiyani window'ga biriktirish
(window as any).renderAuthView = renderAuthView;

(window as any).togglePassVisibility = () => {
    const input = document.getElementById('authPass') as HTMLInputElement;
    const icon = document.getElementById('togglePass');
    if(input.type === 'password') {
        input.type = 'text';
        icon?.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon?.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

(window as any).executeAuth = async (mode: AuthMode, currentEmail?: string) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    
    if (mode === 'verify') {
        const otpInput = document.getElementById('authOtp') as HTMLInputElement;
        const otp = otpInput.value;
        if (otp.length !== 6) return showToast("6 xonali kodni to'liq kiriting");
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> TASDIQLANMOQDA...';
        
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: currentEmail,
                token: otp,
                type: 'signup'
            });
            if (error) throw error;
            showToast("Muvaffaqiyatli tasdiqlandi! ✨");
            await checkAuth();
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Xato kod kiritildi");
            btn.disabled = false;
            btn.innerText = "TASDIQLASH";
        }
        return;
    }

    const emailEl = document.getElementById('authEmail') as HTMLInputElement;
    const passEl = document.getElementById('authPass') as HTMLInputElement;
    const email = emailEl.value.trim();
    const password = passEl.value;

    if(!email || !password) return showToast("Email va parolni kiriting");
    if(password.length < 6) return showToast("Parol kamida 6 ta belgidan iborat bo'lsin");

    if (mode === 'register') {
        const fName = (document.getElementById('regFName') as HTMLInputElement).value.trim();
        const lName = (document.getElementById('regLName') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('regPhone') as HTMLInputElement).value.trim();

        if(!fName || !lName || !phone) return showToast("Barcha maydonlarni to'ldiring");

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> KOD YUBORILMOQDA...';

        try {
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password, 
                options: { 
                    data: { 
                        first_name: fName,
                        last_name: lName,
                        phone: phone
                    } 
                } 
            });
            
            if(error) throw error;

            showToast("Gmail manzilingizga kod yuborildi!");
            renderAuthView('verify', { email });
            
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Xatolik yuz berdi");
            btn.disabled = false;
            btn.innerText = "KODNI YUBORISH";
        }
    } else {
        // LOGIN MODE
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> KIRILMOQDA...';
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if(error) throw error;
            showToast("Xush kelibsiz!");
            await checkAuth();
        } catch (err: any) {
            console.error(err);
            showToast("Email yoki parol xato");
            btn.disabled = false;
            btn.innerText = "TIZIMGA KIRISH";
        }
    }
};
