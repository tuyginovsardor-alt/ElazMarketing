
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register_phone' | 'verify_otp' | 'complete_profile' | 'email_auth';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            <!-- Logo Section -->
            <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
                <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 12px 24px rgba(34,197,94,0.25); margin-bottom: 12px; transform: rotate(-5deg);">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1.2px; color: var(--text);">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <!-- Tabs -->
            ${(mode === 'login' || mode === 'email_auth') ? `
                <div style="display: flex; background: #f1f5f9; padding: 5px; border-radius: 18px; margin-bottom: 25px;">
                    <button onclick="renderAuthView('login')" style="flex: 1; height: 45px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; background: ${mode === 'login' ? 'white' : 'transparent'}; color: ${mode === 'login' ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${mode === 'login' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};">TELEFON</button>
                    <button onclick="renderAuthView('email_auth')" style="flex: 1; height: 45px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; background: ${mode === 'email_auth' ? 'white' : 'transparent'}; color: ${mode === 'email_auth' ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${mode === 'email_auth' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};">EMAIL</button>
                </div>
            ` : ''}

            <div style="margin-bottom: 25px; text-align: center;">
                <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--text);">
                    ${mode === 'login' ? 'Xush kelibsiz! 👋' : 
                      mode === 'register_phone' ? 'Ro\'yxatdan o\'tish 📝' :
                      mode === 'verify_otp' ? 'Kodni kiriting 📩' :
                      mode === 'complete_profile' ? 'Profilni yakunlash ✨' : 'Email orqali kirish'}
                </h2>
                <p style="color: var(--gray); margin-top: 8px; font-size: 0.85rem; font-weight: 600;">
                    ${mode === 'verify_otp' ? 'Bot orqali yuborilgan 6 xonali kodni kiriting.' : 'Davom etish uchun ma\'lumotlarni kiriting.'}
                </p>
            </div>

            <div style="background: white; border-radius: 32px;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    
                    ${mode === 'login' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Telefon raqami</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text);">+998</span>
                                <input type="tel" id="authPhone" placeholder="(90) 000-00-00" maxlength="14" style="width: 100%; height: 60px; padding-left: 62px;" oninput="window.maskPhone(this)">
                            </div>
                        </div>
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Parol</label>
                            <input type="password" id="authPassword" placeholder="••••••••" style="width: 100%; height: 60px;">
                        </div>
                    ` : ''}

                    ${mode === 'email_auth' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Gmail Manzil</label>
                            <input type="email" id="authEmail" placeholder="example@gmail.com" style="width: 100%; height: 60px;">
                        </div>
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Parol</label>
                            <input type="password" id="authEmailPass" placeholder="••••••••" style="width: 100%; height: 60px;">
                        </div>
                    ` : ''}

                    ${mode === 'register_phone' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Yangi Telefon raqami</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text);">+998</span>
                                <input type="tel" id="regPhone" placeholder="(90) 000-00-00" maxlength="14" style="width: 100%; height: 60px; padding-left: 62px;" oninput="window.maskPhone(this)">
                            </div>
                        </div>
                    ` : ''}

                    ${mode === 'verify_otp' ? `
                        <div class="input-group" style="text-align: center;">
                            <input type="number" id="authOtp" placeholder="000000" maxlength="6" style="width: 100%; height: 75px; border-radius: 20px; border: 3px solid var(--primary); font-size: 2.2rem; font-weight: 900; text-align: center; letter-spacing: 8px;">
                            <div id="otpStatusDisplay" style="margin-top:10px; font-size:0.75rem; font-weight:800; color:var(--gray);">Bazaga yozilmoqda...</div>
                        </div>
                    ` : ''}

                    ${mode === 'complete_profile' ? `
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Ismingiz</label>
                            <input type="text" id="regName" placeholder="Ali Valiyev" style="width: 100%; height: 60px;">
                        </div>
                        <div class="input-group">
                            <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">Parol o'rnating</label>
                            <input type="password" id="regPass" placeholder="Kamida 6 ta belgi" style="width: 100%; height: 60px;">
                        </div>
                    ` : ''}

                    <button class="btn btn-primary" id="authSubmitBtn" style="width: 100%; height: 65px; border-radius: 22px; margin-top: 10px;" onclick="executeAuthAction('${mode}', ${JSON.stringify(extraData)})">
                        ${mode === 'login' || mode === 'email_auth' ? 'KIRISH' : 
                          mode === 'register_phone' ? 'KODNI OLISH' : 
                          mode === 'verify_otp' ? 'TASDIQLASH' : 'SAQLASH VA KIRISH'}
                    </button>

                    ${(mode === 'login' || mode === 'register_phone' || mode === 'email_auth') ? `
                        <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                            <div style="flex: 1; height: 1px; background: #f1f5f9;"></div>
                            <span style="font-size: 0.6rem; font-weight: 800; color: #cbd5e1;">YOKI</span>
                            <div style="flex: 1; height: 1px; background: #f1f5f9;"></div>
                        </div>

                        <button onclick="window.signInWithGoogle()" style="width: 100%; height: 60px; border-radius: 20px; border: 2px solid #f1f5f9; background: white; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 800; color: var(--text); cursor: pointer;">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22">
                            Google bilan kirish
                        </button>
                    ` : ''}

                    ${mode === 'login' ? `
                        <p style="text-align:center; font-weight:800; font-size:0.85rem; color:var(--gray); margin-top:10px;">
                            Akkauntingiz yo'qmi? <span style="color:var(--primary); cursor:pointer;" onclick="renderAuthView('register_phone')">Ro'yxatdan o'tish</span>
                        </p>
                    ` : (mode === 'register_phone' || mode === 'email_auth') ? `
                        <p style="text-align:center; font-weight:800; font-size:0.85rem; color:var(--gray); margin-top:10px;">
                            Akkauntingiz bormi? <span style="color:var(--primary); cursor:pointer;" onclick="renderAuthView('login')">Kirish</span>
                        </p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    if(mode === 'verify_otp') {
        startPollingOtpStatus(extraData?.phone);
    }
}

