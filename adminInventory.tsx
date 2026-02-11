
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
let currentStep = 1;

// --- GLOBAL FUNCTIONS ---
(window as any).changeInvFilter = (type: string, val: string) => {
    if(type === 'status') currentSkladFilter = val;
    if(type === 'cat') currentCatFilter = val;
    loadAdminProducts();
};

(window as any).updateDraft = (key: string, val: any) => {
    if(key === 'price' || key === 'stock') val = parseFloat(val) || 0;
    currentEditingProduct[key] = val;
};

(window as any).setStep = (step: number) => {
    if(step === 2 && !currentEditingProduct.name) return showToast("Avval mahsulot nomini kiriting!");
    if(step === 3 && !currentEditingProduct.image_url) return showToast("Avval rasm yuklang!");
    
    currentStep = step;
    renderEditorUI();
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
        renderEditorUI(); 
        showToast("Rasm yuklandi ✅");
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).openProductEditor = async (id?: string) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    currentStep = 1;
    if(id) {
        showToast("Yuklanmoqda...");
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if(!error && data) {
            currentEditingProduct = data;
        } else {
            return showToast("Xatolik: Mahsulot topilmadi");
        }
    } else {
        currentEditingProduct = { name: '', price: 0, stock: 0, unit: 'dona', category: 'grocery', description: '', image_url: '' };
    }
    renderEditorUI();
};

(window as any).saveProductFinal = async () => {
    if(!currentEditingProduct.price || currentEditingProduct.price <= 0) return showToast("Narxni kiriting!");
    
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
        loadAdminProducts();
    } else {
        showToast("Xato: " + res.error.message);
    }
};

(window as any).archiveProduct = async (id: string, currentStatus: boolean) => {
    if(!confirm(currentStatus ? "Mahsulotni faollashtirasizmi?" : "Mahsulotni arxivlaysizmi?")) return;
    const { error } = await supabase.from('products').update({ is_archived: !currentStatus }).eq('id', id);
    if(!error) { showToast("Bajarildi!"); loadAdminProducts(); }
};

