
export function renderWelcomeView(onStart: () => void) {
    const container = document.getElementById('welcomeView');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; justify-content: space-between; padding-top: 5rem; padding-bottom: 2rem; background:white; overflow:hidden;">
            
            <div class="elaz-logo-container" style="flex-direction:column; animation: bounceIn 0.9s cubic-bezier(0.68, -0.55, 0.27, 1.55);">
                <div class="elaz-main-text">
                    <span class="l-char l-e">E</span>
                    <span class="l-char l-l">L</span>
                    <span class="l-char l-a">A<div class="a-cart-wrap"><i class="fas fa-shopping-basket"></i></div></span>
                    <span class="l-char l-z">Z<div class="courier-wrap"><i class="fas fa-motorcycle"></i></div></span>
                </div>
                <div class="market-label" style="font-size:1.4rem; padding:6px 30px; margin-top:5px;">MARKET</div>
                
                <p style="color:var(--gray); margin-top:3.5rem; font-size:1.15rem; font-weight:700; line-height:1.5; text-align:center; max-width:300px; font-family:'Fredoka';">
                    Bag'dod tumanidagi eng tezkor professional savdo platformasi
                </p>
            </div>

            <div style="padding: 20px;">
                <div style="display:flex; gap:12px; margin-bottom:3rem;">
                    <div style="flex:1; background:#f8fafc; padding:18px 10px; border-radius:24px; text-align:center; border:1.5px solid #f1f5f9;">
                        <i class="fas fa-bolt" style="color:#eab308; font-size:1.4rem; margin-bottom:8px;"></i>
                        <div style="font-size:0.75rem; font-weight:800;">TEZKOR</div>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:18px 10px; border-radius:24px; text-align:center; border:1.5px solid #f1f5f9;">
                        <i class="fas fa-shield-heart" style="color:var(--primary); font-size:1.4rem; margin-bottom:8px;"></i>
                        <div style="font-size:0.75rem; font-weight:800;">ISHONCHLI</div>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:18px 10px; border-radius:24px; text-align:center; border:1.5px solid #f1f5f9;">
                        <i class="fas fa-tag" style="color:#ef4444; font-size:1.4rem; margin-bottom:8px;"></i>
                        <div style="font-size:0.75rem; font-weight:800;">ARZON</div>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnGetStarted" style="font-size:1.2rem; width:100%; height:75px; border-radius:28px; font-weight:900; box-shadow:0 15px 35px rgba(34,197,94,0.3);">
                    BOSHLASH <i class="fas fa-arrow-right"></i>
                </button>
                <p style="text-align:center; margin-top:2rem; font-size:0.75rem; color:var(--gray); font-weight:800; opacity:0.6; letter-spacing:1px;">
                    ELAZ GROUP © 2024
                </p>
            </div>
        </div>

        <style>
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
                50% { opacity: 1; transform: scale(1.08) rotate(5deg); }
                70% { transform: scale(0.95) rotate(-2deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
        </style>
    `;

    document.getElementById('btnGetStarted')?.addEventListener('click', onStart);
}
