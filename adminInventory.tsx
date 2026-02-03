
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

let editingProductId: number | null = null;
let currentImages: string[] = [];

export async function renderAdminInventory() {
    const container = document.getElementById('admin_tab_inv');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <button class="btn btn-primary" style="height:50px; padding:0 30px;" onclick="openProductEditor()">
                <i class="fas fa-plus-circle"></i> YANGI MAHSULOT
            </button>
            <div style="width:350px; position:relative;">
                <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--gray);"></i>
                <input type="text" id="skladSearchInput" placeholder="Skladni qidirish..." style="margin:0; height:50px; padding-left:50px;" oninput="searchSklad(this.value)">
            </div>
        </div>
        <div id="skladList"></div>
    `;
    loadAdminProducts();
}

async function loadAdminProducts(searchTerm = '') {
    const listEl = document.getElementById('skladList')!;
    listEl.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    let query = supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    const { data: prods, error } = await query;

    if(error) {
        listEl.innerHTML = `<div style="text-align:center; color:var(--danger); padding:2rem;">Xatolik: ${error.message}</div>`;
        return;
    }

    listEl.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Media</th>
                    <th>Nomi</th>
                    <th>Narxi</th>
                    <th>Sklad</th>
                    <th>Amal</th>
                </tr>
            </thead>
            <tbody>
                ${prods?.map(p => {
                    const imgs = Array.isArray(p.images) ? p.images : [];
                    const mainImg = imgs.length > 0 ? imgs[0] : (p.image_url || '');
                    return `
                    <tr>
                        <td>
                            <div style="width:55px; height:55px; border-radius:14px; background:#f1f5f9; overflow:hidden; border:1px solid #eee; display:flex; align-items:center; justify-content:center;">
                                ${mainImg ? `<img src="${mainImg}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-image" style="opacity:0.2;"></i>`}
                            </div>
                        </td>
                        <td>
                            <div style="font-weight:800; color:var(--text);">${p.name}</div>
                            <div style="font-size:0.65rem; color:var(--gray); font-weight:600; text-transform:uppercase;">${p.brand || 'No Brand'} • ${p.category}</div>
                        </td>
                        <td><b style="color:var(--primary);">${p.price?.toLocaleString()}</b></td>
                        <td><span style="font-weight:700;">${p.stock_qty}</span> <small>${p.unit}</small></td>
                        <td>
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-outline" style="width:36px; height:36px; padding:0; border-radius:10px;" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-outline" style="width:36px; height:36px; padding:0; border-radius:10px; color:var(--danger);" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    `;
}

(window as any).openProductEditor = async (productId = null) => {
    editingProductId = productId;
    currentImages = [];
    const placeholder = document.getElementById('productEditorPlaceholder');
    if(!placeholder) return;

    let initialData = { name: '', brand: '', category: 'grocery', description: '', price: 0, stock_qty: 100, unit: 'dona', marketing_tag: '', images: [], video_url: '' };
    
    if(productId) {
        const { data } = await supabase.from('products').select('*').eq('id', productId).single();
        if(data) {
            initialData = data;
            currentImages = Array.isArray(data.images) ? data.images : (data.image_url ? [data.image_url] : []);
        }
    }

    placeholder.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:20px;">
            <h1 style="font-weight:900; font-size:1.6rem;">${productId ? 'Tahrirlash' : 'Yangi Mahsulot'}</h1>
            <i class="fas fa-times" style="cursor:pointer; font-size:1.5rem; color:var(--gray);" onclick="closeOverlay('productEditorOverlay')"></i>
        </div>

        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:35px;">
            <div>
                <label>Mahsulot nomi *</label>
                <input type="text" id="adv_name" value="${initialData.name}" placeholder="Masalan: Coca-Cola 1.5L">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div><label>Brend</label><input type="text" id="adv_brand" value="${initialData.brand || ''}" placeholder="Brend nomi"></div>
                    <div>
                        <label>Kategoriya</label>
                        <select id="adv_category">
                            <option value="grocery" ${initialData.category === 'grocery' ? 'selected' : ''}>Oziq-ovqat</option>
                            <option value="drinks" ${initialData.category === 'drinks' ? 'selected' : ''}>Ichimliklar</option>
                            <option value="sweets" ${initialData.category === 'sweets' ? 'selected' : ''}>Shirinliklar</option>
                            <option value="household" ${initialData.category === 'household' ? 'selected' : ''}>Xo'jalik</option>
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div><label>Narxi (UZS)</label><input type="number" id="adv_price" value="${initialData.price}"></div>
                    <div><label>Sklad qoldig'i</label><input type="number" id="adv_stock" value="${initialData.stock_qty}"></div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div>
                        <label>O'lchov birligi</label>
                        <select id="adv_unit">
                            <option value="dona" ${initialData.unit === 'dona' ? 'selected' : ''}>Dona</option>
                            <option value="kg" ${initialData.unit === 'kg' ? 'selected' : ''}>Kilogram (kg)</option>
                            <option value="litr" ${initialData.unit === 'litr' ? 'selected' : ''}>Litr (l)</option>
                            <option value="quti" ${initialData.unit === 'quti' ? 'selected' : ''}>Quti</option>
                        </select>
                    </div>
                    <div>
                        <label>Marketing Tag</label>
                        <select id="adv_tag">
                            <option value="" ${initialData.marketing_tag === '' ? 'selected' : ''}>Yo'q</option>
                            <option value="NEW" ${initialData.marketing_tag === 'NEW' ? 'selected' : ''}>YANGI</option>
                            <option value="HOT" ${initialData.marketing_tag === 'HOT' ? 'selected' : ''}>HOT (Qaynoq)</option>
                            <option value="SALE" ${initialData.marketing_tag === 'SALE' ? 'selected' : ''}>SALE</option>
                        </select>
                    </div>
                </div>

                <label>Tavsif</label>
                <textarea id="adv_desc" style="height:100px;">${initialData.description || ''}</textarea>
            </div>

            <div>
                <h4 style="margin-bottom:15px; font-weight:800;">Media Galereya (Max 6)</h4>
                <div id="adminGalleryGrid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-bottom:15px;">
                    <!-- Images here -->
                </div>

                <div style="position:relative; width:100%; height:100px; border:2px dashed #cbd5e1; border-radius:18px; background:#f8fafc; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden;">
                    <input type="file" multiple accept="image/*" style="position:absolute; inset:0; opacity:0; cursor:pointer;" onchange="handleAdminMediaUpload(this, 'image')">
                    <div style="text-align:center; color:var(--gray);">
                        <i class="fas fa-plus-circle fa-lg"></i>
                        <p style="font-size:0.7rem; margin-top:5px; font-weight:700;">Rasm yuklash</p>
                    </div>
                </div>

                <label style="margin-top:25px;">Video Havolasi yoki Yuklash</label>
                <input type="text" id="adv_video_url" value="${initialData.video_url || ''}" placeholder="YouTube yoki MP4 URL">
                <div style="position:relative; width:100%; height:60px; border:2px dashed #cbd5e1; border-radius:14px; background:#f8fafc; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden;">
                    <input type="file" accept="video/*" style="position:absolute; inset:0; opacity:0; cursor:pointer;" onchange="handleAdminMediaUpload(this, 'video')">
                    <div id="videoStat" style="text-align:center; color:var(--gray); font-weight:700;">
                        <i class="fas fa-video"></i> <span style="font-size:0.7rem;">Video fayl tanlash</span>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnSaveFull" style="width:100%; height:65px; margin-top:30px; border-radius:20px; font-size:1.1rem;" onclick="saveProductWithMedia()">
                    <i class="fas fa-save"></i> SAQLASH
                </button>
            </div>
        </div>
    `;

    renderAdminGallery();
    openOverlay('productEditorOverlay');
};

