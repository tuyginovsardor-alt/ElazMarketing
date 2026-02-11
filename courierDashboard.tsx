
import { supabase, showToast, user, loadProfileData, showView, playNotificationSound } from "./index.tsx";

let currentTab = 'new'; 
let courierProfile: any = null;
let locationWatcher: any = null;

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    showView('orders');
    
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if(!p) return;
    courierProfile = p;

    // Tekshirish: Agar kuryer roli bo'lsa-yu, hali tasdiqlanmagan bo'lsa
    if (courierProfile.role === 'courier' && courierProfile.is_approved === false) {
        container.innerHTML = `
            <div style="padding: 4rem 2rem; text-align: center; animation: fadeIn 0.4s;">
                <div style="width:100px; height:100px; background:#fff7ed; color:#ea580c; border-radius:35px; display:inline-flex; align-items:center; justify-content:center; font-size:3rem; margin-bottom:2rem; border:2px solid #ffedd5;">
                    <i class="fas fa-user-clock"></i>
                </div>
                <h2 style="font-weight:900; color:var(--text);">Tasdiqlanish kutilmoqda</h2>
                <p style="color:var(--gray); margin-top:15px; font-weight:600; font-size:0.9rem;">Sizning kuryerlik arizangiz adminlar tomonidan ko'rib chiqilmoqda. Tasdiqlangach, bu terminal ishga tushadi.</p>
                <button class="btn btn-outline" style="width:100%; margin-top:2rem; border-radius:18px;" onclick="navTo('profile')">PROFILGA QAYTISH</button>
            </div>
        `;
        return;
    }

    const isOnline = courierProfile?.active_status || false;
    const isBusy = courierProfile?.is_busy || false;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="background:var(--dark); color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:50px 25px 30px; border-radius:0 0 40px 40px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <h1 style="font-weight:900; font-size:1.4rem;">KURER TERMINALI</h1>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:${isOnline ? '#22c55e' : '#ef4444'};"></div>
                            <span style="font-size:0.7rem; font-weight:800; opacity:0.8;">${isOnline ? 'ISH REJIMIDA' : 'DAM OLISHDA'}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.location.reload()" class="btn" style="width:42px; height:42px; border-radius:12px; background:rgba(255,255,255,0.1); border:none; color:white;"><i class="fas fa-sync-alt"></i></button>
                        <button onclick="window.toggleCourierStatus()" class="btn" style="height:42px; padding:0 20px; border-radius:12px; background:${isOnline ? 'rgba(239,68,68,0.1)' : 'var(--primary)'}; color:${isOnline ? '#ef4444' : 'white'}; border:none; font-size:0.75rem;">
                            ${isOnline ? 'STOP' : 'START'}
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.6;">BALANS</div>
                        <div style="font-weight:900; font-size:1.1rem; color:var(--primary);">${(courierProfile?.balance || 0).toLocaleString()} <small>so'm</small></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.6;">HOLATINGIZ</div>
                        <div style="font-weight:900; font-size:0.9rem; color:${isBusy ? '#f59e0b' : '#22c55e'};">${isBusy ? 'BAND' : 'BO\'SH'}</div>
                    </div>
                </div>
            </div>

            <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:22px; margin-bottom:20px; gap:5px;">
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1.2; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">BO'SH ISH</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">FAOL</button>
                <button onclick="window.switchCourierTab('history')" id="tab_history" style="flex:1; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">TARIX</button>
            </div>

            <div id="courierTerminalFeed">
                <div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
            </div>
        </div>
    `;

    updateTabUI();
    loadTerminalData();
    setupCourierRealtime();
}

function setupCourierRealtime() {
    supabase.channel('new_orders_feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
            if (courierProfile?.active_status && !courierProfile?.is_busy) {
                playNotificationSound();
                showToast("🔔 YANGI BUYURTMA KELDI!");
                if (currentTab === 'new') loadTerminalData();
            }
        }).subscribe();
}

function startLocationTracking() {
    if (!navigator.geolocation) return;
    if (locationWatcher) navigator.geolocation.clearWatch(locationWatcher);
    
    locationWatcher = navigator.geolocation.watchPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await supabase.from('profiles').update({ live_lat: latitude, live_lng: longitude }).eq('id', user.id);
    }, (err) => console.error("Location error", err), { enableHighAccuracy: true });
}

function stopLocationTracking() {
    if (locationWatcher) navigator.geolocation.clearWatch(locationWatcher);
    locationWatcher = null;
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed) return;

    try {
        let query = supabase.from('orders').select(`*, profiles!user_id(first_name, last_name, avatar_url)`);

        if(currentTab === 'new') {
            query = query.in('status', ['pending', 'confirmed']).is('courier_id', null).order('created_at', { ascending: false });
        } else if(currentTab === 'active') {
            query = query.eq('courier_id', user.id).eq('status', 'delivering');
        } else {
            query = query.eq('courier_id', user.id).eq('status', 'delivered').order('created_at', { ascending: false }).limit(20);
        }

        const { data: orders, error } = await query;
        if(error) throw error;

        if(!orders?.length) {
            feed.innerHTML = `
                <div style="text-align:center; padding:5rem 20px; opacity:0.4;">
                    <i class="fas fa-inbox fa-3x" style="margin-bottom:15px;"></i>
                    <p style="font-weight:800; font-size:0.9rem;">${currentTab === 'new' ? 'Yangi buyurtmalar yo\'q' : 'Ma\'lumot yo\'q'}</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = orders.map(o => {
            const customer = (o as any).profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
            const orderDate = new Date(o.created_at);
            const timeStr = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
            <div class="card" style="padding:22px; border-radius:28px; border:1.5px solid #f1f5f9; background:white; margin-bottom:15px; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                    <div>
                        <div style="font-weight:900; font-size:0.8rem; color:var(--gray);">
                            <i class="fas fa-clock"></i> ${timeStr}
                        </div>
                        <div style="font-weight:900; font-size:1.1rem; color:var(--text); margin-top:4px;">${o.total_price.toLocaleString()} so'm</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:0.9rem;">+${o.delivery_cost.toLocaleString()} so'm</div>
                        <div style="font-size:0.6rem; font-weight:800; color:var(--gray);">XIZMAT HAQI</div>
                    </div>
                </div>
                <div style="background:#eff6ff; padding:15px; border-radius:20px; margin-bottom:15px; border:1px solid #dbeafe;">
                    <div style="font-weight:900; font-size:0.9rem; color:#1e40af; margin-bottom:5px;">${fullName}</div>
                    <div style="font-size:0.8rem; font-weight:700; color:var(--gray);"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> ${o.address_text}</div>
                </div>
                <div style="display:flex; gap:10px;">
                    ${currentTab === 'new' ? `<button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:50px; border-radius:14px; background:var(--dark);">QABUL QILISH</button>` : currentTab === 'active' ? `<button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:50px; border-radius:14px;">TOPSHIRILDI</button>` : ''}
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:50px; height:50px; border-radius:14px; background:#f0f9ff; color:#0ea5e9;"><i class="fas fa-location-dot"></i></button>
                </div>
            </div>
            `;
        }).join('');
    } catch(e) {
        feed.innerHTML = `<p style="text-align:center; padding:2rem;">Xatolik yuz berdi</p>`;
    }
}

export function switchCourierTab(tab: string) {
    currentTab = tab;
    updateTabUI();
    loadTerminalData();
}
(window as any).switchCourierTab = switchCourierTab;

function updateTabUI() {
    ['new', 'active', 'history'].forEach(t => {
        const el = document.getElementById(`tab_${t}`);
        if(el) {
            el.style.background = currentTab === t ? 'white' : 'transparent';
            el.style.color = currentTab === t ? 'var(--primary)' : 'var(--gray)';
        }
    });
}

(window as any).toggleCourierStatus = async () => {
    const newStatus = !courierProfile?.active_status;
    await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if (newStatus) startLocationTracking();
    else stopLocationTracking();
    renderCourierDashboard();
    showToast(newStatus ? "Siz ONLAYNsiz! Lokatsiya yangilanmoqda." : "Siz OFLAYNsiz.");
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!courierProfile?.active_status) return showToast("Avval START bosing!");
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
    if(!error) {
        await supabase.from('profiles').update({ is_busy: true }).eq('id', user.id);
        showToast("Buyurtma olindi! 🚀");
        switchCourierTab('active');
    } else {
        showToast("Xato: Buyurtma band.");
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Mijozga topshirildimi?")) return;
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    await supabase.from('profiles').update({ is_busy: false }).eq('id', user.id);
    showToast("Yakunlandi! 💰");
    renderCourierDashboard();
    switchCourierTab('history');
};
