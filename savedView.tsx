
import { supabase, user, navTo } from "./index.tsx";

export async function renderSavedView() {
    const container = document.getElementById('savedView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding-bottom:100px; animation: fadeIn 0.4s ease-out;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight:900; font-size:1.8rem;">Saqlanganlar</h2>
                <div style="background:#fff1f2; color:#f43f5e; width:45px; height:45px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-heart"></i>
                </div>
            </div>
            
            <div id="savedList" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="grid-column: span 2; text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    if(!user) {
        const list = document.getElementById('savedList');
        if(list) list.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:4rem 1rem;"><h3>Tizimga kiring</h3></div>`;
        return;
    }

    const { data: favorites } = await supabase.from('favorites').select('*, products(*)').eq('user_id', user.id);

    const list = document.getElementById('savedList');
    if(!list) return;

    if(!favorites?.length) {
        list.innerHTML = `
            <div style="grid-column: span 2; text-align: center; padding: 4rem 2rem;">
                <div style="width: 100px; height: 100px; background: #f8fafc; border-radius: 35px; display: inline-flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 3rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-heart-circle-xmark"></i>
                </div>
                <h3 style="font-weight: 800; color: var(--text);">Hali hech narsa yo'q</h3>
                <button class="btn btn-primary" style="margin-top: 2rem; width: 100%;" onclick="navTo('home')">MAHSULOTLAR</button>
            </div>
        `;
        return;
    }

    list.innerHTML = favorites.map(f => {
        const p = f.products;
        const mainImg = p.image_url || p.images?.[0] || "https://via.placeholder.com/300";
        return `
            <div class="product-card" style="background:white; border-radius:28px; border:1px solid #f1f5f9; overflow:hidden; position:relative; box-shadow:var(--shadow-sm);">
                <div style="position:relative; width:100%; aspect-ratio:1/1; background:#f8fafc; overflow:hidden;">
                    <img src="${mainImg}" style="width:100%; height:100%; object-fit:cover;" onclick="openProductDetailsById(${p.id})">
                    <button onclick="removeFromSaved(${f.id})" style="position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:12px; background:white; border:none; display:flex; align-items:center; justify-content:center; color:var(--danger); cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
                <div style="padding:15px;">
                    <h5 style="font-weight:800; font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h5>
                    <div style="font-weight:900; color:var(--primary); font-size:1rem; margin-top:5px;">${p.price.toLocaleString()} UZS</div>
                    <button class="btn btn-primary" style="width:100%; height:36px; border-radius:10px; font-size:0.7rem; margin-top:10px;" onclick="addToCart(${p.id})">SAVATGA</button>
                </div>
            </div>
        `;
    }).join('');
}

(window as any).removeFromSaved = async (id: number) => {
    await supabase.from('favorites').delete().eq('id', id);
    renderSavedView();
};