function renderAdminGallery() {
    const grid = document.getElementById('adminGalleryGrid');
    if(!grid) return;
    grid.innerHTML = currentImages.map((img, idx) => `
        <div style="position:relative; width:100%; aspect-ratio:1/1; border-radius:12px; overflow:hidden; border:1px solid #eee;">
            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
            <div style="position:absolute; top:4px; right:4px; width:22px; height:22px; background:rgba(239,68,68,0.9); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.6rem;" onclick="removeAdminImage(${idx})">
                <i class="fas fa-times"></i>
            </div>
        </div>
    `).join('');
}

(window as any).removeAdminImage = (idx: number) => {
    currentImages.splice(idx, 1);
    renderAdminGallery();
};

(window as any).handleAdminMediaUpload = async (input: HTMLInputElement, type: 'image' | 'video') => {
    const files = input.files;
    if(!files || files.length === 0) return;

    showToast("Yuklanmoqda...");
    const statusEl = document.getElementById('videoStat');

    for(let i=0; i<files.length; i++) {
        if(type === 'image' && currentImages.length >= 6) {
            showToast("Maksimal 6 ta rasm yuklash mumkin");
            break;
        }

        try {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error } = await supabase.storage.from('products').upload(filePath, file);
            
            if(error) {
                if(error.message.includes("row-level security")) {
                    alert("STORAGE XATOSI: Sizga rasm yuklashga ruxsat yo'q. SQL Editor'da Storage Policy kodlarini ishga tushiring.");
                }
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);

            if(type === 'image') {
                currentImages.push(publicUrl);
                renderAdminGallery();
            } else {
                (document.getElementById('adv_video_url') as HTMLInputElement).value = publicUrl;
                if(statusEl) statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:var(--primary);"></i> Video tayyor!';
            }
        } catch (e: any) {
            showToast("Yuklashda xato: " + e.message);
            console.error(e);
        }
    }
    input.value = '';
};

