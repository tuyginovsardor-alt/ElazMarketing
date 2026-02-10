
import { supabase, showToast, profile, user, loadProfileData } from "./index.tsx";

let watchId: number | null = null;

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const isOnline = p?.active_status || false;
    const isBusy = p?.is_busy || false;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- STATUS HEADER -->
            <div style="background:white; padding:20px; border-radius:30px; border:1.5px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; box-shadow:var(--shadow-sm);">
                <div>
                    <h2 style="font-weight:900; font-size:1.3rem;">Kuryer Terminali</h2>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                        <div id="statusIndicator" style="width:10px; height:10px; border-radius:50%; background:${isBusy ? '#f59e0b' : (isOnline ? 'var(--primary)' : 'var(--danger)')}; box-shadow:0 0 10px ${isBusy ? '#f59e0b' : (isOnline ? 'var(--primary)' : 'var(--danger)')};"></div>
                        <span id="statusText" style="font-size:0.75rem; font-weight:900; color:${isBusy ? '#f59e0b' : (isOnline ? 'var(--primary)' : 'var(--danger)')}; text-transform:uppercase;">
                            ${isBusy ? 'Band (Buyurtmada)' : (isOnline ? 'Onlayn' : 'Oflayn')}
                        </span>
                    </div>
                </div>
                <button id="toggleStatusBtn" class="btn ${isOnline ? 'btn-outline' : 'btn-primary'}" 
                        style="height:52px; padding:0 25px; border-radius:18px; font-size:0.8rem;" 
                        onclick="window.toggleCourierStatus()" ${isBusy ? 'disabled' : ''}>
                    <i class="fas ${isOnline ? 'fa-pause' : 'fa-play'}"></i> ${isOnline ? 'OFFLINE' : 'ONLINE'}
                </button>
            </div>
            
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button id="tabNewOrders" onclick="window.switchCourierTab('new')" style="flex:1; height:45px; border-radius:15px; border:none; background:var(--primary); color:white; font-weight:900; font-size:0.7rem; box-shadow:var(--shadow-sm);">BO'SH (NEW)</button>
                <button id="tabMyOrders" onclick="window.switchCourierTab('mine')" style="flex:1; height:45px; border-radius:15px; border:none; background:white; color:var(--gray); font-weight:900; font-size:0.7rem; border:1.5px solid #f1f5f9;">MENIKI (ACTIVE)</button>
            </div>

            <div id="courierOrdersFeed">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    if (isOnline) startGeoTracking();
    (window as any).switchCourierTab('new');
}

function startGeoTracking() {
    if (!navigator.geolocation) return;
    if (watchId) navigator.geolocation.clearWatch(watchId);

    // Kuryerning joylashuvini real vaqtda kuzatish
    watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            await supabase.from('profiles').update({ 
                live_lat: latitude, 
                live_lng: longitude,
                last_active: new Date().toISOString()
            }).eq('id', user.id);
            console.log("Location synced:", latitude, longitude);
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

function stopGeoTracking() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
}

(window as any).toggleCourierStatus = async () => {
    const { data: p } = await supabase.from('profiles').select('active_status, is_busy').eq('id', user.id).single();
    if (p.is_busy) return showToast("Hozir buyurtmadagi kuryer holatni o'zgartira olmaydi!");

    const newStatus = !p.active_status;
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    
    if (!error) {
        if (newStatus) startGeoTracking();
        else stopGeoTracking();
        renderCourierDashboard();
        showToast(newStatus ? "Siz onlaynsiz! 🛵" : "Siz oflaynsiz. Dam oling!");
    }
};

(window as any).switchCourierTab = async (tab: string) => {
    const feed = document.getElementById('courierOrdersFeed');
    const tabNew = document.getElementById('tabNewOrders');
    const tabMy = document.getElementById('tabMyOrders');
    if(!feed || !tabNew || !tabMy) return;

    if(tab === 'new') {
        tabNew.style.background = 'var(--primary)'; tabNew.style.color = 'white';
        tabMy.style.background = 'white'; tabMy.style.color = 'var(--gray)'; tabMy.style.border = '1.5px solid #f1f5f9';
        loadAvailableOrders();
    } else {
        tabMy.style.background = 'var(--primary)'; tabMy.style.color = 'white'; tabMy.style.border = 'none';
        tabNew.style.background = 'white'; tabNew.style.color = 'var(--gray)'; tabNew.style.border = '1.5px solid #f1f5f9';
        loadMyActiveOrders();
    }
};

async function loadAvailableOrders() {
    const feed = document.getElementById('courierOrdersFeed');
    if(!feed) return;

    const { data: orders } = await supabase.from('orders').select(`*, profiles!user_id(first_name, last_name)`).eq('status', 'confirmed').is('courier_id', null).order('created_at', { ascending: false });

    if(!orders?.length) {
        feed.innerHTML = `<div style="text-align:center; padding:5rem 1rem; opacity:0.5; font-weight:800;"><i class="fas fa-inbox fa-3x" style="display:block; margin-bottom:15px;"></i> BO'SH BUYURTMALAR YO'Q</div>`;
        return;
    }

    feed.innerHTML = orders.map(o => renderOrderCard(o, 'available')).join('');
}

