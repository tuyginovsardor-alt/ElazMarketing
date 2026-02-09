
import { supabase, showToast } from "./index.tsx";

export async function renderAdminCouriers() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px; height: calc(100vh - 180px);">
            <!-- LEFT: LOGS FEED -->
            <div style="display:flex; flex-direction:column; background:white; border-radius:30px; border:1.5px solid #f1f5f9; overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                    <h3 style="font-weight:900; font-size:1rem; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-list-check" style="color:var(--primary);"></i> JONLI LOGLAR
                    </h3>
                    <span style="background:var(--primary); color:white; padding:4px 10px; border-radius:10px; font-size:0.6rem; font-weight:900; animation:pulse 2s infinite;">LIVE</span>
                </div>
                <div id="courierLogsContainer" style="flex:1; overflow-y:auto; padding:15px; display:flex; flex-direction:column; gap:10px;">
                    <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                </div>
            </div>

            <!-- RIGHT: COURIERS LIST & STATS -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="background:white; border-radius:30px; border:1.5px solid #f1f5f9; padding:20px; flex:1; overflow-y:auto;">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:20px;"><i class="fas fa-motorcycle" style="color:#3b82f6;"></i> KURYERLAR</h3>
                    <div id="adminCouriersGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i></div>
                    </div>
                </div>

                <!-- SELECTABLE STATS CARD -->
                <div id="courierDetailCard" style="background:var(--dark); color:white; border-radius:30px; padding:25px; display:none;">
                    <!-- Detail content injected here -->
                </div>
            </div>
        </div>
    `;

    loadAdminCouriersData();
}

async function loadAdminCouriersData() {
    const logsCont = document.getElementById('courierLogsContainer');
    const gridCont = document.getElementById('adminCouriersGrid');
    if(!logsCont || !gridCont) return;

    // Load Logs
    const { data: logs } = await supabase.from('courier_logs').select(`*, profiles:courier_id(first_name, avatar_url)`).order('created_at', { ascending: false }).limit(30);
    if(logs) {
        logsCont.innerHTML = logs.map(l => `
            <div style="background:#f8fafc; padding:12px 15px; border-radius:18px; border:1px solid #f1f5f9; display:flex; gap:12px; align-items:center;">
                <div style="width:36px; height:36px; border-radius:10px; background:white; overflow:hidden; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                    ${(l as any).profiles?.avatar_url ? `<img src="${(l as any).profiles.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-ninja" style="color:#64748b; font-size:0.8rem;"></i>`}
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-weight:900; font-size:0.75rem;">${(l as any).profiles?.first_name || 'Noma\'lum'}</span>
                        <span style="font-size:0.6rem; color:var(--gray); font-weight:800;">${new Date(l.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style="font-size:0.7rem; color:var(--text); font-weight:700; margin-top:2px;">${l.action_text}</div>
                </div>
            </div>
        `).join('');
    }

    // Load Couriers
    const { data: couriers } = await supabase.from('profiles').select('*').eq('role', 'courier');
    if(couriers) {
        gridCont.innerHTML = couriers.map(c => `
            <div onclick="window.showCourierAdminDetails('${c.id}')" style="background:#f8fafc; padding:15px; border-radius:22px; border:2px solid ${c.active_status ? 'var(--primary)' : 'transparent'}; cursor:pointer; display:flex; align-items:center; gap:12px; position:relative;">
                <div style="width:45px; height:45px; border-radius:14px; background:white; overflow:hidden; border:1.5px solid #e2e8f0;">
                    ${c.avatar_url ? `<img src="${c.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-ninja" style="color:#cbd5e1; margin:10px;"></i>`}
                </div>
                <div>
                    <div style="font-weight:900; font-size:0.85rem;">${c.first_name}</div>
                    <div style="font-size:0.65rem; font-weight:800; color:${c.active_status ? 'var(--primary)' : 'var(--gray)'};">
                        ${c.active_status ? '🟢 ONLAYN' : '⚪ OFLAYN'}
                    </div>
                </div>
                <div style="position:absolute; right:15px; top:50%; transform:translateY(-50%); text-align:right;">
                    <div style="font-weight:900; font-size:0.8rem;">⭐ ${c.rating || 5.0}</div>
                    <div style="font-size:0.6rem; color:var(--gray); font-weight:800;">REYTINNG</div>
                </div>
            </div>
        `).join('');
    }
}

(window as any).showCourierAdminDetails = async (id: string) => {
    const detail = document.getElementById('courierDetailCard');
    if(!detail) return;
    
    const { data: courier } = await supabase.from('profiles').select('*').eq('id', id).single();
    const { count: completed } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('courier_id', id).eq('status', 'delivered');
    const { data: active } = await supabase.from('orders').select('*').eq('courier_id', id).eq('status', 'delivering').maybeSingle();

    detail.style.display = 'block';
    detail.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; border-radius:16px; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                    <i class="fas fa-user-ninja"></i>
                </div>
                <div>
                    <h2 style="font-weight:900; font-size:1.2rem; margin:0;">${courier.first_name}</h2>
                    <span style="font-size:0.7rem; font-weight:800; opacity:0.6;">ID: ${courier.id.substring(0,8)}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:900; font-size:1.3rem; color:var(--primary);">${(courier.balance || 0).toLocaleString()} UZS</div>
                <div style="font-size:0.6rem; font-weight:800; opacity:0.6;">JORIY BALANS</div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; text-align:center;">
                <div style="font-size:1.5rem; font-weight:900;">${completed || 0}</div>
                <div style="font-size:0.6rem; font-weight:800; opacity:0.6;">BAJARILGAN</div>
            </div>
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; text-align:center;">
                <div style="font-size:1.5rem; font-weight:900;">${active ? '1' : '0'}</div>
                <div style="font-size:0.6rem; font-weight:800; opacity:0.6;">HOZIRGI ISHI</div>
            </div>
        </div>

        ${active ? `
            <div style="background:var(--primary); color:white; padding:20px; border-radius:22px; margin-bottom:10px;">
                <div style="font-weight:900; font-size:0.8rem; margin-bottom:10px; display:flex; justify-content:space-between;">
                    <span>JARAYONDAGI BUYURTMA</span>
                    <span>#ORD-${active.id.toString().substring(0,6)}</span>
                </div>
                <div style="font-size:0.85rem; font-weight:800;"><i class="fas fa-location-dot"></i> ${active.address_text}</div>
            </div>
        ` : `
            <div style="text-align:center; padding:15px; border:1px dashed rgba(255,255,255,0.2); border-radius:20px; font-size:0.75rem; opacity:0.6;">
                Hozircha bo'sh
            </div>
        `}
    `;
};
