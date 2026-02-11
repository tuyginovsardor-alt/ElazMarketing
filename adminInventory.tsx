
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'all', label: 'Hamma kategoriyalar', icon: 'fa-layer-group' },
    { id: 'grocery', label: 'Oziq-ovqat', icon: 'fa-apple-whole' },
    { id: 'drinks', label: 'Ichimliklar', icon: 'fa-bottle-water' },
    { id: 'sweets', label: 'Shirinliklar', icon: 'fa-cookie' },
    { id: 'household', label: 'Xo\'jalik', icon: 'fa-house-chimney' }
];

let currentSkladFilter = 'active'; 
let currentCatFilter = 'all';
let currentEditingProduct: any = { name: '', price: 0, stock: 0, unit: 'dona', category: 'grocery', description: '', image_url: '' };

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out;">
            <!-- STATS -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:25px;">
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:15px;">
                    <div style="width:45px; height:45px; border-radius:14px; background:#f0fdf4; color:#16a34a; display:flex; align-items:center; justify-content:center;"><i class="fas fa-boxes-stacked"></i></div>
                    <div><p style="font-size:0.6rem; color:var(--gray); font-weight:800; text-transform:uppercase;">Jami mahsulot</p><h4 id="st_total" style="font-weight:900;">...</h4></div>
                </div>
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:15px;">
                    <div style="width:45px; height:45px; border-radius:14px; background:#fff1f2; color:#e11d48; display:flex; align-items:center; justify-content:center;"><i class="fas fa-arrow-trend-down"></i></div>
                    <div><p style="font-size:0.6rem; color:var(--gray); font-weight:800; text-transform:uppercase;">Kam qolgan</p><h4 id="st_low" style="font-weight:900;">...</h4></div>
                </div>
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:none; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:15px;">
                    <div style="width:45px; height:45px; border-radius:14px; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center;"><i class="fas fa-vault"></i></div>
                    <div><p style="font-size:0.6rem; color:var(--gray); font-weight:800; text-transform:uppercase;">Sklad qiymati</p><h4 id="st_val" style="font-weight:900;">...</h4></div>
                </div>
            </div>

            <!-- CONTROLS -->
            <div style="background:white; padding:20px; border-radius:30px; margin-bottom:25px; border:2px solid #f1f5f9;">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:15px; align-items:center;">
                    <button class="btn btn-primary" style="height:48px; border-radius:14px; font-size:0.75rem; padding:0 20px;" onclick="window.openProductEditor()">
                        <i class="fas fa-plus-circle"></i> YANGI QO'SHISH
                    </button>
                    <div style="display:flex; gap:10px; flex:1; justify-content:flex-end;">
                        <select id="invStatusFilter" style="height:48px; width:130px; font-size:0.75rem;" onchange="window.changeInvFilter('status', this.value)">
                            <option value="active">FAOL</option>
                            <option value="archived">ARXIV</option>
                            <option value="all">HAMMASI</option>
                        </select>
                        <select id="invCatFilter" style="height:48px; width:150px; font-size:0.75rem;" onchange="window.changeInvFilter('cat', this.value)">
                            ${CATEGORIES.map(c => `<option value="${c.id}">${c.label.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div id="skladList"></div>
        </div>
    `;
    loadAdminProducts();
}

async function loadAdminProducts(searchTerm = '') {
    const listEl = document.getElementById('skladList');
    if(!listEl) return;
    
    let query = supabase.from('products').select('*');
    if(currentSkladFilter === 'active') query = query.eq('is_archived', false);
    else if(currentSkladFilter === 'archived') query = query.eq('is_archived', true);
    if(currentCatFilter !== 'all') query = query.eq('category', currentCatFilter);
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    
    const { data: prods } = await query.order('created_at', { ascending: false });

    if(document.getElementById('st_total')) {
        document.getElementById('st_total')!.innerText = (prods?.length || 0).toString();
        document.getElementById('st_low')!.innerText = (prods?.filter(p => p.stock < 10).length || 0).toString();
        document.getElementById('st_val')!.innerText = (prods?.reduce((acc, p) => acc + (p.price * p.stock), 0) || 0).toLocaleString() + " UZS";
    }

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:28px; overflow:hidden; border:2px solid #f1f5f9; background:white;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                    <tr>
                        <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Mahsulot</th>
                        <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Sklad</th>
                        <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Narx</th>
                        <th style="padding:15px; text-align:right; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Amallar</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f8fafc; opacity:${p.is_archived ? '0.6' : '1'}">
                            <td style="padding:12px 15px;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <img src="${p.image_url}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;">
                                    <div style="font-weight:900; color:var(--text);">${p.name}</div>
                                </div>
                            </td>
                            <td style="padding:15px; font-weight:800; color:${p.stock < 10 ? 'var(--danger)' : 'var(--text)'}">${p.stock} ${p.unit}</td>
                            <td style="padding:15px; font-weight:900;">${p.price.toLocaleString()}</td>
                            <td style="padding:15px; text-align:right;">
                                <div style="display:flex; justify-content:flex-end; gap:8px;">
                                    <button class="btn" style="width:34px; height:34px; border-radius:10px; background:#eff6ff; color:#3b82f6; border:none;" onclick="window.openProductEditor(${p.id})"><i class="fas fa-pen"></i></button>
                                    <button class="btn" style="width:34px; height:34px; border-radius:10px; background:${p.is_archived ? '#f0fdf4' : '#fff7ed'}; color:${p.is_archived ? '#16a34a' : '#ea580c'}; border:none;" onclick="window.archiveProduct(${p.id}, ${p.is_archived})"><i class="fas ${p.is_archived ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                                    <button class="btn" style="width:34px; height:34px; border-radius:10px; background:#fef2f2; color:var(--danger); border:none;" onclick="window.deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${!prods?.length ? `<div style="padding:5rem; text-align:center; color:var(--gray); font-weight:800;">Mahsulot topilmadi</div>` : ''}
        </div>
    `;
}

// --- EDITOR LOGIC ---
(window as any).openProductEditor = async (id?: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        currentEditingProduct = data;
    } else {
        // Yangi bo'lsa draftni tiklash yoki tozalash (Draft saqlash uchun currentEditingProduct ishlatiladi)
        if(!currentEditingProduct.id) {
             // Agar ID yo'q bo'lsa, demak bu yangi mahsulot drafti
        } else {
             // Agar ID bo'lsa va biz "Yangi qo'shish"ni bossak, tozalaymiz
             currentEditingProduct = { name: '', price: 0, stock: 0, unit: 'dona', category: 'grocery', description: '', image_url: '' };
        }
    }

    renderEditorUI();
};

function renderEditorUI() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:100px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:100; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; padding:5px;"></i>
                <h2 style="font-weight:900; font-size:1.2rem;">${currentEditingProduct.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h2>
            </div>

            <div class="card" style="border-radius:30px; padding:25px; background:white; border:2px solid #f1f5f9;">
                <div style="text-align:center; margin-bottom:25px;">
                    <div style="position:relative; width:150px; height:150px; margin:0 auto; border-radius:25px; background:#f8fafc; border:2px dashed #cbd5e1; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        ${currentEditingProduct.image_url ? `<img src="${currentEditingProduct.image_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-image fa-3x" style="color:#cbd5e1;"></i>`}
                        <label style="position:absolute; bottom:10px; right:10px; width:40px; height:40px; background:var(--primary); color:white; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 5px 15px rgba(34,197,94,0.3);">
                            <i class="fas fa-camera"></i>
                            <input type="file" style="display:none;" onchange="window.uploadProductImage(this)">
                        </label>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:15px;">
                    <div>
                        <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">MAHSULOT NOMI</label>
                        <input type="text" value="${currentEditingProduct.name}" oninput="window.updateDraft('name', this.value)" placeholder="Masalan: Olma" style="height:55px; border-radius:15px;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">NARXI (UZS)</label>
                            <input type="number" value="${currentEditingProduct.price}" oninput="window.updateDraft('price', this.value)" style="height:55px; border-radius:15px;">
                        </div>
                        <div>
                            <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">SONI (OMBORDA)</label>
                            <input type="number" value="${currentEditingProduct.stock}" oninput="window.updateDraft('stock', this.value)" style="height:55px; border-radius:15px;">
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:15px;">
                        <div>
                            <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">KATEGORIYA</label>
                            <select onchange="window.updateDraft('category', this.value)" style="height:55px; border-radius:15px;">
                                ${CATEGORIES.filter(c => c.id !== 'all').map(c => `<option value="${c.id}" ${currentEditingProduct.category === c.id ? 'selected' : ''}>${c.label.toUpperCase()}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">BIRLIK</label>
                            <select onchange="window.updateDraft('unit', this.value)" style="height:55px; border-radius:15px;">
                                <option value="dona" ${currentEditingProduct.unit === 'dona' ? 'selected' : ''}>DONA</option>
                                <option value="kg" ${currentEditingProduct.unit === 'kg' ? 'selected' : ''}>KG</option>
                                <option value="litr" ${currentEditingProduct.unit === 'litr' ? 'selected' : ''}>LITR</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">TAVSIF (Ixtiyoriy)</label>
                        <textarea oninput="window.updateDraft('description', this.value)" style="height:100px; border-radius:15px;">${currentEditingProduct.description || ''}</textarea>
                    </div>

                    <button class="btn btn-primary" style="height:60px; border-radius:20px; margin-top:10px;" onclick="window.saveProductFinal()">
                        SAQLASH <i class="fas fa-check-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

(window as any).updateDraft = (key: string, val: any) => {
    if(key === 'price' || key === 'stock') val = parseFloat(val) || 0;
    currentEditingProduct[key] = val;
};

(window as any).uploadProductImage = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    
    showToast("Rasm yuklanmoqda...");
    const fileName = `prod_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    
    if(!error) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
        currentEditingProduct.image_url = publicUrl;
        renderEditorUI(); // UI-ni yangilash, matnlar currentEditingProduct-da saqlangan
        showToast("Rasm yuklandi ✅");
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).saveProductFinal = async () => {
    if(!currentEditingProduct.name || !currentEditingProduct.image_url) return showToast("Nom va Rasm majburiy!");
    
    showToast("Saqlanmoqda...");
    let res;
    if(currentEditingProduct.id) {
        res = await supabase.from('products').update(currentEditingProduct).eq('id', currentEditingProduct.id);
    } else {
        res = await supabase.from('products').insert([currentEditingProduct]);
    }

    if(!res.error) {
        showToast("Muvaffaqiyatli saqlandi! ✨");
        closeOverlay('checkoutOverlay');
        currentEditingProduct = { name: '', price: 0, stock: 0, unit: 'dona', category: 'grocery', description: '', image_url: '' };
        loadAdminProducts();
    } else {
        showToast("Xato: " + res.error.message);
    }
};

(window as any).changeInvFilter = (type: string, val: string) => {
    if(type === 'status') currentSkladFilter = val;
    if(type === 'cat') currentCatFilter = val;
    loadAdminProducts();
};

(window as any).archiveProduct = async (id: number, current: boolean) => {
    if(!confirm(current ? "Mahsulotni faollashtirasizmi?" : "Mahsulotni arxivlaysizmi?")) return;
    const { error } = await supabase.from('products').update({ is_archived: !current }).eq('id', id);
    if(!error) { showToast("Holat yangilandi!"); loadAdminProducts(); }
    else showToast("Xato: " + error.message);
};

(window as any).deleteProduct = async (id: number) => {
    if(!confirm("Diqqat! Mahsulot bazadan butunlay o'chiriladi. Qaytarib bo'lmaydi!")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(!error) { showToast("O'chirildi!"); loadAdminProducts(); }
    else showToast("Xato: " + error.message);
};
