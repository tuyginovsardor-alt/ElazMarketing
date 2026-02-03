
import { supabase, showToast, user } from "./index.tsx";

export async function renderHomeView() {
    const container = document.getElementById('homeView');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:25px; padding-bottom:20px;">
            <div style="position: sticky; top: -1px; background: white; z-index: 10; padding: 10px 0;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="flex:1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); opacity:0.6;"></i>
                        <input type="text" placeholder="Qidirish..." style="width: 100%; height: 56px; border-radius: 20px; border: 2.5px solid #f1f5f9; padding: 0 50px; font-weight: 700; background: #f8fafc;" oninput="searchProducts(this.value)">
                    </div>
                </div>
            </div>

            <div id="productsGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                ${Array.from({length: 4}).map(() => `<div style="height:250px; background:#f8fafc; border-radius:24px; animation: pulse 1.5s infinite;"></div>`).join('')}
            </div>
            
            ${renderRichFooter()}
        </div>
    `;

    loadProducts();
}

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if(!grid) return;

    const { data: prods } = await supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    
    // Check wishlist if user logged in
    let likedIds = new Set();
    if(user) {
        const { data: wishlist } = await supabase.from('wishlist').select('product_id').eq('user_id', user.id);
        wishlist?.forEach(w => likedIds.add(w.product_id));
    }

    if(!prods) return;

    grid.innerHTML = prods.map(p => {
        const isLiked = likedIds.has(p.id);
        const mainImg = p.images?.[0] || p.image_url || "https://via.placeholder.com/300";
        
        return `
            <div class="product-card" onclick="openProductDetails(${p.id})" style="background:white; border-radius:26px; border:1px solid #f1f5f9; overflow:hidden; position:relative; box-shadow:var(--shadow-sm); transition:0.3s; cursor:pointer;">
                <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                    <img src="${mainImg}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                    
                    <button style="position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:12px; background:rgba(255,255,255,0.8); border:none; backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:5;" onclick="event.stopPropagation(); toggleLike(${p.id}, this.querySelector('i'))">
                        <i class="${isLiked ? 'fas' : 'far'} fa-heart" style="color:${isLiked ? '#f43f5e' : '#cbd5e1'}; font-size:1.1rem;"></i>
                    </button>

                    <button style="position:absolute; bottom:12px; right:12px; width:40px; height:40px; border-radius:12px; background:var(--primary); border:none; color:white; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; z-index:5;" onclick="event.stopPropagation(); addToCart(${p.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div style="padding:12px;">
                    <h5 style="font-weight:800; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h5>
                    <div style="font-weight:900; color:var(--primary); font-size:1rem; margin-top:5px;">${p.price.toLocaleString()} UZS</div>
                </div>
            </div>
        `;
    }).join('');
}

export function renderRichFooter() {
    return `
        <footer style="margin-top:40px; padding:35px 20px; background:#f8fafc; border-radius:35px; text-align:center; border:1px solid #f1f5f9;">
            <div style="font-weight:900; font-size:1.4rem;">ELAZ<span style="color:var(--primary)">MARKET</span></div>
            <p style="font-size:0.8rem; color:var(--gray); margin-top:10px;">Bag'dod tumanidagi eng yaxshi xizmat.</p>
        </footer>
    `;
}
