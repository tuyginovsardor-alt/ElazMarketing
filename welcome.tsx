
export function renderWelcomeView(onStart: () => void) {
    const container = document.getElementById('welcomeView');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; justify-content: space-between; padding-bottom: 2rem; background:white; overflow:hidden;">
            
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);">
                <div class="elaz-brand-container" style="flex-direction:column; gap:0;">
                    <div class="elaz-letters">
                        <span class="l-char l-e" style="font-size:7rem;">E</span>
                        <span class="l-char l-l" style="font-size:7rem;">L</span>
                        <span class="l-char l-a" style="font-size:7rem;">A<i class="fas fa-shopping-basket a-icon" style="font-size:2.5rem;"></i></span>
                        <span class="l-char l-z" style="font-size:7rem;">Z<i class="fas fa-motorcycle z-moto" style="font-size:3.5rem; right:-65px;"></i></span>
                    </div>
                    <div class="market-chip" style="font-size:1.5rem; padding:6px 30px; margin-top:-10px; margin-left:0;">MARKET</div>
                </div>
                
                <p style="color:var(--gray); margin-top:3.5rem; font-size:1.1rem; font-weight:700; line-height:1.5; text-align:center; max-width:300px;">
                    Bag'dod tumanidagi eng tezkor professional savdo platformasi
                </p>
            </div>

            <div style="padding: 0 25px;">
                <div style="display:flex; gap:12px; margin-bottom:2.5rem;">
                    <div style="flex:1; background:#f8fafc; padding:20px 10px; border-radius:24px; text-align:center; border:1px solid #f1f5f9;">
                        <i class="fas fa-bolt" style="color:#fbbf24; font-size:1.5rem; margin-bottom:8px;"></i>
                        <div style="font-size:0.75rem; font-weight:800; color:var(--dark);">TEZKOR</div>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:20px 10px; border-radius:24px; text-align:center; border:1px solid #f1f5f9;">
                        <i class="fas fa-heart" style="color:var(--primary); font-size:1.5rem; margin-bottom:8px;"></i>
                        <div style="font-size:0.75rem; font-weight:800; color:var(--dark);">ISHLONCHLI</div>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:20px 10px; border-radius:24px; text-align:center; border:1px solid #f1f5f9;">
                        <i class="fas fa-tag" style="color:var(--danger); font-size:1.5rem; margin-bottom:8px;"></i>
                        <div style="font-size:0.75rem; font-weight:800; color:var(--dark);">ARZON</div>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnGetStarted" style="font-size:1.2rem; width:100%; height:75px; border-radius:28px; font-weight:900; letter-spacing:1px;">
                    BOSHLASH <i class="fas fa-arrow-right"></i>
                </button>
                
                <p style="text-align:center; margin-top:2rem; font-size:0.75rem; color:var(--gray); font-weight:800; opacity:0.5; letter-spacing:1px;">
                    ELAZ GROUP © 2024
                </p>
            </div>
        </div>

        <style>
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3); }
                50% { opacity: 1; transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); }
            }
        </style>
    `;

    document.getElementById('btnGetStarted')?.addEventListener('click', onStart);
}
