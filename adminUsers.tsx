
import { supabase, showToast } from "./index.tsx";

let currentFilter = 'all';

export async function renderAdminUsers() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:15px; flex-wrap:wrap;">
                <div style="display:flex; gap:10px; background:#f1f5f9; padding:6px; border-radius:18px;">
                    <button class="btn" id="btnAll" style="height:40px; padding:0 20px; font-size:0.7rem; background:white; border-radius:12px; font-weight:800; box-shadow:var(--shadow-sm);" onclick="window.filterUsers('all')">HAMMASI</button>
                    <button class="btn" id="btnMijoz" style="height:40px; padding:0 20px; font-size:0.7rem; background:transparent; border-radius:12px; color:var(--gray); font-weight:800;" onclick="window.filterUsers('user')">MIJOZLAR</button>
                    <button class="btn" id="btnCourier" style="height:40px; padding:0 20px; font-size:0.7rem; background:transparent; border-radius:12px; color:var(--gray); font-weight:800;" onclick="window.filterUsers('courier')">KURYERLAR</button>
                </div>
                
                <div style="flex:1; max-width:350px; position:relative;">
                    <i class="fas fa-search" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); color:var(--gray); font-size:0.8rem;"></i>
                    <input type="text" id="userSearchInput" placeholder="Email yoki ism orqali qidirish..." 
                           style="margin:0; height:50px; padding-left:45px; font-size:0.85rem; border-radius:15px; background:white; border:1.5px solid #f1f5f9;" 
                           oninput="window.handleUserSearch(this.value)">
                </div>
            </div>

            <div id="usersTableContainer">
                <div style="text-align:center; padding:5rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    loadUsers();
}

async function loadUsers(searchTerm = '', roleFilter = 'all') {
    const container = document.getElementById('usersTableContainer');
    if(!container) return;

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    
    if(roleFilter !== 'all') query = query.eq('role', roleFilter);
    if(searchTerm) query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`);

    const { data: users, error } = await query;

    if(error) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--danger);">Xatolik: ${error.message}</div>`;
        return;
    }

    container.innerHTML = `
        <div class="card" style="padding:0; border-radius:25px; overflow:hidden; border:1.5px solid #f1f5f9; background:white;">
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; min-width:700px;">
                    <thead style="background:#f8fafc; border-bottom:1.5px solid #f1f5f9;">
                        <tr>
                            <th style="padding:18px; text-align:left; font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">Foydalanuvchi</th>
                            <th style="padding:18px; text-align:left; font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">Role</th>
                            <th style="padding:18px; text-align:left; font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">Balans</th>
                            <th style="padding:18px; text-align:left; font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">Hudud</th>
                            <th style="padding:18px; text-align:center; font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase;">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr style="border-bottom:1px solid #f8fafc;">
                                <td style="padding:15px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div style="width:40px; height:40px; border-radius:12px; background:#f1f5f9; overflow:hidden; display:flex; align-items:center; justify-content:center; border:1px solid #e2e8f0;">
                                            ${u.avatar_url ? `<img src="${u.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user" style="color:#cbd5e1;"></i>`}
                                        </div>
                                        <div>
                                            <div style="font-weight:800; font-size:0.85rem; color:var(--text);">${u.first_name || 'Nomsiz'} ${u.last_name || ''}</div>
                                            <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">${u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:15px;">
                                    <select onchange="window.updateUserRoleDirectly('${u.id}', this.value)" 
                                            style="height:35px; border-radius:10px; font-size:0.7rem; font-weight:800; margin:0; padding:0 10px; border:1.5px solid #f1f5f9; background:white; cursor:pointer;">
                                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>MIJOZ</option>
                                        <option value="courier" ${u.role === 'courier' ? 'selected' : ''}>KURYER</option>
                                        <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>STAFF</option>
                                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                                    </select>
                                </td>
                                <td style="padding:15px; font-weight:900; color:var(--primary); font-size:0.85rem;">
                                    ${(u.balance || 0).toLocaleString()} <span style="font-size:0.6rem;">UZS</span>
                                </td>
                                <td style="padding:15px; font-size:0.75rem; font-weight:700; color:var(--gray);">
                                    ${u.district || '—'}
                                </td>
                                <td style="padding:15px; text-align:center;">
                                    <div style="display:flex; justify-content:center; gap:8px;">
                                        <button class="btn" style="width:35px; height:35px; background:#eff6ff; color:#3b82f6; border-radius:10px; border:none; cursor:pointer;" onclick="window.impersonateUser(${JSON.stringify(u).replace(/"/g, '&quot;')})" title="Hisobiga kirish">
                                            <i class="fas fa-right-to-bracket"></i>
                                        </button>
                                        <button class="btn" style="width:35px; height:35px; background:#fee2e2; color:var(--danger); border-radius:10px; border:none; cursor:pointer;" onclick="window.deleteUserAdmin('${u.id}')" title="O'chirish">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${!users.length ? `<div style="padding:4rem; text-align:center; color:var(--gray); font-weight:800;">Foydalanuvchilar topilmadi</div>` : ''}
        </div>
    `;
}

(window as any).handleUserSearch = (val: string) => {
    loadUsers(val.trim(), currentFilter);
};

(window as any).filterUsers = (role: string) => {
    currentFilter = role;
    const btnAll = document.getElementById('btnAll');
    const btnMijoz = document.getElementById('btnMijoz');
    const btnCourier = document.getElementById('btnCourier');
    
    [btnAll, btnMijoz, btnCourier].forEach(b => {
        if(b) { b.style.background = 'transparent'; b.style.color = 'var(--gray)'; b.style.boxShadow = 'none'; }
    });

    const activeBtn = role === 'all' ? btnAll : (role === 'user' ? btnMijoz : btnCourier);
    if(activeBtn) {
        activeBtn.style.background = 'white';
        activeBtn.style.color = 'var(--text)';
        activeBtn.style.boxShadow = 'var(--shadow-sm)';
    }

    loadUsers('', role);
};

(window as any).updateUserRoleDirectly = async (uid: string, newRole: string) => {
    if(!confirm(`Foydalanuvchi rolini ${newRole.toUpperCase()} ga o'zgartirasizmi?`)) {
        return renderAdminUsers();
    }

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', uid);
    if(!error) {
        showToast("Role yangilandi! ✨");
        loadUsers('', currentFilter);
    } else {
        showToast("Xato: " + error.message);
    }
};

(window as any).deleteUserAdmin = async (uid: string) => {
    if(!confirm("Diqqat! Foydalanuvchini o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', uid);
    if(!error) {
        showToast("Muvaffaqiyatli o'chirildi.");
        loadUsers('', currentFilter);
    } else {
        showToast("Xato: " + error.message);
    }
};
