
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'grocery', label: 'Oziq-ovqat', icon: 'fa-apple-whole' },
    { id: 'drinks', label: 'Ichimliklar', icon: 'fa-bottle-water' },
    { id: 'sweets', label: 'Shirinliklar', icon: 'fa-cookie' },
    { id: 'household', label: 'Xo\'jalik', icon: 'fa-house-chimney' }
];

let currentEditingImages: string[] = [];
let activeEditorTab = 'general';

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; gap:15px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; gap:10px;">
                <button class="btn btn-primary" style="height:52px; padding:0 25px; font-size:0.85rem; border-radius:16px; background:var(--gradient);" onclick="openProductEditor()">
                    <i class="fas fa-plus-circle"></i> YANGI MAHSULOT
                </button>
            </div>
            <div style="flex:1; max-width:400px; position:relative;">
                <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.9rem;"></i>
                <input type="text" id="skladSearchInput" placeholder="Mahsulot nomi yoki ID..." style="margin:0; height:52px; padding-left:48px; font-size:0.9rem; border-radius:18px; border:2px solid #f1f5f9; background:white; font-weight:600;" oninput="window.searchSklad(this.value)">
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
        <div class="card" style="padding:0; border-radius:30px; background:white; overflow:hidden; border:2px solid #f1f5f9; box-shadow:var(--shadow-sm);">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                    <tr>
                        <th style="padding:18px; text-align:left; color:#64748b; font-weight:900; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">Mahsulot</th>
                        <th style="padding:18px; text-align:left; color:#64748b; font-weight:900; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">Status</th>
                        <th style="padding:18px; text-align:left; color:#64748b; font-weight:900; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">Narx</th>
                        <th style="padding:18px; text-align:center; color:#64748b; font-weight:900; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">Amal</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f8fafc; transition:0.2s;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='white'">
                            <td style="padding:15px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="width:50px; height:50px; border-radius:14px; overflow:hidden; border:1px solid #f1f5f9; background:#f8fafc;">
                                        <img src="${p.image_url}" style="width:100%; height:100%; object-fit:cover;">
                                    </div>
                                    <div>
                                        <div style="font-weight:900; color:var(--text); font-size:0.9rem;">${p.name}</div>
                                        <div style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase;">${p.category} • ${p.unit}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding:15px;">
                                <span style="font-size:0.6rem; font-weight:900; padding:4px 10px; border-radius:8px; background:${p.stock > 0 ? '#f0fdf4' : '#fef2f2'}; color:${p.stock > 0 ? '#16a34a' : '#ef4444'};">
                                    ${p.stock > 0 ? 'BOR' : 'TUGAGAN'}
                                </span>
                            </td>
                            <td style="padding:15px; font-weight:900; color:var(--primary); font-size:0.95rem;">${p.price.toLocaleString()}</td>
                            <td style="padding:15px; text-align:center;">
                                <button class="btn" style="width:40px; height:40px; border-radius:12px; background:#eff6ff; color:#3b82f6; border:none; cursor:pointer;" onclick="openProductEditor(${p.id})"><i class="fas fa-pen-to-square"></i></button>
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

    placeholder.innerHTML = `<div style="text-align:center; padding:10rem;"><i class="fas fa-spinner fa-spin fa-3x" style="color:var(--primary);"></i></div>`;

    // Bu "p" obyekti hozirgi tahrirlash sessiyasining asosiy xotirasi (Source of truth)
    let p: any = { name: '', price: '', category: 'grocery', unit: 'dona', image_url: '', description: '', images: [], stock: 100, discount: 0 };
    
    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if(data) p = data;
    }

    currentEditingImages = p.images || [];
    activeEditorTab = 'general';

    // Muhim: DOMdagi inputlardan qiymatlarni olib, "p" obyektini yangilash funksiyasi
    const syncPFromDOM = () => {
        const nameEl = document.getElementById('p_name') as HTMLInputElement;
        const priceEl = document.getElementById('p_price') as HTMLInputElement;
        const unitEl = document.getElementById('p_unit') as HTMLInputElement;
        const catEl = document.getElementById('p_cat') as HTMLSelectElement;
        const descEl = document.getElementById('p_desc') as HTMLTextAreaElement;
        const imgEl = document.getElementById('p_img') as HTMLInputElement;
        const stockEl = document.getElementById('p_stock') as HTMLInputElement;
        const discEl = document.getElementById('p_discount') as HTMLInputElement;

        if(nameEl) p.name = nameEl.value;
        if(priceEl) p.price = Number(priceEl.value);
        if(unitEl) p.unit = unitEl.value;
        if(catEl) p.category = catEl.value;
        if(descEl) p.description = descEl.value;
        if(imgEl) p.image_url = imgEl.value;
        if(stockEl) p.stock = Number(stockEl.value);
        if(discEl) p.discount = Number(discEl.value);
        
        p.images = currentEditingImages;
    };

    const renderEditorContent = () => {
        placeholder.innerHTML = `
            <div style="padding-bottom:120px; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:100; padding:15px 0; border-bottom:2px solid #f8fafc;">
                    <div onclick="closeOverlay('checkoutOverlay')" style="width:45px; height:45px; border-radius:15px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; cursor:pointer;"><i class="fas fa-chevron-left"></i></div>
                    <h2 style="font-weight:900; font-size:1.4rem; letter-spacing:-0.5px;">${id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h2>
                </div>

                <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:18px; margin-bottom:25px; gap:5px;">
                    <button onclick="window.switchEditorTab('general')" style="flex:1; height:42px; border-radius:14px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s; background:${activeEditorTab === 'general' ? 'white' : 'transparent'}; color:${activeEditorTab === 'general' ? 'var(--primary)' : 'var(--gray)'}; box-shadow:${activeEditorTab === 'general' ? 'var(--shadow-sm)' : 'none'};">ASOSIY</button>
                    <button onclick="window.switchEditorTab('media')" style="flex:1; height:42px; border-radius:14px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s; background:${activeEditorTab === 'media' ? 'white' : 'transparent'}; color:${activeEditorTab === 'media' ? 'var(--primary)' : 'var(--gray)'}; box-shadow:${activeEditorTab === 'media' ? 'var(--shadow-sm)' : 'none'};">RASMLAR</button>
                    <button onclick="window.switchEditorTab('stock')" style="flex:1; height:42px; border-radius:14px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s; background:${activeEditorTab === 'stock' ? 'white' : 'transparent'}; color:${activeEditorTab === 'stock' ? 'var(--primary)' : 'var(--gray)'}; box-shadow:${activeEditorTab === 'stock' ? 'var(--shadow-sm)' : 'none'};">OMBOR</button>
                </div>

                <div id="editorTabBody">
                    ${activeEditorTab === 'general' ? `
                        <div class="card" style="border-radius:28px; padding:25px; border:2px solid #f1f5f9; background:white;">
                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">Mahsulot nomi *</label>
                            <input type="text" id="p_name" value="${p.name}" placeholder="Masalan: Pepsi 1.5L" style="height:60px; font-size:1rem; border-radius:18px;">
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                                <div>
                                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">Narxi (UZS) *</label>
                                    <input type="number" id="p_price" value="${p.price}" placeholder="12000" style="height:60px; font-size:1rem; border-radius:18px;">
                                </div>
                                <div>
                                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">Birligi *</label>
                                    <input type="text" id="p_unit" value="${p.unit}" placeholder="kg, dona" style="height:60px; font-size:1rem; border-radius:18px;">
                                </div>
                            </div>

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block; margin-top:10px;">Kategoriya</label>
                            <select id="p_cat" style="height:60px; border-radius:18px;">
                                ${CATEGORIES.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                            </select>

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block; margin-top:10px;">Tavsif</label>
                            <textarea id="p_desc" style="height:120px; border-radius:18px; padding:15px;">${p.description || ''}</textarea>
                        </div>
                    ` : ''}

                    ${activeEditorTab === 'media' ? `
                        <div class="card" style="border-radius:28px; padding:25px; border:2px solid #f1f5f9; background:white;">
                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:15px; display:block;">Asosiy rasm URL</label>
                            <div style="display:flex; gap:15px; align-items:center; margin-bottom:25px;">
                                <div id="mainImgPreview" style="width:100px; height:100px; border-radius:20px; background:#f8fafc; border:2px dashed #cbd5e1; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                                    ${p.image_url ? `<img src="${p.image_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-image" style="color:#cbd5e1;"></i>`}
                                </div>
                                <div style="flex:1;">
                                    <input type="text" id="p_img" value="${p.image_url}" placeholder="URL..." style="height:50px; font-size:0.8rem; margin-bottom:10px;">
                                    <label class="btn btn-outline" style="height:45px; border-radius:12px; cursor:pointer; font-size:0.7rem; border-color:var(--primary); color:var(--primary); width:100%; display:flex; align-items:center; justify-content:center;">
                                        <input type="file" style="display:none;" onchange="window.uploadProdImageToUrl(this, 'p_img')">
                                        YUKLASH
                                    </label>
                                </div>
                            </div>

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:15px; display:block;">Galereya</label>
                            <div id="additionalImagesCont" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                                ${currentEditingImages.map((img, i) => `
                                    <div style="position:relative; aspect-ratio:1/1; border-radius:15px; overflow:hidden; border:2px solid #f1f5f9;">
                                        <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                                        <button onclick="window.removeEditorImg(${i})" style="position:absolute; top:2px; right:2px; width:22px; height:22px; border-radius:5px; background:rgba(239,68,68,0.9); color:white; border:none; cursor:pointer;"><i class="fas fa-times" style="font-size:0.6rem;"></i></button>
                                    </div>
                                `).join('')}
                                <label class="btn btn-outline" style="aspect-ratio:1/1; height:auto; border-radius:15px; border:2px dashed #cbd5e1; background:#f8fafc; color:var(--gray); cursor:pointer; display:flex; flex-direction:column; gap:5px; font-size:0.6rem; justify-content:center; align-items:center;">
                                    <input type="file" style="display:none;" onchange="window.uploadProdImageToGallery(this)">
                                    <i class="fas fa-plus"></i>
                                    <span>QO'SHISH</span>
                                </label>
                            </div>
                        </div>
                    ` : ''}

                    ${activeEditorTab === 'stock' ? `
                        <div class="card" style="border-radius:28px; padding:25px; border:2px solid #f1f5f9; background:white;">
                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">Ombordagi miqdor</label>
                            <input type="number" id="p_stock" value="${p.stock}" style="height:60px; font-size:1rem; border-radius:18px;">

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block; margin-top:20px;">Chegirma foizi (%)</label>
                            <input type="number" id="p_discount" value="${p.discount}" style="height:60px; font-size:1rem; border-radius:18px;">
                        </div>
                    ` : ''}
                </div>

                <div style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); padding:20px; z-index:1000; border-top:1px solid #f1f5f9;">
                    <button class="btn btn-primary" id="btnSaveProd" style="width:100%; height:65px; border-radius:22px; font-size:1.1rem;" onclick="window.saveAdminProduct(${id || 'null'})">
                        SAQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
                    </button>
                </div>
            </div>
        `;
    };

    (window as any).switchEditorTab = (tab: string) => {
        syncPFromDOM(); // Tabni o'zgartirishdan oldin ma'lumotlarni saqlaymiz
        activeEditorTab = tab;
        renderEditorContent();
    };

    (window as any).saveAdminProduct = async (prodId: any) => {
        syncPFromDOM(); // Saqlashdan oldin hammasini o'qib olamiz
        const btn = document.getElementById('btnSaveProd') as HTMLButtonElement;
        
        if(!p.name || !p.price) return showToast("Nomi va narxi majburiy!");

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> SAQLANMOQDA...';

        const { error } = prodId ? await supabase.from('products').update(p).eq('id', prodId) : await supabase.from('products').insert(p);
        
        if(!error) { 
            showToast("Mahsulot saqlandi!"); 
            closeOverlay('checkoutOverlay'); 
            renderAdminInventory(); 
        } else {
            showToast("Xato: " + error.message);
            btn.disabled = false;
            btn.innerText = "SAQLASH";
        }
    };

    renderEditorContent();
};

(window as any).uploadProdImageToUrl = async (input: HTMLInputElement, targetId: string) => {
    const file = input.files?.[0];
    if(!file) return;
    showToast("Yuklanmoqda...");
    const fileName = `main_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    if(error) return showToast("Xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
    
    // UI va inputni yangilash
    const inputEl = document.getElementById(targetId) as HTMLInputElement;
    if(inputEl) inputEl.value = publicUrl;
    const preview = document.getElementById('mainImgPreview');
    if(preview) preview.innerHTML = `<img src="${publicUrl}" style="width:100%; height:100%; object-fit:cover;">`;
    showToast("Rasm yuklandi");
};

(window as any).uploadProdImageToGallery = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    const fileName = `gal_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    if(error) return showToast("Xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
    currentEditingImages.push(publicUrl);
    (window as any).switchEditorTab('media');
};

(window as any).removeEditorImg = (idx: number) => {
    currentEditingImages.splice(idx, 1);
    (window as any).switchEditorTab('media');
};

(window as any).searchSklad = (val: string) => {
    loadAdminProducts(val.trim());
};
