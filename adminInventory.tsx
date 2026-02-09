
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

const CATEGORIES = [
    { id: 'grocery', label: 'Oziq-ovqat' },
    { id: 'drinks', label: 'Ichimliklar' },
    { id: 'sweets', label: 'Shirinliklar' },
    { id: 'household', label: 'Xo\'jalik' }
];

let selectedIds: number[] = [];

export async function renderAdminInventory() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    selectedIds = [];

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; gap:15px;">
            <div style="display:flex; gap:10px;">
                <button class="btn btn-primary" style="height:52px; padding:0 20px; font-size:0.8rem; border-radius:14px;" onclick="openProductEditor()">
                    <i class="fas fa-plus-circle"></i> YANGI
                </button>
                <button id="bulkDeleteBtn" class="btn" style="display:none; height:52px; padding:0 20px; font-size:0.8rem; border-radius:14px; background:#fee2e2; color:var(--danger); border:none;" onclick="bulkDeleteProducts()">
                    <i class="fas fa-trash-alt"></i> O'CHIRISH (<span id="selCount">0</span>)
                </button>
            </div>
            <div style="flex:1; max-width:400px; position:relative;">
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
    
    listEl.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    let query = supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    if(searchTerm) query = query.ilike('name', `%${searchTerm}%`);
    const { data: prods } = await query;

    listEl.innerHTML = `
        <div class="card" style="padding:0; border-radius:24px; background:white; overflow:hidden; border:1.5px solid #f1f5f9;">
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
                        <tr style="border-bottom:1px solid #f8fafc;">
                            <td style="padding:15px; text-align:center;"><input type="checkbox" class="prod-checkbox" value="${p.id}" onchange="handleRowSelect(this)"></td>
                            <td style="padding:15px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${p.image_url}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;">
                                    <div><div style="font-weight:900;">${p.name}</div><div style="font-size:0.65rem; color:#94a3b8;">${p.unit}</div></div>
                                </div>
                            </td>
                            <td style="padding:15px; font-weight:800;">${p.price.toLocaleString()}</td>
                            <td style="padding:15px; text-align:center;">
                                <button class="btn" style="width:32px; height:32px; border-radius:8px; background:#eff6ff; color:#3b82f6; border:none;" onclick="openProductEditor(${p.id})"><i class="fas fa-edit"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

(window as any).handleRowSelect = (cb: HTMLInputElement) => {
    const id = parseInt(cb.value);
    if(cb.checked) selectedIds.push(id);
    else selectedIds = selectedIds.filter(i => i !== id);
    updateBulkUI();
};

(window as any).toggleAllCheckboxes = (mainCb: HTMLInputElement) => {
    const checkboxes = document.querySelectorAll('.prod-checkbox') as NodeListOf<HTMLInputElement>;
    selectedIds = [];
    checkboxes.forEach(cb => {
        cb.checked = mainCb.checked;
        if(cb.checked) selectedIds.push(parseInt(cb.value));
    });
    updateBulkUI();
};

function updateBulkUI() {
    const btn = document.getElementById('bulkDeleteBtn');
    const countEl = document.getElementById('selCount');
    if(btn && countEl) {
        btn.style.display = selectedIds.length > 0 ? 'flex' : 'none';
        countEl.innerText = selectedIds.length.toString();
    }
}

(window as any).bulkDeleteProducts = async () => {
    if(!confirm(`Tanlangan ${selectedIds.length} ta mahsulotni o'chirmoqchimisiz?`)) return;
    const { error } = await supabase.from('products').update({ is_archived: true }).in('id', selectedIds);
    if(!error) { showToast("O'chirildi! 🗑️"); renderAdminInventory(); }
};

(window as any).searchSklad = (val: string) => loadAdminProducts(val);

(window as any).openProductEditor = async (id?: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    let p: any = { name: '', price: '', category: 'grocery', unit: 'dona', image_url: '', description: '' };
    if(id) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if(data) p = data;
    }

    placeholder.innerHTML = `
        <div style="padding-bottom:100px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <i class="fas fa-chevron-left" onclick="closeOverlay('checkoutOverlay')" style="cursor:pointer; font-size:1.2rem;"></i>
                <h2 style="font-weight:900;">${id ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
            </div>
            <div class="card">
                <input type="text" id="p_name" value="${p.name}" placeholder="Nomi">
                <input type="number" id="p_price" value="${p.price}" placeholder="Narxi">
                <select id="p_cat">
                    ${CATEGORIES.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
                <input type="text" id="p_unit" value="${p.unit}" placeholder="O'lchov (kg, dona)">
                <textarea id="p_desc" placeholder="Tavsif" style="height:100px;">${p.description || ''}</textarea>
                <input type="text" id="p_img" value="${p.image_url}" placeholder="Rasm URL">
                <button class="btn btn-primary" style="width:100%; margin-top:20px;" onclick="saveAdminProduct(${id || 'null'})">SAQLASH</button>
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
        description: (document.getElementById('p_desc') as HTMLTextAreaElement).value,
        image_url: (document.getElementById('p_img') as HTMLInputElement).value,
        is_archived: false
    };
    const { error } = id ? await supabase.from('products').update(data).eq('id', id) : await supabase.from('products').insert(data);
    if(!error) { showToast("Saqlandi!"); closeOverlay('checkoutOverlay'); renderAdminInventory(); }
};
