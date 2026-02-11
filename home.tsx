
import { supabase, user, addToCart, showToast } from "./index.tsx";

let activeCategory = 'all';
let activeSort = 'newest'; 
let searchQuery = '';
let banners: any[] = [];

const CATEGORIES = [
    { id: 'all', label: 'Barchasi', icon: 'fa-border-all' },
    { id: 'grocery', label: 'Oziq-ovqat', icon: 'fa-apple-whole' },
    { id: 'drinks', label: 'Ichimliklar', icon: 'fa-bottle-water' },
    { id: 'sweets', label: 'Shirinliklar', icon: 'fa-cookie' },
    { id: 'household', label: 'Xo\'jalik', icon: 'fa-house-chimney' }
];

export async function renderHomeView() {
    const container = document.getElementById('homeView');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:25px; padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- SEARCH BAR -->
            <div style="position: sticky; top: -1px; background: white; z-index: 100; padding: 10px 0;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="flex:1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); opacity:0.7;"></i>
                        <input type="text" id="mainSearchInput" value="${searchQuery}" placeholder="Nima qidiramiz?..." 
                               style="width: 100%; height: 54px; border-radius: 20px; border: 2.5px solid #f1f5f9; padding: 0 50px; font-weight: 700; background: #f8fafc; margin-bottom:0;" 
                               oninput="window.handleSearch(this.value)">
                    </div>
                </div>
            </div>

            <!-- MAIN PROMO SLIDER -->
            <div id="bannerCarousel" style="position:relative; width:100%; height:190px; overflow:hidden; border-radius:35px; background:#f1f5f9; display:none; box-shadow:var(--shadow-lg);">
                <div id="bannerTrack" style="display:flex; height:100%; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);"></div>
                <div id="bannerDots" style="position:absolute; bottom:15px; width:100%; display:flex; justify-content:center; gap:8px;"></div>
            </div>

            <!-- CATEGORIES SCROLL -->
            <div>
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:15px; padding-left:5px;">Kategoriyalar</h3>
                <div style="display:flex; overflow-x:auto; gap:12px; padding-bottom:10px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${CATEGORIES.map(cat => `
                        <div onclick="window.filterByCategory('${cat.id}')" 
                             style="flex: 0 0 auto; display:flex; align-items:center; gap:10px; padding:12px 20px; border-radius:20px; border: 2px solid ${activeCategory === cat.id ? 'var(--primary)' : '#f1f5f9'}; background: ${activeCategory === cat.id ? 'var(--primary-light)' : 'white'}; cursor:pointer; transition:0.3s;">
                            <i class="fas ${cat.icon}" style="color:${activeCategory === cat.id ? 'var(--primary)' : 'var(--gray)'}; font-size:1rem;"></i>
                            <span style="font-size:0.8rem; font-weight:800; color: ${activeCategory === cat.id ? 'var(--primary)' : 'var(--gray)'}; white-space:nowrap;">${cat.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- NEW PRODUCTS CAROUSEL -->
            <div id="newArrivalsSection">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding:0 5px;">
                    <h3 style="font-weight:900; font-size:1.1rem;">Yangi mahsulotlar</h3>
                    <span style="color:var(--primary); font-weight:900; font-size:0.75rem; cursor:pointer;">HAMMASI <i class="fas fa-chevron-right" style="font-size:0.6rem;"></i></span>
                </div>
                <div id="newProductsCarousel" style="display:flex; overflow-x:auto; gap:15px; padding:5px; scrollbar-width: none; -ms-overflow-style: none;">
                    <!-- Karusel elementlari bu yerga keladi -->
                </div>
            </div>

            <!-- MAIN GRID -->
            <div>
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:15px; padding-left:5px;">Barcha mahsulotlar</h3>
                <div id="productsGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <!-- Grid elementlari -->
                </div>
            </div>
        </div>

        <style>
            #newProductsCarousel::-webkit-scrollbar { display: none; }
            .premium-card {
                background: white; border-radius: 30px; border: 1.5px solid #f1f5f9; 
                overflow: hidden; position: relative; cursor: pointer; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: 0.3s;
            }
            .premium-card:active { transform: scale(0.96); }
            .add-btn-float {
                position: absolute; bottom: 12px; right: 12px; width: 44px; height: 44px; 
                border-radius: 15px; background: var(--gradient); border: none; 
                color: white; font-size: 1.2rem; cursor: pointer; 
                box-shadow: 0 8px 15px rgba(34, 197, 94, 0.3); display: flex; 
                align-items: center; justify-content: center; z-index: 5;
            }
            .fav-btn-float {
                position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; 
                border-radius: 12px; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); 
                border: none; color: #cbd5e1; font-size: 1rem; cursor: pointer; 
                display: flex; align-items: center; justify-content: center; z-index: 5;
            }
            .fav-btn-float.active { color: var(--danger); }
        </style>
    `;

    loadBanners();
    loadProducts();
}

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    const carousel = document.getElementById('newProductsCarousel');
    if(!grid || !carousel) return;

    let query = supabase.from('products').select('*').eq('is_archived', false);
    if(activeCategory !== 'all') query = query.eq('category', activeCategory);
    if(searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    
    const { data: prods } = await query.order('created_at', { ascending: false });
    const { data: favs } = user ? await supabase.from('favorites').select('product_id').eq('user_id', user.id) : { data: [] };
    const favIds = favs?.map(f => f.product_id) || [];

    if(!prods?.length) {
        grid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:5rem; color:var(--gray); font-weight:800; opacity:0.5;">Mahsulot topilmadi</div>`;
        carousel.parentElement!.style.display = 'none';
        return;
    }

    // Karusel uchun yangi 6 ta mahsulot
    const newItems = prods.slice(0, 6);
    carousel.innerHTML = newItems.map(p => renderProductCard(p, favIds.includes(p.id), true)).join('');

    // Grid uchun qolganlari
    grid.innerHTML = prods.map(p => renderProductCard(p, favIds.includes(p.id), false)).join('');
}

