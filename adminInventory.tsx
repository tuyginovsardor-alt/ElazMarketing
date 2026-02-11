
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'all', label: 'Hamma kategoriyalar', icon: 'fa-layer-group' },
    { id: 'grocery', label: 'Oziq-ovqat', icon: 'fa-apple-whole' },
    { id: 'drinks', label: 'Ichimliklar', icon: 'fa-bottle-water' },
    { id: 'sweets', label: 'Shirinliklar', icon: 'fa-cookie' },
    { id: 'household', label: 'Xo\'jalik', icon: 'fa-house-chimney' }
];

let currentEditingImages: string[] = [];
let activeEditorTab = 'general';
let currentSkladFilter = 'active'; // active, archived, all
let currentCatFilter = 'all';

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out;">
            <!-- SKLAD STATS -->
            <div id="skladStats" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px; margin-bottom:25px;">
                <div class="card" style="padding:15px; border-radius:20px; background:white; border:none; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f0fdf4; color:#16a34a; display:flex; align-items:center; justify-content:center;"><i class="fas fa-boxes-stacked"></i></div>
                    <div><p style="font-size:0.6rem; color:var(--gray); font-weight:800;">JAMI TUR</p><h4 id="st_total" style="font-weight:900;">...</h4></div>
                </div>
                <div class="card" style="padding:15px; border-radius:20px; background:white; border:none; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#fff7ed; color:#ea580c; display:flex; align-items:center; justify-content:center;"><i class="fas fa-triangle-exclamation"></i></div>
                    <div><p style="font-size:0.6rem; color:var(--gray); font-weight:800;">KAM QOLGAN</p><h4 id="st_low" style="font-weight:900;">...</h4></div>
                </div>
                <div class="card" style="padding:15px; border-radius:20px; background:white; border:none; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center;"><i class="fas fa-money-bill-trend-up"></i></div>
                    <div><p style="font-size:0.6rem; color:var(--gray); font-weight:800;">SKLAD QIYMATI</p><h4 id="st_val" style="font-weight:900;">...</h4></div>
                </div>
            </div>

            <!-- FILTERS & ACTIONS -->
            <div style="background:white; padding:20px; border-radius:25px; margin-bottom:25px; box-shadow:var(--shadow-sm); border:1.5px solid #f1f5f9;">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:15px;">
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="height:50px; padding:0 20px; font-size:0.8rem; border-radius:14px; background:var(--gradient);" onclick="openProductEditor()">
                            <i class="fas fa-plus-circle"></i> YANGI QO'SHISH
                        </button>
                        <select id="invStatusFilter" style="height:50px; width:150px; margin:0; font-size:0.8rem; border-radius:14px;" onchange="window.changeInvFilter('status', this.value)">
                            <option value="active">FAOL</option>
                            <option value="archived">ARXIVLANGAN</option>
                            <option value="all">HAMMASI</option>
                        </select>
                        <select id="invCatFilter" style="height:50px; width:180px; margin:0; font-size:0.8rem; border-radius:14px;" onchange="window.changeInvFilter('cat', this.value)">
                            ${CATEGORIES.map(c => `<option value="${c.id}">${c.label.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="flex:1; max-width:350px; position:relative;">
                        <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.9rem;"></i>
                        <input type="text" id="skladSearchInput" placeholder="Nomi yoki ID orqali qidirish..." style="margin:0; height:50px; padding-left:48px; font-size:0.85rem; border-radius:14px;" oninput="window.searchSklad(this.value)">
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
    
    listEl.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    let query = supabase.from('products').select('*');

    // Filterlar
    if(currentSkladFilter === 'active') query = query.eq('is_archived', false);
    else if(currentSkladFilter === 'archived') query = query.eq('is_archived', true);
    
    if(currentCatFilter !== 'all') query = query.eq('category', currentCatFilter);
    
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    
    query = query.order('created_at', { ascending: false });

    const { data: prods, error } = await query;

    if(error) {
        listEl.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--danger);">Ma'lumotlarni yuklab bo'lmadi</div>`;
        return;
    }

    // Stats hisoblash
    const totalItems = prods?.length || 0;
    const lowStock = prods?.filter(p => p.stock < 10).length || 0;
    const totalValue = prods?.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0) || 0;

    document.getElementById('st_total')!.innerText = totalItems.toString();
    document.getElementById('st_low')!.innerText = lowStock.toString();
    document.getElementById('st_val')!.innerText = totalValue.toLocaleString() + " UZS";

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:30px; background:white; overflow:hidden; border:2.5px solid #f1f5f9; box-shadow:var(--shadow-sm);">
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:800px;">
                    <thead style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                        <tr>
                            <th style="padding:18px; text-align:left; color:#64748b; font-weight:900; font-size:0.6rem; text-transform:uppercase; letter-spacing:1px;">Mahsulot</th>
                            <th style="padding:18px; text-align:left; color:#64748b; font-weight:900; font-size:0.6rem; text-transform:uppercase; letter-spacing:1px;">Zaxira</th>
                            <th style="padding:18px; text-align:left; color:#64748b; font-weight:900; font-size:0.6rem; text-transform:uppercase; letter-spacing:1px;">Narx</th>
                            <th style="padding:18px; text-align:center; color:#64748b; font-weight:900; font-size:0.6rem; text-transform:uppercase; letter-spacing:1px;">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prods?.map(p => `
                            <tr style="border-bottom:1px solid #f8fafc; transition:0.2s; opacity: ${p.is_archived ? '0.6' : '1'}">
                                <td style="padding:15px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div style="width:55px; height:55px; border-radius:14px; overflow:hidden; border:1px solid #f1f5f9; background:#f8fafc; flex-shrink:0;">
                                            <img src="${p.image_url}" style="width:100%; height:100%; object-fit:cover;">
                                        </div>
                                        <div>
                                            <div style="font-weight:900; color:var(--text); font-size:0.9rem;">${p.name}</div>
                                            <div style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase;">${p.category} • ${p.unit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:15px;">
                                    <div style="display:flex; flex-direction:column; gap:4px;">
                                        <b style="font-size:1rem; color: ${p.stock < 10 ? 'var(--danger)' : 'var(--text)'}">${p.stock}</b>
                                        <div style="width:100px; height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
                                            <div style="width:${Math.min(100, p.stock)}%; height:100%; background:${p.stock < 10 ? 'var(--danger)' : 'var(--primary)'}; border-radius:10px;"></div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:15px;">
                                    <div style="font-weight:900; color:var(--primary); font-size:0.95rem;">${p.price.toLocaleString()}</div>
                                    ${p.discount ? `<div style="font-size:0.6rem; color:var(--danger); font-weight:800;">CHEGIRMA: -${p.discount}%</div>` : ''}
                                </td>
                                <td style="padding:15px; text-align:center;">
                                    <div style="display:flex; justify-content:center; gap:8px;">
                                        <button class="btn" style="width:38px; height:38px; border-radius:10px; background:#eff6ff; color:#3b82f6; border:none;" onclick="openProductEditor(${p.id})" title="Tahrirlash"><i class="fas fa-pen"></i></button>
                                        <button class="btn" style="width:38px; height:38px; border-radius:10px; background:${p.is_archived ? '#f0fdf4' : '#fff7ed'}; color:${p.is_archived ? '#16a34a' : '#ea580c'}; border:none;" onclick="window.archiveAdminProduct(${p.id}, ${p.is_archived})" title="${p.is_archived ? 'Qayta tiklash' : 'Arxivlash'}"><i class="fas ${p.is_archived ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                                        <button class="btn" style="width:38px; height:38px; border-radius:10px; background:#fef2f2; color:var(--danger); border:none;" onclick="window.deleteAdminProduct(${p.id})" title="Butunlay o'chirish"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${!prods?.length ? `<div style="padding:4rem; text-align:center; color:var(--gray); font-weight:800;">Mahsulot topilmadi</div>` : ''}
        </div>
    `;
}