function startPollingOtpStatus(phone: string) {
    const statusEl = document.getElementById('otpStatusDisplay');
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        const { data } = await supabase.from('profiles').select('otp_status').eq('phone', phone).maybeSingle();
        if(data && statusEl) {
            if(data.otp_status === 'sent') {
                statusEl.innerText = "✅ Kod Telegram botingizga yuborildi!";
                statusEl.style.color = "var(--primary)";
                clearInterval(interval);
            } else if(data.otp_status === 'failed' || attempts > 20) {
                statusEl.innerHTML = "❌ Botga ulanmagansiz! <br> Avval <a href='https://t.me/elaz_market_bot' target='_blank'>Botga kirib</a> 'Raqamni ulash' tugmasini bosing.";
                statusEl.style.color = "var(--danger)";
                clearInterval(interval);
            }
        }
    }, 2000);
}

(window as any).executeAuthAction = async (mode: AuthMode, extraData?: any) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    btn.disabled = true;

    try {
        if (mode === 'login') {
            const phone = '+998' + (document.getElementById('authPhone') as HTMLInputElement).value.replace(/\D/g, '');
            const pass = (document.getElementById('authPassword') as HTMLInputElement).value;
            if (phone.length < 12 || pass.length < 4) throw new Error("Ma'lumotlar yetarli emas!");

            const { data, error } = await supabase.auth.signInWithPassword({ email: phone + '@elaz.uz', password: pass });
            if (error) throw new Error("Parol yoki telefon xato!");
            
            showToast("Xush kelibsiz! 👋");
            await checkAuth();
        }

        else if (mode === 'register_phone') {
            const phone = '+998' + (document.getElementById('regPhone') as HTMLInputElement).value.replace(/\D/g, '');
            if (phone.length < 12) throw new Error("Raqamni to'liq kiriting!");

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // 1. Bazaga yozamiz. Bot bu yerdan oladi.
            const { error } = await supabase.from('profiles').upsert({
                phone: phone,
                otp_code: otpCode,
                otp_status: 'pending',
                otp_updated_at: new Date().toISOString()
            }, { onConflict: 'phone' });

            if (error) throw error;
            renderAuthView('verify_otp', { phone });
        }

        else if (mode === 'verify_otp') {
            const code = (document.getElementById('authOtp') as HTMLInputElement).value;
            const { data: p } = await supabase.from('profiles').select('*').eq('phone', extraData.phone).eq('otp_code', code).maybeSingle();

            if (!p) throw new Error("Tasdiqlash kodi xato!");
            renderAuthView('complete_profile', { phone: extraData.phone });
        }

        else if (mode === 'complete_profile') {
            const name = (document.getElementById('regName') as HTMLInputElement).value.trim();
            const pass = (document.getElementById('regPass') as HTMLInputElement).value;
            if (name.length < 2 || pass.length < 6) throw new Error("Ism yoki parol kamlik qiladi!");

            const phone = extraData.phone;
            const email = phone + '@elaz.uz';

            // Supabase-da ro'yxatdan o'tkazish
            const { data: auth, error: signUpErr } = await supabase.auth.signUp({ email, password: pass });
            if (signUpErr) throw signUpErr;

            if (auth.user) {
                // Profilni yangilash
                await supabase.from('profiles').update({
                    id: auth.user.id,
                    first_name: name,
                    otp_status: 'verified',
                    role: 'user'
                }).eq('phone', phone);
            }

            showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz! 🥳");
            await checkAuth();
        }
        
        else if (mode === 'email_auth') {
            const email = (document.getElementById('authEmail') as HTMLInputElement).value.trim();
            const pass = (document.getElementById('authEmailPass') as HTMLInputElement).value;
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) {
                const { error: signUpError } = await supabase.auth.signUp({ email, password: pass });
                if (signUpError) throw signUpError;
                showToast("Gmailingizga tasdiqlash xati yuborildi!");
            } else {
                await checkAuth();
            }
        }

    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
    }
};

(window as any).renderAuthView = renderAuthView;
