
import { supabase, showToast, profile, user, loadProfileData } from "./index.tsx";

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const isOnline = p?.active_status || false;

    container.innerHTML = `
        <div style="padding-bottom:120px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <h2 style="font-weight:900;">Kurer Paneli</h2>
                    <p style="font-size:0.75rem; color:${isOnline ? 'var(--primary)' : 'var(--danger)'}; font-weight:800;">
                        STATUS: ${isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}
                    </p>
                </div>
                <button class="btn ${isOnline ? 'btn-outline' : 'btn-primary'}" style="height:45px; width:auto; padding:0 20px;" onclick="toggleCourierStatus()">
                    ${isOnline ? 'DAM OLISH' : 'ISHGA TUSHISH'}
                </button>
            </div>
            
            <div id="courierOrdersContent">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
            </div>
        </div>
    `;

    loadCourierOrders();
}

(window as any).toggleCourierStatus = async () => {
    const { data: p } = await supabase.from('profiles').select('active_status').eq('id', user.id).single();
    const newStatus = !p.active_status;
    
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if(!error) {
        showToast(newStatus ? "Siz onlaynsiz! 🛵" : "Oflayn rejimga o'tdingiz.");
        renderCourierDashboard();
    }
};

async function loadCourierOrders() {
    const content = document.getElementById('courierOrdersContent')!;
    
    // Mijoz ma'lumotlari bilan birga yuklash
    const { data: orders } = await supabase
        .from('orders')
        .select('*, profiles:user_id(first_name, last_name, email)')
        .eq('status', 'confirmed')
        .is('courier_id', null)
        .order('created_at', { ascending: false });

    if(!orders?.length) {
        content.innerHTML = `<div style="text-align:center; padding:5rem; color:var(--gray);">Yangi buyurtmalar yo'q</div>`;
        return;
    }

    content.innerHTML = orders.map(o => {
        const customer = (o as any).profiles;
        const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Noma'lum mijoz";

        return `
        <div class="card" style="padding:20px; border-radius:28px; margin-bottom:15px; border:1.5px solid #f1f5f9; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                <b style="font-size:1.1rem; font-weight:900;">#ORD-${o.id.toString().substring(0,6)}</b>
                <b style="color:var(--primary); font-size:1.1rem;">${o.total_price.toLocaleString()} UZS</b>
            </div>

            <!-- MIJOZ -->
            <div style="background:#f8fafc; padding:12px 15px; border-radius:15px; margin-bottom:12px; display:flex; align-items:center; gap:10px; border:1px solid #e2e8f0;">
                <i class="fas fa-user-circle" style="color:#64748b; font-size:1.2rem;"></i>
                <div style="font-weight:800; font-size:0.85rem; color:var(--text);">${fullName}</div>
            </div>

            <div style="font-size:0.85rem; margin-bottom:15px; font-weight:600;">
                <div style="margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> ${o.address_text}</div>
                <div style="color:var(--gray);">Dostavka: <b>${o.delivery_cost.toLocaleString()} UZS</b></div>
                
                ${o.comment ? `
                    <div style="margin-top:10px; padding:12px; background:#fff9db; border-radius:12px; border:1px dashed #ffeeba; color:#856404; font-size:0.8rem;">
                        <i class="fas fa-sticky-note"></i> MIJOZ IZOHI: "${o.comment}"
                    </div>
                ` : ''}
            </div>
            <button class="btn btn-primary" style="width:100%; height:55px; border-radius:18px; font-size:1rem;" onclick="acceptOrder(${o.id})">BUYURTMANI OLISH</button>
        </div>
    `}).join('');
}

(window as any).acceptOrder = async (id: number) => {
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', id).is('courier_id', null);
    if(!error) {
        showToast("Buyurtma olingan! 🛵");
        renderCourierDashboard();
    } else {
        showToast("Xatolik yoki buyurtma olingan.");
    }
};
