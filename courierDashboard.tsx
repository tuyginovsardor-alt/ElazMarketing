
import { supabase, showToast, profile, user } from "./index.tsx";

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight:900; font-size:1.6rem;">Kuryer Ish Joyi</h2>
                <div style="background:var(--primary); color:white; width:45px; height:45px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-motorcycle"></i>
                </div>
            </div>
            
            <div id="courierStats" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:30px;">
                <div class="card" style="padding:15px; text-align:center; border:none; background:#f0fdf4; border-radius:22px;">
                    <div style="font-size:0.65rem; font-weight:800; color:var(--primary); text-transform:uppercase;">BUGUNGI DAROMAD</div>
                    <div id="c_today_earn" style="font-weight:900; font-size:1.2rem; margin-top:5px; color:var(--text);">0 <small>UZS</small></div>
                </div>
                <div class="card" style="padding:15px; text-align:center; border:none; background:#eff6ff; border-radius:22px;">
                    <div style="font-size:0.65rem; font-weight:800; color:#3b82f6; text-transform:uppercase;">YETKAZILDI</div>
                    <div id="c_today_count" style="font-weight:900; font-size:1.2rem; margin-top:5px; color:var(--text);">0 <small>ta</small></div>
                </div>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:25px; background:#f1f5f9; padding:5px; border-radius:16px;">
                <button class="btn" id="btnAvailOrders" style="flex:1; height:44px; font-size:0.8rem; background:white; border-radius:12px; font-weight:800; color:var(--text); box-shadow:var(--shadow-sm);" onclick="toggleCourierTab('avail')">MAVJUDLARI</button>
                <button class="btn" id="btnMyOrders" style="flex:1; height:44px; font-size:0.8rem; background:transparent; border-radius:12px; font-weight:800; color:var(--gray);" onclick="toggleCourierTab('mine')">MENING ISHLARIM</button>
            </div>

            <div id="courierOrdersContent">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    loadCourierOrders('avail');
}

// Fixed: Defined as a named function to be accessible within the module scope for acceptOrderCourier
export function toggleCourierTab(tab: string) {
    const bAvail = document.getElementById('btnAvailOrders')!;
    const bMine = document.getElementById('btnMyOrders')!;
    
    if(tab === 'avail') {
        bAvail.style.background = 'white'; bAvail.style.color = 'var(--text)'; bAvail.style.boxShadow = 'var(--shadow-sm)';
        bMine.style.background = 'transparent'; bMine.style.color = 'var(--gray)'; bMine.style.boxShadow = 'none';
        loadCourierOrders('avail');
    } else {
        bMine.style.background = 'white'; bMine.style.color = 'var(--text)'; bMine.style.boxShadow = 'var(--shadow-sm)';
        bAvail.style.background = 'transparent'; bAvail.style.color = 'var(--gray)'; bAvail.style.boxShadow = 'none';
        loadCourierOrders('mine');
    }
}
(window as any).toggleCourierTab = toggleCourierTab;

