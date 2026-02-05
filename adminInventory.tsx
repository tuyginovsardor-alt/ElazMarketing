
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'grocery', label: 'Oziq-ovqat' },
    { id: 'drinks', label: 'Ichimliklar' },
    { id: 'sweets', label: 'Shirinliklar' },
    { id: 'household', label: 'Xo\'jalik' }
];

// Vaqtinchalik galereya rasmlarini saqlash uchun
let tempGallery: string[] = [];
let tempMainImg: string = "";

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <button class="btn btn-primary" style="height:52px; padding:0 25px; font-size:0.85rem; border-radius:16px; box-shadow:0 8px 20px rgba(34,197,94,0.2);" onclick="openProductEditor()">
                <i class="fas fa-plus-circle"></i> YANGI MAHSULOT
            </button>
            <div style="width:300px; position:relative;">
                <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.9rem;"></i>
                <input type="text" id="skladSearchInput" placeholder="Mahsulot qidirish..." style="margin:0; height:52px; padding-left:48px; font-size:0.9rem; border-radius:16px; border:1.5px solid #e2e8f0; background:white;" oninput="searchSklad(this.value)">
            </div>
        </div>
        <div id="skladList"></div>
    `;
    loadAdminProducts();
}

async function loadAdminProducts(searchTerm = '') {
    const listEl = document.getElementById('skladList');
    if(!listEl) return;
    
    listEl.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-circle-notch fa-spin fa-3x" style="color:var(--primary); opacity:0.3;"></i></div>';
    
    let query = supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    const { data: prods, error } = await query;

    if(error) {
        listEl.innerHTML = `<div class="card" style="text-align:center; color:var(--danger); padding:3rem; font-weight:800;">Ulanishda xatolik!</div>`;
        return;
    }

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:24px; border:1.5px solid #f1f5f9; background:white; overflow:hidden; box-shadow:var(--shadow-sm);">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:1.5px solid #f1f5f9;">
                    <tr>
                        <th style="padding:18px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px;">Mahsulot</th>
                        <th style="padding:18px; text-align:left; color:#64748b; font-weight:800; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px;">Narx</th>
                        <th style="padding:18px; text-align:center; color:#64748b; font-weight:800; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px;">Amal</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f8fafc; transition:0.2s;" onmouseover="this.style.background='#fcfdfe'" onmouseout="this.style.background='transparent'">
                            <td style="padding:15px 18px;">
                                <div style="display:flex; align-items:center; gap:15px;">
                                    <div style="width:48px; height:48px; border-radius:12px; overflow:hidden; border:1px solid #f1f5f9; flex-shrink:0;">
                                        <img src="${p.image_url || p.images?.[0] || 'https://via.placeholder.com/100'}" style="width:100%; height:100%; object-fit:cover;">
                                    </div>
                                    <div>
                                        <div style="font-weight:900; color:var(--text); font-size:0.9rem;">${p.name}</div>
                                        <div style="font-size:0.7rem; color:#94a3b8; font-weight:700;">Zaxira: ${p.stock_qty || 0} ${p.unit}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding:18px;"><b style="color:var(--primary); font-size:0.95rem;">${p.price?.toLocaleString()}</b> <small style="font-size:0.6rem; opacity:0.6;">UZS</small></td>
                            <td style="padding:18px; text-align:center;">
                                <div style="display:flex; justify-content:center; gap:10px;">
                                    <button class="btn" style="width:36px; height:36px; padding:0; border-radius:10px; background:#eff6ff; color:#3b82f6; border:none;" onclick="openProductEditor(${p.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn" style="width:36px; height:36px; padding:0; border-radius:10px; background:#fee2e2; color:var(--danger); border:none;" onclick="deleteProduct(${p.id})"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                    ${!prods?.length ? `<tr><td colspan="3" style="padding:50px; text-align:center; color:#94a3b8; font-weight:700;">Mahsulotlar topilmadi</td></tr>` : ''}
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

    let p: any = { name: '', price: '', category: 'grocery', unit: 'dona', stock_qty: 10, image_url: '', images: [], video_url: '', description: '', marketing_tag: '' };
    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if(data) p = data;
    }

    tempMainImg = p.image_url || "";
    tempGallery = p.images || [];

    placeholder.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text);"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">${id ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
            </div>

            <!-- MEDIA SECTION -->
            <div class="card" style="padding:25px; border-radius:28px; border:1.5px solid #f1f5f9; background:white; margin-bottom:20px;">
                <label style="font-size:0.75rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:15px; display:block;">Asosiy rasm</label>
                
                <div style="position:relative; width:150px; height:150px; margin-bottom:25px;">
                    <div style="width:100%; height:100%; border-radius:22px; background:#f8fafc; border:2px dashed #e2e8f0; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        <img id="pEditMainPreview" src="${tempMainImg || 'https://via.placeholder.com/150?text=Rasm+yoq'}" style="width:100%; height:100%; object-fit:cover; display:${tempMainImg ? 'block' : 'none'};">
                        <i id="pEditMainIcon" class="fas fa-image" style="font-size:2rem; color:#cbd5e1; display:${tempMainImg ? 'none' : 'block'};"></i>
                    </div>
                    <label for="pMainInput" style="position:absolute; bottom:-10px; right:-10px; width:44px; height:44px; border-radius:15px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; border:3.5px solid white; box-shadow:var(--shadow-sm);">
                        <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" id="pMainInput" accept="image/*" style="display:none;" onchange="uploadProductMainImg(this)">
                </div>

                <label style="font-size:0.75rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:15px; display:block;">Galereya (Qo'shimcha rasmlar)</label>
                <div id="pGalleryList" style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:15px;">
                    ${tempGallery.map((img, idx) => `
                        <div style="position:relative; width:80px; height:80px; border-radius:15px; overflow:hidden; border:1px solid #f1f5f9;">
                            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                            <div style="position:absolute; top:4px; right:4px; width:22px; height:22px; background:var(--danger); color:white; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.6rem;" onclick="removeFromGallery(${idx})">
                                <i class="fas fa-times"></i>
                            </div>
                        </div>
                    `).join('')}
                    
                    <label for="pGalleryInput" style="width:80px; height:80px; border-radius:15px; background:#f8fafc; border:2px dashed #e2e8f0; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; gap:5px;">
                        <i class="fas fa-plus" style="color:#94a3b8;"></i>
                        <span style="font-size:0.5rem; font-weight:800; color:#94a3b8;">QO'SHISH</span>
                        <input type="file" id="pGalleryInput" accept="image/*" multiple style="display:none;" onchange="uploadToProductGallery(this)">
                    </label>
                </div>
            </div>

            <!-- INFO SECTION -->
            <div class="card" style="padding:25px; border-radius:28px; border:1.5px solid #f1f5f9; background:white;">
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Mahsulot nomi</label>
                    <input type="text" id="p_name" value="${p.name}" placeholder="Masalan: Pepsi 1.5L" style="height:62px; font-weight:700;">
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div>
                        <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Narxi (UZS)</label>
                        <input type="number" id="p_price" value="${p.price}" style="height:62px; font-weight:700;">
                    </div>
                    <div>
                        <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Kategoriya</label>
                        <select id="p_cat" style="height:62px; font-weight:700;">
                            ${CATEGORIES.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div>
                        <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">O'lchov birligi</label>
                        <input type="text" id="p_unit" value="${p.unit}" placeholder="dona, kg" style="height:62px; font-weight:700;">
                    </div>
                    <div>
                        <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Skladdagi miqdor</label>
                        <input type="number" id="p_stock" value="${p.stock_qty}" style="height:62px; font-weight:700;">
                    </div>
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Marketing tegi (Masalan: CHEGIRMA)</label>
                    <input type="text" id="p_tag" value="${p.marketing_tag || ''}" placeholder="New, Sale, Top..." style="height:62px; font-weight:700;">
                </div>

                <div style="margin-bottom:25px;">
                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; display:block; margin-bottom:8px;">Batafsil tavsif</label>
                    <textarea id="p_desc" style="height:120px; padding:18px; border-radius:18px; font-weight:600; font-size:0.9rem;">${p.description || ''}</textarea>
                </div>

                <button class="btn btn-primary" id="btnSaveP" style="width:100%; height:65px; border-radius:24px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.25);" onclick="saveAdminProduct(${id || 'null'})">
                    ${id ? 'O\'ZGARISHLARNI SAQLASH' : 'MAHSULOTNI QO\'SHISH'}
                </button>
            </div>
        </div>
    `;
};

