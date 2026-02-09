
import { supabase, showToast } from "./index.tsx";

export async function renderAdminUsers() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div style="display:flex; gap:10px; background:#f1f5f9; padding:6px; border-radius:18px;">
                <button class="btn" id="btnUserList" style="height:42px; padding:0 22px; font-size:0.75rem; background:white; border-radius:14px; font-weight:800; box-shadow:var(--shadow-sm);" onclick="toggleAdminUserTab('list')">MIJOZLAR</button>
                <button class="btn" id="btnCourierList" style="height:42px; padding:0 22px; font-size:0.75rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('couriers')">KURYERLAR</button>
                <button class="btn" id="btnAllUsers" style="height:42px; padding:0 22px; font-size:0.75rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('all')">HAMMA FOYDALANUVCHILAR</button>
            </div>
        </div>

        <div id="adminUsersInnerContent"></div>
    `;

    loadUserList('user');
}

(window as any).toggleAdminUserTab = (tab: string) => {
    const buttons = ['btnUserList', 'btnCourierList', 'btnAllUsers'];
    buttons.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.style.background = 'transparent';
            el.style.color = 'var(--gray)';
            el.style.boxShadow = 'none';
        }
    });
    
    const activeBtn = document.getElementById(tab === 'all' ? 'btnAllUsers' : (tab === 'couriers' ? 'btnCourierList' : 'btnUserList'));
    if(activeBtn) {
        activeBtn.style.background = 'white';
        activeBtn.style.color = 'var(--text)';
        activeBtn.style.boxShadow = 'var(--shadow-sm)';
    }

    if(tab === 'list') loadUserList('user');
    else if(tab === 'couriers') loadUserList('courier');
    else if(tab === 'all') loadUserList('all');
};

async function loadUserList(roleFilter: string) {
    const content = document.getElementById('adminUsersInnerContent');
    if(!content) return;
    
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    try {
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if(roleFilter !== 'all') query = query.eq('role', roleFilter);
        
        const { data: users, error } = await query;
        if (error) throw error;

        content.innerHTML = `
            <div class="card" style="border-radius:28px; overflow:hidden; padding:0; border:1px solid #e2e8f0; background:white;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                        <tr>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">FOYDALANUVCHI</th>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">ROLE BOSHQARISH</th>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">HAMYON</th>
                            <th style="padding:15px; text-align:center; font-size:0.7rem; font-weight:800; color:var(--gray);">AMAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users?.map(u => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:15px;">
                                    <div style="font-weight:800; font-size:0.9rem;">${u.first_name || 'Nomsiz'}</div>
                                    <div style="font-size:0.65rem; color:var(--gray);">${u.email}</div>
                                </td>
                                <td style="padding:15px;">
                                    <select onchange="updateUserRoleDirectly('${u.id}', this.value)" style="height:36px; padding:0 10px; border-radius:10px; font-size:0.7rem; font-weight:800; margin:0; border:1px solid #e2e8f0;">
                                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>MIJOZ</option>
                                        <option value="courier" ${u.role === 'courier' ? 'selected' : ''}>KURYER</option>
                                        <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>STAFF</option>
                                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                                    </select>
                                </td>
                                <td style="padding:15px; font-weight:900; color:var(--primary); font-size:0.85rem;">${(u.balance || 0).toLocaleString()} UZS</td>
                                <td style="padding:15px; text-align:center;">
                                    <button class="btn" style="width:32px; height:32px; background:#fee2e2; color:var(--danger); border-radius:8px; border:none;" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e: any) {
        content.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--danger); font-weight:800;">Xatolik: ${e.message}</div>`;
    }
}

(window as any).updateUserRoleDirectly = async (userId: string, newRole: string) => {
    if(!confirm(`Foydalanuvchi rolini ${newRole.toUpperCase()} ga o'zgartirmoqchimisiz?`)) {
        return loadUserList('all');
    }
    
    try {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) throw error;
        showToast("Role yangilandi! ✨");
    } catch (e: any) {
        showToast("Xato: " + e.message);
        loadUserList('all');
    }
};

(window as any).deleteUser = async (id: string) => {
    if(!confirm("Foydalanuvchini o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) { showToast("O'chirildi"); loadUserList('all'); }
};
