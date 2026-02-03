
import { supabase } from "./index.tsx";

export async function renderAdminDashboard() {
    const container = document.getElementById('admin_tab_dash');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin-bottom:30px;">
            <div class="card" style="border:none; background:white; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:20px; padding:25px; border-radius:24px;">
                <div style="width:60px; height:60px; border-radius:18px; background:#f0fdf4; color:#22c55e; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                    <i class="fas fa-coins"></i>
                </div>
                <div>
                    <p style="color:var(--gray); font-size:0.8rem; font-weight:800; text-transform:uppercase;">Umumiy Savdo</p>
                    <h2 id="s_rev" style="font-size:1.6rem; font-weight:900;">...</h2>
                </div>
            </div>
            
            <div class="card" style="border:none; background:white; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:20px; padding:25px; border-radius:24px;">
                <div style="width:60px; height:60px; border-radius:18px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div>
                    <p style="color:var(--gray); font-size:0.8rem; font-weight:800; text-transform:uppercase;">Buyurtmalar</p>
                    <h2 id="s_orders" style="font-size:1.6rem; font-weight:900;">...</h2>
                </div>
            </div>

            <div class="card" style="border:none; background:white; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:20px; padding:25px; border-radius:24px;">
                <div style="width:60px; height:60px; border-radius:18px; background:#fefce8; color:#eab308; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <p style="color:var(--gray); font-size:0.8rem; font-weight:800; text-transform:uppercase;">Mijozlar</p>
                    <h2 id="s_users" style="font-size:1.6rem; font-weight:900;">...</h2>
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:20px;">
            <div class="card" style="padding:25px; border-radius:24px; border:none; background:white; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h4 style="font-weight:900;">ENG YAXSHI KURYERLAR (LEADERBOARD)</h4>
                </div>
                <div id="courierLeaderboard" style="display:flex; flex-direction:column; gap:12px;">
                    <!-- Leaderboard content -->
                </div>
            </div>

            <div class="card" style="padding:25px; border-radius:24px; border:none; background:white; box-shadow:var(--shadow-sm);">
                <h4 style="font-weight:900; margin-bottom:20px;">HUDUDLAR BO'YIChA</h4>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    ${['Bag\'dod Markazi', 'Guliston shahri'].map((h, i) => `
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:5px;">
                                <span>${h}</span>
                                <span>${75 - (i*25)}%</span>
                            </div>
                            <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
                                <div style="width:${75 - (i*25)}%; height:100%; background:var(--primary);"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    loadLiveStats();
}

async function loadLiveStats() {
    const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    // Top kuryerlarni olish (shartli ravishda profiles'dan)
    const { data: topCouriers } = await supabase.from('profiles').select('*').eq('role', 'courier').order('balance', { ascending: false }).limit(5);

    document.getElementById('s_rev')!.innerText = "4,820,000 UZS";
    document.getElementById('s_orders')!.innerText = (oCount || 0).toString();
    document.getElementById('s_users')!.innerText = (uCount || 0).toString();

    const leaderboard = document.getElementById('courierLeaderboard');
    if(leaderboard && topCouriers) {
        leaderboard.innerHTML = topCouriers.map((c, i) => `
            <div style="display:flex; align-items:center; gap:15px; padding:12px; border-radius:15px; background:${i === 0 ? 'var(--primary-light)' : '#f8fafc'}; border:1px solid ${i === 0 ? 'var(--primary)' : '#f1f5f9'};">
                <div style="width:32px; height:32px; border-radius:50%; background:white; display:flex; align-items:center; justify-content:center; font-weight:900; color:${i === 0 ? 'var(--primary)' : 'var(--gray)'}; font-size:0.8rem;">
                    ${i + 1}
                </div>
                <div style="flex:1;">
                    <div style="font-weight:800; font-size:0.85rem;">${c.first_name}</div>
                    <div style="font-size:0.65rem; color:var(--gray); font-weight:700;">${c.transport_type}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:900; color:var(--primary); font-size:0.9rem;">${c.balance.toLocaleString()}</div>
                    <div style="font-size:0.6rem; color:var(--gray);">Topilgan foyda</div>
                </div>
            </div>
        `).join('');
    }
}