// --- IMAGE UPLOAD LOGIC ---

(window as any).uploadProductMainImg = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    
    showToast("Rasm yuklanmoqda...");
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `main_${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage.from('products').upload(filePath, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        
        tempMainImg = publicUrl;
        const preview = document.getElementById('pEditMainPreview') as HTMLImageElement;
        const icon = document.getElementById('pEditMainIcon');
        if(preview) { preview.src = publicUrl; preview.style.display = 'block'; }
        if(icon) icon.style.display = 'none';
        
        showToast("Asosiy rasm yuklandi! ✅");
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
};

(window as any).uploadToProductGallery = async (input: HTMLInputElement) => {
    const files = input.files;
    if(!files || files.length === 0) return;

    showToast("Galereya yangilanmoqda...");
    const galleryContainer = document.getElementById('pGalleryList');

    for (const file of Array.from(files)) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `gal_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/gallery/${fileName}`;

            const { error } = await supabase.storage.from('products').upload(filePath, file);
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
            tempGallery.push(publicUrl);
        } catch(e) {
            console.error(e);
        }
    }

    // Galereyani qayta chizish
    if(galleryContainer) {
        const addBtn = galleryContainer.lastElementChild;
        galleryContainer.innerHTML = tempGallery.map((img, idx) => `
            <div style="position:relative; width:80px; height:80px; border-radius:15px; overflow:hidden; border:1px solid #f1f5f9;">
                <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                <div style="position:absolute; top:4px; right:4px; width:22px; height:22px; background:var(--danger); color:white; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.6rem;" onclick="removeFromGallery(${idx})">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `).join('') + addBtn?.outerHTML;
    }
    showToast("Galereya yuklandi! ✨");
};

(window as any).removeFromGallery = (idx: number) => {
    tempGallery.splice(idx, 1);
    const galleryContainer = document.getElementById('pGalleryList');
    if(galleryContainer) {
        const addBtn = galleryContainer.lastElementChild;
        galleryContainer.innerHTML = tempGallery.map((img, i) => `
            <div style="position:relative; width:80px; height:80px; border-radius:15px; overflow:hidden; border:1px solid #f1f5f9;">
                <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                <div style="position:absolute; top:4px; right:4px; width:22px; height:22px; background:var(--danger); color:white; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.6rem;" onclick="removeFromGallery(${i})">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `).join('') + addBtn?.outerHTML;
    }
};

(window as any).saveAdminProduct = async (id: any) => {
    const btn = document.getElementById('btnSaveP') as HTMLButtonElement;
    const name = (document.getElementById('p_name') as HTMLInputElement).value.trim();
    const price = Number((document.getElementById('p_price') as HTMLInputElement).value);
    const category = (document.getElementById('p_cat') as HTMLSelectElement).value;
    const unit = (document.getElementById('p_unit') as HTMLInputElement).value.trim();
    const stock_qty = Number((document.getElementById('p_stock') as HTMLInputElement).value);
    const marketing_tag = (document.getElementById('p_tag') as HTMLInputElement).value.trim();
    const description = (document.getElementById('p_desc') as HTMLTextAreaElement).value.trim();

    if(!name || !price || !tempMainImg) return showToast("Nom, narx va asosiy rasm majburiy!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> SAQLANMOQDA...';

    const data = {
        name,
        price,
        category,
        unit,
        stock_qty,
        image_url: tempMainImg,
        images: tempGallery,
        marketing_tag,
        description,
        is_archived: false
    };

    try {
        const { error } = id ? await supabase.from('products').update(data).eq('id', id) : await supabase.from('products').insert(data);
        
        if(!error) {
            showToast("Muvaffaqiyatli saqlandi! ✨");
            closeOverlay('checkoutOverlay');
            renderAdminInventory();
        } else throw error;
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "QAYTA URINISH";
    }
};

(window as any).deleteProduct = async (id: number) => {
    if(confirm("Mahsulotni o'chirmoqchimisiz?")) {
        const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
        if(!error) { showToast("O'chirildi"); loadAdminProducts(); }
    }
};
