
export function renderWelcomeView(onStart: () => void) {
    const container = document.getElementById('welcomeView');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; justify-content: space-between; padding-top: 4rem; padding-bottom: 2rem; background:white; position:relative; overflow:hidden;">
            
            <div style="text-align:center; padding: 0 20px;">
                <!-- NEW BRAND LOGO BANNER -->
                <div style="margin-bottom: 2rem; animation: float 3s infinite ease-in-out;">
                    <div class="elaz-brand">
                        <span class="elaz-char char-e">E</span>
                        <span class="elaz-char char-l">L</span>
                        <span class="elaz-char char-a">A<i class="fas fa-shopping-cart cart-icon"></i></span>
                        <span class="elaz-char char-z">Z<i class="fas fa-motorcycle courier-icon"></i></span>
                    </div>
                    <div class="market-tag">MARKET</div>
                </div>

                <p style="color:var(--gray); margin-top:1.5rem; font-size:1.1rem; font-weight:600; line-height:1.5;">
                    Bag'dod tumanidagi eng tezkor <br> professional savdo platformasi
                </p>
            </div>

            <div style="padding: 20px;">
                <div style="display:flex; gap:15px; margin-bottom:2.5rem;">
                    <div style="flex:1; background:#f8fafc; padding:15px; border-radius:22px; border:1px solid #f1f5f9; text-align:center;">
                        <i class="fas fa-bolt" style="color:#eab308; margin-bottom:8px; font-size:1.2rem;"></i>
                        <p style="font-size:0.75rem; font-weight:800;">Tezkor</p>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:15px; border-radius:22px; border:1px solid #f1f5f9; text-align:center;">
                        <i class="fas fa-shield-alt" style="color:var(--primary); margin-bottom:8px; font-size:1.2rem;"></i>
                        <p style="font-size:0.75rem; font-weight:800;">Ishonchli</p>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:15px; border-radius:22px; border:1px solid #f1f5f9; text-align:center;">
                        <i class="fas fa-tags" style="color:#ef4444; margin-bottom:8px; font-size:1.2rem;"></i>
                        <p style="font-size:0.75rem; font-weight:800;">Arzon</p>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnGetStarted" style="font-size:1.1rem; width:100%; height:70px; border-radius:25px;">
                    BOSHLASH <i class="fas fa-arrow-right"></i>
                </button>
                <p style="text-align:center; margin-top:1.5rem; font-size:0.8rem; color:var(--gray); font-weight:700; opacity:0.6;">
                    ELAZ GROUP © 2024
                </p>
            </div>
        </div>

        <style>
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }
        </style>
    `;

    document.getElementById('btnGetStarted')?.addEventListener('click', onStart);
}