async function loadMyActiveOrders() {
    const feed = document.getElementById('courierOrdersFeed');
    if(!feed) return;

    const { data: orders } = await supabase.from('orders').select(`*, profiles!user_id(first_name, last_name)`).eq('courier_id', user.id).eq('status', 'delivering');

    if(!orders?.length) {
        feed.innerHTML = `<div style="text-align:center; padding:5rem 1rem; opacity:0.5; font-weight:800;"><i class="fas fa-box-open fa-3x" style="display:block; margin-bottom:15px;"></i> SIZDA FAOL ISHLAR YO'Q</div>`;
        return;
    }

    feed.innerHTML = orders.map(o => renderOrderCard(o, 'active')).join('');
}

function renderOrderCard(o: any, type: 'available' | 'active') {
    const customer = o.profiles;
    const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";

    return `
        <div class="card" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:20px; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                <div>
                    <div style="font-weight:900; font-size:1.1rem;">#ORD-${o.id.toString().substring(0,6)}</div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray);">${new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:900; font-size:1.2rem; color:var(--primary);">${o.total_price.toLocaleString()} UZS</div>
                    <div style="font-size:0.6rem; font-weight:800; background:var(--primary-light); color:var(--primary); padding:3px 8px; border-radius:8px;">DAROMAD: ${o.delivery_cost.toLocaleString()}</div>
                </div>
            </div>

            <div style="background:#f8fafc; padding:15px; border-radius:22px; border:1px solid #f1f5f9; margin-bottom:15px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                    <div style="width:36px; height:36px; border-radius:10px; background:white; display:flex; align-items:center; justify-content:center; color:var(--primary);"><i class="fas fa-user"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:0.85rem;">${fullName}</div>
                        <div style="font-size:0.75rem; font-weight:800; color:var(--primary);"><i class="fas fa-phone-alt"></i> ${o.phone_number}</div>
                    </div>
                    ${type === 'active' ? `<a href="tel:${o.phone_number}" style="width:40px; height:40px; border-radius:12px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; text-decoration:none;"><i class="fas fa-phone"></i></a>` : ''}
                </div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--text); line-height:1.4;"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> ${o.address_text}</div>
                ${o.comment ? `<div style="margin-top:10px; padding:10px; background:#fff9db; border-radius:12px; font-size:0.75rem; font-weight:700; border:1px dashed #ffeeba;">"${o.comment}"</div>` : ''}
            </div>

            <div style="display:flex; gap:10px;">
                ${type === 'available' ? 
                    `<button class="btn btn-primary" style="flex:1; height:55px; border-radius:18px; font-size:0.9rem;" onclick="window.courierAcceptOrder('${o.id}')">QABUL QILISH <i class="fas fa-check-circle" style="margin-left:8px;"></i></button>` : 
                    `<button class="btn btn-primary" style="flex:1; height:55px; border-radius:18px; font-size:0.9rem; background:var(--dark); box-shadow:none;" onclick="window.courierFinishOrder('${o.id}')">BAJARILDI (YAKUNLASH) <i class="fas fa-flag-checkered" style="margin-left:8px;"></i></button>`
                }
            </div>
        </div>
    `;
}

(window as any).courierAcceptOrder = async (oid: string) => {
    const { data: p } = await supabase.from('profiles').select('is_busy').eq('id', user.id).single();
    if (p.is_busy) return showToast("Sizda allaqachon faol buyurtma bor!");

    if(!confirm("Ushbu buyurtmani qabul qilasizmi?")) return;
    
    try {
        const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if(error) throw error;

        // Kuryer holatini BAND qilish va statusni oflayn qilish
        await supabase.from('profiles').update({ is_busy: true, active_status: false }).eq('id', user.id);
        
        await supabase.from('courier_logs').insert({ 
            courier_id: user.id, 
            order_id: parseInt(oid), 
            action_text: "Yangi buyurtmani qabul qildi" 
        });
        
        showToast("Buyurtma qabul qilindi! Holatingiz 'BAND'ga o'zgardi. 🛵");
        renderCourierDashboard();
    } catch(e: any) {
        showToast("Xato: Kechikdingiz yoki ulanishda xato.");
    }
};

(window as any).courierFinishOrder = async (oid: string) => {
    if(!confirm("Buyurtma mijozga yetkazildimi?")) return;

    try {
        const { data: order } = await supabase.from('orders').select('delivery_cost').eq('id', oid).single();
        const { data: p } = await supabase.from('profiles').select('balance').eq('id', user.id).single();

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        
        // Kuryerni yana BO'SHATISH va ONLAYN qilish
        await supabase.from('profiles').update({ 
            balance: (p.balance || 0) + order.delivery_cost,
            is_busy: false,
            active_status: true
        }).eq('id', user.id);
        
        await supabase.from('courier_logs').insert({ 
            courier_id: user.id, 
            order_id: parseInt(oid), 
            action_text: "Buyurtmani muvaffaqiyatli yetkazdi ✅" 
        });

        showToast("Baraka toping! Siz yana onlaynsiz. 💰");
        renderCourierDashboard();
        await loadProfileData();
    } catch(e) {
        showToast("Xatolik yuz berdi.");
    }
};
