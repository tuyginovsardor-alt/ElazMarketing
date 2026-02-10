
import { supabase, user, showToast, openOverlay, closeOverlay } from "./index.tsx";

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

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.getElementById('ordersList');
    if(!list) return;

    if(error || !orders?.length) {
        list.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <div style="width: 100px; height: 100px; background: #f8fafc; border-radius: 35px; display: inline-flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 3rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3 style="font-weight: 800; color: var(--text);">Buyurtmalar yo'q</h3>
                <button class="btn btn-primary" style="margin-top: 2rem; width: 100%;" onclick="navTo('home')">XARID BOSHLASH</button>
            </div>
        `;
        return;
    }

    list.innerHTML = orders.map(o => `
        <div class="card" style="margin-bottom:0; border:1px solid #f1f5f9; padding:20px; border-radius:24px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:0.75rem; color:var(--gray); font-weight:800;">#ORD-${o.id.toString().substring(0,6)}</span>
                <span style="padding:4px 10px; border-radius:8px; font-size:0.65rem; font-weight:900; text-transform:uppercase; background:${o.status === 'delivered' ? '#f0fdf4' : '#fff7ed'}; color:${o.status === 'delivered' ? '#16a34a' : '#ea580c'};">
                    ${o.status === 'delivered' ? 'Yetkazilgan' : (o.status === 'delivering' ? 'Yo\'lda 🛵' : 'Tasdiqlangan')}
                </span>
            </div>
            
            <div style="margin-bottom:15px;">
                <p style="font-size:0.85rem; font-weight:600; color:var(--gray);">${new Date(o.created_at).toLocaleDateString()}</p>
                <h4 style="font-weight:900; font-size:1.2rem; color:var(--text); margin-top:4px;">${o.total_price.toLocaleString()} UZS</h4>
            </div>

            ${o.status === 'delivering' ? `
                <button class="btn btn-primary" style="height:45px; border-radius:12px; font-size:0.8rem; width:100%;" onclick="window.openTrackingMap('${o.courier_id}', ${o.latitude}, ${o.longitude})">
                    <i class="fas fa-map-location-dot"></i> KURYERNI JONLI KUZATISH
                </button>
            ` : ''}

            ${o.status === 'delivered' && !o.rating ? `
                <div style="border-top: 1px dashed #e2e8f0; padding-top: 15px; text-align: center;">
                    <p style="font-size: 0.75rem; font-weight: 800; color: var(--gray); margin-bottom: 10px;">XIZMATNI BAHOLANG:</p>
                    <div style="display: flex; justify-content: center; gap: 10px; font-size: 1.5rem; color: #eab308;">
                        ${[1, 2, 3, 4, 5].map(star => `<i class="far fa-star" onclick="rateOrder(${o.id}, ${star})" style="cursor:pointer;"></i>`).join('')}
                    </div>
                </div>
            ` : o.rating ? `
                <div style="border-top: 1px dashed #e2e8f0; padding-top: 10px; text-align: center; color: #eab308;">
                    ${Array.from({length: o.rating}).map(() => `<i class="fas fa-star" style="font-size:0.8rem;"></i>`).join('')}
                    <span style="font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-left: 5px;">Baholangan</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

(window as any).openTrackingMap = async (courierId: string, destLat: number, destLng: number) => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="height:100%; display:flex; flex-direction:column; background:white;">
            <div style="padding:15px; display:flex; align-items:center; gap:15px; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-chevron-left" onclick="window.closeTracking()" style="cursor:pointer; font-size:1.2rem;"></i>
                <h3 style="font-weight:900;">Kuryer yo'lda...</h3>
            </div>
            <div id="liveTrackingMap" style="flex:1; width:100%;"></div>
            <div id="trackingInfo" style="padding:20px; background:white; border-top:1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div class="pulse-icon" style="width:12px; height:12px; background:var(--primary); border-radius:50%;"></div>
                    <span style="font-weight:800; font-size:0.9rem;">Kuryer koordinatalari olinmoqda...</span>
                </div>
            </div>
        </div>
        <style>
            .pulse-icon { animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.7; } }
            /* Silliq animatsiya uchun transition */
            .smooth-marker { transition: transform 0.5s linear !important; }
        </style>
    `;

    setTimeout(async () => {
        const L = (window as any).L;
        if (!L) return;

        trackingMap = L.map('liveTrackingMap').setView([destLat, destLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(trackingMap);

        // Mijoz manzili marker
        L.marker([destLat, destLng], { 
            icon: L.divIcon({ 
                html: '<i class="fas fa-house-user" style="color:var(--danger); font-size:25px;"></i>',
                className: 'dest-marker', iconSize: [30, 30] 
            }) 
        }).addTo(trackingMap).bindPopup("Sizning manzilingiz");

        // Kuryer uchun dastlabki joylashuv
        const { data: cData } = await supabase.from('profiles').select('live_lat, live_lng').eq('id', courierId).single();
        
        const courierIcon = L.divIcon({ 
            html: '<div style="background:var(--primary); color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 0 15px rgba(0,0,0,0.2);"><i class="fas fa-motorcycle"></i></div>',
            className: 'smooth-marker', 
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        if (cData?.live_lat) {
            courierMarker = L.marker([cData.live_lat, cData.live_lng], { icon: courierIcon }).addTo(trackingMap);
            trackingMap.panTo([cData.live_lat, cData.live_lng]);
        }

        // REALTIME SUBSCRIPTION (JONLI KUZATISH)
        trackingSubscription = supabase
            .channel(`courier_${courierId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'profiles', 
                filter: `id=eq.${courierId}` 
            }, (payload) => {
                const { live_lat, live_lng } = payload.new;
                if (live_lat && live_lng && courierMarker) {
                    // Silliq harakatlanish (144 FPS effekti CSS orqali)
                    courierMarker.setLatLng([live_lat, live_lng]);
                    trackingMap.panTo([live_lat, live_lng]);
                    const info = document.getElementById('trackingInfo');
                    if(info) info.innerHTML = `<span style="font-weight:800; color:var(--primary);"><i class="fas fa-motorcycle"></i> Kuryer harakatlanmoqda (Jonli) ✅</span>`;
                }
            })
            .subscribe();
    }, 200);
};

(window as any).closeTracking = () => {
    if (trackingSubscription) supabase.removeChannel(trackingSubscription);
    closeOverlay('checkoutOverlay');
    renderOrdersView();
};

(window as any).rateOrder = async (orderId: number, rating: number) => {
    showToast("Baholash uchun rahmat! ⭐");
    const { error } = await supabase.from('orders').update({ rating }).eq('id', orderId);
    if(!error) renderOrdersView();
};
