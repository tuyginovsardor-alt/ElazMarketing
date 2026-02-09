
import { openOverlay, addToCart, closeOverlay, supabase, user, navTo, showToast, profile } from "./index.tsx";

let currentQty = 1.0;
let currentImgIndex = 0;
let productImages: string[] = [];
let currentP: any = null;

export async function renderProductDetails(p: any) {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    currentP = p;
    productImages = [p.image_url, ...(p.images || [])].filter(url => !!url);
    currentImgIndex = 0;
    currentQty = p.unit === 'kg' ? 0.5 : 1.0;

    // Like count va Reytingni olish
    const { count: likes } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('product_id', p.id);
    const { data: reviews } = await supabase.from('reviews').select('*, profiles:user_id(first_name, avatar_url)').eq('product_id', p.id).order('created_at', { ascending: false });
    
    const avgRating = reviews?.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0";

    placeholder.innerHTML = `
        <div style="padding-bottom:140px; animation: slideUp 0.3s cubic-bezier(0, 0, 0.2, 1); background:white; min-height:100vh;">
            <!-- TOP ACTIONS -->
            <div style="position:fixed; top:20px; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:0 20px; display:flex; justify-content:space-between; z-index:100;">
                <div onclick="closeOverlay('checkoutOverlay')" style="width:45px; height:45px; background:rgba(255,255,255,0.9); backdrop-filter:blur(10px); border-radius:15px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg); cursor:pointer;">
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

            <!-- IMAGE SWIPER -->
            <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                <div id="carouselTrack" style="display:flex; height:100%; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
                    ${productImages.map(img => `<img src="${img}" style="width:100%; height:100%; object-fit:cover; flex-shrink:0;">`).join('')}
                </div>
                ${productImages.length > 1 ? `
                    <div style="position:absolute; bottom:45px; left:0; width:100%; display:flex; justify-content:center; gap:8px;">
                        ${productImages.map((_, i) => `<div class="carousel-dot" style="width:${i === 0 ? '20px' : '8px'}; height:8px; border-radius:10px; background:${i === 0 ? 'var(--primary)' : '#cbd5e1'}; transition:0.3s;"></div>`).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- CONTENT -->
            <div style="padding:30px 25px; border-radius:40px 40px 0 0; background:white; margin-top:-35px; position:relative; z-index:10; box-shadow: 0 -15px 30px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div style="flex:1;">
                        <h1 style="font-weight:900; font-size:1.7rem; color:var(--text); line-height:1.2;">${p.name}</h1>
                        <div style="margin-top:8px;"><span style="font-size:0.7rem; font-weight:900; color:var(--primary); background:var(--primary-light); padding:4px 12px; border-radius:10px; text-transform:uppercase;">${p.category}</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:1.6rem; color:var(--text);">${p.price.toLocaleString()}</div>
                        <div style="font-size:0.75rem; color:var(--gray); font-weight:800;">1 ${p.unit} narxi</div>
                    </div>
                </div>

                <!-- QUANTITY TOOLBOX -->
                <div style="background:#f8fafc; border:2px solid #f1f5f9; border-radius:30px; padding:20px; margin:30px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span style="font-weight:900; font-size:0.75rem; color:var(--gray);">MIQDORNI TANLANG:</span>
                        <span style="font-weight:900; font-size:0.8rem; color:var(--primary);">${p.unit.toUpperCase()}</span>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                        <button onclick="changeQtyDelta(-1)" style="width:55px; height:55px; border-radius:18px; background:white; border:2px solid #e2e8f0; font-size:1.3rem;"><i class="fas fa-minus"></i></button>
                        <input type="number" id="detailQtyInput" value="${currentQty}" step="0.1" style="flex:1; height:55px; text-align:center; font-weight:900; font-size:1.6rem; background:white; border:2px solid #e2e8f0; border-radius:18px; margin:0;" oninput="syncTotalDisplay()">
                        <button onclick="changeQtyDelta(1)" style="width:55px; height:55px; border-radius:18px; background:var(--primary); color:white; border:none; font-size:1.3rem;"><i class="fas fa-plus"></i></button>
                    </div>

                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                        ${p.unit === 'kg' ? `
                            <div onclick="setFixedQty(0.1)" class="qty-btn">+0.1</div>
                            <div onclick="setFixedQty(0.5)" class="qty-btn">+0.5</div>
                            <div onclick="setFixedQty(1.0)" class="qty-btn">+1.0</div>
                            <div onclick="setFixedQty(2.5)" class="qty-btn">+2.5</div>
                        ` : `
                            <div onclick="setFixedQty(1)" class="qty-btn">+1</div>
                            <div onclick="setFixedQty(5)" class="qty-btn">+5</div>
                            <div onclick="setFixedQty(10)" class="qty-btn">+10</div>
                        `}
                    </div>
                </div>

                <div style="margin-top:35px;">
                    <h4 style="font-weight:900; font-size:0.95rem; color:var(--text); margin-bottom:12px;">MAHSULOT HAQIDA</h4>
                    <p style="font-size:0.9rem; color:var(--gray); line-height:1.7; font-weight:600;">${p.description || "Yuqori sifatli mahsulot. Bag'dod tumanidan siz uchun maxsus tanlab keltirilgan."}</p>
                </div>

                <!-- SIMILAR PRODUCTS GRID -->
                <div id="similarProductsGrid" style="margin-top:45px;"></div>

                <!-- REVIEWS -->
                <div style="margin-top:45px; border-top:2px solid #f8fafc; padding-top:30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h4 style="font-weight:900; font-size:1.1rem;">Mijozlar fikri</h4>
                        <button onclick="openReviewDialog(${p.id})" style="background:none; border:none; color:var(--primary); font-weight:900; font-size:0.8rem; cursor:pointer;">FIKR QOLDIRISH</button>
                    </div>
                    <div id="p_reviews_list">
                         ${reviews?.length ? reviews.map(r => `
                            <div style="margin-bottom:15px; background:#f8fafc; padding:15px; border-radius:20px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                    <b style="font-size:0.8rem;">${(r as any).profiles?.first_name || 'Mijoz'}</b>
                                    <div style="color:#eab308; font-size:0.7rem;">
                                        ${Array.from({length: r.rating}).map(() => `<i class="fas fa-star"></i>`).join('')}
                                    </div>
                                </div>
                                <p style="font-size:0.8rem; color:var(--gray); font-weight:600;">${r.comment}</p>
                            </div>
                        `).join('') : '<p style="text-align:center; color:var(--gray); font-size:0.8rem; padding:20px;">Hali fikrlar yo\'q.</p>'}
                    </div>
                </div>
            </div>

            <!-- STICKY ACTION BAR -->
            <div style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.95); backdrop-filter:blur(20px); border-top:1px solid #f1f5f9; padding:20px 25px calc(25px + env(safe-area-inset-bottom, 0px)); z-index:1000; display:flex; justify-content:space-between; align-items:center; gap:20px;">
                <div style="flex:1;">
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase; letter-spacing:0.5px;">Jami summa:</div>
                    <div id="stickyTotalDisplay" style="font-weight:900; font-size:1.3rem; color:var(--text);">${(p.price * currentQty).toLocaleString()} UZS</div>
                </div>
                <button class="btn btn-primary" style="flex:1.5; height:65px; border-radius:22px; font-size:1.1rem; box-shadow: 0 10px 25px rgba(34,197,94,0.3);" onclick="handleFinalAddToCart(${p.id})">
                    SAVATGA QO'SHISH <i class="fas fa-shopping-basket" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>

        <style>
            .qty-btn { padding: 10px 18px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; font-weight: 900; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
            .qty-btn:hover { border-color: var(--primary); color: var(--primary); }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        </style>
    `;
    
    loadSimilarProducts(p.category, p.id);
    openOverlay('checkoutOverlay');
    initSimpleCarousel();
}

function initSimpleCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    let startX = 0;
    
    if(track) {
        track.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
        track.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if(Math.abs(diff) > 50) {
                if(diff > 0) currentImgIndex = Math.min(currentImgIndex + 1, productImages.length - 1);
                else currentImgIndex = Math.max(currentImgIndex - 1, 0);
                
                track.style.transform = `translateX(-${currentImgIndex * 100}%)`;
                dots.forEach((dot, i) => {
                    (dot as HTMLElement).style.width = i === currentImgIndex ? '20px' : '8px';
                    (dot as HTMLElement).style.background = i === currentImgIndex ? 'var(--primary)' : '#cbd5e1';
                });
            }
        });
    }
}

async function loadSimilarProducts(category: string, excludeId: number) {
    const { data: prods } = await supabase.from('products').select('*').eq('category', category).neq('id', excludeId).eq('is_archived', false).limit(4);
    const grid = document.getElementById('similarProductsGrid');
    if(!grid || !prods?.length) return;

    grid.innerHTML = `
        <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px;">O'xshash mahsulotlar</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            ${prods.map(s => `
                <div onclick="openProductDetailsById(${s.id})" style="background:#f8fafc; border-radius:24px; padding:12px; display:flex; align-items:center; gap:12px; border:1px solid #f1f5f9;">
                    <img src="${s.image_url}" style="width:50px; height:50px; border-radius:12px; object-fit:cover; background:white;">
                    <div style="overflow:hidden;">
                        <div style="font-weight:800; font-size:0.75rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${s.name}</div>
                        <div style="font-weight:900; font-size:0.85rem; color:var(--primary); margin-top:2px;">${s.price.toLocaleString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Fixed: Define syncTotalDisplay as a local function before assigning and using it
const syncTotalDisplay = () => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    const totalEl = document.getElementById('stickyTotalDisplay');
    if(input) currentQty = parseFloat(input.value) || 0;
    if(totalEl && currentP) totalEl.innerText = (currentQty * currentP.price).toLocaleString() + " UZS";
};
(window as any).syncTotalDisplay = syncTotalDisplay;

// Fixed: Use the locally defined syncTotalDisplay instead of calling it as an undefined global
(window as any).changeQtyDelta = (delta: number) => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    let step = currentP.unit === 'kg' ? 0.1 : 1;
    currentQty = parseFloat((currentQty + (delta * step)).toFixed(2));
    if(currentQty < step) currentQty = step;
    if(input) input.value = currentQty.toString();
    syncTotalDisplay();
};

// Fixed: Use the locally defined syncTotalDisplay instead of calling it as an undefined global
(window as any).setFixedQty = (val: number) => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    currentQty = val;
    if(input) input.value = val.toString();
    syncTotalDisplay();
};

(window as any).handleFinalAddToCart = async (id: number) => {
    if(!user) return showToast("Tizimga kiring!");
    await addToCart(id, currentQty);
    closeOverlay('checkoutOverlay');
};

(window as any).openReviewDialog = async (pId: number) => {
    if(!user) return showToast("Fikr qoldirish uchun kiring!");
    const comment = prompt("Mahsulot haqida fikringizni yozing:");
    if(!comment) return;
    const rating = parseInt(prompt("1 dan 5 gacha baholang (Faqat raqam):") || "5");
    
    const { error } = await supabase.from('reviews').insert({ product_id: pId, user_id: user.id, rating, comment });
    if(!error) { showToast("Rahmat! Fikringiz qabul qilindi."); closeOverlay('checkoutOverlay'); }
};
