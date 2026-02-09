
import { supabase, user } from "./index.tsx";

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
        <div style="display:flex; flex-direction:column; gap:20px; padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="position: sticky; top: -1px; background: white; z-index: 100; padding: 10px 0; display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="flex:1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); opacity:0.7;"></i>
                        <input type="text" id="mainSearchInput" value="${searchQuery}" placeholder="Mahsulot qidirish..." 
                               style="width: 100%; height: 56px; border-radius: 20px; border: 2.5px solid #f1f5f9; padding: 0 55px; font-weight: 700; background: #f8fafc;" 
                               oninput="window.handleSearch(this.value)">
                    </div>
                </div>
                <div style="display:flex; overflow-x:auto; gap:10px; padding-bottom:5px; scrollbar-width: none;">
                    ${CATEGORIES.map(cat => `
                        <div onclick="window.filterByCategory('${cat.id}')" 
                             style="flex: 0 0 auto; display:flex; align-items:center; gap:8px; padding:10px 20px; border-radius:16px; border: 2px solid ${activeCategory === cat.id ? 'var(--primary)' : '#f1f5f9'}; background: ${activeCategory === cat.id ? 'var(--primary-light)' : 'white'}; cursor:pointer;">
                            <i class="fas ${cat.icon}" style="color: ${activeCategory === cat.id ? 'var(--primary)' : '#94a3b8'};"></i>
                            <span style="font-size:0.8rem; font-weight:800; color: ${activeCategory === cat.id ? 'var(--primary)' : 'var(--gray)'};">${cat.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div id="productsGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;"></div>
        </div>
    `;
    loadProducts();
}

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if(!grid) return;

    let query = supabase.from('products').select('*').eq('is_archived', false);
    if(activeCategory !== 'all') query = query.eq('category', activeCategory);
    if(searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    
    const { data: prods } = await query.order('created_at', { ascending: false });
    const { data: favs } = user ? await supabase.from('favorites').select('product_id').eq('user_id', user.id) : { data: [] };
    const favIds = favs?.map(f => f.product_id) || [];
    
    if(!prods?.length) {
        grid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:4rem; color:var(--gray);">Mahsulot topilmadi</div>`;
        return;
    }

    grid.innerHTML = prods.map(p => `
        <div class="product-card" onclick="window.openProductDetailsById(${p.id})" style="background:white; border-radius:28px; border:1.5px solid #f1f5f9; overflow:hidden; position:relative; cursor:pointer;">
            <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc;">
                <img src="${p.image_url}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                <button onclick="event.stopPropagation(); window.handleToggleFav(${p.id}, this)" 
                        style="position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:12px; background:rgba(255,255,255,0.8); border:none; color:${favIds.includes(p.id) ? 'var(--danger)' : '#cbd5e1'};">
                    <i class="${favIds.includes(p.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div style="padding:15px;">
                <h5 style="font-weight:800; font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</h5>
                <div style="font-weight:900; color:var(--primary); font-size:1.1rem; margin-top:5px;">${p.price.toLocaleString()} UZS</div>
            </div>
        </div>
    `).join('');
}

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

(window as any).handleSearch = (val: string) => { searchQuery = val.trim(); loadProducts(); };
(window as any).filterByCategory = (catId: string) => { activeCategory = catId; renderHomeView(); };
