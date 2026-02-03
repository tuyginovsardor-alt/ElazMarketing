
import { supabase, showToast, profile, user, loadProfileData } from "./index.tsx";

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container) return;

    // Eng so'nggi ma'lumotni olish
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const isOnline = p?.active_status || false;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h2 style="font-weight:900; font-size:1.6rem;">Ish Joyi</h2>
                    <p style="font-size:0.75rem; font-weight:700; color:${isOnline ? 'var(--primary)' : 'var(--gray)'};">
                        ${isOnline ? '🟢 SIZ ONLAYNSIZ' : '🔴 SIZ OFLAYNSIZ'}
                    </p>
                </div>
                <div style="background:var(--primary); color:white; width:45px; height:45px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-motorcycle"></i>
                </div>
            </div>
            
            <div id="courierStats" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                <div class="card" style="padding:15px; text-align:center; border:none; background:#f0fdf4; border-radius:22px;">
                    <div style="font-size:0.65rem; font-weight:800; color:var(--primary); text-transform:uppercase;">BALANS</div>
                    <div style="font-weight:900; font-size:1.1rem; margin-top:5px;">${(p?.balance || 0).toLocaleString()} <small>so'm</small></div>
                </div>
                <div class="card" style="padding:15px; text-align:center; border:none; background:#eff6ff; border-radius:22px;">
                    <div style="font-size:0.65rem; font-weight:800; color:#3b82f6; text-transform:uppercase;">STATUS</div>
                    <button class="btn" style="height:32px; font-size:0.65rem; margin-top:5px; width:100%; background:${isOnline ? 'var(--danger)' : 'var(--primary)'}; color:white;" onclick="toggleCourierStatus()">
                        ${isOnline ? 'STOP' : 'START'}
                    </button>
                </div>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:25px; background:#f1f5f9; padding:5px; border-radius:16px;">
                <button class="btn" id="btnAvailOrders" style="flex:1; height:44px; font-size:0.8rem; background:white; border-radius:12px; font-weight:800;" onclick="toggleCourierTab('avail')">BOZOR</button>
                <button class="btn" id="btnMyOrders" style="flex:1; height:44px; font-size:0.8rem; background:transparent; border-radius:12px; font-weight:800; color:var(--gray);" onclick="toggleCourierTab('mine')">MENING ISHIM</button>
            </div>

            <div id="courierOrdersContent">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    loadCourierOrders('avail');
}

(window as any).toggleCourierStatus = async () => {
    const { data: p } = await supabase.from('profiles').select('active_status').eq('id', user.id).single();
    const newStatus = !p.active_status;
    
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if(!error) {
        showToast(newStatus ? "Ishga tushdingiz! 🛵" : "Dam olishga chiqdingiz 🛌");
        renderCourierDashboard();
    }
};

export function toggleCourierTab(tab: string) {
    const bAvail = document.getElementById('btnAvailOrders')!;
    const bMine = document.getElementById('btnMyOrders')!;
    if(tab === 'avail') {
        bAvail.style.background = 'white'; bAvail.style.color = 'var(--text)';
        bMine.style.background = 'transparent'; bMine.style.color = 'var(--gray)';
        loadCourierOrders('avail');
    } else {
        bMine.style.background = 'white'; bMine.style.color = 'var(--text)';
        bAvail.style.background = 'transparent'; bAvail.style.color = 'var(--gray)';
        loadCourierOrders('mine');
    }
}
(window as any).toggleCourierTab = toggleCourierTab;

async function loadCourierOrders(tab: 'avail' | 'mine') {
    const content = document.getElementById('courierOrdersContent');
    if(!content) return;

    let query;
    if(tab === 'avail') {
        query = supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null).order('created_at', { ascending: false });
    } else {
        query = supabase.from('orders').select('*').eq('courier_id', user.id).in('status', ['delivering', 'delivered']).order('created_at', { ascending: false });
    }

    const { data: orders } = await query;

    if(!orders || orders.length === 0) {
        content.innerHTML = `<div style="text-align:center; padding:5rem 2rem; color:var(--gray); font-weight:700;">${tab === 'avail' ? 'Yangi buyurtmalar yo\'q' : 'Ishlar ro\'yxati bo\'sh'}</div>`;
        return;
    }

    content.innerHTML = orders.map(o => `
        <div class="card" style="padding:15px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:15px; position:relative; background:white;">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                <b style="font-size:1rem;">#ORD-${o.id}</b>
                <span style="font-size:0.7rem; font-weight:900; color:var(--primary);">${o.status.toUpperCase()}</span>
            </div>
            <div style="font-size:0.85rem; font-weight:700; margin-bottom:15px;">
                <i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> ${o.address_text}
                <div style="margin-top:5px; color:var(--gray);">Dostavka: <b>${o.delivery_cost.toLocaleString()} so'm</b></div>
            </div>
            ${o.status === 'confirmed' ? `
                <button class="btn btn-primary" style="width:100%; height:45px; font-size:0.8rem;" onclick="acceptOrderFromDashboard(${o.id})">QABUL QILISH</button>
            ` : (o.status === 'delivering' ? `
                <button class="btn btn-primary" style="width:100%; height:45px; font-size:0.8rem;" onclick="completeOrderFromDashboard(${o.id})">YETKAZDIM ✅</button>
            ` : '<div style="text-align:center; color:var(--primary); font-weight:900;">BAJARILDI ✨</div>')}
        </div>
    `).join('');
}

(window as any).acceptOrderFromDashboard = async (id: number) => {
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', id);
    if(!error) {
        showToast("Buyurtma qabul qilindi! 🛵");
        toggleCourierTab('mine');
    }
};

(window as any).completeOrderFromDashboard = async (id: number) => {
    if(!confirm("Yetkazib bo'ldingizmi?")) return;
    const { data: order } = await supabase.from('orders').select('delivery_cost').eq('id', id).single();
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
    if(!error) {
        const { data: courier } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        await supabase.from('profiles').update({ balance: (courier.balance || 0) + (order.delivery_cost || 5000) }).eq('id', user.id);
        showToast("Barakalla! Balans yangilandi 💰");
        toggleCourierTab('mine');
    }
};
