
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
                    <input type="text" id="userSearchInput" placeholder="Email yoki ism..." 
                           style="margin:0; height:50px; padding-left:45px; font-size:0.85rem; border-radius:15px; background:white; border:1.5px solid #f1f5f9;" 
                           oninput="window.handleUserSearch(this.value)">
                </div>
            </div>
            <div id="usersTableContainer"></div>
        </div>
    `;
    loadUsers();
}

async function loadUsers(searchTerm = '', roleFilter = 'all') {
    const container = document.getElementById('usersTableContainer');
    if(!container) return;

    container.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin"></i></div>';

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if(roleFilter !== 'all') query = query.eq('role', roleFilter);
    if(searchTerm) query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`);

    const { data: users } = await query;

    container.innerHTML = `
        <div class="card" style="padding:0; border-radius:25px; overflow:hidden; border:1.5px solid #f1f5f9; background:white;">
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; min-width:600px;">
                    <thead style="background:#f8fafc; border-bottom:1.5px solid #f1f5f9;">
                        <tr>
                            <th style="padding:15px; text-align:left; font-size:0.65rem; color:var(--gray);">FOYDALANUVCHI</th>
                            <th style="padding:15px; text-align:left; font-size:0.65rem; color:var(--gray);">ROLE</th>
                            <th style="padding:15px; text-align:left; font-size:0.65rem; color:var(--gray);">BALANS</th>
                            <th style="padding:15px; text-align:center; font-size:0.65rem; color:var(--gray);">AMAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users?.map(u => `
                            <tr style="border-bottom:1px solid #f8fafc;">
                                <td style="padding:12px 15px;">
                                    <div style="font-weight:800; font-size:0.85rem;">${u.first_name || '—'}</div>
                                    <div style="font-size:0.7rem; color:var(--gray);">${u.email}</div>
                                </td>
                                <td style="padding:15px;">
                                    <span style="font-size:0.65rem; font-weight:900; background:#f1f5f9; padding:4px 8px; border-radius:6px;">${u.role.toUpperCase()}</span>
                                </td>
                                <td style="padding:15px; font-weight:900; color:var(--primary); font-size:0.85rem;">
                                    ${(u.balance || 0).toLocaleString()}
                                </td>
                                <td style="padding:15px; text-align:center;">
                                    <button class="btn" style="width:35px; height:35px; background:#eff6ff; color:#3b82f6; border-radius:10px; border:none; display:inline-flex;" onclick='window.impersonateUser(${JSON.stringify(u)})'>
                                        <i class="fas fa-right-to-bracket"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

(window as any).handleUserSearch = (val: string) => loadUsers(val.trim(), currentFilter);
(window as any).filterUsers = (role: string) => {
    currentFilter = role;
    loadUsers('', role);
};
