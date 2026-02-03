
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
    const { data: orders } = await supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null).order('created_at', { ascending: false });

    if(!orders?.length) {
        content.innerHTML = `<div style="text-align:center; padding:5rem; color:var(--gray);">Yangi buyurtmalar yo'q</div>`;
        return;
    }

    content.innerHTML = orders.map(o => `
        <div class="card" style="padding:20px; border-radius:24px; margin-bottom:15px; border:1px solid #f1f5f9;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <b style="font-size:1.1rem;">#ORD-${o.id}</b>
                <b style="color:var(--primary);">${o.total_price.toLocaleString()} UZS</b>
            </div>
            <div style="font-size:0.85rem; margin-bottom:15px;">
                <i class="fas fa-map-marker-alt"></i> ${o.address_text}
                <div style="color:var(--gray); margin-top:5px;">Yetkazish: <b>${o.delivery_cost.toLocaleString()}</b></div>
            </div>
            <button class="btn btn-primary" style="width:100%; height:45px;" onclick="acceptOrder(${o.id})">QABUL QILISH</button>
        </div>
    `).join('');
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