async function loadCourierOrders(tab: 'avail' | 'mine') {
    const content = document.getElementById('courierOrdersContent');
    if(!content) return;

    let query;
    if(tab === 'avail') {
        // Faqat tasdiqlangan va hali kuryer biriktirilmagan buyurtmalar
        query = supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null).order('created_at', { ascending: false });
    } else {
        // Kuryerning o'zi qabul qilgan buyurtmalari
        query = supabase.from('orders').select('*').eq('courier_id', user.id).neq('status', 'cancelled').order('created_at', { ascending: false });
    }

    const { data: orders } = await query;

    // Statlar uchun hamma buyurtmalarini olish
    const { data: statsData } = await supabase.from('orders').select('delivery_cost').eq('courier_id', user.id).eq('status', 'delivered');
    const totalEarn = statsData?.reduce((acc, o) => acc + (o.delivery_cost || 0), 0) || 0;
    const totalCount = statsData?.length || 0;

    const earnEl = document.getElementById('c_today_earn');
    const countEl = document.getElementById('c_today_count');
    if(earnEl) earnEl.innerHTML = `${totalEarn.toLocaleString()} <small>UZS</small>`;
    if(countEl) countEl.innerHTML = `${totalCount} <small>ta</small>`;

    if(!orders || orders.length === 0) {
        content.innerHTML = `<div style="text-align:center; padding:5rem 2rem; color:var(--gray); font-weight:700;">Hozircha buyurtmalar yo'q.</div>`;
        return;
    }

    content.innerHTML = orders.map(o => `
        <div class="card" style="padding:20px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:15px; position:relative; background:white;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <div>
                    <div style="font-weight:900; font-size:1.1rem;">#ORD-${o.id}</div>
                    <div style="font-size:0.75rem; color:var(--gray); font-weight:700;">${new Date(o.created_at).toLocaleTimeString()}</div>
                </div>
                <div style="background:${o.status === 'delivered' ? '#f0fdf4' : '#fff7ed'}; color:${o.status === 'delivered' ? '#16a34a' : '#ea580c'}; padding:5px 12px; border-radius:10px; font-size:0.65rem; font-weight:900; text-transform:uppercase;">
                    ${o.status === 'delivered' ? 'Yetkazildi' : (o.status === 'delivering' ? 'Yo\'lda' : 'Tasdiqlangan')}
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <div style="font-size:0.75rem; color:var(--gray); font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px;">Yetkazish manzili:</div>
                <div style="font-weight:800; font-size:0.95rem; color:var(--text); line-height:1.4;">${o.address_text || 'Aniq manzil yo\'q'}</div>
                <div style="color:var(--primary); font-weight:900; font-size:0.95rem; margin-top:8px;"><i class="fas fa-phone"></i> ${o.phone_number || '-'}</div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #f1f5f9; padding-top:15px;">
                <div>
                    <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">XIZMAT HAQI:</div>
                    <div style="font-weight:900; color:var(--text); font-size:1.1rem;">${(o.delivery_cost || 5000).toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                </div>
                
                ${tab === 'avail' ? `
                    <button class="btn btn-primary" style="height:50px; padding:0 25px; font-size:0.85rem; border-radius:16px;" onclick="acceptOrderCourier(${o.id})">
                        QABUL QILISH <i class="fas fa-check"></i>
                    </button>
                ` : (o.status === 'confirmed' ? `
                    <button class="btn btn-primary" style="height:50px; padding:0 25px; font-size:0.85rem; border-radius:16px; background:var(--dark);" onclick="startDeliveringCourier(${o.id})">
                        YO'LGA CHIQDIM <i class="fas fa-motorcycle"></i>
                    </button>
                ` : (o.status === 'delivering' ? `
                    <button class="btn btn-primary" style="height:50px; padding:0 25px; font-size:0.85rem; border-radius:16px;" onclick="completeOrderCourier(${o.id})">
                        YETKAZDIM <i class="fas fa-check-double"></i>
                    </button>
                ` : '<i class="fas fa-check-circle" style="color:var(--primary); font-size:1.8rem;"></i>'))}
            </div>
        </div>
    `).join('');
}

(window as any).acceptOrderCourier = async (id: number) => {
    showToast("Qabul qilinmoqda...");
    const { error } = await supabase.from('orders').update({ 
        courier_id: user.id,
        status: 'confirmed' 
    }).eq('id', id);
    
    if(!error) {
        showToast("Buyurtma sizga biriktirildi! 👍");
        toggleCourierTab('mine');
    } else showToast("Xato: " + error.message);
};

(window as any).startDeliveringCourier = async (id: number) => {
    const { error } = await supabase.from('orders').update({ status: 'delivering' }).eq('id', id);
    if(!error) {
        showToast("Omad! Manzil sari yo'lga chiqdingiz 🛵");
        loadCourierOrders('mine');
    }
};

(window as any).completeOrderCourier = async (id: number) => {
    if(!confirm("Mijoz mahsulotni qabul qildimi?")) return;
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
    if(!error) {
        showToast("Barakalla! Daromad hisobingizga qo'shildi ✨");
        loadCourierOrders('mine');
    }
};
