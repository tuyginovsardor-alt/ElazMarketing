
import { supabase, showToast, checkAuth } from "./index.tsx";

type AuthMode = 'login' | 'register_phone' | 'register_email' | 'verify_otp' | 'forgot_password';

export function renderAuthView(mode: AuthMode = 'login', extraData?: any) {
    const container = document.getElementById('authView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; min-height: 100%; max-width: 420px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 25px; margin-top: 10px;">
                <div style="width: 65px; height: 65px; background: var(--gradient); border-radius: 22px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; box-shadow: 0 10px 20px rgba(34,197,94,0.2);">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size: 1.6rem; font-weight: 900; color: var(--text); margin-top:10px;">ELAZ<span style="color:var(--primary)">MARKET</span></h1>
            </div>

            <div style="background: white; border-radius: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.03); overflow: hidden; border: 1.5px solid #f1f5f9;">
                
                <!-- Tabs for Login/Register -->
                ${(mode === 'login' || mode.startsWith('register')) ? `
                    <div style="display: flex; background: #f8fafc; padding: 6px; border-bottom: 1.5px solid #f1f5f9;">
                        <button onclick="renderAuthView('login')" style="flex: 1; height: 42px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: 0.3s; background: ${mode === 'login' ? 'white' : 'transparent'}; color: ${mode === 'login' ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${mode === 'login' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'};">KIRISH</button>
                        <button onclick="renderAuthView('register_phone')" style="flex: 1; height: 42px; border: none; border-radius: 14px; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: 0.3s; background: ${mode.startsWith('register') ? 'white' : 'transparent'}; color: ${mode.startsWith('register') ? 'var(--primary)' : 'var(--gray)'}; box-shadow: ${mode.startsWith('register') ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'};">RO'YXATDAN O'TISH</button>
                    </div>
                ` : ''}

                <div style="padding: 25px;">
                    <h2 style="font-size: 1.2rem; font-weight: 900; text-align: center; margin-bottom: 25px;">
                        ${mode === 'login' ? 'Xush kelibsiz! 👋' : 
                          mode === 'register_phone' ? 'Telefon orqali ochish' :
                          mode === 'register_email' ? 'Gmail orqali ochish' :
                          mode === 'verify_otp' ? 'Kodni kiriting' : 'Parolni tiklash'}
                    </h2>

                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        
                        <!-- LOGIN PATH -->
                        ${mode === 'login' ? `
                            <div class="input-group">
                                <label style="display: block; font-size: 0.6rem; font-weight: 900; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">GMAIL YOKI TELEFON (+998...)</label>
                                <input type="text" id="loginIdentifier" placeholder="Email yoki tel" style="height: 55px;">
                            </div>
                            <div class="input-group">
                                <div style="display:flex; justify-content:space-between;">
                                    <label style="font-size: 0.6rem; font-weight: 900; color: var(--gray); margin-bottom: 6px; text-transform: uppercase;">PAROL</label>
                                    <span onclick="renderAuthView('forgot_password')" style="font-size:0.65rem; color:var(--primary); font-weight:800; cursor:pointer;">ESDAN CHIQDI?</span>
                                </div>
                                <input type="password" id="loginPass" placeholder="••••••••" style="height: 55px;">
                            </div>
                        ` : ''}

                        <!-- REGISTER PHONE PATH -->
                        ${mode === 'register_phone' ? `
                            <div style="display:flex; gap:10px; margin-bottom:10px;">
                                <button onclick="renderAuthView('register_phone')" style="flex:1; height:35px; border-radius:10px; border:none; background:var(--primary-light); color:var(--primary); font-weight:900; font-size:0.6rem;">TELEFON</button>
                                <button onclick="renderAuthView('register_email')" style="flex:1; height:35px; border-radius:10px; border:1px solid #f1f5f9; background:white; color:var(--gray); font-weight:900; font-size:0.6rem;">GMAIL</button>
                            </div>
                            <input type="text" id="regFName" placeholder="Ism va Familiya" style="height: 55px;">
                            <div style="position: relative;">
                                <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-weight: 800;">+998</span>
                                <input type="tel" id="regPhone" placeholder="(90) 000-00-00" maxlength="14" style="height: 55px; padding-left: 62px;" oninput="window.maskPhone(this)">
                            </div>
                            <input type="password" id="regPhonePass" placeholder="Parol yarating" style="height: 55px;">
                        ` : ''}

                        <!-- REGISTER EMAIL PATH -->
                        ${mode === 'register_email' ? `
                            <div style="display:flex; gap:10px; margin-bottom:10px;">
                                <button onclick="renderAuthView('register_phone')" style="flex:1; height:35px; border-radius:10px; border:1px solid #f1f5f9; background:white; color:var(--gray); font-weight:900; font-size:0.6rem;">TELEFON</button>
                                <button onclick="renderAuthView('register_email')" style="flex:1; height:35px; border-radius:10px; border:none; background:var(--primary-light); color:var(--primary); font-weight:900; font-size:0.6rem;">GMAIL</button>
                            </div>
                            <input type="text" id="regEmailName" placeholder="Ismingiz" style="height: 55px;">
                            <input type="email" id="regEmail" placeholder="example@gmail.com" style="height: 55px;">
                            <input type="password" id="regEmailPass" placeholder="Murakkab parol" style="height: 55px;">
                        ` : ''}

                        <!-- FORGOT PASS -->
                        ${mode === 'forgot_password' ? `
                            <p style="font-size:0.8rem; color:var(--gray); text-align:center; font-weight:600;">Parolni tiklash havolasi Gmailingizga yuboriladi.</p>
                            <input type="email" id="forgotEmail" placeholder="Gmail manzilingizni kiriting" style="height: 55px;">
                        ` : ''}

                        <!-- VERIFY OTP -->
                        ${mode === 'verify_otp' ? `
                            <input type="number" id="authOtp" placeholder="000000" style="height: 75px; font-size: 2rem; text-align: center; font-weight: 900; letter-spacing: 10px; border-color: var(--primary);">
                            <div id="otpStatusDisplay" style="text-align:center; font-size:0.75rem; font-weight:800; color:var(--gray);">Bazaga yozilmoqda...</div>
                        ` : ''}

                        <button class="btn btn-primary" id="authSubmitBtn" style="width: 100%; height: 58px; font-size:0.95rem;" onclick="executeAuthAction('${mode}', ${JSON.stringify(extraData)})">
                            ${mode === 'login' ? 'KIRISH' : mode === 'forgot_password' ? 'YUBORISH' : mode === 'verify_otp' ? 'TASDIQLASH' : 'DAVOM ETISH'}
                        </button>

                        ${(mode === 'login' || mode.startsWith('register')) ? `
                            <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                                <div style="flex: 1; height: 1px; background: #f1f5f9;"></div>
                                <span style="font-size: 0.6rem; font-weight: 900; color: #cbd5e1;">YOKI</span>
                                <div style="flex: 1; height: 1px; background: #f1f5f9;"></div>
                            </div>

                            <button onclick="window.signInWithGoogle()" style="width: 100%; height: 55px; border-radius: 18px; border: 2px solid #f1f5f9; background: white; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 800; color: var(--text); cursor: pointer; transition: 0.3s;">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20">
                                Google orqali kirish
                            </button>
                        ` : ''}

                        ${mode === 'forgot_password' || mode === 'verify_otp' ? `
                            <button onclick="renderAuthView('login')" style="background:none; border:none; color:var(--primary); font-weight:800; font-size:0.8rem; cursor:pointer;">Orqaga qaytish</button>
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
                statusEl.innerHTML = "❌ Botga ulanmagansiz! <br> Avval <a href='https://t.me/elaz_market_bot' target='_blank'>Botga kirib</a> raqamni ulang.";
                statusEl.style.color = "var(--danger)";
                clearInterval(interval);
            }
        }
    }, 2000);
}

(window as any).executeAuthAction = async (mode: AuthMode, extraData?: any) => {
    const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        if (mode === 'login') {
            const ident = (document.getElementById('loginIdentifier') as HTMLInputElement).value.trim();
            const pass = (document.getElementById('loginPass') as HTMLInputElement).value;
            
            const email = ident.startsWith('(') || ident.startsWith('9') || ident.startsWith('+') ? '+998' + ident.replace(/\D/g, '') + '@elaz.uz' : ident;
            
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw new Error("Email/Telefon yoki parol xato!");
            await checkAuth();
        }

        else if (mode === 'register_phone') {
            const name = (document.getElementById('regFName') as HTMLInputElement).value.trim();
            const phone = '+998' + (document.getElementById('regPhone') as HTMLInputElement).value.replace(/\D/g, '');
            const pass = (document.getElementById('regPhonePass') as HTMLInputElement).value;

            if (name.length < 3 || phone.length < 12 || pass.length < 6) throw new Error("Ma'lumotlar yetarli emas!");

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Upsert orqali vaqtinchalik profil yaratamiz (SQL-da default id bo'lishi shart)
            const { error } = await supabase.from('profiles').upsert({
                phone, 
                first_name: name, 
                otp_code: otpCode, 
                otp_status: 'pending'
            }, { onConflict: 'phone' });

            if (error) {
                if(error.message.includes('null value in column "id"')) {
                    throw new Error("Tizimda SQL xatoligi: ID ustuniga default qiymat berilmagan. Iltimos, SQL Editor'da 'ALTER COLUMN id SET DEFAULT gen_random_uuid()' kodini yurgizing.");
                }
                throw error;
            }
            renderAuthView('verify_otp', { phone, name, pass });
        }

        else if (mode === 'verify_otp') {
            const code = (document.getElementById('authOtp') as HTMLInputElement).value;
            const { data: p } = await supabase.from('profiles').select('*').eq('phone', extraData.phone).eq('otp_code', code).maybeSingle();
            
            if (!p) throw new Error("Tasdiqlash kodi xato!");

            const email = extraData.phone + '@elaz.uz';
            const { data: auth, error: signUpErr } = await supabase.auth.signUp({ 
                email, 
                password: extraData.pass,
                options: {
                    data: {
                        phone: extraData.phone,
                        full_name: extraData.name
                    }
                }
            });
            
            if (signUpErr) throw signUpErr;

            if (auth.user) {
                // Endi vaqtinchalik yaratilgan profilni haqiqiy Auth ID bilan yangilaymiz
                // Agar eski row bo'lsa uni o'chirib, yangisini yozish yoki ID-ni update qilish
                const { error: updErr } = await supabase.from('profiles').update({ 
                    id: auth.user.id, 
                    otp_status: 'verified', 
                    role: 'user' 
                }).eq('phone', extraData.phone);
                
                if(updErr) {
                    // Agar ID PK bo'lsa va uni o'zgartirib bo'lmasa:
                    await supabase.from('profiles').delete().eq('phone', extraData.phone);
                    await supabase.from('profiles').insert({
                        id: auth.user.id,
                        phone: extraData.phone,
                        first_name: extraData.name,
                        email,
                        role: 'user',
                        balance: 0
                    });
                }
            }
            showToast("Xush kelibsiz! 🥳");
            await checkAuth();
        }

        else if (mode === 'register_email') {
            const name = (document.getElementById('regEmailName') as HTMLInputElement).value.trim();
            const email = (document.getElementById('regEmail') as HTMLInputElement).value.trim();
            const pass = (document.getElementById('regEmailPass') as HTMLInputElement).value;

            const { data: auth, error } = await supabase.auth.signUp({ 
                email, 
                password: pass,
                options: { data: { full_name: name } }
            });
            if (error) throw error;
            showToast("Gmailingizga tasdiqlash xati yuborildi! 📧");
            renderAuthView('login');
        }

        else if (mode === 'forgot_password') {
            const email = (document.getElementById('forgotEmail') as HTMLInputElement).value.trim();
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            showToast("Havola yuborildi!");
            renderAuthView('login');
        }

    } catch (err: any) {
        showToast(err.message);
        btn.disabled = false;
        btn.innerText = "DAVOM ETISH";
    }
};

(window as any).signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) showToast("Google Login xatosi: " + error.message);
};

(window as any).renderAuthView = renderAuthView;
