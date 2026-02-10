
export function renderWelcomeView(onStart: () => void) {
    const container = document.getElementById('welcomeView');
    if(!container) return;

    container.innerHTML = `
        <div class="welcome-bg"></div>
        <div style="display:flex; flex-direction:column; height:100%; justify-content: space-between; padding-top: 4rem; padding-bottom: 2rem;">
            
            <div style="text-align:center;">
                <div style="width:100px; height:100px; background:var(--primary); border-radius:35px; display:inline-flex; align-items:center; justify-content:center; color:white; font-size:3rem; box-shadow: 0 15px 35px rgba(34,197,94,0.3); margin-bottom:2rem; animation: pulse 2s infinite;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h1 style="font-size:2.8rem; font-weight:900; letter-spacing:-2px; line-height:1; color:var(--text);">
                    ELAZ<span style="color:var(--primary)">MARKET</span>
                </h1>
                <p style="color:var(--gray); margin-top:1rem; font-size:1.1rem; font-weight:600;">
                    Bag'dod tumanidagi eng tezkor <br> savdo platformasi
                </p>
            </div>

            <div style="padding: 20px;">
                <div style="display:flex; gap:15px; margin-bottom:2.5rem;">
                    <div style="flex:1; background:white; padding:15px; border-radius:22px; box-shadow:var(--shadow-sm); text-align:center;">
                        <i class="fas fa-bolt" style="color:#eab308; margin-bottom:8px;"></i>
                        <p style="font-size:0.75rem; font-weight:800;">Tezkor</p>
                    </div>
                    <div style="flex:1; background:white; padding:15px; border-radius:22px; box-shadow:var(--shadow-sm); text-align:center;">
                        <i class="fas fa-shield-alt" style="color:var(--primary); margin-bottom:8px;"></i>
                        <p style="font-size:0.75rem; font-weight:800;">Ishonchli</p>
                    </div>
                    <div style="flex:1; background:white; padding:15px; border-radius:22px; box-shadow:var(--shadow-sm); text-align:center;">
                        <i class="fas fa-tags" style="color:#ef4444; margin-bottom:8px;"></i>
                        <p style="font-size:0.75rem; font-weight:800;">Arzon</p>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnGetStarted" style="font-size:1.1rem; width:100%;">
                    BOSHLASH <i class="fas fa-arrow-right"></i>
                </button>
                <p style="text-align:center; margin-top:1.5rem; font-size:0.85rem; color:var(--gray); font-weight:600;">
                    Sizning ishonchingiz - bizning yutug'imiz
                </p>
            </div>
        </div>

        <style>
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        </style>
    `;

    document.getElementById('btnGetStarted')?.addEventListener('click', onStart);
}
