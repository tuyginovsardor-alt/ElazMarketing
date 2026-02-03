
import { supabase, showToast } from "./index.tsx";

export async function renderAdminUsers() {
    const container = document.getElementById('admin_tab_users');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div style="display:flex; gap:10px; background:#f1f5f9; padding:5px; border-radius:18px;">
                <button class="btn" id="btnUserList" style="height:42px; padding:0 22px; font-size:0.8rem; background:white; border-radius:14px; box-shadow:0 4px 10px rgba(0,0,0,0.05); font-weight:800;" onclick="toggleAdminUserTab('list')">MIJOZLAR</button>
                <button class="btn" id="btnCourierReq" style="height:42px; padding:0 22px; font-size:0.8rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('requests')">KURYER ARIZALARI <span id="courierReqCount" style="background:var(--danger); color:white; padding:2px 8px; border-radius:10px; font-size:0.6rem; margin-left:5px; display:none;">0</span></button>
            </div>
            <div style="flex:1; max-width:400px; position:relative; margin-left:25px;">
                <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--gray);"></i>
                <input type="text" id="adminUserSearchInput" placeholder="Qidirish..." style="margin:0; height:52px; padding-left:52px; border-radius:16px; font-weight:700;" oninput="searchAdminUsers(this.value)">
            </div>
        </div>

        <div id="adminUsersContent"></div>
    `;

    loadUserList();
    updateReqCount();
}

async function updateReqCount() {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user').not('phone', 'is', null).eq('is_approved', false);
    const badge = document.getElementById('courierReqCount');
    if(badge && count) {
        badge.innerText = count.toString();
        badge.style.display = 'inline-block';
    } else if(badge) badge.style.display = 'none';
}

(window as any).toggleAdminUserTab = (tab: string) => {
    const bList = document.getElementById('btnUserList')!;
    const bReq = document.getElementById('btnCourierReq')!;
    
    if(tab === 'list') {
        bList.style.background = 'white'; bList.style.color = 'var(--text)';
        bReq.style.background = 'transparent'; bReq.style.color = 'var(--gray)';
        loadUserList();
    } else {
        bReq.style.background = 'white'; bReq.style.color = 'var(--text)';
        bList.style.background = 'transparent'; bList.style.color = 'var(--gray)';
        loadCourierRequests();
    }
};

async function loadUserList() {
    const content = document.getElementById('adminUsersContent')!;
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    
    const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

    content.innerHTML = `
        <div class="card" style="border-radius:28px; overflow:hidden; padding:0;">
            <table class="admin-table">
                <thead>
                    <tr><th>User</th><th>Role</th><th>Phone</th><th>Status</th><th>Balance</th><th>Action</th></tr>
                </thead>
                <tbody>
                    ${users?.map(u => `
                        <tr>
                            <td><div style="font-weight:800;">${u.first_name}</div><div style="font-size:0.7rem; color:var(--gray);">${u.email}</div></td>
                            <td><span style="font-size:0.7rem; font-weight:900; color:${u.role === 'admin' ? 'var(--danger)' : (u.role === 'courier' ? 'var(--primary)' : 'var(--gray)')}">${u.role.toUpperCase()}</span></td>
                            <td>${u.phone || '-'}</td>
                            <td>${u.is_approved ? '✅' : '⏳'}</td>
                            <td><b>${u.balance.toLocaleString()}</b></td>
                            <td><button class="btn btn-outline" style="width:32px; height:32px; border:none; color:var(--danger);" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadCourierRequests() {
    const content = document.getElementById('adminUsersContent')!;
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    const { data: reqs } = await supabase.from('profiles').select('*').eq('role', 'user').not('phone', 'is', null).eq('is_approved', false);

    if(!reqs || reqs.length === 0) {
        content.innerHTML = '<div style="padding:4rem; text-align:center; color:var(--gray);">Yangi arizalar mavjud emas.</div>';
        return;
    }

    content.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
            ${reqs.map(r => `
                <div class="card" style="border-radius:24px; padding:20px; border:1px solid #f1f5f9;">
                    <h3 style="font-weight:900;">${r.first_name} ${r.last_name || ''}</h3>
                    <p style="font-size:0.8rem; color:var(--gray); margin-bottom:15px;">Tel: ${r.phone}</p>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex:1; height:42px; font-size:0.75rem;" onclick="approveCourier('${r.id}')">TASDIQLASH</button>
                        <button class="btn btn-outline" style="flex:1; height:42px; font-size:0.75rem; color:var(--danger);" onclick="rejectCourier('${r.id}')">RAD ETISH</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).approveCourier = async (id: string) => {
    if(!confirm("Kuryerlikka tasdiqlaysizmi?")) return;
    const { error } = await supabase.from('profiles').update({ role: 'courier', is_approved: true }).eq('id', id);
    if(!error) { showToast("Kuryer tasdiqlandi!"); loadCourierRequests(); updateReqCount(); }
};

(window as any).rejectCourier = async (id: string) => {
    if(!confirm("Arizani bekor qilasizmi?")) return;
    const { error } = await supabase.from('profiles').update({ phone: null, is_approved: false }).eq('id', id);
    if(!error) { showToast("Rad etildi."); loadCourierRequests(); updateReqCount(); }
};