(window as any).deleteProduct = async (id: string) => {
    if(!confirm("Diqqat! Mahsulot bazadan BUTUNLAY O'CHIRILADI!")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(!error) { showToast("O'chirildi!"); loadAdminProducts(); }
};

// --- RENDERERS ---
export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out;">
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

            <div style="background:white; padding:20px; border-radius:30px; margin-bottom:25px; border:2px solid #f1f5f9;">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:15px; align-items:center;">
                    <button class="btn btn-primary" style="height:48px; border-radius:14px; font-size:0.75rem; padding:0 20px;" onclick="window.openProductEditor()">
                        <i class="fas fa-plus-circle"></i> YANGI QO'SHISH
                    </button>
                    <div style="display:flex; gap:10px; flex:1; justify-content:flex-end;">
                        <select id="invStatusFilter" style="height:48px; width:130px; font-size:0.75rem;" onchange="window.changeInvFilter('status', this.value)">
                            <option value="active" ${currentSkladFilter === 'active' ? 'selected' : ''}>FAOL</option>
                            <option value="archived" ${currentSkladFilter === 'archived' ? 'selected' : ''}>ARXIV</option>
                            <option value="all" ${currentSkladFilter === 'all' ? 'selected' : ''}>HAMMASI</option>
                        </select>
                        <select id="invCatFilter" style="height:48px; width:150px; font-size:0.75rem;" onchange="window.changeInvFilter('cat', this.value)">
                            ${CATEGORIES.map(c => `<option value="${c.id}" ${currentCatFilter === c.id ? 'selected' : ''}>${c.label.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div id="skladList"></div>
        </div>
    `;
    loadAdminProducts();
}

async function loadAdminProducts() {
    const listEl = document.getElementById('skladList');
    if(!listEl) return;
    
    let query = supabase.from('products').select('*');
    if(currentSkladFilter === 'active') query = query.eq('is_archived', false);
    else if(currentSkladFilter === 'archived') query = query.eq('is_archived', true);
    if(currentCatFilter !== 'all') query = query.eq('category', currentCatFilter);
    
    const { data: prods } = await query.order('created_at', { ascending: false });

    if(prods) {
        const totalCount = prods.length;
        const lowStock = prods.filter(p => p.stock < 10).length;
        const totalVal = prods.reduce((acc, p) => acc + (p.price * p.stock), 0);
        
        if(document.getElementById('st_total')) document.getElementById('st_total')!.innerText = totalCount.toString();
        if(document.getElementById('st_low')) document.getElementById('st_low')!.innerText = lowStock.toString();
        if(document.getElementById('st_val')) document.getElementById('st_val')!.innerText = totalVal.toLocaleString() + " UZS";
    }

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:28px; overflow:hidden; border:2px solid #f1f5f9; background:white;">
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; min-width:600px;">
                    <thead style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                        <tr>
                            <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Mahsulot</th>
                            <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Ombor</th>
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
                                        <button class="btn" style="width:34px; height:34px; border-radius:10px; background:#eff6ff; color:#3b82f6; border:none;" onclick="window.openProductEditor('${p.id}')"><i class="fas fa-pen"></i></button>
                                        <button class="btn" style="width:34px; height:34px; border-radius:10px; background:${p.is_archived ? '#f0fdf4' : '#fff7ed'}; color:${p.is_archived ? '#16a34a' : '#ea580c'}; border:none;" onclick="window.archiveProduct('${p.id}', ${p.is_archived})"><i class="fas ${p.is_archived ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                                        <button class="btn" style="width:34px; height:34px; border-radius:10px; background:#fef2f2; color:var(--danger); border:none;" onclick="window.deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${!prods?.length ? `<div style="padding:5rem; text-align:center; color:var(--gray); font-weight:800;">Mahsulot topilmadi</div>` : ''}
        </div>
    `;
}

function renderEditorUI() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:100px; animation: slideUp 0.3s ease-out;">
            <!-- HEADER -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:25px; position:sticky; top:0; background:white; z-index:100; padding:15px 20px; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; padding:5px;"></i>
                    <h2 style="font-weight:900; font-size:1.1rem;">${currentEditingProduct.id ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
                </div>
                <div style="display:flex; gap:8px;">
                    ${[1,2,3].map(i => `
                        <div style="width:10px; height:10px; border-radius:50%; background:${currentStep >= i ? 'var(--primary)' : '#e2e8f0'}; transition:0.3s;"></div>
                    `).join('')}
                </div>
            </div>

            <div style="padding: 0 20px;">
                <div class="card" style="border-radius:35px; padding:30px; background:white; border:2px solid #f1f5f9; box-shadow:var(--shadow-lg);">
                    
                    <!-- STEP 1: BASIC INFO -->
                    <div id="step1" style="display:${currentStep === 1 ? 'block' : 'none'}; animation: fadeIn 0.3s;">
                        <h4 style="font-weight:900; color:var(--primary); margin-bottom:20px; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">1. ASOSIY MA'LUMOTLAR</h4>
                        <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">MAHSULOT NOMI</label>
                        <input type="text" value="${currentEditingProduct.name}" oninput="window.updateDraft('name', this.value)" placeholder="Masalan: Pepsi 1.5L" style="height:60px; border-radius:18px; margin-bottom:15px;">
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">KATEGORIYA</label>
                                <select onchange="window.updateDraft('category', this.value)" style="height:60px; border-radius:18px;">
                                    ${CATEGORIES.filter(c => c.id !== 'all').map(c => `<option value="${c.id}" ${currentEditingProduct.category === c.id ? 'selected' : ''}>${c.label.toUpperCase()}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">BIRLIK</label>
                                <select onchange="window.updateDraft('unit', this.value)" style="height:60px; border-radius:18px;">
                                    <option value="dona" ${currentEditingProduct.unit === 'dona' ? 'selected' : ''}>DONA</option>
                                    <option value="kg" ${currentEditingProduct.unit === 'kg' ? 'selected' : ''}>KG</option>
                                    <option value="litr" ${currentEditingProduct.unit === 'litr' ? 'selected' : ''}>LITR</option>
                                </select>
                            </div>
                        </div>

                        <label style="font-size:0.65rem; font-weight:900; color:var(--gray);">TAVSIF</label>
                        <textarea oninput="window.updateDraft('description', this.value)" placeholder="Mahsulot haqida..." style="height:120px; border-radius:18px; margin-bottom:25px;">${currentEditingProduct.description || ''}</textarea>
                        
                        <button class="btn btn-primary" style="width:100%; height:65px; border-radius:22px;" onclick="window.setStep(2)">
                            DAVOM ETISH <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    <!-- STEP 2: MEDIA -->
                    <div id="step2" style="display:${currentStep === 2 ? 'block' : 'none'}; animation: fadeIn 0.3s;">
                        <h4 style="font-weight:900; color:var(--primary); margin-bottom:20px; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">2. MAHSULOT RASMI</h4>
                        <div style="text-align:center; margin-bottom:25px;">
                            <div style="position:relative; width:220px; height:220px; margin:0 auto; border-radius:35px; background:#f8fafc; border:2px dashed #cbd5e1; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                                ${currentEditingProduct.image_url ? `<img src="${currentEditingProduct.image_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-cloud-arrow-up fa-3x" style="color:#cbd5e1;"></i>`}
                                <label style="position:absolute; inset:0; cursor:pointer; background:transparent;">
                                    <input type="file" style="display:none;" onchange="window.uploadProductImage(this)">
                                </label>
                            </div>
                            <p style="font-size:0.7rem; color:var(--gray); margin-top:15px; font-weight:700;">Rasm ustiga bosing va yuklang</p>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:15px;">
                            <button class="btn" style="height:65px; border-radius:22px; background:#f1f5f9; color:var(--gray); border:none;" onclick="window.setStep(1)">ORQAGA</button>
                            <button class="btn btn-primary" style="height:65px; border-radius:22px;" onclick="window.setStep(3)">DAVOM ETISH <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>

                    <!-- STEP 3: PRICE & STOCK -->
                    <div id="step3" style="display:${currentStep === 3 ? 'block' : 'none'}; animation: fadeIn 0.3s;">
                        <h4 style="font-weight:900; color:var(--primary); margin-bottom:20px; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">3. NARX VA OMBOR</h4>
                        
                        <div style="background:#f0fdf4; padding:20px; border-radius:25px; margin-bottom:20px; border:1px solid #dcfce7;">
                            <label style="font-size:0.65rem; font-weight:900; color:#16a34a;">NARXI (UZS)</label>
                            <input type="number" value="${currentEditingProduct.price}" oninput="window.updateDraft('price', this.value)" style="height:60px; border-radius:18px; font-size:1.5rem; color:#16a34a; background:white; margin-top:8px;">
                        </div>

                        <div style="background:#eff6ff; padding:20px; border-radius:25px; margin-bottom:25px; border:1px solid #dbeafe;">
                            <label style="font-size:0.65rem; font-weight:900; color:#2563eb;">OMBORDA QANCHA (SONI)?</label>
                            <input type="number" value="${currentEditingProduct.stock}" oninput="window.updateDraft('stock', this.value)" style="height:60px; border-radius:18px; font-size:1.5rem; color:#2563eb; background:white; margin-top:8px;">
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:15px;">
                            <button class="btn" style="height:65px; border-radius:22px; background:#f1f5f9; color:var(--gray); border:none;" onclick="window.setStep(2)">ORQAGA</button>
                            <button class="btn btn-primary" style="height:65px; border-radius:22px; background:var(--gradient);" onclick="window.saveProductFinal()">
                                SAQLASH <i class="fas fa-check-circle"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}
