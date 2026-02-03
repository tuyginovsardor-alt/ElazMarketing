
import { supabase, showToast } from "./index.tsx";

export async function renderAdminUsers() {
    const container = document.getElementById('admin_tab_users');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div style="display:flex; gap:10px; background:#f1f5f9; padding:5px; border-radius:18px;">
                <button class="btn" id="btnUserList" style="height:42px; padding:0 22px; font-size:0.8rem; background:white; border-radius:14px; font-weight:800;" onclick="toggleAdminUserTab('list')">MIJOZLAR</button>
                <button class="btn" id="btnCourierList" style="height:42px; padding:0 22px; font-size:0.8rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('couriers')">KURYERLAR</button>
                <button class="btn" id="btnCourierReq" style="height:42px; padding:0 22px; font-size:0.8rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('requests')">ARIZALAR <span id="courierReqCount" style="background:var(--danger); color:white; padding:2px 8px; border-radius:10px; font-size:0.6rem; margin-left:5px; display:none;">0</span></button>
            </div>
        </div>

        <div id="adminUsersContent"></div>
    `;

    loadUserList();
    updateReqCount();
}

async function updateReqCount() {
    const { count } = await supabase.from('courier_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const badge = document.getElementById('courierReqCount');
    if(badge && count) {
        badge.innerText = count.toString();
        badge.style.display = 'inline-block';
    } else if(badge) badge.style.display = 'none';
}

(window as any).toggleAdminUserTab = (tab: string) => {
    const buttons = ['btnUserList', 'btnCourierList', 'btnCourierReq'];
    buttons.forEach(id => {
        const el = document.getElementById(id)!;
        el.style.background = 'transparent';
        el.style.color = 'var(--gray)';
    });
    
    const btnId = tab === 'requests' ? 'btnCourierReq' : (tab === 'couriers' ? 'btnCourierList' : 'btnUserList');
    const activeBtn = document.getElementById(btnId);
    if(activeBtn) {
        activeBtn.style.background = 'white';
        activeBtn.style.color = 'var(--text)';
    }

    if(tab === 'list') loadUserList();
    else if(tab === 'couriers') loadCourierList();
    else loadCourierRequests();
};

async function loadUserList() {
    const content = document.getElementById('adminUsersContent')!;
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const { data: users } = await supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
    renderUserTable(users, 'Mijoz');
}

async function loadCourierList() {
    const content = document.getElementById('adminUsersContent')!;
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const { data: couriers } = await supabase.from('profiles').select('*').eq('role', 'courier');
    
    const couriersWithStats = await Promise.all((couriers || []).map(async (c) => {
        const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('courier_id', c.id).eq('status', 'delivered');
        return { ...c, orders_count: count || 0 };
    }));

    content.innerHTML = `
        <div class="card" style="border-radius:28px; overflow:hidden; padding:0;">
            <table class="admin-table">
                <thead>
                    <tr><th>Kurer</th><th>Transport</th><th>Status</th><th>Buyurtmalar</th><th>Balans</th><th>Amal</th></tr>
                </thead>
                <tbody>
                    ${couriersWithStats.map(u => `
                        <tr>
                            <td><div style="font-weight:800;">${u.first_name}</div><div style="font-size:0.7rem; color:var(--gray);">${u.email}</div></td>
                            <td><span style="font-size:0.7rem; font-weight:800; color:var(--primary);">${u.transport_type || 'Piyoda'}</span></td>
                            <td>${u.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}</td>
                            <td><b style="color:var(--primary);">${u.orders_count} ta</b></td>
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
    
    const { data: reqs, error } = await supabase.from('courier_applications').select('*').eq('status', 'pending');

    if(error) {
        content.innerHTML = `<div style="padding:4rem; text-align:center; color:var(--danger);">Xatolik: ${error.message}</div>`;
        return;
    }

    if(!reqs || reqs.length === 0) {
        content.innerHTML = '<div style="padding:4rem; text-align:center; color:var(--gray);">Yangi arizalar mavjud emas.</div>';
        return;
    }

    content.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
            ${reqs.map(r => `
                <div class="card" style="border-radius:24px; padding:25px; border:1px solid #f1f5f9; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                        <div>
                            <h3 style="font-weight:900; font-size:1.1rem;">${r.full_name || 'Ismsiz'}</h3>
                            <div style="font-size:0.75rem; color:var(--gray); font-weight:700;">Ariza ID: ${r.id.substring(0,8)}</div>
                        </div>
                        <div style="background:var(--primary-light); color:var(--primary); padding:5px 10px; border-radius:10px; font-size:0.65rem; font-weight:900;">${(r.transport_type || 'walking').toUpperCase()}</div>
                    </div>
                    <div style="margin-bottom:20px; font-size:0.85rem; color:var(--text); font-weight:700;">
                        <i class="fas fa-phone" style="color:var(--primary); margin-right:8px;"></i> ${r.phone || 'Raqam yo\'q'}
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" id="btnApprove_${r.id}" style="flex:1; height:45px; font-size:0.75rem;" onclick="approveCourierApp('${r.id}', '${r.user_id}', '${r.transport_type}')">TASDIQLASH</button>
                        <button class="btn btn-outline" style="flex:1; height:45px; font-size:0.75rem; color:var(--danger); border-color:#fee2e2;" onclick="rejectCourierApp('${r.id}')">RAD ETISH</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).approveCourierApp = async (appId: string, userId: string, transport: string) => {
    if(!confirm("Ushbu foydalanuvchini kuryerlikka tasdiqlaysizmi?")) return;
    
    const btn = document.getElementById(`btnApprove_${appId}`) as HTMLButtonElement;
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        // 1. Profilni yangilash
        const { error: profileError } = await supabase.from('profiles').update({ 
            role: 'courier', 
            is_approved: true, 
            transport_type: transport 
        }).eq('id', userId);

        if (profileError) {
            // Agar ustunlar topilmasa, sodda update qilib ko'ramiz
            if(profileError.message.includes("column")) {
                throw new Error("Bazaga profiles uchun ustunlar qo'shilmagan. SQL Editor'da kodni RUN qiling.");
            }
            throw profileError;
        }

        // 2. Arizani yangilash
        const { error: appError } = await supabase.from('courier_applications').update({ status: 'approved' }).eq('id', appId);
        if (appError) throw appError;

        showToast("Kuryer muvaffaqiyatli tasdiqlandi! 🛵");
        loadCourierRequests();
        updateReqCount();
        
    } catch (e: any) {
        console.error("Approve Error:", e);
        showToast("Xato: " + e.message);
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = 'TASDIQLASH';
        }
    }
};

