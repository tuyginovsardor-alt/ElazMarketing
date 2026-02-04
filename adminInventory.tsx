
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'grocery', label: 'Oziq-ovqat' },
    { id: 'drinks', label: 'Ichimliklar' },
    { id: 'sweets', label: 'Shirinliklar' },
    { id: 'household', label: 'Xo\'jalik' }
];

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <button class="btn btn-primary" style="height:46px; padding:0 20px; font-size:0.8rem; border-radius:12px;" onclick="openProductEditor()">
                <i class="fas fa-plus-circle"></i> YANGI MAHSULOT
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
        listEl.innerHTML = `<div style="text-align:center; color:var(--danger); padding:2rem;">Ulanishda xatolik!</div>`;
        return;
    }

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:18px; border:1px solid #e2e8f0; background:white; overflow:hidden;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                    <tr>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem;">MAHSULOT</th>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem;">NARX</th>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem;">KATEGORIYA</th>
                        <th style="padding:15px; text-align:center; color:#64748b; font-weight:800; font-size:0.7rem;">AMAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 15px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${p.image_url || p.images?.[0] || 'https://via.placeholder.com/100'}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #eee;">
                                    <div><div style="font-weight:800;">${p.name}</div><div style="font-size:0.65rem; color:#94a3b8;">Sklad: ${p.stock_qty || 0} ${p.unit || 'dona'}</div></div>
                                </div>
                            </td>
                            <td style="padding:15px;"><b style="color:var(--primary);">${p.price?.toLocaleString()}</b></td>
                            <td style="padding:15px;"><span style="font-size:0.7rem; font-weight:800; color:#64748b; background:#f1f5f9; padding:4px 8px; border-radius:6px;">${p.category?.toUpperCase()}</span></td>
                            <td style="padding:15px; text-align:center;">
                                <div style="display:flex; justify-content:center; gap:8px;">
                                    <button class="btn" style="width:30px; height:30px; padding:0; border-radius:8px; background:#f1f5f9; color:#64748b; border:none;" onclick="openProductEditor(${p.id})"><i class="fas fa-edit"></i></button>
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

(window as any).openProductEditor = async (id?: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    let p: any = { name: '', price: '', category: 'grocery', unit: 'dona', stock_qty: 10, image_url: '' };
    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if(data) p = data;
    }

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer;"></i>
                <h2 style="font-weight:900;">${id ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
            </div>

            <div class="card" style="padding:25px; border-radius:24px;">
                <label style="font-size:0.7rem; font-weight:800; color:var(--gray);">MAHSULOT NOMI</label>
                <input type="text" id="p_name" value="${p.name}" placeholder="Masalan: Pepsi 1.5L" style="height:55px;">

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <div><label style="font-size:0.7rem; font-weight:800; color:var(--gray);">NARXI (UZS)</label><input type="number" id="p_price" value="${p.price}" style="height:55px;"></div>
                    <div><label style="font-size:0.7rem; font-weight:800; color:var(--gray);">KATEGORIYA</label>
                        <select id="p_cat" style="height:55px;">
                            ${CATEGORIES.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <div><label style="font-size:0.7rem; font-weight:800; color:var(--gray);">O'LCHOV</label><input type="text" id="p_unit" value="${p.unit}" placeholder="dona, kg, litr" style="height:55px;"></div>
                    <div><label style="font-size:0.7rem; font-weight:800; color:var(--gray);">SKLAD (MIQDOR)</label><input type="number" id="p_stock" value="${p.stock_qty}" style="height:55px;"></div>
                </div>

                <label style="font-size:0.7rem; font-weight:800; color:var(--gray);">RASM URL (YOKI YUKLASH)</label>
                <input type="text" id="p_img" value="${p.image_url || ''}" placeholder="https://..." style="height:55px;">
                
                <button class="btn btn-primary" style="width:100%; height:60px; margin-top:20px;" onclick="saveAdminProduct(${id || 'null'})">
                    ${id ? 'O\'ZGARISHLARNI SAQLASH' : 'MAHSULOTNI QO\'SHISH'}
                </button>
            </div>
        </div>
    `;
};

(window as any).saveAdminProduct = async (id: any) => {
    const data = {
        name: (document.getElementById('p_name') as HTMLInputElement).value,
        price: Number((document.getElementById('p_price') as HTMLInputElement).value),
        category: (document.getElementById('p_cat') as HTMLSelectElement).value,
        unit: (document.getElementById('p_unit') as HTMLInputElement).value,
        stock_qty: Number((document.getElementById('p_stock') as HTMLInputElement).value),
        image_url: (document.getElementById('p_img') as HTMLInputElement).value,
        is_archived: false
    };

    if(!data.name || !data.price) return showToast("Nom va narxni kiriting!");

    const { error } = id ? await supabase.from('products').update(data).eq('id', id) : await supabase.from('products').insert(data);
    
    if(!error) {
        showToast("Muvaffaqiyatli saqlandi! ✨");
        closeOverlay('checkoutOverlay');
        renderAdminInventory();
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).deleteProduct = async (id: number) => {
    if(confirm("Mahsulotni o'chirmoqchimisiz?")) {
        const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
        if(!error) { showToast("O'chirildi"); loadAdminProducts(); }
    }
};