(window as any).changeInvFilter = (type: string, val: string) => {
    if(type === 'status') currentSkladFilter = val;
    if(type === 'cat') currentCatFilter = val;
    loadAdminProducts();
};

(window as any).archiveAdminProduct = async (id: number, current: boolean) => {
    if(!confirm(current ? "Mahsulotni faollashtirasizmi?" : "Mahsulotni arxivga olasizmi? Ilovada ko'rinmaydi.")) return;
    
    const { error } = await supabase.from('products').update({ is_archived: !current }).eq('id', id);
    if(!error) {
        showToast(current ? "Qayta tiklandi!" : "Arxivlandi!");
        loadAdminProducts();
    } else showToast("Xato!");
};

(window as any).deleteAdminProduct = async (id: number) => {
    if(!confirm("Diqqat! Mahsulot bazadan butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi!")) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(!error) {
        showToast("Butunlay o'chirildi!");
        loadAdminProducts();
    } else showToast("Xato: " + error.message);
};

(window as any).openProductEditor = async (id?: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `<div style="text-align:center; padding:10rem;"><i class="fas fa-spinner fa-spin fa-3x" style="color:var(--primary);"></i></div>`;

    let p: any = { name: '', price: '', category: 'grocery', unit: 'dona', image_url: '', description: '', images: [], stock: 100, discount: 0 };
    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if(data) p = data;
    }

    currentEditingImages = p.images || [];
    activeEditorTab = 'general';

    const renderEditorContent = () => {
        placeholder.innerHTML = `
            <div style="padding-bottom:120px; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:100; padding:15px 0; border-bottom:2px solid #f8fafc;">
                    <div onclick="closeOverlay('checkoutOverlay')" style="width:45px; height:45px; border-radius:15px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; cursor:pointer;"><i class="fas fa-chevron-left"></i></div>
                    <h2 style="font-weight:900; font-size:1.4rem; letter-spacing:-0.5px;">${id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h2>
                </div>

                <!-- TABS -->
                <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:18px; margin-bottom:25px; gap:5px;">
                    <button onclick="window.switchEditorTab('general')" style="flex:1; height:42px; border-radius:14px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s; background:${activeEditorTab === 'general' ? 'white' : 'transparent'}; color:${activeEditorTab === 'general' ? 'var(--primary)' : 'var(--gray)'}; box-shadow:${activeEditorTab === 'general' ? 'var(--shadow-sm)' : 'none'};">ASOSIY</button>
                    <button onclick="window.switchEditorTab('media')" style="flex:1; height:42px; border-radius:14px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s; background:${activeEditorTab === 'media' ? 'white' : 'transparent'}; color:${activeEditorTab === 'media' ? 'var(--primary)' : 'var(--gray)'}; box-shadow:${activeEditorTab === 'media' ? 'var(--shadow-sm)' : 'none'};">RASMLAR</button>
                    <button onclick="window.switchEditorTab('stock')" style="flex:1; height:42px; border-radius:14px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s; background:${activeEditorTab === 'stock' ? 'white' : 'transparent'}; color:${activeEditorTab === 'stock' ? 'var(--primary)' : 'var(--gray)'}; box-shadow:${activeEditorTab === 'stock' ? 'var(--shadow-sm)' : 'none'};">OMBOR</button>
                </div>

                <div id="editorTabBody" style="min-height:400px;">
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
                                    <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">O'lchov birligi *</label>
                                    <input type="text" id="p_unit" value="${p.unit}" placeholder="kg, dona, litr" style="height:60px; font-size:1rem; border-radius:18px;">
                                </div>
                            </div>

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block; margin-top:10px;">Kategoriya *</label>
                            <select id="p_cat" style="height:60px; border-radius:18px; background-image:none;">
                                ${CATEGORIES.filter(c => c.id !== 'all').map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                            </select>

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block; margin-top:10px;">Batafsil tavsif</label>
                            <textarea id="p_desc" placeholder="Mahsulot haqida ko'proq ma'lumot bering..." style="height:150px; border-radius:18px; padding:20px;">${p.description || ''}</textarea>
                        </div>
                    ` : ''}

                    ${activeEditorTab === 'media' ? `
                        <div class="card" style="border-radius:28px; padding:25px; border:2px solid #f1f5f9; background:white;">
                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:15px; display:block;">Asosiy rasm (Muqova)</label>
                            <div style="display:flex; gap:15px; align-items:center; margin-bottom:30px;">
                                <div id="mainImgPreview" style="width:120px; height:120px; border-radius:24px; background:#f8fafc; border:2px dashed #cbd5e1; overflow:hidden; display:flex; align-items:center; justify-content:center; position:relative;">
                                    ${p.image_url ? `<img src="${p.image_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-image fa-2x" style="color:#cbd5e1;"></i>`}
                                </div>
                                <div style="flex:1;">
                                    <input type="text" id="p_img" value="${p.image_url}" placeholder="Rasm URL manzili" style="height:50px; font-size:0.8rem; margin-bottom:10px; border-radius:12px;">
                                    <label class="btn btn-outline" style="height:50px; border-radius:12px; cursor:pointer; font-size:0.8rem; border-color:var(--primary); color:var(--primary);">
                                        <input type="file" style="display:none;" onchange="window.uploadProdImageToUrl(this, 'p_img')">
                                        <i class="fas fa-cloud-arrow-up"></i> RASM YUKLASH
                                    </label>
                                </div>
                            </div>

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:15px; display:block;">Qo'shimcha rasmlar (Galereya)</label>
                            <div id="additionalImagesCont" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
                                ${currentEditingImages.map((img, i) => `
                                    <div style="position:relative; aspect-ratio:1/1; border-radius:18px; overflow:hidden; border:2px solid #f1f5f9; box-shadow:var(--shadow-sm);">
                                        <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                                        <button onclick="window.removeEditorImg(${i})" style="position:absolute; top:5px; right:5px; width:28px; height:28px; border-radius:8px; background:rgba(239,68,68,0.9); color:white; border:none; cursor:pointer;"><i class="fas fa-times"></i></button>
                                    </div>
                                `).join('')}
                                <label class="btn btn-outline" style="aspect-ratio:1/1; height:auto; border-radius:18px; border:2px dashed #cbd5e1; background:#f8fafc; color:var(--gray); cursor:pointer; display:flex; flex-direction:column; gap:8px; font-size:0.7rem; justify-content:center;">
                                    <input type="file" style="display:none;" onchange="window.uploadProdImageToGallery(this)">
                                    <i class="fas fa-plus-circle fa-2x"></i>
                                    <span>QO'SHISH</span>
                                </label>
                            </div>
                        </div>
                    ` : ''}

                    ${activeEditorTab === 'stock' ? `
                        <div class="card" style="border-radius:28px; padding:25px; border:2px solid #f1f5f9; background:white;">
                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">Ombordagi miqdor</label>
                            <input type="number" id="p_stock" value="${p.stock || 0}" placeholder="Masalan: 50" style="height:60px; font-size:1rem; border-radius:18px; margin-bottom:20px;">

                            <label style="font-size:0.7rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:block;">Chegirma foizi (%)</label>
                            <input type="number" id="p_discount" value="${p.discount || 0}" placeholder="Masalan: 10" style="height:60px; font-size:1rem; border-radius:18px;">
                        </div>
                    ` : ''}
                </div>

                <div style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); padding:20px; z-index:1000; border-top:1px solid #f1f5f9; display:flex; gap:10px;">
                    ${id ? `<button class="btn btn-outline" style="flex:0.5; border-color:var(--danger); color:var(--danger); border-radius:20px;" onclick="window.deleteAdminProduct(${id}).then(() => closeOverlay('checkoutOverlay'))"><i class="fas fa-trash"></i></button>` : ''}
                    <button class="btn btn-primary" id="btnSaveProd" style="flex:1; height:65px; border-radius:20px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="window.saveAdminProduct(${id || 'null'})">
                        SAQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
                    </button>
                </div>
            </div>
        `;
    };

    (window as any).switchEditorTab = (tab: string) => {
        activeEditorTab = tab;
        renderEditorContent();
    };

    renderEditorContent();
};

(window as any).uploadProdImageToUrl = async (input: HTMLInputElement, targetId: string) => {
    const file = input.files?.[0];
    if(!file) return;
    showToast("Rasm yuklanmoqda...");
    const fileName = `main_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    if(error) return showToast("Yuklashda xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
    (document.getElementById(targetId) as HTMLInputElement).value = publicUrl;
    
    const preview = document.getElementById('mainImgPreview');
    if(preview) preview.innerHTML = `<img src="${publicUrl}" style="width:100%; height:100%; object-fit:cover;">`;
    showToast("Asosiy rasm tayyor!");
};