(window as any).rejectCourierApp = async (appId: string) => {
    if(!confirm("Arizani rad etasizmi?")) return;
    await supabase.from('courier_applications').update({ status: 'rejected' }).eq('id', appId);
    showToast("Ariza rad etildi.");
    loadCourierRequests();
    updateReqCount();
};

function renderUserTable(users: any, roleName: string) {
    const content = document.getElementById('adminUsersContent')!;
    content.innerHTML = `
        <div class="card" style="border-radius:28px; overflow:hidden; padding:0;">
            <table class="admin-table">
                <thead>
                    <tr><th>Foydalanuvchi</th><th>Rol</th><th>Telefon</th><th>Hamyon</th><th>Amal</th></tr>
                </thead>
                <tbody>
                    ${users?.map(u => `
                        <tr>
                            <td><div style="font-weight:800;">${u.first_name}</div><div style="font-size:0.7rem; color:var(--gray);">${u.email}</div></td>
                            <td><span style="font-size:0.7rem; font-weight:900; color:var(--gray);">${roleName.toUpperCase()}</span></td>
                            <td>${u.phone || '-'}</td>
                            <td><b>${u.balance.toLocaleString()}</b></td>
                            <td><button class="btn btn-outline" style="width:32px; height:32px; border:none; color:var(--danger);" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
