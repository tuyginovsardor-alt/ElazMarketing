
import { supabase, showToast } from "./index.tsx";

export async function renderAdminOrders() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if(error) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--danger);">Ulanishda xatolik: ${error.message}</div>`;
        return;
    }

    if(!orders?.length) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:5rem; color:var(--gray); font-weight:800;">Hozircha buyurtmalar mavjud emas.</div>`;
        return;
    }

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:20px; padding:10px 0;">
            ${orders.map(o => `
                <div class="card" style="padding:22px; border-radius:28px; background:white; border:1.5px solid #f1f5f9; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:${o.status === 'delivered' ? '#22c55e' : (o.status === 'cancelled' ? '#ef4444' : '#3b82f6')};"></div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div>
                            <div style="font-weight:900; font-size:1.1rem; color:var(--text);">#ORD-${o.id.toString().substring(0,6)}</div>
                            <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">${new Date(o.created_at).toLocaleString()}</div>
                        </div>
                        <div style="padding:6px 14px; border-radius:12px; background:#f8fafc; font-size:0.65rem; font-weight:900; color:#64748b; border:1px solid #f1f5f9;">
                            ${o.status.toUpperCase()}
                        </div>
                    </div>
                    
                    <div style="margin-bottom:15px; background:#f8fafc; padding:15px; border-radius:18px;">
                        <div style="font-size:0.85rem; font-weight:700; display:flex; gap:10px; align-items:center;">
                            <i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> 
                            <span>${o.address_text || "Manzil ko'rsatilmagan"}</span>
                        </div>
                        <div style="margin-top:10px; font-size:0.8rem; font-weight:800; color:var(--primary);">
                            <i class="fas fa-phone"></i> ${o.phone_number || 'Noma\'lum'}
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding:0 5px;">
                        <span style="font-size:0.75rem; font-weight:800; color:var(--gray);">SUMMA:</span>
                        <b style="font-size:1.1rem; color:var(--text);">${o.total_price?.toLocaleString()} UZS</b>
                    </div>

                    <div style="display:flex; gap:10px;">
                        ${o.latitude ? `
                            <button class="btn btn-outline" style="width:50px; height:48px; padding:0; border-radius:14px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;" onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')">
                                <i class="fas fa-location-arrow"></i>
                            </button>
                        ` : ''}
                        
                        <select onchange="updateAdminOrderStatus(${o.id}, this.value)" style="flex:1; height:48px; border-radius:14px; margin:0; padding:0 15px; font-size:0.75rem; font-weight:800; background:white; border:2px solid #f1f5f9;">
                            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>TASDIQLANGAN</option>
                            <option value="delivering" ${o.status === 'delivering' ? 'selected' : ''}>YETKAZILMOQDA</option>
                            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>YETKAZIB BERILDI</option>
                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>BEKOR QILINGAN</option>
                        </select>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).updateAdminOrderStatus = async (id: number, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if(!error) {
        showToast("Holat o'zgardi: " + status.toUpperCase());
        renderAdminOrders();
    } else {
        showToast("Xato: " + error.message);
    }
};
