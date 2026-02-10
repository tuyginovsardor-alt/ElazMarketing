
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'grocery', label: 'Oziq-ovqat' },
    { id: 'drinks', label: 'Ichimliklar' },
    { id: 'sweets', label: 'Shirinliklar' },
    { id: 'household', label: 'Xo\'jalik' }
];

let selectedIds: number[] = [];
let currentEditingImages: string[] = [];

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    selectedIds = [];

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; gap:15px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; gap:10px;">
                <button class="btn btn-primary" style="height:52px; padding:0 20px; font-size:0.8rem; border-radius:14px;" onclick="openProductEditor()">
                    <i class="fas fa-plus-circle"></i> YANGI MAHSULOT
                </button>
                <button id="bulkDeleteBtn" class="btn" style="display:none; height:52px; padding:0 20px; font-size:0.8rem; border-radius:14px; background:#fee2e2; color:var(--danger); border:none;" onclick="bulkDeleteProducts()">
                    <i class="fas fa-trash-alt"></i> O'CHIRISH (<span id="selCount">0</span>)
                </button>
            </div>
            <div style="flex:1; max-width:400px; position:relative;">
                <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.9rem;"></i>
                <input type="text" id="skladSearchInput" placeholder="Mahsulot qidirish..." style="margin:0; height:52px; padding-left:48px; font-size:0.9rem; border-radius:16px; border:1.5px solid #e2e8f0; background:white;" oninput="window.searchSklad(this.value)">
            </div>
        </div>
        <div id="skladList"></div>
    `;
    loadAdminProducts();
}

async function loadAdminProducts(searchTerm = '') {
    const listEl = document.getElementById('skladList');
    if(!listEl) return;
    
    listEl.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    let query = supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    const { data: prods } = await query;

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:24px; background:white; overflow:hidden; border:1.5px solid #f1f5f9; box-shadow:var(--shadow-sm);">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:1.5px solid #f1f5f9;">
                    <tr>
                        <th style="padding:15px; width:40px;"><input type="checkbox" onchange="toggleAllCheckboxes(this)"></th>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.65rem; text-transform:uppercase;">Mahsulot</th>
                        <th style="padding:15px; text-align:left; color:#64748b; font-weight:800; font-size:0.65rem; text-transform:uppercase;">Narx</th>
                        <th style="padding:15px; text-align:center; color:#64748b; font-weight:800; font-size:0.65rem; text-transform:uppercase;">Amal</th>
                    </tr>
                </thead>
                <tbody id="inventoryTableBody">
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f8fafc; transition:0.2s;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='white'">
                            <td style="padding:15px; text-align:center;"><input type="checkbox" class="prod-checkbox" value="${p.id}" onchange="handleRowSelect(this)"></td>
                            <td style="padding:15px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${p.image_url}" style="width:45px; height:45px; border-radius:12px; object-fit:cover; border:1px solid #f1f5f9; background:#f8fafc;">
                                    <div>
                                        <div style="font-weight:900; color:var(--text);">${p.name}</div>
                                        <div style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">${p.category} • ${p.unit}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding:15px; font-weight:900; color:var(--primary); font-size:0.9rem;">${p.price.toLocaleString()}</td>
                            <td style="padding:15px; text-align:center;">
                                <button class="btn" style="width:36px; height:36px; border-radius:10px; background:#eff6ff; color:#3b82f6; border:none;" onclick="openProductEditor(${p.id})"><i class="fas fa-edit"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

(window as any).openProductEditor = async (id?: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `<div style="text-align:center; padding:5rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>`;

    let p: any = { name: '', price: '', category: 'grocery', unit: 'dona', image_url: '', description: '', images: [] };
    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if(data) p = data;
    }

    currentEditingImages = p.images || [];

    placeholder.innerHTML = `
        <div style="padding-bottom:100px; animation: slideUp 0.4s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:100; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-chevron-left" onclick="closeOverlay('checkoutOverlay')" style="cursor:pointer; font-size:1.2rem; padding:10px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">${id ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
            </div>

            <div class="card" style="border-radius:28px; padding:25px; border:1.5px solid #f1f5f9; background:white;">
                <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:8px; display:block;">Asosiy ma'lumotlar</label>
                <input type="text" id="p_name" value="${p.name}" placeholder="Mahsulot nomi">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <input type="number" id="p_price" value="${p.price}" placeholder="Narxi (UZS)">
                    <input type="text" id="p_unit" value="${p.unit}" placeholder="O'lchov (kg, dona)">
                </div>
                <select id="p_cat">
                    ${CATEGORIES.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
                <textarea id="p_desc" placeholder="Mahsulot tavsifi..." style="height:120px;">${p.description || ''}</textarea>

                <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-top:20px; margin-bottom:15px; display:block;">Rasmlar galereyasi</label>
                
                <div style="margin-bottom:15px;">
                    <label style="font-size:0.65rem; font-weight:800; color:var(--gray);">ASOSIY RASM URL</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="p_img" value="${p.image_url}" placeholder="https://..." style="margin:0; flex:1;">
                        <label class="btn btn-outline" style="width:55px; height:55px; border-radius:15px; cursor:pointer;">
                            <input type="file" style="display:none;" onchange="uploadProdImageToUrl(this, 'p_img')">
                            <i class="fas fa-camera"></i>
                        </label>
                    </div>
                </div>

                <div id="additionalImagesCont" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:15px;">
                    <!-- Rasmlar piltkalari -->
                    ${currentEditingImages.map((img, i) => `
                        <div style="position:relative; aspect-ratio:1/1; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
                            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                            <button onclick="removeEditorImg(${i})" style="position:absolute; top:2px; right:2px; width:20px; height:20px; border-radius:5px; background:rgba(239,68,68,0.8); color:white; border:none; font-size:0.6rem;"><i class="fas fa-times"></i></button>
                        </div>
                    `).join('')}
                    <label class="btn btn-outline" style="aspect-ratio:1/1; height:auto; border-radius:12px; border:2px dashed #cbd5e1; background:#f8fafc; color:var(--gray); cursor:pointer; display:flex; flex-direction:column; gap:5px; font-size:0.6rem;">
                        <input type="file" style="display:none;" onchange="uploadProdImageToGallery(this)">
                        <i class="fas fa-plus"></i>
                        <span>Rasm</span>
                    </label>
                </div>

                <button class="btn btn-primary" id="btnSaveProd" style="width:100%; height:65px; border-radius:22px; margin-top:20px; font-size:1.1rem;" onclick="saveAdminProduct(${id || 'null'})">
                    SAQLASH <i class="fas fa-save" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>
    `;
};

