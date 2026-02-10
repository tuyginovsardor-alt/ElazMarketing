
import { supabase, showToast, openOverlay, closeOverlay } from "./index.tsx";

export async function renderAdminOrders() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>`;

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            profiles!user_id (
                first_name,
                last_name,
                email
            )
        `)
        .order('created_at', { ascending: false });

    if(error) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:2rem;"><p style="color:var(--danger);">Xatolik: ${error.message}</p></div>`;
        return;
    }

    if(!orders?.length) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:5rem; color:var(--gray); font-weight:800;">Hozircha buyurtmalar mavjud emas.</div>`;
        return;
    }

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap:20px; padding:10px 0;">
            ${orders.map(o => {
                const customer = (o as any).profiles;
                const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Noma'lum mijoz";
                const isUnassigned = !o.courier_id && o.status !== 'cancelled' && o.status !== 'delivered';

                // Vaqt formati
                const oDate = new Date(o.created_at);
                const fullDateTime = `${oDate.toLocaleDateString()} ${oDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}`;

                // Mahsulotlar ro'yxatini formatlash
                const itemsMarkup = o.items ? o.items.split('|').map(item => `
                    <div style="display:inline-block; margin-right:5px; margin-bottom:5px; padding:5px 12px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; font-size:0.75rem; font-weight:800; color:var(--text);">
                        ${item}
                    </div>
                `).join('') : '<span style="color:var(--gray); font-size:0.75rem;">Ma\'lumot kiritilmagan</span>';

                return `
                <div class="card" style="padding:22px; border-radius:28px; background:white; border:1.5px solid #f1f5f9; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; left:0; width:6px; height:100%; background:${o.status === 'delivered' ? '#22c55e' : (o.status === 'cancelled' ? '#ef4444' : (o.status === 'pending' ? '#f59e0b' : '#3b82f6'))};"></div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div>
                            <div style="font-weight:900; font-size:1.1rem; color:var(--text);">#ORD-${o.id.toString().substring(0,6)}</div>
                            <div style="font-size:0.7rem; color:var(--gray); font-weight:800; display:flex; align-items:center; gap:5px; margin-top:2px;">
                                <i class="fas fa-clock"></i> ${fullDateTime}
                            </div>
                        </div>
                        <div style="padding:6px 14px; border-radius:12px; background:${o.status === 'pending' ? '#fff7ed' : (isUnassigned ? '#fef2f2' : '#f8fafc')}; font-size:0.65rem; font-weight:900; color:${o.status === 'pending' ? '#ea580c' : (isUnassigned ? '#ef4444' : '#64748b')}; border:1px solid ${o.status === 'pending' ? '#ffedd5' : (isUnassigned ? '#fee2e2' : '#f1f5f9')};">
                            ${o.status === 'pending' ? 'KUTILMOQDA' : (isUnassigned ? 'KURYER KUTILMOQDA' : o.status.toUpperCase())}
                        </div>
                    </div>

                    <div style="margin-bottom:15px; background:#eff6ff; padding:15px; border-radius:18px; border:1px solid #dbeafe;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:36px; height:36px; background:white; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#3b82f6; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="overflow:hidden;">
                                <div style="font-weight:900; font-size:0.9rem; color:#1e40af; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${fullName}</div>
                                <div style="font-size:0.7rem; color:#3b82f6; font-weight:700;">${o.phone_number}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:15px; background:#fcfcfd; padding:15px; border-radius:18px; border:1.5px solid #f1f5f9;">
                        <div style="font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:5px;">
                            <i class="fas fa-shopping-basket"></i> Mahsulotlar ro'yxati:
                        </div>
                        <div style="display:block;">
                            ${itemsMarkup}
                        </div>
                        ${o.comment ? `<div style="margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:10px; font-size:0.75rem; font-style:italic; color:var(--gray); line-height:1.4;">💬 " ${o.comment} "</div>` : ''}
                    </div>

                    <div style="margin-bottom:15px; background:#f8fafc; padding:15px; border-radius:18px;">
                        <div style="font-size:0.85rem; font-weight:700; display:flex; gap:10px; align-items:flex-start;">
                            <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-top:3px;"></i> 
                            <span>${o.address_text || "Xaritada belgilangan"}</span>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding:0 5px;">
                         <div style="font-weight:900; font-size:1.2rem; color:var(--text);">${o.total_price.toLocaleString()} <small style="font-size:0.6rem; color:var(--gray);">UZS</small></div>
                         <div style="font-size:0.7rem; font-weight:800; color:var(--primary);">Dostavka: ${o.delivery_cost.toLocaleString()}</div>
                    </div>

                    ${isUnassigned ? `
                        <button class="btn btn-primary" style="width:100%; height:50px; border-radius:16px; margin-bottom:15px; background:var(--dark); box-shadow:none;" onclick="window.openCourierAssigner(${o.id})">
                            <i class="fas fa-motorcycle"></i> KURYER BIRIKTIRISH
                        </button>
                    ` : ''}

                    <div style="display:flex; gap:10px;">
                        ${o.latitude ? `
                            <button class="btn btn-outline" style="width:50px; height:48px; padding:0; border-radius:14px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;" onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')">
                                <i class="fas fa-location-dot"></i>
                            </button>
                        ` : ''}
                        
                        <select onchange="updateAdminOrderStatus(${o.id}, this.value)" style="flex:1; height:48px; border-radius:14px; margin:0; padding:0 15px; font-size:0.75rem; font-weight:800; background:white; border:2px solid #f1f5f9;">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>KUTILMOQDA</option>
                            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>TASDIQLANGAN</option>
                            <option value="delivering" ${o.status === 'delivering' ? 'selected' : ''}>YETKAZILMOQDA</option>
                            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>YETKAZILDI</option>
                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>BEKOR QILISH</option>
                        </select>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
}

(window as any).openCourierAssigner = async (orderId: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `<div style="text-align:center; padding:5rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>`;

    const { data: couriers } = await supabase.from('profiles').select('*').eq('role', 'courier');

    placeholder.innerHTML = `
        <div style="padding-bottom:50px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding:5px;"></i>
                <h2 style="font-weight:900; font-size:1.2rem;">Kuryerni biriktirish</h2>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
                ${couriers?.map(c => `
                    <div class="card" style="display:flex; align-items:center; gap:15px; padding:18px; border-radius:24px; cursor:pointer; border:2px solid ${c.active_status && !c.is_busy ? 'var(--primary-light)' : '#f1f5f9'}" onclick="window.assignOrderToCourier(${orderId}, '${c.id}')">
                        <div style="width:48px; height:48px; border-radius:14px; background:#f8fafc; overflow:hidden; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                            ${c.avatar_url ? `<img src="${c.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-ninja" style="color:#cbd5e1;"></i>`}
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:900; font-size:0.9rem;">${c.first_name}</div>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
                                <span style="width:8px; height:8px; border-radius:50%; background:${c.active_status ? '#22c55e' : '#cbd5e1'};"></span>
                                <span style="font-size:0.65rem; font-weight:800; color:var(--gray);">${c.active_status ? 'ONLAYN' : 'OFLAYN'}</span>
                                ${c.is_busy ? `<span style="font-size:0.6rem; font-weight:900; background:#fff7ed; color:#ea580c; padding:2px 6px; border-radius:5px;">BAND</span>` : `<span style="font-size:0.6rem; font-weight:900; background:#f0fdf4; color:#16a34a; padding:2px 6px; border-radius:5px;">BO'SH</span>`}
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
                    </div>
                `).join('')}
                ${!couriers?.length ? '<p style="text-align:center; padding:3rem; color:var(--gray);">Kuryerlar topilmadi.</p>' : ''}
            </div>
        </div>
    `;
};

(window as any).assignOrderToCourier = async (orderId: number, courierId: string) => {
    if(!confirm("Ushbu buyurtmani kuryerga biriktirasizmi?")) return;

    try {
        const { error: orderError } = await supabase.from('orders').update({
            courier_id: courierId,
            status: 'delivering'
        }).eq('id', orderId);

        if(orderError) throw orderError;

        await supabase.from('profiles').update({ is_busy: true }).eq('id', courierId);

        await supabase.from('courier_logs').insert({
            courier_id: courierId,
            order_id: orderId,
            action_text: "Admin tomonidan buyurtma biriktirildi"
        });

        showToast("Buyurtma kuryerga muvaffaqiyatli topshirildi! 🛵");
        closeOverlay('checkoutOverlay');
        renderAdminOrders();
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
};

(window as any).updateAdminOrderStatus = async (id: number, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if(!error) {
        showToast("Holat yangilandi.");
        renderAdminOrders();
    } else {
        showToast("Xato: " + error.message);
    }
};
