
import { supabase, showToast, user } from "./index.tsx";

let activeCategory = 'all';
let activeSort = 'newest';
let searchQuery = '';

const CATEGORIES = [
    { id: 'all', label: 'Hammasi', icon: 'fa-th-large' },
    { id: 'grocery', label: 'Oziq-ovqat', icon: 'fa-apple-whole' },
    { id: 'drinks', label: 'Ichimliklar', icon: 'fa-bottle-water' },
    { id: 'sweets', label: 'Shirinliklar', icon: 'fa-cookie' },
    { id: 'household', label: 'Xo\'jalik', icon: 'fa-house-chimney' }
];

export async function renderHomeView() {
    const container = document.getElementById('homeView');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px; padding-bottom:100px; animation: fadeIn 0.4s ease-out;">
            <!-- SEARCH & SORT BAR -->
            <div style="position: sticky; top: -1px; background: white; z-index: 100; padding: 10px 0; display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="flex:1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); opacity:0.7;"></i>
                        <input type="text" id="mainSearchInput" value="${searchQuery}" placeholder="Mahsulot qidirish..." 
                               style="width: 100%; height: 56px; border-radius: 20px; border: 2.5px solid #f1f5f9; padding: 0 55px; font-weight: 700; background: #f8fafc; transition:0.3s;" 
                               oninput="handleSearch(this.value)">
                    </div>
                    <div style="position:relative;">
                        <button onclick="toggleSortDropdown()" class="btn" style="width:56px; height:56px; border-radius:20px; background:#f8fafc; border:2.5px solid #f1f5f9; padding:0; color:var(--text);">
                            <i class="fas fa-sliders"></i>
                        </button>
                        <div id="sortDropdown" style="display:none; position:absolute; top:65px; right:0; background:white; border-radius:18px; box-shadow:var(--shadow-lg); border:1px solid #f1f5f9; width:180px; z-index:200; overflow:hidden;">
                            <div class="sort-opt" onclick="changeSort('newest')" style="padding:15px; font-size:0.75rem; font-weight:800; border-bottom:1px solid #f8fafc; cursor:pointer;">
                                <i class="fas fa-clock mr-2"></i> Yangilari
                            </div>
                            <div class="sort-opt" onclick="changeSort('price_asc')" style="padding:15px; font-size:0.75rem; font-weight:800; border-bottom:1px solid #f8fafc; cursor:pointer;">
                                <i class="fas fa-sort-amount-down mr-2"></i> Arzonroq
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CATEGORY SCROLL BAR -->
                <div style="display:flex; overflow-x:auto; gap:10px; padding-bottom:5px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${CATEGORIES.map(cat => `
                        <div onclick="filterByCategory('${cat.id}')" 
                             style="flex: 0 0 auto; display:flex; align-items:center; gap:8px; padding:10px 20px; border-radius:16px; border: 2px solid ${activeCategory === cat.id ? 'var(--primary)' : '#f1f5f9'}; background: ${activeCategory === cat.id ? 'var(--primary-light)' : 'white'}; cursor:pointer; transition:0.3s;">
                            <i class="fas ${cat.icon}" style="color: ${activeCategory === cat.id ? 'var(--primary)' : '#94a3b8'}; font-size:0.9rem;"></i>
                            <span style="font-size:0.8rem; font-weight:800; color: ${activeCategory === cat.id ? 'var(--primary)' : 'var(--gray)'}; white-space:nowrap;">${cat.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- PRODUCTS GRID -->
            <div id="productsGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <!-- Skeleton Loading -->
            </div>
            
            ${renderRichFooter()}
        </div>
    `;

    loadProducts();
}

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if(!grid) return;

    grid.innerHTML = Array.from({length: 6}).map(() => `<div style="height:220px; background:#f1f5f9; border-radius:24px; animation: pulse 1.5s infinite;"></div>`).join('');

    let query = supabase.from('products').select('*').eq('is_archived', false);
    if(activeCategory !== 'all') query = query.eq('category', activeCategory);
    if(searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    
    if(activeSort === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('price', { ascending: true });

    const { data: prods } = await query;
    
    if(!prods?.length) {
        grid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:4rem 1rem; color:var(--gray); font-weight:800;">Mahsulot topilmadi</div>`;
        return;
    }

    grid.innerHTML = prods.map(p => {
        const mainImg = p.image_url || p.images?.[0] || "https://via.placeholder.com/300";
        return `
            <div class="product-card" onclick="openProductDetailsById(${p.id})" style="background:white; border-radius:28px; border:1px solid #f1f5f9; overflow:hidden; position:relative; box-shadow:var(--shadow-sm); transition:0.3s; cursor:pointer;">
                <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                    <img src="${mainImg}" loading="lazy" style="width:100%; height:100%; object-fit:cover; transition: 0.5s transform;">
                    <div style="position:absolute; bottom:10px; right:10px; z-index:10;">
                        <button class="btn" onclick="event.stopPropagation(); addToCart(${p.id})" style="width:42px; height:42px; border-radius:14px; background:var(--primary); color:white; padding:0; box-shadow: 0 4px 12px rgba(34,197,94,0.3); border:none;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    ${p.marketing_tag ? `<div style="position:absolute; top:12px; left:12px; background:var(--danger); color:white; padding:4px 8px; border-radius:10px; font-size:0.55rem; font-weight:900; letter-spacing:0.5px;">${p.marketing_tag.toUpperCase()}</div>` : ''}
                </div>
                <div style="padding:15px;">
                    <h5 style="font-weight:800; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text);">${p.name}</h5>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem;">${p.price.toLocaleString()} <small style="font-size:0.6rem; opacity:0.8;">UZS</small></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

(window as any).openProductDetailsById = async (id: number) => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if(data) {
        const { renderProductDetails } = await import("./productDetails.tsx");
        renderProductDetails(data);
    }
};

(window as any).filterByCategory = (catId: string) => {
    activeCategory = catId;
    renderHomeView();
};

(window as any).handleSearch = (val: string) => {
    searchQuery = val.trim();
    loadProducts();
};

(window as any).toggleSortDropdown = () => {
    const drp = document.getElementById('sortDropdown');
    if(drp) drp.style.display = drp.style.display === 'none' ? 'block' : 'none';
};

(window as any).changeSort = (sortType: string) => {
    activeSort = sortType;
    const drp = document.getElementById('sortDropdown');
    if(drp) drp.style.display = 'none';
    renderHomeView();
};

export function renderRichFooter() {
    return `
        <footer style="margin-top:40px; padding:35px 20px; background:#f8fafc; border-radius:35px; text-align:center; border:1px solid #f1f5f9; opacity:0.6;">
            <div style="font-weight:900; font-size:1rem;">ELAZ<span style="color:var(--primary)">MARKET</span></div>
            <p style="font-size:0.65rem; color:var(--gray); margin-top:5px; font-weight:700;">© 2024 Bag'dod Tuman. Barcha huquqlar himoyalangan.</p>
        </footer>
    `;
}