(window as any).uploadProdImageToUrl = async (input: HTMLInputElement, targetId: string) => {
    const file = input.files?.[0];
    if(!file) return;
    showToast("Yuklanmoqda...");
    const fileName = `p_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    if(error) return showToast("Yuklashda xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
    (document.getElementById(targetId) as HTMLInputElement).value = publicUrl;
    showToast("Asosiy rasm tayyor!");
};

(window as any).uploadProdImageToGallery = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    showToast("Galereyaga qo'shilmoqda...");
    const fileName = `g_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    if(error) return showToast("Xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
    currentEditingImages.push(publicUrl);
    
    // UI yangilash
    const cont = document.getElementById('additionalImagesCont');
    if(cont) {
        const btn = cont.lastElementChild;
        const newImg = document.createElement('div');
        newImg.style.cssText = "position:relative; aspect-ratio:1/1; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;";
        newImg.innerHTML = `
            <img src="${publicUrl}" style="width:100%; height:100%; object-fit:cover;">
            <button onclick="removeEditorImg(${currentEditingImages.length - 1})" style="position:absolute; top:2px; right:2px; width:20px; height:20px; border-radius:5px; background:rgba(239,68,68,0.8); color:white; border:none; font-size:0.6rem;"><i class="fas fa-times"></i></button>
        `;
        cont.insertBefore(newImg, btn);
    }
};

(window as any).removeEditorImg = (idx: number) => {
    currentEditingImages.splice(idx, 1);
    // Shortcut: qayta render qilish o'rniga oddiygina elementni o'chirsa ham bo'ladi, 
    // lekin bizda rasmlar soni kam bo'lgani uchun tezda yangilash kifoya.
    const cont = document.getElementById('additionalImagesCont');
    if(cont) {
        const children = Array.from(cont.children);
        if(children[idx]) children[idx].remove();
    }
};

(window as any).saveAdminProduct = async (id: any) => {
    const btn = document.getElementById('btnSaveProd') as HTMLButtonElement;
    const data = {
        name: (document.getElementById('p_name') as HTMLInputElement).value.trim(),
        price: Number((document.getElementById('p_price') as HTMLInputElement).value),
        category: (document.getElementById('p_cat') as HTMLSelectElement).value,
        unit: (document.getElementById('p_unit') as HTMLInputElement).value.trim(),
        description: (document.getElementById('p_desc') as HTMLTextAreaElement).value.trim(),
        image_url: (document.getElementById('p_img') as HTMLInputElement).value.trim(),
        images: currentEditingImages,
        is_archived: false
    };

    if(!data.name || !data.price || !data.image_url) return showToast("Ism, narx va rasm URL majburiy!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> SAQLANMOQDA...';

    const { error } = id ? await supabase.from('products').update(data).eq('id', id) : await supabase.from('products').insert(data);
    
    if(!error) { 
        showToast("Mahsulot muvaffaqiyatli saqlandi! ✨"); 
        closeOverlay('checkoutOverlay'); 
        renderAdminInventory(); 
    } else {
        showToast("Xato: " + error.message);
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};
