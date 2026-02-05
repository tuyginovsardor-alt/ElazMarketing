
import { supabase, showToast } from "./index.tsx";

export async function renderAdminUsers() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div style="display:flex; gap:10px; background:#f1f5f9; padding:6px; border-radius:18px;">
                <button class="btn" id="btnUserList" style="height:42px; padding:0 22px; font-size:0.75rem; background:white; border-radius:14px; font-weight:800; box-shadow:var(--shadow-sm);" onclick="toggleAdminUserTab('list')">MIJOZLAR</button>
                <button class="btn" id="btnCourierList" style="height:42px; padding:0 22px; font-size:0.75rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800;" onclick="toggleAdminUserTab('couriers')">KURYERLAR</button>
                <button class="btn" id="btnCourierReq" style="height:42px; padding:0 22px; font-size:0.75rem; background:transparent; border-radius:14px; color:var(--gray); font-weight:800; position:relative;" onclick="toggleAdminUserTab('requests')">
                    ARIZALAR <span id="courierReqCount" style="background:var(--danger); color:white; padding:2px 8px; border-radius:10px; font-size:0.6rem; margin-left:5px; display:none;">0</span>
                </button>
            </div>
        </div>

        <div id="adminUsersInnerContent"></div>
    `;

    loadUserList();
    updateReqCount();
}

async function updateReqCount() {
    try {
        const { count, error } = await supabase.from('courier_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        if (error) throw error;
        
        const badge = document.getElementById('courierReqCount');
        if(badge && count) {
            badge.innerText = count.toString();
            badge.style.display = 'inline-block';
        } else if(badge) badge.style.display = 'none';
    } catch (e) {
        console.error("ReqCount error:", e);
    }
}

(window as any).toggleAdminUserTab = (tab: string) => {
    const buttons = ['btnUserList', 'btnCourierList', 'btnCourierReq'];
    buttons.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.style.background = 'transparent';
            el.style.color = 'var(--gray)';
            el.style.boxShadow = 'none';
        }
    });
    
    const btnId = tab === 'requests' ? 'btnCourierReq' : (tab === 'couriers' ? 'btnCourierList' : 'btnUserList');
    const activeBtn = document.getElementById(btnId);
    if(activeBtn) {
        activeBtn.style.background = 'white';
        activeBtn.style.color = 'var(--text)';
        activeBtn.style.boxShadow = 'var(--shadow-sm)';
    }

    if(tab === 'list') loadUserList();
    else if(tab === 'couriers') loadCourierList();
    else if(tab === 'requests') loadCourierRequests();
};

async function loadUserList() {
    const content = document.getElementById('adminUsersInnerContent');
    if(!content) return;
    
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    try {
        const { data: users, error } = await supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
        if (error) throw error;

        content.innerHTML = `
            <div class="card" style="border-radius:28px; overflow:hidden; padding:0; border:1px solid #e2e8f0; background:white;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                        <tr>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">FOYDALANUVCHI</th>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">HAMYON</th>
                            <th style="padding:15px; text-align:center; font-size:0.7rem; font-weight:800; color:var(--gray);">AMAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users?.map(u => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:15px;">
                                    <div style="font-weight:800; font-size:0.9rem;">${u.first_name || 'Nomsiz'}</div>
                                    <div style="font-size:0.7rem; color:var(--gray);">${u.email}</div>
                                </td>
                                <td style="padding:15px; font-weight:900; color:var(--primary);">${(u.balance || 0).toLocaleString()} UZS</td>
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
        content.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--danger); font-weight:800;">Xatolik yuz berdi: ${e.message}</div>`;
    }
}

