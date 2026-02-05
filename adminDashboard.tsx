
import { supabase } from "./index.tsx";

export async function renderAdminDashboard() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:15px; margin-bottom:25px;">
            <div class="card" style="border:none; background:white; box-shadow:var(--shadow-sm); padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; border-radius:15px; background:#f0fdf4; color:#22c55e; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-coins"></i></div>
                <div><p style="color:var(--gray); font-size:0.65rem; font-weight:800; text-transform:uppercase;">Savdo</p><h2 id="s_rev" style="font-size:1.2rem; font-weight:900;">...</h2></div>
            </div>
            <div class="card" style="border:none; background:white; box-shadow:var(--shadow-sm); padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; border-radius:15px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-shopping-cart"></i></div>
                <div><p style="color:var(--gray); font-size:0.65rem; font-weight:800; text-transform:uppercase;">Buyurtmalar</p><h2 id="s_orders" style="font-size:1.2rem; font-weight:900;">...</h2></div>
            </div>
            <div class="card" style="border:none; background:white; box-shadow:var(--shadow-sm); padding:20px; border-radius:20px; display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; border-radius:15px; background:#fefce8; color:#eab308; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-users"></i></div>
                <div><p style="color:var(--gray); font-size:0.65rem; font-weight:800; text-transform:uppercase;">Jami Foydalanuvchilar</p><h2 id="s_users" style="font-size:1.2rem; font-weight:900;">...</h2></div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px; margin-bottom:25px;">
             <div class="card" style="border:none; background:#f8fafc; padding:15px; border-radius:18px; text-align:center;">
                <p style="font-size:0.6rem; font-weight:800; color:var(--gray); margin-bottom:5px;">MIJOZLAR</p>
                <h3 id="c_users" style="font-weight:900; color:var(--text);">0</h3>
            </div>
            <div class="card" style="border:none; background:#f8fafc; padding:15px; border-radius:18px; text-align:center;">
                <p style="font-size:0.6rem; font-weight:800; color:var(--gray); margin-bottom:5px;">KURYERLAR</p>
                <h3 id="c_couriers" style="font-weight:900; color:var(--primary);">0</h3>
            </div>
            <div class="card" style="border:none; background:#f8fafc; padding:15px; border-radius:18px; text-align:center;">
                <p style="font-size:0.6rem; font-weight:800; color:var(--gray); margin-bottom:5px;">ADMIN/STAFF</p>
                <h3 id="c_admins" style="font-weight:900; color:var(--dark);">0</h3>
            </div>
        </div>
        <div id="dashboardDetails"></div>
    `;

    loadLiveStats();
}

async function loadLiveStats() {
    try {
        const { data: profiles } = await supabase.from('profiles').select('role');
        const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        
        const revEl = document.getElementById('s_rev');
        const ordEl = document.getElementById('s_orders');
        const userEl = document.getElementById('s_users');
        const cUserEl = document.getElementById('c_users');
        const cCourierEl = document.getElementById('c_couriers');
        const cAdminEl = document.getElementById('c_admins');

        if(revEl) revEl.innerText = "4,820,000 UZS"; // Buni keyinchalik dinamik qilsa bo'ladi
        if(ordEl) ordEl.innerText = (oCount || 0).toString();
        
        if(profiles) {
            if(userEl) userEl.innerText = profiles.length.toString();
            if(cUserEl) cUserEl.innerText = profiles.filter(p => p.role === 'user').length.toString();
            if(cCourierEl) cCourierEl.innerText = profiles.filter(p => p.role === 'courier').length.toString();
            if(cAdminEl) cAdminEl.innerText = profiles.filter(p => ['admin', 'staff'].includes(p.role)).length.toString();
        }
    } catch(e) {
        console.error("Dashboard Stats Error:", e);
    }
}