function renderProductCard(p: any, isFav: boolean, isCarousel: boolean) {
    const widthStyle = isCarousel ? 'min-width: 160px; max-width: 160px;' : '';
    const discountPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;

    return `
        <div class="premium-card" style="${widthStyle}" onclick="window.openProductDetailsById(${p.id})">
            <!-- IMAGE AREA -->
            <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                <img src="${p.image_url}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                
                ${p.discount ? `<div style="position:absolute; top:12px; left:12px; background:var(--danger); color:white; padding:4px 10px; border-radius:10px; font-size:0.6rem; font-weight:900; box-shadow:0 4px 10px rgba(239, 68, 68, 0.2); animation:pulse 2s infinite;">-${p.discount}%</div>` : ''}
                
                <button onclick="event.stopPropagation(); window.handleToggleFav(${p.id}, this)" 
                        class="fav-btn-float ${isFav ? 'active' : ''}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>

                <button onclick="event.stopPropagation(); window.quickAddToCart(${p.id})" 
                        class="add-btn-float">
                    <i class="fas fa-plus"></i>
                </button>
            </div>

            <!-- INFO AREA -->
            <div style="padding:15px;">
                <h5 style="font-weight:800; font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text); margin-bottom:4px;">${p.name}</h5>
                <div style="font-size:0.65rem; color:var(--gray); font-weight:800;">1 ${p.unit}</div>
                
                <div style="margin-top:10px;">
                    ${p.discount ? `
                        <div style="font-size:0.7rem; color:var(--gray); text-decoration:line-through; opacity:0.6; margin-bottom:2px;">${p.price.toLocaleString()}</div>
                        <div style="font-weight:900; color:var(--danger); font-size:1rem;">${discountPrice.toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                    ` : `
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem; margin-top:12px;">${p.price.toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                    `}
                </div>
            </div>
        </div>
    `;
}

async function loadBanners() {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    const container = document.getElementById('bannerCarousel');
    if(!track || !dots || !container) return;

    const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('priority', { ascending: false });
    if(data && data.length > 0) {
        banners = data;
        container.style.display = 'block';
        track.innerHTML = banners.map(b => `<img src="${b.image_url}" style="width:100%; height:100%; object-fit:cover; flex-shrink:0;">`).join('');
        dots.innerHTML = banners.map((_, i) => `<div class="dot" style="width:10px; height:6px; border-radius:10px; background:rgba(255,255,255,0.4); transition:0.4s;" id="dot-${i}"></div>`).join('');
        startCarousel();
    }
}

let bannerIdx = 0;
function startCarousel() {
    const track = document.getElementById('bannerTrack');
    if(!track || banners.length < 2) return;
    const updateDots = (idx: number) => {
        document.querySelectorAll('.dot').forEach((d, i) => {
            (d as HTMLElement).style.background = i === idx ? 'white' : 'rgba(255,255,255,0.4)';
            (d as HTMLElement).style.width = i === idx ? '24px' : '10px';
        });
    };
    updateDots(0);
    setInterval(() => {
        bannerIdx = (bannerIdx + 1) % banners.length;
        track.style.transform = `translateX(-${bannerIdx * 100}%)`;
        updateDots(bannerIdx);
    }, 4500);
}

(window as any).quickAddToCart = async (id: number) => {
    await addToCart(id, 1);
};

(window as any).handleSearch = (val: string) => { 
    searchQuery = val.trim(); 
    loadProducts(); 
};

(window as any).filterByCategory = (catId: string) => { 
    activeCategory = catId; 
    renderHomeView(); 
};

(window as any).handleToggleFav = async (id: number, btn: HTMLElement) => {
    if(!user) return showToast("Sevimlilarga qo'shish uchun kiring");
    const isFav = btn.classList.contains('active');
    if(isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
        btn.classList.remove('active');
        btn.querySelector('i')!.className = 'far fa-heart';
        showToast("O'chirildi");
    } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
        btn.classList.add('active');
        btn.querySelector('i')!.className = 'fas fa-heart';
        showToast("Saqlandi ❤️");
    }
};
