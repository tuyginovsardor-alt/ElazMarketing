
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

let currentImages: string[] = [];

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <button class="btn btn-primary" style="height:46px; padding:0 20px; font-size:0.8rem; border-radius:12px;" onclick="openProductEditor()">
                <i class="fas fa-plus-circle"></i> YANGI QO'SHISH
            </button>
            <div style="width:280px; position:relative;">
                <i class="fas fa-search" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;"></i>
                <input type="text" id="skladSearchInput" placeholder="Qidirish..." style="margin:0; height:46px; padding-left:40px; font-size:0.85rem; border-radius:12px;" oninput="searchSklad(this.value)">
            </div>
        </div>
        <div id="skladList"></div>
    `;
    loadAdminProducts();
}

async function loadAdminProducts(searchTerm = '') {
    const listEl = document.getElementById('skladList');
    if(!listEl) return;
    
    listEl.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    let query = supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    const { data: prods, error } = await query;

    if(error) {
        listEl.innerHTML = `<div style="text-align:center; color:var(--danger); padding:2rem;">Bazaga ulanib bo'lmadi!</div>`;
        return;
    }

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:18px; border:1px solid #e2e8f0; background:white; overflow:hidden;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                    <tr>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem;">MAHSULOT</th>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem;">NARX</th>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem;">SKLAD</th>
                        <th style="padding:15px; text-align:center; color:#64748b; font-weight:800; font-size:0.7rem;">AMAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 15px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${p.image_url || p.images?.[0]}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #eee;">
                                    <div><div style="font-weight:800;">${p.name}</div><div style="font-size:0.65rem; color:#94a3b8;">${p.category}</div></div>
                                </div>
                            </td>
                            <td style="padding:15px;"><b style="color:var(--primary);">${p.price?.toLocaleString()}</b></td>
                            <td style="padding:15px; font-weight:800;">${p.stock_qty} <span style="font-weight:400; color:#94a3b8; font-size:0.75rem;">${p.unit}</span></td>
                            <td style="padding:15px; text-align:center;">
                                <div style="display:flex; justify-content:center; gap:8px;">
                                    <button class="btn" style="width:30px; height:30px; padding:0; border-radius:8px; background:#f1f5f9; color:#64748b; border:none;" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn" style="width:30px; height:30px; padding:0; border-radius:8px; background:#fee2e2; color:var(--danger); border:none;" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

(window as any).searchSklad = (val: string) => loadAdminProducts(val);

(window as any).deleteProduct = async (id: number) => {
    if(confirm("Mahsulotni o'chirmoqchimisiz?")) {
        const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
        if(!error) { showToast("O'chirildi"); loadAdminProducts(); }
    }
};

(window as any).editProduct = (id: number) => {
    // Sklad tahrirlash funksiyasi (openProductEditor bilan bog'lanadi)
    showToast("Tahrirlash: " + id);
};
