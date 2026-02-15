
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register_phone' | 'verify_otp' | 'complete_profile' | 'email_auth';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
                <div style="width: 70px; height: 70px; background: var(--gradient); border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 12px 24px rgba(34,197,94,0.25); margin-bottom: 12px;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.8rem; font-weight: 900; color: var(--text);">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <div style="background: white; border-radius: 32px; padding: 5px;">
                ${(mode === 'login' || mode === 'email_auth') ? `
                    <div style="display: flex; background: #f1f5f9; padding: 5px; border-radius: 18px; margin: 10px;">
                        <button onclick="renderAuthView('login')" style="flex: 1; height: 40px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: 0.3s; background: ${mode === 'login' ? 'white' : 'transparent'}; color: ${mode === 'login' ? 'var(--primary)' : 'var(--gray)'};">TELEFON</button>
                        <button onclick="renderAuthView('email_auth')" style="flex: 1; height: 40px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: 0.3s; background: ${mode === 'email_auth' ? 'white' : 'transparent'}; color: ${mode === 'email_auth' ? 'var(--primary)' : 'var(--gray)'};">EMAIL</button>
                    </div>
                ` : ''}

                <div style="padding: 20px;">
                    <h2 style="font-size: 1.3rem; font-weight: 900; text-align: center; margin-bottom: 20px;">
                        ${mode === 'login' ? 'Xush kelibsiz! 👋' : 
                          mode === 'register_phone' ? 'Ro\'yxatdan o\'tish' :
                          mode === 'verify_otp' ? 'Tasdiqlash kodi' :
                          mode === 'complete_profile' ? 'Profilni to\'ldiring' : 'Email orqali kirish'}
                    </h2>

                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${mode === 'login' ? `
                            <div class="input-group">
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px;">TELEFON RAQAMI</label>
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800;">+998</span>
                                    <input type="tel" id="authPhone" placeholder="(90) 000-00-00" maxlength="14" style="width: 100%; height: 55px; padding-left: 62px;" oninput="window.maskPhone(this)">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px;">PAROL</label>
                                <input type="password" id="authPassword" placeholder="••••••••" style="width: 100%; height: 55px;">
                            </div>
                        ` : ''}

                        ${mode === 'register_phone' ? `
                            <div class="input-group">
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px;">TELEFON RAQAMINGIZ</label>
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800;">+998</span>
                                    <input type="tel" id="regPhone" placeholder="(90) 000-00-00" maxlength="14" style="width: 100%; height: 55px; padding-left: 62px;" oninput="window.maskPhone(this)">
                                </div>
                                <p style="font-size: 0.65rem; color: var(--gray); margin-top: 8px; font-weight: 700;">Tasdiqlash kodi bizning Telegram botimizga yuboriladi.</p>
                            </div>
                        ` : ''}

                        ${mode === 'verify_otp' ? `
                            <div class="input-group" style="text-align: center;">
                                <input type="number" id="authOtp" placeholder="000000" style="width: 100%; height: 70px; font-size: 2rem; font-weight: 900; text-align: center; letter-spacing: 10px; border-color: var(--primary);">
                                <div id="otpStatusDisplay" style="margin-top:15px; font-size:0.75rem; font-weight:800; color:var(--gray);">Kutilmoqda...</div>
                            </div>
                        ` : ''}

                        ${mode === 'complete_profile' ? `
                            <div class="input-group">
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px;">ISMINGIZ</label>
                                <input type="text" id="regName" placeholder="Ali Valiyev" style="width: 100%; height: 55px;">
                            </div>
                            <div class="input-group">
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: var(--gray); margin-bottom: 6px;">YANGI PAROL O'RNATING</label>
                                <input type="password" id="regPass" placeholder="Kamida 6 ta belgi" style="width: 100%; height: 55px;">
                            </div>
                        ` : ''}

                        <button class="btn btn-primary" id="authSubmitBtn" style="width: 100%; height: 55px;" onclick="executeAuthAction('${mode}', ${JSON.stringify(extraData)})">
                            ${mode === 'login' ? 'KIRISH' : mode === 'register_phone' ? 'KODNI OLISH' : mode === 'verify_otp' ? 'TASDIQLASH' : 'RO\'YXATDAN O\'TISH'}
                        </button>

                        ${mode === 'login' ? `
                            <p style="text-align:center; font-weight:800; font-size:0.8rem; color:var(--gray); margin-top:10px;">
                                Akkauntingiz yo'qmi? <span style="color:var(--primary); cursor:pointer;" onclick="renderAuthView('register_phone')">Ro'yxatdan o'tish</span>
                            </p>
                        ` : (mode === 'register_phone' || mode === 'email_auth') ? `
                            <p style="text-align:center; font-weight:800; font-size:0.8rem; color:var(--gray); margin-top:10px;">
                                Akkauntingiz bormi? <span style="color:var(--primary); cursor:pointer;" onclick="renderAuthView('login')">Kirish</span>
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    if(mode === 'verify_otp') startPollingOtpStatus(extraData?.phone);
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
            } else if(data.otp_status === 'failed' || attempts > 30) {
                statusEl.innerHTML = "❌ Kod yuborilmadi. <br> <a href='https://t.me/elaz_market_bot' target='_blank'>Botga kirib</a> raqamni ulaganingizga ishonch hosil qiling.";
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
            const { error } = await supabase.auth.signInWithPassword({ email: phone + '@elaz.uz', password: pass });
            if (error) throw new Error("Parol yoki telefon xato!");
            await checkAuth();
        }
        else if (mode === 'register_phone') {
            const phone = '+998' + (document.getElementById('regPhone') as HTMLInputElement).value.replace(/\D/g, '');
            if (phone.length < 12) throw new Error("Raqamni kiriting!");
            
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
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
            if (!p) throw new Error("Kod noto'g'ri!");
            renderAuthView('complete_profile', { phone: extraData.phone });
        }
        else if (mode === 'complete_profile') {
            const name = (document.getElementById('regName') as HTMLInputElement).value.trim();
            const pass = (document.getElementById('regPass') as HTMLInputElement).value;
            const phone = extraData.phone;
            
            const { data: auth, error: signUpErr } = await supabase.auth.signUp({ 
                email: phone + '@elaz.uz', 
                password: pass 
            });
            if (signUpErr) throw signUpErr;

            if (auth.user) {
                await supabase.from('profiles').update({ 
                    id: auth.user.id, 
                    first_name: name, 
                    otp_status: 'verified',
                    role: 'user'
                }).eq('phone', phone);
            }
            showToast("Ro'yxatdan o'tdingiz! 🥳");
            await checkAuth();
        }
    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
    }
};

(window as any).renderAuthView = renderAuthView;
