
import { supabase, showToast } from "./index.tsx";

export async function renderAdminUsers() {
    const container = document.getElementById('admin_tab_users');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div style="display:flex; gap:10px; background:#f1f5f9; padding:5px; border-radius:18px;">
                <button class="btn" id="btnUserList" style="height:42px; padding:0 22px; font-size:0.8rem; background:white; border-radius:14px; box-shadow:0 4px 10px rgba(0,0,0,0.05); font-weight:800;" onclick="toggleAdminUserTab('list')">MIJOZLAR</button>
                <button class="btn" id="btnCourierReq" style="height:42px; padding:0 22px; font-size:0.8rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('requests')">ARIZALAR <span id="courierReqCount" style="background:var(--danger); color:white; padding:2px 8px; border-radius:10px; font-size:0.6rem; margin-left:5px; display:none;">0</span></button>
            </div>
            <div style="flex:1; max-width:400px; position:relative; margin-left:25px;">
                <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--gray);"></i>
                <input type="text" id="adminUserSearchInput" placeholder="Qidirish..." style="margin:0; height:52px; padding-left:52px; border-radius:16px; font-weight:700;" oninput="searchAdminUsers(this.value)">
            </div>
        </div>

        <div id="adminUsersContent" style="background:white; border-radius:28px; overflow:hidden; border:1px solid #f1f5f9; box-shadow:var(--shadow-sm);"></div>
    `;

    loadUserList();
    updateReqCount();
}

async function updateReqCount() {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user').not('phone', 'is', null);
    const badge = document.getElementById('courierReqCount');
    if(badge && count && count > 0) {
        badge.innerText = count.toString();
        badge.style.display = 'inline-block';
    } else if(badge) {
        badge.style.display = 'none';
    }
}

let lastSearchTerm = '';
let currentTab = 'list';

(window as any).toggleAdminUserTab = (tab: string) => {
    currentTab = tab;
    const bList = document.getElementById('btnUserList')!;
    const bReq = document.getElementById('btnCourierReq')!;
    
    if(tab === 'list') {
        bList.style.background = 'white'; bList.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)'; bList.style.color = 'var(--text)';
        bReq.style.background = 'transparent'; bReq.style.boxShadow = 'none'; bReq.style.color = 'var(--gray)';
        loadUserList();
    } else {
        bReq.style.background = 'white'; bReq.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)'; bReq.style.color = 'var(--text)';
        bList.style.background = 'transparent'; bList.style.boxShadow = 'none'; bList.style.color = 'var(--gray)';
        loadCourierApprovalRequests();
    }
};

async function loadUserList() {
    const listEl = document.getElementById('adminUsersContent')!;
    listEl.innerHTML = '<div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if(lastSearchTerm) query = query.or(`email.ilike.%${lastSearchTerm}%,first_name.ilike.%${lastSearchTerm}%,phone.ilike.%${lastSearchTerm}%`);

    const { data: users } = await query;

    listEl.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Media</th>
                    <th>Ism va Email</th>
                    <th>Telefon</th>
                    <th>Rol</th>
                    <th>Amal</th>
                </tr>
            </thead>
            <tbody>
                ${users?.map(u => `
                    <tr>
                        <td><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}" style="width:44px; height:44px; border-radius:12px; background:#f1f5f9;"></td>
                        <td><div style="font-weight:800; font-size:0.9rem;">${u.first_name} ${u.last_name || ''}</div><div style="font-size:0.7rem; color:var(--gray);">${u.email}</div></td>
                        <td><div style="font-weight:700; font-size:0.85rem;">${u.phone || '-'}</div></td>
                        <td><span style="background:${u.role==='admin'?'#fee2e2':'#f1f5f9'}; color:${u.role==='admin'?'var(--danger)':'var(--text)'}; padding:4px 10px; border-radius:8px; font-size:0.6rem; font-weight:900; text-transform:uppercase;">${u.role}</span></td>
                        <td>
                            <button class="btn btn-outline" style="width:32px; height:32px; padding:0; color:var(--danger); border:none;" onclick="deleteUserById('${u.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadCourierApprovalRequests() {
    const listEl = document.getElementById('adminUsersContent')!;
    listEl.innerHTML = '<div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';

    const { data: reqs } = await supabase.from('profiles').select('*').eq('role', 'user').not('phone', 'is', null).order('created_at', { ascending: false });

    if(!reqs || reqs.length === 0) {
        listEl.innerHTML = '<div style="padding:5rem; text-align:center; color:var(--gray); font-weight:700;">Yangi arizalar topilmadi.</div>';
        return;
    }

    listEl.innerHTML = `
        <div style="padding:30px; display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:25px;">
            ${reqs.map(r => `
                <div class="card" style="margin-bottom:0; border:1px solid #f1f5f9; padding:25px; box-shadow:var(--shadow-sm); border-radius:28px; background:white;">
                    <div style="display:flex; align-items:center; gap:18px; margin-bottom:20px;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${r.email}" style="width:65px; height:65px; border-radius:20px; border:2px solid #f1f5f9; background:#f8fafc;">
                        <div>
                            <div style="font-weight:900; font-size:1.2rem; color:var(--text);">${r.first_name} ${r.last_name || ''}</div>
                            <div style="font-size:0.85rem; color:var(--primary); font-weight:800;">Kuryerlikka ariza</div>
                        </div>
                    </div>
                    <div style="background:#f8fafc; padding:18px; border-radius:20px; margin-bottom:25px;">
                        <div style="font-size:0.7rem; color:var(--gray); font-weight:900; text-transform:uppercase; margin-bottom:5px;">Malumotlar:</div>
                        <div style="font-weight:800; font-size:0.95rem; color:var(--text);">${r.phone || r.email}</div>
                        <div style="font-size:0.8rem; color:var(--gray); margin-top:5px;">${r.district || 'Manzil yo\'q'}</div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <button class="btn btn-primary" style="height:54px; font-size:0.8rem; border-radius:16px; font-weight:900;" onclick="approveCourierById('${r.id}', 'courier')">KURYER QILISH</button>
                        <button class="btn btn-outline" style="height:54px; font-size:0.8rem; border-radius:16px; font-weight:900; color:var(--dark);" onclick="approveCourierById('${r.id}', 'staff')">HODIM QILISH</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).approveCourierById = async (userId: string, targetRole: string) => {
    if(!confirm(`Foydalanuvchini ${targetRole === 'courier' ? 'Kuryer' : 'Hodim'} sifatida tasdiqlaysizmi?`)) return;
    showToast("Tasdiqlanmoqda...");
    const { error } = await supabase.from('profiles').update({ 
        role: targetRole, 
        is_approved: true 
    }).eq('id', userId);
    
    if(!error) {
        showToast("Muvaffaqiyatli tasdiqlandi! ✅");
        loadCourierApprovalRequests();
        updateReqCount();
    } else showToast("Xato: " + error.message);
};

(window as any).deleteUserById = async (userId: string) => {
    if(!confirm("O'chirilsinmi?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if(!error) {
        showToast("O'chirildi.");
        if(currentTab === 'list') loadUserList(); else loadCourierApprovalRequests();
        updateReqCount();
    }
};

(window as any).searchAdminUsers = (val: string) => {
    lastSearchTerm = val;
    if(currentTab === 'list') loadUserList();
};
