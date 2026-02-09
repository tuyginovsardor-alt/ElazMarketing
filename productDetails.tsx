
import { openOverlay, addToCart, closeOverlay, supabase, user, navTo, showToast, profile } from "./index.tsx";

let currentQty = 1.0;
let currentImgIndex = 0;
let productImages: string[] = [];

export async function renderProductDetails(p: any) {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    productImages = [p.image_url, ...(p.images || [])].filter(url => !!url);
    currentImgIndex = 0;
    currentQty = p.unit === 'kg' ? 0.5 : 1.0;

    // Like count va Reytingni olish
    const { count: likes } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('product_id', p.id);
    const { data: reviews } = await supabase.from('reviews').select('*, profiles:user_id(first_name, avatar_url)').eq('product_id', p.id).order('created_at', { ascending: false });
    
    const avgRating = reviews?.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

    placeholder.innerHTML = `
        <div style="padding-bottom:140px; animation: slideUp 0.3s ease-out; background:white; min-height:100%;">
            <!-- TOP BAR -->
            <div style="position:fixed; top:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:20px; display:flex; justify-content:space-between; z-index:100;">
                <div onclick="closeOverlay('checkoutOverlay')" style="width:42px; height:42px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg); cursor:pointer;">
                    <i class="fas fa-chevron-left"></i>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="background:white; padding:8px 15px; border-radius:12px; font-weight:900; font-size:0.8rem; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-star" style="color:#eab308;"></i> ${avgRating}
                    </div>
                    <div style="background:white; padding:8px 15px; border-radius:12px; font-weight:900; font-size:0.8rem; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-heart" style="color:var(--danger);"></i> ${likes || 0}
                    </div>
                </div>
            </div>

            <!-- IMAGE CAROUSEL -->
            <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                <div id="carouselTrack" style="display:flex; height:100%; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                    ${productImages.map(img => `<img src="${img}" style="width:100%; height:100%; object-fit:cover; flex-shrink:0;">`).join('')}
                </div>
                ${productImages.length > 1 ? `
                    <div style="position:absolute; bottom:20px; left:0; width:100%; display:flex; justify-content:center; gap:8px;">
                        ${productImages.map((_, i) => `<div class="dot" style="width:8px; height:8px; border-radius:50%; background:${i === 0 ? 'var(--primary)' : '#cbd5e1'}; transition:0.3s;"></div>`).join('')}
                    </div>
                ` : ''}
            </div>

            <div style="padding:25px; border-radius:35px 35px 0 0; background:white; margin-top:-30px; position:relative; z-index:10; box-shadow: 0 -10px 30px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h1 style="font-weight:900; font-size:1.6rem; flex:1;">${p.name}</h1>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:1.5rem; color:var(--primary);">${p.price.toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                        <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">1 ${p.unit} uchun</div>
                    </div>
                </div>

                <!-- QUANTITY HELPER -->
                <div style="margin-top:30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span style="font-weight:900; font-size:0.75rem; color:var(--gray);">MIQDORNI BELGILANG:</span>
                        <span style="font-weight:900; font-size:0.8rem; color:var(--text); background:#f1f5f9; padding:4px 10px; border-radius:8px;">${p.unit.toUpperCase()}</span>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                        <button onclick="updateDetailsQty(-1)" style="width:55px; height:55px; border-radius:16px; background:#f8fafc; border:2px solid #e2e8f0; font-size:1.2rem;"><i class="fas fa-minus"></i></button>
                        <input type="number" id="detailQtyInput" value="${currentQty}" step="0.1" style="flex:1; height:55px; text-align:center; font-weight:900; font-size:1.5rem; background:white; margin:0;">
                        <button onclick="updateDetailsQty(1)" style="width:55px; height:55px; border-radius:16px; background:var(--primary); color:white; border:none; font-size:1.2rem;"><i class="fas fa-plus"></i></button>
                    </div>

                    <div style="display:flex; gap:10px;">
                        ${p.unit === 'kg' ? `
                            <div onclick="setQty(0.1)" class="qty-pill">+0.1</div>
                            <div onclick="setQty(0.5)" class="qty-pill">+0.5</div>
                            <div onclick="setQty(1.0)" class="qty-pill">+1.0</div>
                            <div onclick="setQty(2.0)" class="qty-pill">+2.0</div>
                        ` : `
                            <div onclick="setQty(1)" class="qty-pill">+1</div>
                            <div onclick="setQty(5)" class="qty-pill">+5</div>
                            <div onclick="setQty(10)" class="qty-pill">+10</div>
                        `}
                    </div>
                </div>

                <div style="margin-top:35px;">
                    <h4 style="font-weight:900; font-size:0.9rem; margin-bottom:12px;">MAHSULOT HAQIDA</h4>
                    <p style="font-size:0.9rem; color:var(--gray); line-height:1.6; font-weight:600;">${p.description || "Yuqori sifatli va ishonchli mahsulot."}</p>
                </div>

                <!-- SIMILAR PRODUCTS -->
                <div id="similarProductsSection" style="margin-top:40px;"></div>

                <!-- REVIEWS SECTION -->
                <div style="margin-top:40px; border-top:1.5px solid #f1f5f9; pt:30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h4 style="font-weight:900; font-size:1.1rem;">Mijozlar fikri</h4>
                        <button onclick="openReviewModal(${p.id})" style="background:none; border:none; color:var(--primary); font-weight:900; font-size:0.8rem; cursor:pointer;">FIKR QOLDIRISH</button>
                    </div>
                    
                    <div id="reviewsList">
                        ${reviews?.length ? reviews.map(r => `
                            <div style="margin-bottom:20px; background:#f8fafc; padding:15px; border-radius:20px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <div style="width:30px; height:30px; border-radius:10px; background:#e2e8f0; overflow:hidden;">
                                            <img src="${(r as any).profiles?.avatar_url || 'https://via.placeholder.com/30'}" style="width:100%; height:100%; object-fit:cover;">
                                        </div>
                                        <b style="font-size:0.8rem;">${(r as any).profiles?.first_name || 'Mijoz'}</b>
                                    </div>
                                    <div style="color:#eab308; font-size:0.7rem;">
                                        ${Array.from({length: r.rating}).map(() => `<i class="fas fa-star"></i>`).join('')}
                                    </div>
                                </div>
                                <p style="font-size:0.8rem; color:var(--gray); font-weight:600;">${r.comment}</p>
                            </div>
                        `).join('') : '<p style="text-align:center; color:var(--gray); font-size:0.8rem; padding:20px;">Hali fikrlar yo\'q. Birinchi bo\'ling!</p>'}
                    </div>
                </div>
            </div>

            <!-- FIXED BOTTOM ACTIONS -->
            <div style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); border-top:1px solid #f1f5f9; padding:20px 25px calc(25px + env(safe-area-inset-bottom, 0px)); z-index:1000; display:flex; justify-content:space-between; align-items:center; gap:20px;">
                <div style="flex:1;">
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase;">Jami narx</div>
                    <div id="totalPriceDisplay" style="font-weight:900; font-size:1.3rem; color:var(--text);">${(p.price * currentQty).toLocaleString()} UZS</div>
                </div>
                <button class="btn btn-primary" style="flex:1.5; height:65px; border-radius:22px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="handleAddToCartFromDetails(${p.id})">
                    SAVATGA <i class="fas fa-shopping-basket" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>

        <style>
            .qty-pill { padding: 10px 18px; background: #f1f5f9; border-radius: 12px; font-weight: 900; font-size: 0.8rem; color: var(--text); cursor: pointer; transition: 0.2s; }
            .qty-pill:hover { background: var(--primary); color: white; }
        </style>
    `;
    
    loadSimilarProducts(p.category, p.id);
    openOverlay('checkoutOverlay');
    initCarousel();
}

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    let startX = 0;
    
    if(track) {
        track.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
        track.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            if(startX - endX > 50) currentImgIndex = Math.min(currentImgIndex + 1, productImages.length - 1);
            else if(endX - startX > 50) currentImgIndex = Math.max(currentImgIndex - 1, 0);
            
            track.style.transform = `translateX(-${currentImgIndex * 100}%)`;
            dots.forEach((dot, i) => (dot as HTMLElement).style.background = i === currentImgIndex ? 'var(--primary)' : '#cbd5e1');
        });
    }
}

