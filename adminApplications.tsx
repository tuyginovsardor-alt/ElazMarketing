
import { supabase, showToast } from "./index.tsx";

export async function renderAdminApplications() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    try {
        const { data: apps, error } = await supabase.from('courier_applications').select('*').order('created_at', { ascending: false });

        if(error) throw error;

        if(!apps?.length) {
            container.innerHTML = `<div style="text-align:center; padding:5rem; opacity:0.5;"><i class="fas fa-folder-open fa-3x"></i><p style="margin-top:15px; font-weight:900;">Yangi arizalar mavjud emas</p></div>`;
            return;
        }

        container.innerHTML = `
            <h2 style="font-weight:900; margin-bottom:25px;">Kuryerlikka Arizalar</h2>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                ${apps.map(a => `
                    <div class="card" style="padding:22px; border-radius:28px; background:white; position:relative; overflow:hidden;">
                        <div style="position:absolute; top:0; right:0; background:#f1f5f9; padding:8px 15px; font-size:0.6rem; font-weight:800; border-radius:0 0 0 15px;">
                            ${new Date(a.created_at).toLocaleDateString()}
                        </div>
                        
                        <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                            <div style="width:50px; height:50px; border-radius:15px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div>
                                <div style="font-weight:900; font-size:1rem;">${a.full_name || 'Ismsiz'}</div>
                                <div style="font-size:0.75rem; color:var(--gray); font-weight:800;">${a.phone || 'Tel yo\'q'}</div>
                            </div>
                        </div>

                        <div style="background:#f8fafc; padding:15px; border-radius:18px; margin-bottom:20px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <span style="font-size:0.65rem; font-weight:800; color:var(--gray);">TRANSPORT:</span>
                                <span style="font-size:0.75rem; font-weight:900; color:var(--primary);">${(a.transport_type || 'piyoda').toUpperCase()}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="font-size:0.65rem; font-weight:800; color:var(--gray);">HUDUDLAR:</span>
                                <span style="font-size:0.7rem; font-weight:900; text-align:right;">${Array.isArray(a.work_zones) ? a.work_zones.join(', ') : 'Belgilanmagan'}</span>
                            </div>
                        </div>

                        <div style="display:flex; gap:10px;">
                            <button onclick="window.approveApplication('${a.id}', '${a.user_id}')" class="btn btn-primary" style="flex:1.5; height:45px; font-size:0.75rem; border-radius:12px;">TASDIQLASH</button>
                            <button onclick="window.rejectApplication('${a.id}')" class="btn" style="flex:1; height:45px; font-size:0.75rem; border-radius:12px; background:#fee2e2; color:var(--danger); border:none;">RAD ETISH</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e: any) {
        container.innerHTML = `<div style="text-align:center; padding:5rem; color:var(--danger);"><i class="fas fa-exclamation-triangle fa-2x"></i><p style="margin-top:10px; font-weight:800;">Xatolik: ${e.message}</p><button onclick="renderAdminApplications()" class="btn btn-outline" style="margin-top:15px; height:40px; font-size:0.7rem;">QAYTA URINISH</button></div>`;
    }
}

(window as any).approveApplication = async (appId: string, userId: string) => {
    if(!confirm("Ushbu foydalanuvchini kuryer sifatida tasdiqlaysizmi?")) return;
    
    try {
        // MUHIM: Ham role, ham is_approved o'zgarishi shart!
        const { error: roleErr } = await supabase.from('profiles').update({ 
            role: 'courier',
            is_approved: true,
            active_status: false 
        }).eq('id', userId);
        
        if(roleErr) throw roleErr;

        await supabase.from('courier_applications').delete().eq('id', appId);
        showToast("Kuryer muvaffaqiyatli tasdiqlandi! ✅");
        renderAdminApplications();
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
};

(window as any).rejectApplication = async (appId: string) => {
    if(!confirm("Arizani o'chirib yuborasizmi?")) return;
    await supabase.from('courier_applications').delete().eq('id', appId);
    showToast("Ariza o'chirildi.");
    renderAdminApplications();
};
