
import { supabase, user, showToast, openOverlay, closeOverlay, loadProfileData } from "./index.tsx";

let trackingMap: any = null;
let courierMarker: any = null;
let trackingSubscription: any = null;

export async function renderOrdersView() {
    const container = document.getElementById('ordersView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding-bottom:100px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight:900; font-size:1.8rem;">Buyurtmalarim</h2>
                <div style="background:var(--primary-light); color:var(--primary); width:45px; height:45px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-clock-rotate-left"></i>
                </div>
            </div>
            <div id="ordersList" style="display: flex; flex-direction: column; gap: 15px;">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    if(!user) return;
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    const list = document.getElementById('ordersList');
    if(!list) return;

    if(!orders?.length) {
        list.innerHTML = `<div style="text-align:center; padding:5rem; opacity:0.5;">Buyurtmalar yo'q</div>`;
        return;
    }

    list.innerHTML = orders.map(o => {
        const orderTime = new Date(o.created_at).getTime();
        const now = new Date().getTime();
        const diffMs = now - orderTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        // Faqat pending va 1 soatdan kam vaqt o'tgan bo'lsa bekor qilish mumkin
        const canCancel = o.status === 'pending' && diffMins < 60;
        const timeLeftMins = 60 - diffMins;
        
        let statusText = o.status === 'pending' ? 'Kutilmoqda' : o.status === 'delivering' ? 'Yo\'lda 🛵' : o.status === 'delivered' ? 'Yetkazilgan' : o.status === 'cancelled' ? 'Bekor qilindi' : 'Tasdiqlangan';
        let statusColor = o.status === 'delivered' ? '#f0fdf4' : o.status === 'cancelled' ? '#fef2f2' : '#f8fafc';
        let textColor = o.status === 'delivered' ? '#16a34a' : o.status === 'cancelled' ? '#ef4444' : '#64748b';

        return `
        <div class="card" style="margin-bottom:0; border:1px solid #f1f5f9; padding:22px; border-radius:28px; background:white; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:0.75rem; color:var(--gray); font-weight:800;">#ORD-${o.id.toString().substring(0,6)}</span>
                <span style="padding:4px 10px; border-radius:8px; font-size:0.65rem; font-weight:900; text-transform:uppercase; background:${statusColor}; color:${textColor}; border:1px solid ${textColor}33;">
                    ${statusText}
                </span>
            </div>
            
            <div style="margin-bottom:18px;">
                <p style="font-size:0.8rem; font-weight:700; color:var(--gray);">${new Date(o.created_at).toLocaleString()}</p>
                <h4 style="font-weight:900; font-size:1.3rem; color:var(--text); margin-top:5px;">${o.total_price.toLocaleString()} UZS</h4>
            </div>

            ${o.status === 'delivering' ? `<button class="btn btn-primary" style="height:45px; border-radius:12px; font-size:0.8rem; width:100%;" onclick="window.openTrackingMap('${o.courier_id}', ${o.latitude}, ${o.longitude})">KURYERNI KUZATISH</button>` : ''}

            ${canCancel ? `
                <div style="margin-top:15px; border: 2px dashed #fee2e2; border-radius:18px; padding:15px; background:#fffafb;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:0.65rem; font-weight:900; color:var(--danger);"><i class="fas fa-shield-halved"></i> XAVFSIZLIK REJIMIDA</span>
                        <span style="font-size:0.65rem; font-weight:900; color:var(--gray);">${timeLeftMins} daqiqa qoldi</span>
                    </div>
                    <button class="btn" style="height:48px; border-radius:14px; font-size:0.8rem; width:100%; background:var(--danger); color:white; border:none; font-weight:900; box-shadow: 0 8px 15px rgba(239,68,68,0.2);" onclick="window.cancelUserOrder(${o.id}, '${o.payment_method}', ${o.total_price})">
                        BUYURTMANI BEKOR QILISH
                    </button>
                    <p style="font-size:0.6rem; color:var(--gray); text-align:center; margin-top:8px; font-weight:700;">* To'lov qilingan bo'lsa, balansga qaytariladi.</p>
                </div>
            ` : ''}

            ${o.status === 'delivered' && !o.rating ? `
                <div style="border-top: 1px dashed #e2e8f0; padding-top: 15px; margin-top:15px; text-align: center;">
                    <p style="font-size: 0.75rem; font-weight: 800; color: var(--gray); margin-bottom: 10px;">XIZMATNI BAHOLANG:</p>
                    <div style="display: flex; justify-content: center; gap: 10px; font-size: 1.5rem; color: #eab308;">
                        ${[1, 2, 3, 4, 5].map(star => `<i class="far fa-star" onclick="rateOrder(${o.id}, ${star})" style="cursor:pointer;"></i>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `}).join('');
}

(window as any).cancelUserOrder = async (orderId: number, payMethod: string, amount: number) => {
    if(!confirm("Diqqat! Haqiqatan ham buyurtmani bekor qilmoqchimisiz?")) return;

    try {
        // Statusni bekor qilingan deb belgilash
        const { error: cancelError } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        if(cancelError) throw cancelError;

        // Agar Hamyon orqali to'langan bo'lsa, balansga qaytaramiz
        if (payMethod === 'wallet') {
            const { data: p } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
            const newBal = (p?.balance || 0) + amount;
            
            await supabase.from('profiles').update({ balance: newBal }).eq('id', user.id);
            await supabase.from('transactions').insert({ 
                user_id: user.id, 
                amount: amount, 
                type: 'income', 
                description: `Buyurtma bekor qilindi (#ORD-${orderId.toString().substring(0,4)}) - Qaytarish` 
            });
            await loadProfileData();
        }

        showToast("Buyurtma bekor qilindi! ❌");
        renderOrdersView();
    } catch(e: any) { 
        showToast("Xatolik: " + e.message); 
    }
};

(window as any).openTrackingMap = async (courierId: string, destLat: number, destLng: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;
    placeholder.innerHTML = `<div style="height:100%; display:flex; flex-direction:column;"><div style="padding:15px; border-bottom:1px solid #f1f5f9; display:flex; gap:15px; align-items:center;"><i class="fas fa-chevron-left" onclick="window.closeTracking()" style="cursor:pointer;"></i><h3>Kuryer yo'lda</h3></div><div id="liveTrackingMap" style="flex:1;"></div></div>`;
    setTimeout(() => {
        const L = (window as any).L;
        trackingMap = L.map('liveTrackingMap').setView([destLat, destLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(trackingMap);
        L.marker([destLat, destLng]).addTo(trackingMap).bindPopup("Manzil");
        trackingSubscription = supabase.channel(`courier_${courierId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${courierId}` }, (p) => {
            if (p.new.live_lat) {
                if(!courierMarker) courierMarker = L.marker([p.new.live_lat, p.new.live_lng], { icon: L.divIcon({html:'🛵'}) }).addTo(trackingMap);
                else courierMarker.setLatLng([p.new.live_lat, p.new.live_lng]);
            }
        }).subscribe();
    }, 200);
};

(window as any).closeTracking = () => { if (trackingSubscription) supabase.removeChannel(trackingSubscription); closeOverlay('checkoutOverlay'); };
(window as any).rateOrder = async (orderId: number, rating: number) => { await supabase.from('orders').update({ rating }).eq('id', orderId); renderOrdersView(); };
