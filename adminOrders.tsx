
import { supabase, showToast } from "./index.tsx";

export async function renderAdminOrders() {
    const container = document.getElementById('admin_tab_orders');
    if(!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if(!orders?.length) {
        container.innerHTML = `<div style="text-align:center; padding:3rem;">Buyurtmalar yo'q</div>`;
        return;
    }

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:20px; padding:10px;">
            ${orders.map(o => `
                <div class="card" style="padding:20px; border-radius:24px; background:white; border:1px solid #f1f5f9; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;">
                    ${o.status === 'pending' ? '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--danger);"></div>' : ''}
                    ${o.status === 'confirmed' ? '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--primary);"></div>' : ''}

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div>
                            <b style="font-size:1.1rem;">#ORD-${o.id}</b>
                            <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">${new Date(o.created_at).toLocaleString()}</div>
                        </div>
                        <span style="padding:5px 12px; border-radius:10px; background:${o.status === 'pending' ? '#fef2f2' : (o.status === 'confirmed' ? '#f0fdf4' : '#f1f5f9')}; font-size:0.7rem; font-weight:900; text-transform:uppercase; color:${o.status === 'pending' ? '#ef4444' : (o.status === 'confirmed' ? 'var(--primary)' : 'var(--gray)')};">
                            ${o.status === 'pending' ? 'YANGI' : (o.status === 'confirmed' ? 'TASDIQLANGAN' : o.status)}
                        </span>
                    </div>
                    
                    <div style="margin-bottom:15px; font-size:0.9rem; color:var(--text); font-weight:700;">
                        <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-right:5px;"></i> ${o.address_text || 'Manzil yo\'q'}
                        <div style="margin-top:5px; color:var(--primary);">Tel: ${o.phone_number || '-'}</div>
                    </div>

                    <div style="background:#f8fafc; padding:12px; border-radius:15px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:800; color:var(--gray);">SUMMA:</span>
                        <b style="font-size:1rem;">${o.total_price.toLocaleString()} UZS</b>
                    </div>

                    <div style="display:flex; gap:10px;">
                        ${o.status === 'pending' ? `
                            <button class="btn btn-primary" style="flex:1; height:45px; font-size:0.8rem; background:var(--primary);" onclick="confirmOrderByAdmin(${o.id})">
                                <i class="fas fa-check-circle"></i> TASDIQLASH
                            </button>
                        ` : ''}
                        
                        ${o.latitude ? `
                            <a href="https://www.google.com/maps?q=${o.latitude},${o.longitude}" target="_blank" class="btn btn-outline" style="width:50px; height:45px; padding:0; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-location-arrow" style="color:var(--primary);"></i>
                            </a>
                        ` : ''}
                        
                        <button class="btn btn-outline" style="flex:1; height:45px; font-size:0.8rem; color:var(--danger); border-color:#fee2e2;" onclick="cancelOrderByAdmin(${o.id})">
                            <i class="fas fa-times"></i> BEKOR QILISH
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).confirmOrderByAdmin = async (id: number) => {
    const { error } = await supabase.from('orders').update({ status: 'confirmed' }).eq('id', id);
    if(!error) {
        showToast("Buyurtma tasdiqlandi! Kuryerlar uni ko'rishlari mumkin.");
        renderAdminOrders();
    }
};

(window as any).cancelOrderByAdmin = async (id: number) => {
    if(!confirm("Buyurtmani bekor qilasizmi?")) return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
    if(!error) {
        showToast("Buyurtma bekor qilindi.");
        renderAdminOrders();
    }
};