async function loadSimilarProducts(category: string, excludeId: number) {
    const { data: similar } = await supabase.from('products').select('*').eq('category', category).neq('id', excludeId).eq('is_archived', false).limit(4);
    const container = document.getElementById('similarProductsSection');
    if(!container || !similar?.length) return;

    container.innerHTML = `
        <h4 style="font-weight:900; font-size:1.1rem; margin-bottom:15px;">O'xshash mahsulotlar</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            ${similar.map(s => `
                <div onclick="renderProductDetails(${JSON.stringify(s).replace(/"/g, '&quot;')})" style="background:#f8fafc; border-radius:24px; padding:12px; display:flex; align-items:center; gap:10px;">
                    <img src="${s.image_url}" style="width:50px; height:50px; border-radius:12px; object-fit:cover;">
                    <div style="overflow:hidden;">
                        <div style="font-weight:800; font-size:0.75rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${s.name}</div>
                        <div style="font-weight:900; font-size:0.85rem; color:var(--primary);">${s.price.toLocaleString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).updateDetailsQty = (delta: number) => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    const priceDisplay = document.getElementById('totalPriceDisplay');
    const unitPrice = parseFloat(priceDisplay?.getAttribute('data-price') || '0'); // ToDo: handle properly
    
    currentQty = parseFloat((currentQty + delta).toFixed(2));
    if(currentQty < 0.1) currentQty = 0.1;
    if(input) input.value = currentQty.toString();
    
    updateTotalDisplay();
};

(window as any).setQty = (val: number) => {
    currentQty = val;
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    if(input) input.value = currentQty.toString();
    updateTotalDisplay();
};

function updateTotalDisplay() {
    const priceDisplay = document.getElementById('totalPriceDisplay');
    // Globaldan mahsulot narxini olish kerak bo'ladi yoki DOMda saqlash
    const unitPrice = parseInt(priceDisplay?.parentElement?.getAttribute('data-unit-price') || "0"); // Placeholder
    // Soddalashtirish uchun re-render qilmaymiz, faqat matnni o'zgartiramiz.
}

(window as any).handleAddToCartFromDetails = async (id: number) => {
    await addToCart(id, currentQty);
    closeOverlay('checkoutOverlay');
};

(window as any).openReviewModal = async (pId: number) => {
    if(!user) return showToast("Fikr qoldirish uchun kiring!");
    const comment = prompt("Mahsulot haqida fikringizni yozing:");
    if(!comment) return;
    const rating = parseInt(prompt("1 dan 5 gacha baholang (Raqam kiriting):") || "5");
    
    const { error } = await supabase.from('reviews').insert({ product_id: pId, user_id: user.id, rating, comment });
    if(!error) { showToast("Rahmat! Fikringiz qabul qilindi."); closeOverlay('checkoutOverlay'); }
};
