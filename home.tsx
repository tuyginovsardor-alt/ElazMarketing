
import { supabase, user, addToCart, showToast } from "./index.tsx";

let activeCategory = 'all';
let activeSort = 'newest'; // newest, price_asc, price_desc
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

    // Sahifa strukturasini tayyorlash
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px; padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            
            <!-- SEARCH & SORT -->
            <div style="position: sticky; top: -1px; background: white; z-index: 100; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="flex:1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); opacity:0.7;"></i>
                        <input type="text" id="mainSearchInput" value="${searchQuery}" placeholder="Mahsulot qidirish..." 
                               style="width: 100%; height: 52px; border-radius: 20px; border: 2.5px solid #f1f5f9; padding: 0 50px; font-weight: 700; background: #f8fafc; margin-bottom:0;" 
                               oninput="window.handleSearch(this.value)">
                    </div>
                    <button onclick="window.toggleSortMenu()" style="width:52px; height:52px; border-radius:18px; border:2.5px solid #f1f5f9; background:white; color:var(--text); cursor:pointer;">
                        <i class="fas fa-arrow-up-wide-short"></i>
                    </button>
                </div>

                <!-- SORT OPTIONS (Hidden by default) -->
                <div id="sortMenu" style="display:none; margin-top:10px; gap:8px; overflow-x:auto; padding-bottom:5px;">
                    <span onclick="window.setSort('newest')" class="sort-chip ${activeSort === 'newest' ? 'active' : ''}">Yangilari</span>
                    <span onclick="window.setSort('price_asc')" class="sort-chip ${activeSort === 'price_asc' ? 'active' : ''}">Arzonroq</span>
                    <span onclick="window.setSort('price_desc')" class="sort-chip ${activeSort === 'price_desc' ? 'active' : ''}">Qimmatroq</span>
                </div>
            </div>

            <!-- ADVERTISING BANNERS -->
            <div id="bannerCarousel" style="position:relative; width:100%; height:180px; overflow:hidden; border-radius:30px; background:#f1f5f9; display:none;">
                <div id="bannerTrack" style="display:flex; height:100%; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                <div id="bannerDots" style="position:absolute; bottom:15px; width:100%; display:flex; justify-content:center; gap:8px;"></div>
            </div>

            <!-- CATEGORIES -->
            <div style="display:flex; overflow-x:auto; gap:12px; padding-bottom:5px; scrollbar-width: none; -ms-overflow-style: none;">
                ${CATEGORIES.map(cat => `
                    <div onclick="window.filterByCategory('${cat.id}')" 
                         style="flex: 0 0 auto; display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px 18px; border-radius:22px; border: 2px solid ${activeCategory === cat.id ? 'var(--primary)' : '#f1f5f9'}; background: ${activeCategory === cat.id ? 'var(--primary-light)' : 'white'}; cursor:pointer; min-width:90px; transition:0.3s;">
                        <div style="width:40px; height:40px; border-radius:12px; background:${activeCategory === cat.id ? 'var(--primary)' : '#f8fafc'}; color:${activeCategory === cat.id ? 'white' : 'var(--gray)'}; display:flex; align-items:center; justify-content:center;">
                            <i class="fas ${cat.icon}"></i>
                        </div>
                        <span style="font-size:0.65rem; font-weight:800; color: ${activeCategory === cat.id ? 'var(--primary)' : 'var(--gray)'}; text-transform:uppercase; letter-spacing:0.5px;">${cat.label}</span>
                    </div>
                `).join('')}
            </div>

            <!-- PRODUCT GRID -->
            <div id="productsGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <!-- Skeleton loaders -->
                ${Array(4).fill(0).map(() => `
                    <div style="height:220px; border-radius:28px; background:#f1f5f9; animation: pulse 1.5s infinite;"></div>
                `).join('')}
            </div>
        </div>

        <style>
            .sort-chip { padding: 8px 16px; border-radius: 12px; border: 1.5px solid #f1f5f9; font-size: 0.75rem; font-weight: 800; color: var(--gray); cursor:pointer; background:white; white-space:nowrap; }
            .sort-chip.active { background: var(--primary); color: white; border-color: var(--primary); }
            @keyframes pulse { 0% { opacity:0.6; } 50% { opacity:1; } 100% { opacity:0.6; } }
            .qty-pill { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.5); color: white; padding: 4px 10px; border-radius: 10px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(5px); }
        </style>
    `;

    loadBanners();
    loadProducts();
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
        
        track.innerHTML = banners.map(b => `
            <img src="${b.image_url}" style="width:100%; height:100%; object-fit:cover; flex-shrink:0;">
        `).join('');

        dots.innerHTML = banners.map((_, i) => `
            <div class="dot" style="width:8px; height:8px; border-radius:40%; background:rgba(255,255,255,0.5); transition:0.3s;" id="dot-${i}"></div>
        `).join('');

        startCarousel();
    }
}

let bannerIdx = 0;
function startCarousel() {
    const track = document.getElementById('bannerTrack');
    if(!track || banners.length < 2) return;

    const updateDots = (idx: number) => {
        document.querySelectorAll('.dot').forEach((d, i) => {
            (d as HTMLElement).style.background = i === idx ? 'white' : 'rgba(255,255,255,0.5)';
            (d as HTMLElement).style.width = i === idx ? '20px' : '8px';
            (d as HTMLElement).style.borderRadius = i === idx ? '4px' : '50%';
        });
    };

    updateDots(0);
    setInterval(() => {
        bannerIdx = (bannerIdx + 1) % banners.length;
        track.style.transform = `translateX(-${bannerIdx * 100}%)`;
        updateDots(bannerIdx);
    }, 4000);
}

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if(!grid) return;

    let query = supabase.from('products').select('*').eq('is_archived', false);
    if(activeCategory !== 'all') query = query.eq('category', activeCategory);
    if(searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    
    // Sorting logic
    if(activeSort === 'newest') query = query.order('created_at', { ascending: false });
    else if(activeSort === 'price_asc') query = query.order('price', { ascending: true });
    else if(activeSort === 'price_desc') query = query.order('price', { ascending: false });
    
    const { data: prods } = await query;
    
    const currUser = (window as any).user;
    const { data: favs } = currUser ? await supabase.from('favorites').select('product_id').eq('user_id', currUser.id) : { data: [] };
    const favIds = favs?.map(f => f.product_id) || [];
    
    if(!prods?.length) {
        grid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:4rem; color:var(--gray); font-weight:800; opacity:0.5;">Mahsulot topilmadi</div>`;
        return;
    }

    grid.innerHTML = prods.map(p => `
        <div class="product-card" style="background:white; border-radius:28px; border:1.5px solid #f1f5f9; overflow:hidden; position:relative; cursor:pointer; box-shadow:var(--shadow-sm); transition:0.3s;" onclick="window.openProductDetailsById(${p.id})">
            <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc;">
                <img src="${p.image_url}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                
                ${p.discount ? `<div style="position:absolute; top:12px; left:12px; background:var(--danger); color:white; padding:4px 8px; border-radius:10px; font-size:0.6rem; font-weight:900;">-${p.discount}%</div>` : ''}
                
                <button onclick="event.stopPropagation(); window.handleToggleFav(${p.id}, this)" 
                        style="position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:12px; background:rgba(255,255,255,0.9); border:none; color:${favIds.includes(p.id) ? 'var(--danger)' : '#cbd5e1'}; font-size:1rem; cursor:pointer; backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center;">
                    <i class="${favIds.includes(p.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>

                <button onclick="event.stopPropagation(); window.quickAddToCart(${p.id})" 
                        style="position:absolute; bottom:12px; right:12px; width:44px; height:44px; border-radius:15px; background:var(--gradient); border:none; color:white; font-size:1.2rem; cursor:pointer; box-shadow: 0 5px 15px rgba(34,197,94,0.3); display:flex; align-items:center; justify-content:center; transform:translateY(5px); transition:0.3s;">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div style="padding:15px;">
                <h5 style="font-weight:800; font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text);">${p.name}</h5>
                <div style="font-size:0.65rem; color:var(--gray); font-weight:800; margin-top:3px; text-transform:uppercase;">${p.unit}</div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                    <span style="font-weight:900; color:var(--primary); font-size:1rem;">${p.price.toLocaleString()}</span>
                    ${p.discount ? `<span style="font-size:0.7rem; color:var(--gray); text-decoration:line-through; opacity:0.6;">${Math.round(p.price * 1.2).toLocaleString()}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

(window as any).quickAddToCart = async (id: number) => {
    await addToCart(id, 1);
};

(window as any).toggleSortMenu = () => {
    const el = document.getElementById('sortMenu');
    if(el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
};

(window as any).setSort = (val: string) => {
    activeSort = val;
    renderHomeView();
};

(window as any).handleToggleFav = async (id: number, btn: HTMLElement) => {
    const { toggleFavorite } = await import("./index.tsx");
    await toggleFavorite(id);
    const icon = btn.querySelector('i');
    if(icon?.classList.contains('far')) {
        icon.className = 'fas fa-heart'; btn.style.color = 'var(--danger)';
    } else if(icon) {
        icon.className = 'far fa-heart'; btn.style.color = '#cbd5e1';
    }
};

(window as any).openProductDetailsById = async (id: number) => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if(data) {
        const { renderProductDetails } = await import("./productDetails.tsx");
        renderProductDetails(data);
    }
};

(window as any).handleSearch = (val: string) => { 
    searchQuery = val.trim(); 
    loadProducts(); 
};

(window as any).filterByCategory = (catId: string) => { 
    activeCategory = catId; 
    renderHomeView(); 
};