(window as any).uploadProdImageToGallery = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    showToast("Galereyaga yuklanmoqda...");
    const fileName = `gal_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('products').upload(`items/${fileName}`, file);
    if(error) return showToast("Xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`items/${fileName}`);
    currentEditingImages.push(publicUrl);
    (window as any).switchEditorTab('media');
    showToast("Galereyaga qo'shildi!");
};

(window as any).removeEditorImg = (idx: number) => {
    currentEditingImages.splice(idx, 1);
    (window as any).switchEditorTab('media');
};

(window as any).saveAdminProduct = async (id: any) => {
    const btn = document.getElementById('btnSaveProd') as HTMLButtonElement;
    const p_name = (document.getElementById('p_name') as HTMLInputElement)?.value.trim();
    const p_price = Number((document.getElementById('p_price') as HTMLInputElement)?.value);
    
    if(!p_name || !p_price) return showToast("Majburiy maydonlarni to'ldiring!");

    const data = {
        name: p_name,
        price: p_price,
        category: (document.getElementById('p_cat') as HTMLSelectElement).value,
        unit: (document.getElementById('p_unit') as HTMLInputElement).value.trim(),
        description: (document.getElementById('p_desc') as HTMLTextAreaElement).value.trim(),
        image_url: (document.getElementById('p_img') as HTMLInputElement).value.trim(),
        images: currentEditingImages,
        stock: Number((document.getElementById('p_stock') as HTMLInputElement)?.value || 0),
        discount: Number((document.getElementById('p_discount') as HTMLInputElement)?.value || 0)
    };

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> SAQLANMOQDA...';

    const { error } = id ? await supabase.from('products').update(data).eq('id', id) : await supabase.from('products').insert({ ...data, is_archived: false });
    
    if(!error) { 
        showToast("Muvaffaqiyatli saqlandi! ✨"); 
        closeOverlay('checkoutOverlay'); 
        renderAdminInventory(); 
    } else {
        showToast("Xato: " + error.message);
        btn.disabled = false;
        btn.innerText = "SAQLASH";
    }
};

(window as any).searchSklad = (val: string) => {
    loadAdminProducts(val.trim());
};
