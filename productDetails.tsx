
import { openOverlay, addToCart, closeOverlay, supabase, user, navTo, showToast, profile, loadProfileData } from "./index.tsx";

let currentQty = 1.0;
let currentImgIndex = 0;
let productImages: string[] = [];
let currentP: any = null;

export async function renderProductDetails(p: any) {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    // "Qotib qolish" oldini olish uchun darhol loading render qilamiz
    placeholder.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:white;">
            <div style="width:60px; height:60px; border-radius:20px; background:var(--primary-light); display:flex; align-items:center; justify-content:center; animation: pulse 1.5s infinite;">
                <i class="fas fa-shopping-bag fa-2x" style="color:var(--primary);"></i>
            </div>
            <p style="margin-top:20px; font-weight:900; font-size:0.75rem; color:var(--gray); letter-spacing:1.5px;">MAHSULOT YUKLANMOQDA...</p>
        </div>
    `;
    openOverlay('checkoutOverlay');

    currentP = p;
    productImages = [p.image_url, ...(p.images || [])].filter(url => !!url);
    currentImgIndex = 0;
    currentQty = p.unit === 'kg' ? 0.5 : 1.0;

    // Ma'lumotlarni parallel yuklash
    const [likesRes, reviewsRes] = await Promise.all([
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('product_id', p.id),
        supabase.from('reviews').select('*, profiles:user_id(first_name, avatar_url)').eq('product_id', p.id).order('created_at', { ascending: false })
    ]);

    const likesCount = likesRes.count || 0;
    const reviews = reviewsRes.data || [];
    const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0";

    placeholder.innerHTML = `
        <div style="padding-bottom:140px; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); background:white; min-height:100vh;">
            <!-- TOP ACTIONS -->
            <div style="position:fixed; top:20px; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:0 20px; display:flex; justify-content:space-between; z-index:100;">
                <div onclick="closeOverlay('checkoutOverlay')" style="width:45px; height:45px; background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border-radius:15px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg); cursor:pointer;">
                    <i class="fas fa-chevron-left"></i>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="background:white; padding:8px 15px; border-radius:12px; font-weight:900; font-size:0.8rem; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-star" style="color:#eab308;"></i> ${avgRating}
                    </div>
                    <div style="background:white; padding:8px 15px; border-radius:12px; font-weight:900; font-size:0.8rem; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-heart" style="color:var(--danger);"></i> ${likesCount}
                    </div>
                </div>
            </div>

            <!-- IMAGE SWIPER -->
            <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                <div id="carouselTrack" style="display:flex; height:100%; transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1);">
                    ${productImages.map(img => `<img src="${img}" style="width:100%; height:100%; object-fit:cover; flex-shrink:0;">`).join('')}
                </div>
                ${productImages.length > 1 ? `
                    <div style="position:absolute; bottom:45px; left:0; width:100%; display:flex; justify-content:center; gap:8px;">
                        ${productImages.map((_, i) => `<div class="carousel-dot" id="dot_${i}" style="width:${i === 0 ? '20px' : '8px'}; height:8px; border-radius:10px; background:${i === 0 ? 'var(--primary)' : '#cbd5e1'}; transition:0.3s;"></div>`).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- CONTENT -->
            <div style="padding:30px 25px; border-radius:40px 40px 0 0; background:white; margin-top:-35px; position:relative; z-index:10; box-shadow: 0 -15px 30px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div style="flex:1;">
                        <h1 style="font-weight:900; font-size:1.6rem; color:var(--text); line-height:1.2;">${p.name}</h1>
                        <div style="margin-top:10px;"><span style="font-size:0.65rem; font-weight:900; color:var(--primary); background:var(--primary-light); padding:5px 14px; border-radius:10px; text-transform:uppercase; letter-spacing:0.5px;">${p.category}</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:1.5rem; color:var(--text);">${p.price.toLocaleString()}</div>
                        <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">1 ${p.unit}</div>
                    </div>
                </div>

                <div style="background:#f8fafc; border:1.5px solid #f1f5f9; border-radius:30px; padding:20px; margin:30px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span style="font-weight:900; font-size:0.7rem; color:var(--gray); letter-spacing:1px;">MIQDORNI TANLANG</span>
                        <span style="font-weight:900; font-size:0.8rem; color:var(--primary);">${p.unit.toUpperCase()}</span>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                        <button onclick="window.changeQtyDelta(-1)" style="width:55px; height:55px; border-radius:18px; background:white; border:2px solid #e2e8f0; font-size:1.3rem;"><i class="fas fa-minus"></i></button>
                        <input type="number" id="detailQtyInput" value="${currentQty}" step="0.1" style="flex:1; height:55px; text-align:center; font-weight:900; font-size:1.5rem; background:white; border:2px solid #e2e8f0; border-radius:18px; margin:0;" oninput="window.syncTotalDisplay()">
                        <button onclick="window.changeQtyDelta(1)" style="width:55px; height:55px; border-radius:18px; background:var(--primary); color:white; border:none; font-size:1.3rem;"><i class="fas fa-plus"></i></button>
                    </div>

                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${p.unit === 'kg' ? `
                            <div onclick="window.setFixedQty(0.1)" class="qty-btn">+0.1</div>
                            <div onclick="window.setFixedQty(0.5)" class="qty-btn">+0.5</div>
                            <div onclick="window.setFixedQty(1.0)" class="qty-btn">+1.0</div>
                        ` : `
                            <div onclick="window.setFixedQty(1)" class="qty-btn">+1</div>
                            <div onclick="window.setFixedQty(5)" class="qty-btn">+5</div>
                            <div onclick="window.setFixedQty(10)" class="qty-btn">+10</div>
                        `}
                    </div>
                </div>

                <div style="margin-top:35px;">
                    <h4 style="font-weight:900; font-size:0.95rem; color:var(--text); margin-bottom:12px;">MAHSULOT HAQIDA</h4>
                    <p style="font-size:0.85rem; color:var(--gray); line-height:1.7; font-weight:600;">${p.description || "Yuqori sifatli mahsulot. Bag'dod tumanidan siz uchun maxsus tanlab keltirilgan."}</p>
                </div>

                <!-- SIMILAR -->
                <div id="similarProductsGrid" style="margin-top:40px;"></div>

                <!-- REVIEWS SECTION -->
                <div style="margin-top:45px; border-top:2px solid #f8fafc; padding-top:30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h4 style="font-weight:900; font-size:1rem;">Mijozlar fikri (${reviews.length})</h4>
                        <button onclick="window.openReviewDialog(${p.id})" style="background:var(--primary-light); border:none; color:var(--primary); font-weight:900; font-size:0.75rem; cursor:pointer; padding:8px 15px; border-radius:12px;">
                            FIKR QOLDIRISH <i class="fas fa-pen-nib" style="margin-left:5px;"></i>
                        </button>
                    </div>
                    <div id="p_reviews_list" style="display:flex; flex-direction:column; gap:15px;">
                         ${reviews.map(r => `
                            <div style="background:#f8fafc; padding:18px; border-radius:24px; border:1px solid #f1f5f9;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <div style="width:32px; height:32px; border-radius:10px; background:white; overflow:hidden; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                                            ${(r as any).profiles?.avatar_url ? `<img src="${(r as any).profiles.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user" style="font-size:0.8rem; color:#cbd5e1;"></i>`}
                                        </div>
                                        <b style="font-size:0.8rem;">${(r as any).profiles?.first_name || 'Mijoz'}</b>
                                    </div>
                                    <div style="color:#eab308; font-size:0.65rem; background:white; padding:4px 8px; border-radius:8px; border:1px solid #f1f5f9;">
                                        ${Array.from({length: r.rating}).map(() => `<i class="fas fa-star"></i>`).join('')}
                                    </div>
                                </div>
                                <p style="font-size:0.8rem; color:var(--gray); font-weight:600; line-height:1.5;">${r.comment}</p>
                            </div>
                        `).join('')}
                        ${!reviews.length ? '<p style="text-align:center; color:var(--gray); font-size:0.8rem; padding:20px; font-weight:700;">Hali fikrlar yo\'q. Birinchi bo\'ling!</p>' : ''}
                    </div>
                </div>
            </div>

            <!-- ACTION BAR -->
            <div style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); border-top:1px solid #f1f5f9; padding:20px 25px calc(25px + env(safe-area-inset-bottom, 0px)); z-index:1000; display:flex; justify-content:space-between; align-items:center; gap:20px;">
                <div style="flex:1;">
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); text-transform:uppercase; letter-spacing:0.5px;">Jami summa</div>
                    <div id="stickyTotalDisplay" style="font-weight:900; font-size:1.3rem; color:var(--text);">${(p.price * currentQty).toLocaleString()} UZS</div>
                </div>
                <button class="btn btn-primary" style="flex:1.5; height:65px; border-radius:22px; font-size:1rem; box-shadow: 0 10px 25px rgba(34,197,94,0.2);" onclick="window.handleFinalAddToCart(${p.id})">
                    SAVATGA QO'SHISH <i class="fas fa-shopping-basket" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>
    `;
    
    loadSimilarProducts(p.category, p.id);
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
        <h4 style="font-weight:900; font-size:0.9rem; margin-bottom:15px; letter-spacing:0.5px;">O'XSHASH MAHSULOTLAR</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            ${prods.map(s => `
                <div onclick="window.openProductDetailsById(${s.id})" style="background:#f8fafc; border-radius:22px; padding:10px; display:flex; align-items:center; gap:10px; border:1px solid #f1f5f9; cursor:pointer;">
                    <img src="${s.image_url}" style="width:45px; height:45px; border-radius:10px; object-fit:cover; background:white;">
                    <div style="overflow:hidden;">
                        <div style="font-weight:800; font-size:0.75rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${s.name}</div>
                        <div style="font-weight:900; font-size:0.8rem; color:var(--primary); margin-top:2px;">${s.price.toLocaleString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).syncTotalDisplay = () => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    const totalEl = document.getElementById('stickyTotalDisplay');
    if(input) currentQty = parseFloat(input.value) || 0;
    if(totalEl && currentP) totalEl.innerText = (currentQty * currentP.price).toLocaleString() + " UZS";
};

(window as any).changeQtyDelta = (delta: number) => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    let step = currentP.unit === 'kg' ? 0.1 : 1;
    currentQty = parseFloat((currentQty + (delta * step)).toFixed(2));
    if(currentQty < step) currentQty = step;
    if(input) input.value = currentQty.toString();
    (window as any).syncTotalDisplay();
};

(window as any).setFixedQty = (val: number) => {
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    currentQty = val;
    if(input) input.value = val.toString();
    (window as any).syncTotalDisplay();
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
    const ratingStr = prompt("1 dan 5 gacha baholang (Faqat raqam):") || "5";
    const rating = parseInt(ratingStr);
    
    showToast("Fikr saqlanmoqda...");
    const { error } = await supabase.from('reviews').insert({ product_id: pId, user_id: user.id, rating, comment });
    if(!error) { 
        showToast("Rahmat! Fikringiz qabul qilindi."); 
        // Re-render
        renderProductDetails(currentP);
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).openProductDetailsById = async (id: number) => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if(data) renderProductDetails(data);
};
