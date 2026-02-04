
import { supabase } from "./index.tsx";

export async function renderAdminDashboard() {
    // ID: adminTabContent bo'lishi shart!
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
                <div><p style="color:var(--gray); font-size:0.65rem; font-weight:800; text-transform:uppercase;">Mijozlar</p><h2 id="s_users" style="font-size:1.2rem; font-weight:900;">...</h2></div>
            </div>
        </div>
        <div id="dashboardDetails"></div>
    `;

    loadLiveStats();
}

async function loadLiveStats() {
    const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    const revEl = document.getElementById('s_rev');
    const ordEl = document.getElementById('s_orders');
    const userEl = document.getElementById('s_users');

    if(revEl) revEl.innerText = "4,820,000 UZS";
    if(ordEl) ordEl.innerText = (oCount || 0).toString();
    if(userEl) userEl.innerText = (uCount || 0).toString();
}
