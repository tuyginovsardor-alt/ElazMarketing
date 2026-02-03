
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

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
            <div class="card" style="min-height:400px; padding:25px; border-radius:24px; border:none; background:white; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h4 style="font-weight:900;">SAVDO DINAMIKASI</h4>
                </div>
                <div style="height:250px; display:flex; align-items:flex-end; gap:15px; padding:20px 0; border-bottom:1px solid #f1f5f9;">
                    ${[40, 70, 55, 90, 65, 85, 100].map(h => `
                        <div style="flex:1; background:var(--primary); height:${h}%; border-radius:8px 8px 0 0; position:relative;">
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:15px; margin-top:10px; color:var(--gray); font-size:0.7rem; font-weight:800; text-align:center;">
                    ${['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => `<div style="flex:1;">${d}</div>`).join('')}
                </div>
            </div>

            <div class="card" style="padding:25px; border-radius:24px; border:none; background:white; box-shadow:var(--shadow-sm);">
                <h4 style="font-weight:900; margin-bottom:20px;">HUDUDLAR</h4>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    ${['Bag\'dod', 'Guliston', 'Navoiy'].map((h, i) => `
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:5px;">
                                <span>${h}</span>
                                <span>${90 - (i*20)}%</span>
                            </div>
                            <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
                                <div style="width:${90 - (i*20)}%; height:100%; background:var(--primary);"></div>
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
    
    document.getElementById('s_rev')!.innerText = "2,450,000 UZS";
    document.getElementById('s_orders')!.innerText = (oCount || 0).toString();
    document.getElementById('s_users')!.innerText = (uCount || 0).toString();
}