async function loadCourierRequests() {
    const content = document.getElementById('adminUsersInnerContent');
    if(!content) return;
    
    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    try {
        const { data: reqs, error } = await supabase.from('courier_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        if (error) throw error;

        if(!reqs?.length) {
            content.innerHTML = '<div style="text-align:center; padding:5rem; color:var(--gray); font-weight:700;">Hali arizalar yo\'q</div>';
            return;
        }

        content.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                ${reqs.map(r => {
                    const transport = r.transport_type || 'walking';
                    return `
                        <div class="card" style="border-radius:24px; padding:25px; background:white; border:1.5px solid #e2e8f0;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                                <div>
                                    <h3 style="font-weight:900; font-size:1.1rem;">${r.full_name || 'Noma\'lum'}</h3>
                                    <div style="font-size:0.75rem; color:var(--gray); font-weight:700;">Tel: ${r.phone || 'Kiritilmagan'}</div>
                                </div>
                                <div style="background:var(--primary-light); color:var(--primary); padding:5px 12px; border-radius:10px; font-size:0.65rem; font-weight:900;">${transport.toUpperCase()}</div>
                            </div>
                            <div style="display:flex; gap:10px;">
                                <button class="btn btn-primary" style="flex:1; height:45px; font-size:0.75rem;" onclick="approveCourierApp('${r.id}', '${r.user_id}', '${transport}')">TASDIQLASH</button>
                                <button class="btn btn-outline" style="flex:1; height:45px; font-size:0.75rem; color:var(--danger); border-color:#fee2e2;" onclick="rejectCourierApp('${r.id}')">RAD ETISH</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (e: any) {
        content.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--danger); font-weight:800;">Xatolik: Arizalarni yuklab bo'lmadi</div>`;
    }
}

(window as any).approveCourierApp = async (appId: string, userId: string, transport: string) => {
    if(!confirm("Kuryerlikka tasdiqlaysizmi?")) return;
    try {
        showToast("Tasdiqlanmoqda...");
        const { error: profileError } = await supabase.from('profiles').update({ role: 'courier', transport_type: transport }).eq('id', userId);
        if (profileError) throw profileError;

        const { error: appError } = await supabase.from('courier_applications').update({ status: 'approved' }).eq('id', appId);
        if (appError) throw appError;

        showToast("Kuryer tasdiqlandi! ✅");
        // Arizalar ro'yxatini yangilash
        loadCourierRequests();
        // Badge raqamini yangilash
        updateReqCount();
    } catch(e: any) { 
        console.error(e);
        showToast("Xatolik yuz berdi!"); 
    }
};

(window as any).rejectCourierApp = async (appId: string) => {
    if(!confirm("Arizani rad etasizmi?")) return;
    try {
        const { error } = await supabase.from('courier_applications').update({ status: 'rejected' }).eq('id', appId);
        if (error) throw error;
        showToast("Ariza rad etildi.");
        loadCourierRequests();
        updateReqCount();
    } catch (e) {
        showToast("Xatolik!");
    }
};

async function loadCourierList() {
    const content = document.getElementById('adminUsersInnerContent');
    if(!content) return;

    content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';
    
    try {
        // Kuryerlar va ularning yetkazib berilgan buyurtmalari sonini olish
        const { data: couriers, error } = await supabase
            .from('profiles')
            .select(`
                *,
                orders:orders(count)
            `)
            .eq('role', 'courier')
            .eq('orders.status', 'delivered');

        if (error) throw error;
        
        content.innerHTML = `
            <div class="card" style="border-radius:28px; overflow:hidden; padding:0; border:1px solid #e2e8f0; background:white;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                        <tr>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">KURER</th>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">TRANSPORT</th>
                            <th style="padding:15px; text-align:center; font-size:0.7rem; font-weight:800; color:var(--gray);">TOPSHIRIQLAR</th>
                            <th style="padding:15px; text-align:left; font-size:0.7rem; font-weight:800; color:var(--gray);">HOLAT</th>
                            <th style="padding:15px; text-align:center; font-size:0.7rem; font-weight:800; color:var(--gray);">AMAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${couriers?.map(u => {
                            const taskCount = u.orders?.[0]?.count || 0;
                            return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:15px;">
                                        <div style="font-weight:800; font-size:0.9rem;">${u.first_name || 'Ismsiz'}</div>
                                        <div style="font-size:0.7rem; color:var(--gray);">${u.email}</div>
                                    </td>
                                    <td style="padding:15px;"><span style="font-size:0.75rem; font-weight:800; color:var(--primary);">${u.transport_type?.toUpperCase() || 'PIYODA'}</span></td>
                                    <td style="padding:15px; text-align:center;">
                                        <div style="display:inline-flex; align-items:center; gap:5px; background:var(--primary-light); color:var(--primary); padding:4px 10px; border-radius:10px; font-weight:900; font-size:0.8rem;">
                                            <i class="fas fa-check-double" style="font-size:0.7rem;"></i> ${taskCount}
                                        </div>
                                    </td>
                                    <td style="padding:15px;">${u.active_status ? '<span style="color:#22c55e; font-weight:800; font-size:0.75rem;">🟢 ONLAYN</span>' : '<span style="color:var(--gray); font-weight:800; font-size:0.75rem;">🔴 OFLAYN</span>'}</td>
                                    <td style="padding:15px; text-align:center;">
                                        <div style="display:flex; justify-content:center; gap:8px;">
                                            <button class="btn" title="Balansni ko'rish" style="width:32px; height:32px; background:#f0fdf4; color:var(--primary); border-radius:8px; border:none;" onclick="showToast('Balans: ${u.balance.toLocaleString()} UZS')"><i class="fas fa-wallet"></i></button>
                                            <button class="btn" style="width:32px; height:32px; background:#fee2e2; color:var(--danger); border-radius:8px; border:none;" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e: any) {
        content.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--danger); font-weight:800;">Xatolik: Ma'lumotlarni yuklab bo'lmadi</div>`;
    }
}

(window as any).deleteUser = async (id: string) => {
    if(!confirm("Akkauntni tizimdan o'chirmoqchimisiz?")) return;
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        showToast("Muvaffaqiyatli o'chirildi.");
        // Qaysi tabdaligiga qarab ro'yxatni yangilash
        const activeTab = document.querySelector('.btn[style*="background: white"]')?.id;
        if(activeTab === 'btnCourierList') loadCourierList();
        else loadUserList();
    } catch (e) {
        showToast("O'chirishda xatolik!");
    }
};
