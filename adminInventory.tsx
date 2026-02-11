
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

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out;">
            <!-- SKLAD STATISTIKASI -->
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

            <!-- BOSHQARUV PANEL -->
            <div style="background:white; padding:20px; border-radius:30px; margin-bottom:25px; border:2px solid #f1f5f9;">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:15px; align-items:center;">
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="height:48px; border-radius:14px; font-size:0.75rem; padding:0 20px;" onclick="window.openProductEditor()">
                            <i class="fas fa-plus-circle"></i> YANGI QO'SHISH
                        </button>
                        <select id="invStatusFilter" style="height:48px; margin:0; width:140px; font-size:0.75rem; border-radius:14px;" onchange="window.changeInvFilter('status', this.value)">
                            <option value="active">FAOL</option>
                            <option value="archived">ARXIVLANGAN</option>
                            <option value="all">HAMMASI</option>
                        </select>
                        <select id="invCatFilter" style="height:48px; margin:0; width:160px; font-size:0.75rem; border-radius:14px;" onchange="window.changeInvFilter('cat', this.value)">
                            ${CATEGORIES.map(c => `<option value="${c.id}">${c.label.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>
                    <div style="flex:1; max-width:300px; position:relative;">
                        <i class="fas fa-search" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;"></i>
                        <input type="text" placeholder="Qidirish..." style="margin:0; height:48px; padding-left:45px; font-size:0.85rem; border-radius:14px;" oninput="window.searchSklad(this.value)">
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
    
    listEl.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    let query = supabase.from('products').select('*');
    if(currentSkladFilter === 'active') query = query.eq('is_archived', false);
    else if(currentSkladFilter === 'archived') query = query.eq('is_archived', true);
    if(currentCatFilter !== 'all') query = query.eq('category', currentCatFilter);
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    
    const { data: prods } = await query.order('created_at', { ascending: false });

    // Statistika hisoblash
    const total = prods?.length || 0;
    const low = prods?.filter(p => p.stock < 10).length || 0;
    const val = prods?.reduce((acc, p) => acc + (p.price * p.stock), 0) || 0;

    document.getElementById('st_total')!.innerText = total.toString();
    document.getElementById('st_low')!.innerText = low.toString();
    document.getElementById('st_val')!.innerText = val.toLocaleString() + " UZS";

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:28px; overflow:hidden; border:2px solid #f1f5f9; background:white;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                    <tr>
                        <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Mahsulot</th>
                        <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Ombor</th>
                        <th style="padding:15px; text-align:left; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Narx</th>
                        <th style="padding:15px; text-align:center; font-size:0.6rem; color:var(--gray); text-transform:uppercase;">Amallar</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods?.map(p => `
                        <tr style="border-bottom:1px solid #f8fafc; opacity:${p.is_archived ? '0.6' : '1'}">
                            <td style="padding:12px 15px;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <img src="${p.image_url}" style="width:45px; height:45px; border-radius:12px; object-fit:cover; border:1px solid #f1f5f9;">
                                    <div>
                                        <div style="font-weight:900; color:var(--text);">${p.name}</div>
                                        <div style="font-size:0.65rem; color:var(--gray); font-weight:800;">${p.category.toUpperCase()}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding:15px;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <b style="color:${p.stock < 10 ? 'var(--danger)' : 'var(--text)'}">${p.stock} ${p.unit}</b>
                                    <div style="width:100%; height:4px; background:#f1f5f9; border-radius:5px; overflow:hidden;">
                                        <div style="width:${Math.min(100, p.stock)}%; height:100%; background:${p.stock < 10 ? 'var(--danger)' : 'var(--primary)'};"></div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding:15px; font-weight:900; color:var(--primary);">${p.price.toLocaleString()}</td>
                            <td style="padding:15px; text-align:center;">
                                <div style="display:flex; justify-content:center; gap:8px;">
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

(window as any).changeInvFilter = (type: string, val: string) => {
    if(type === 'status') currentSkladFilter = val;
    if(type === 'cat') currentCatFilter = val;
    loadAdminProducts();
};

(window as any).archiveProduct = async (id: number, current: boolean) => {
    if(!confirm(current ? "Mahsulotni faollashtirasizmi?" : "Mahsulotni arxivlaysizmi?")) return;
    const { error } = await supabase.from('products').update({ is_archived: !current }).eq('id', id);
    if(!error) { showToast("Muvaffaqiyatli!"); loadAdminProducts(); }
};

(window as any).deleteProduct = async (id: number) => {
    if(!confirm("Diqqat! Mahsulot bazadan butunlay o'chiriladi. Qaytarib bo'lmaydi!")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(!error) { showToast("O'chirildi!"); loadAdminProducts(); }
    else showToast("Xato: " + error.message);
};

(window as any).searchSklad = (val: string) => loadAdminProducts(val.trim());
