
import { supabase, user, addToCart, showToast } from "./index.tsx";

let activeCategory = 'all';
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
        <div style="display:flex; flex-direction:column; gap:25px; padding-bottom:140px;">
            
            <!-- PREMIUM SEARCH -->
            <div style="position: sticky; top: -1px; background: white; z-index: 100; padding: 10px 0;">
                <div style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: var(--primary); font-size: 1.1rem;"></i>
                    <input type="text" id="mainSearchInput" value="${searchQuery}" placeholder="Mahsulotlarni qidirish..." 
                           style="width: 100%; height: 62px; border-radius: 24px; padding: 0 60px; font-size: 1rem; border: 2px solid #f1f5f9; background: #f8fafc;" 
                           oninput="window.handleSearch(this.value)">
                </div>
            </div>

            <!-- PROMO SLIDER -->
            <div id="bannerCarousel" style="position:relative; width:100%; height:200px; overflow:hidden; border-radius:40px; background:#f1f5f9; display:none; box-shadow: var(--shadow-premium);">
                <div id="bannerTrack" style="display:flex; height:100%; transition: transform 0.6s cubic-bezier(0.2, 0, 0, 1);"></div>
                <div id="bannerDots" style="position:absolute; bottom:20px; width:100%; display:flex; justify-content:center; gap:8px;"></div>
            </div>

            <!-- CATEGORIES -->
            <div>
                <h3 style="font-weight:900; font-size:1.15rem; margin-bottom:15px; color:var(--text); letter-spacing:-0.5px;">Kategoriyalar</h3>
                <div style="display:flex; overflow-x:auto; gap:14px; padding: 5px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${CATEGORIES.map(cat => `
                        <div onclick="window.filterByCategory('${cat.id}')" 
                             style="flex: 0 0 auto; display:flex; align-items:center; gap:12px; padding:14px 24px; border-radius:22px; border: 2.5px solid ${activeCategory === cat.id ? 'var(--primary)' : '#f1f5f9'}; background: ${activeCategory === cat.id ? 'var(--primary-light)' : 'white'}; cursor:pointer; transition:0.3s;">
                            <i class="fas ${cat.icon}" style="color:${activeCategory === cat.id ? 'var(--primary)' : 'var(--gray)'}; font-size:1.1rem;"></i>
                            <span style="font-size:0.85rem; font-weight:800; color: ${activeCategory === cat.id ? 'var(--primary)' : 'var(--text)'};">${cat.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- NEW PRODUCTS CAROUSEL -->
            <div id="newArrivalsSection">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="font-weight:900; font-size:1.15rem;">Yangi mahsulotlar</h3>
                    <div style="width:36px; height:36px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-arrow-right"></i></div>
                </div>
                <div id="newProductsCarousel" style="display:flex; overflow-x:auto; gap:18px; padding: 10px 5px; scrollbar-width: none; -ms-overflow-style: none;"></div>
            </div>

            <!-- MAIN GRID -->
            <div>
                <h3 style="font-weight:900; font-size:1.15rem; margin-bottom:15px;">Siz uchun tanladik</h3>
                <div id="productsGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;"></div>
            </div>
        </div>

        <style>
            .premium-card {
                background: white; border-radius: 35px; border: 1.5px solid #f1f5f9; 
                overflow: hidden; position: relative; cursor: pointer; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.03); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .premium-card:active { transform: scale(0.94); }
            
            .product-image-container {
                position: relative; width: 100%; aspect-ratio: 1/1; 
                background: #f8fafc; border-radius: 35px; overflow: hidden;
                margin: 8px; width: calc(100% - 16px);
            }
            
            .premium-price-tag {
                background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px);
                padding: 6px 14px; border-radius: 16px; border: 1px solid white;
                position: absolute; bottom: 12px; left: 12px; z-index: 5;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            }

            .premium-add-btn {
                position: absolute; bottom: 12px; right: 12px; width: 52px; height: 52px; 
                border-radius: 18px; background: var(--gradient); border: none; 
                color: white; font-size: 1.3rem; cursor: pointer; 
                box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3); display: flex; 
                align-items: center; justify-content: center; z-index: 5;
                transition: 0.3s;
            }
            .premium-add-btn:active { transform: rotate(90deg) scale(0.8); }

            .fav-btn-premium {
                position: absolute; top: 12px; right: 12px; width: 40px; height: 40px; 
                border-radius: 14px; background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); 
                border: none; color: #cbd5e1; font-size: 1.1rem; cursor: pointer; 
                display: flex; align-items: center; justify-content: center; z-index: 5;
            }
            .fav-btn-premium.active { color: var(--danger); background: white; }
            
            @keyframes pulse-soft { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        </style>
    `;

    loadBanners();
    loadProducts();
}

function renderProductCard(p: any, isFav: boolean, isCarousel: boolean) {
    const widthStyle = isCarousel ? 'min-width: 170px; max-width: 170px;' : '';
    const discountPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;

    return `
        <div class="premium-card" style="${widthStyle}" onclick="window.openProductDetailsById(${p.id})">
            <!-- IMAGE AREA -->
            <div class="product-image-container">
                <img src="${p.image_url}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                
                ${p.discount ? `<div style="position:absolute; top:12px; left:12px; background:var(--danger); color:white; padding:5px 12px; border-radius:12px; font-size:0.65rem; font-weight:900; box-shadow:0 8px 15px rgba(239, 68, 68, 0.3); animation:pulse-soft 2s infinite;">-${p.discount}%</div>` : ''}
                
                <button onclick="event.stopPropagation(); window.handleToggleFav(${p.id}, this)" 
                        class="fav-btn-premium ${isFav ? 'active' : ''}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>

                <div class="premium-price-tag">
                    <div style="font-weight:900; color:var(--text); font-size:0.9rem;">${(discountPrice || p.price).toLocaleString()} <small style="font-size:0.55rem; opacity:0.6;">UZS</small></div>
                </div>

                <button onclick="event.stopPropagation(); window.quickAddToCart(${p.id})" 
                        class="premium-add-btn">
                    <i class="fas fa-plus"></i>
                </button>
            </div>

            <!-- INFO AREA -->
            <div style="padding: 10px 18px 20px;">
                <h5 style="font-weight:800; font-size:0.9rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text); margin-bottom:5px;">${p.name}</h5>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:0.65rem; color:var(--gray); font-weight:800; background:#f1f5f9; padding:3px 8px; border-radius:6px;">1 ${p.unit}</span>
                    ${p.discount ? `<span style="font-size:0.65rem; color:var(--gray); text-decoration:line-through; opacity:0.5;">${p.price.toLocaleString()}</span>` : ''}
                </div>
            </div>
        </div>
    `;
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
        grid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:5rem; color:var(--gray); font-weight:800; opacity:0.4;">Mahsulot topilmadi</div>`;
        carousel.parentElement!.style.display = 'none';
        return;
    }

    const newItems = prods.slice(0, 6);
    carousel.innerHTML = newItems.map(p => renderProductCard(p, favIds.includes(p.id), true)).join('');
    grid.innerHTML = prods.map(p => renderProductCard(p, favIds.includes(p.id), false)).join('');
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
        dots.innerHTML = banners.map((_, i) => `<div class="dot" style="width:${i === 0 ? '24px' : '10px'}; height:8px; border-radius:10px; background:${i === 0 ? 'white' : 'rgba(255,255,255,0.4)'}; transition:0.4s;" id="dot-${i}"></div>`).join('');
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
    setInterval(() => {
        bannerIdx = (bannerIdx + 1) % banners.length;
        track.style.transform = `translateX(-${bannerIdx * 100}%)`;
        updateDots(bannerIdx);
    }, 5000);
}

(window as any).quickAddToCart = async (id: number) => { await addToCart(id, 1); };
(window as any).handleSearch = (val: string) => { searchQuery = val.trim(); loadProducts(); };
(window as any).filterByCategory = (catId: string) => { activeCategory = catId; renderHomeView(); };
(window as any).handleToggleFav = async (id: number, btn: HTMLElement) => {
    if(!user) return showToast("Tizimga kiring");
    const isFav = btn.classList.contains('active');
    if(isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
        btn.classList.remove('active');
        btn.querySelector('i')!.className = 'far fa-heart';
        showToast("Sevimlilardan o'chirildi");
    } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
        btn.classList.add('active');
        btn.querySelector('i')!.className = 'fas fa-heart';
        showToast("Sevimlilarga qo'shildi ❤️");
    }
};