(window as any).saveProductWithMedia = async () => {
    const btn = document.getElementById('btnSaveFull') as HTMLButtonElement;
    const name = (document.getElementById('adv_name') as HTMLInputElement).value.trim();
    const brand = (document.getElementById('adv_brand') as HTMLInputElement).value.trim();
    const price = parseFloat((document.getElementById('adv_price') as HTMLInputElement).value) || 0;
    const stock = parseInt((document.getElementById('adv_stock') as HTMLInputElement).value) || 0;
    const category = (document.getElementById('adv_category') as HTMLSelectElement).value;
    const unit = (document.getElementById('adv_unit') as HTMLSelectElement).value;
    const tag = (document.getElementById('adv_tag') as HTMLSelectElement).value;
    const video = (document.getElementById('adv_video_url') as HTMLInputElement).value.trim();
    const desc = (document.getElementById('adv_desc') as HTMLTextAreaElement).value.trim();

    if(!name || price <= 0) return showToast("Nomi va narxini to'ldiring");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAQLANMOQDA...';

    // Ustunlar bazada borligiga ishonch hosil qilish uchun pData tuzilishi
    const pData: any = {
        name,
        brand,
        category,
        description: desc,
        price,
        stock_qty: stock,
        unit,
        marketing_tag: tag,
        images: currentImages,
        video_url: video,
        is_archived: false,
        image_url: currentImages[0] || ''
    };

    try {
        let err;
        if(editingProductId) {
            const { error } = await supabase.from('products').update(pData).eq('id', editingProductId);
            err = error;
        } else {
            const { error } = await supabase.from('products').insert([pData]);
            err = error;
        }

        if(err) {
            console.error("Supabase Save Error:", err);
            if(err.message.includes("column") || err.message.includes("schema cache")) {
                alert("BAZA XATOSI: Bazada ba'zi ustunlar yetishmayapti. Iltimos, SQL kodini qaytadan RUN qiling.");
            } else if(err.message.includes("row-level security")) {
                alert("RUHSAT XATOSI: Sizning profilingizda admin roli yo'q.");
            }
            throw err;
        }

        showToast("Saqlandi! ✨");
        closeOverlay('productEditorOverlay');
        loadAdminProducts();
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> SAQLASH';
    }
};

(window as any).editProduct = (id: number) => (window as any).openProductEditor(id);
(window as any).deleteProduct = async (id: number) => {
    if(confirm("Haqiqatan ham o'chirilsinmi?")) {
        const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
        if(error) showToast("Xato: " + error.message);
        else loadAdminProducts();
    }
};

(window as any).searchSklad = (val: string) => {
    loadAdminProducts(val);
};
