
import { supabase, showToast, profile, user, loadProfileData, showView } from "./index.tsx";

let watchId: number | null = null;
let currentTab = 'new'; // 'new', 'active', 'history'

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    showView('orders');

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const isOnline = p?.active_status || false;
    const isBusy = p?.is_busy || false;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- PROFESSIONAL HEADER STATS -->
            <div style="background:var(--dark); color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:40px 25px 30px; border-radius:0 0 40px 40px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px;">
                    <div>
                        <h1 style="font-weight:900; font-size:1.4rem; letter-spacing:-0.5px;">KURER TERMINALI</h1>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${isOnline ? '#22c55e' : '#ef4444'}; box-shadow:0 0 10px ${isOnline ? '#22c55e' : '#ef4444'};"></div>
                            <span style="font-size:0.65rem; font-weight:900; color:rgba(255,255,255,0.6); text-transform:uppercase;">${isOnline ? 'Tizimda faol' : 'Oflayn rejim'}</span>
                        </div>
                    </div>
                    <button onclick="window.toggleCourierStatus()" class="btn" style="height:45px; padding:0 20px; border-radius:15px; background:${isOnline ? 'rgba(239,68,68,0.2)' : 'var(--primary)'}; color:${isOnline ? '#f87171' : 'white'}; border:none; font-size:0.75rem; font-weight:900;">
                        ${isOnline ? '<i class="fas fa-power-off"></i> STOP' : '<i class="fas fa-play"></i> START'}
                    </button>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px;">
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.55rem; font-weight:900; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:5px;">Balans</div>
                        <div style="font-weight:900; font-size:1rem; color:var(--primary);">${(p?.balance || 0).toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.55rem; font-weight:900; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:5px;">Reyting</div>
                        <div style="font-weight:900; font-size:1rem; color:#fbbf24;">⭐ ${p?.rating || 5.0}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.55rem; font-weight:900; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:5px;">Holat</div>
                        <div style="font-weight:900; font-size:0.8rem; color:${isBusy ? '#f59e0b' : '#22c55e'};">${isBusy ? 'BAND' : 'BO\'SH'}</div>
                    </div>
                </div>
            </div>

            <!-- TAB NAVIGATION -->
            <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:20px; margin-bottom:20px; gap:5px;">
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1; height:42px; border-radius:15px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s;">BO'SH BUYURTMALAR</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:42px; border-radius:15px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s;">MENING ISHIM</button>
                <button onclick="window.switchCourierTab('history')" id="tab_history" style="flex:1; height:42px; border-radius:15px; border:none; font-weight:800; font-size:0.7rem; cursor:pointer; transition:0.3s;">TARIX</button>
            </div>

            <!-- CONTENT FEED -->
            <div id="courierTerminalFeed" style="min-height:300px;">
                <div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    if (isOnline) startGeoTracking();
    updateTabUI();
    loadTerminalData();
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed) return;

    try {
        let query = supabase.from('orders').select(`*, profiles!user_id(first_name, last_name, avatar_url)`);

        if(currentTab === 'new') {
            query = query.eq('status', 'confirmed').is('courier_id', null).order('created_at', { ascending: false });
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
                    <p style="font-weight:800; font-size:0.9rem;">${currentTab === 'new' ? 'Hozircha yangi buyurtmalar yo\'q' : 'Ma\'lumot topilmadi'}</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = orders.map(o => renderOrderTerminalCard(o)).join('');
    } catch(e) {
        feed.innerHTML = `<div style="color:var(--danger); text-align:center; padding:2rem; font-weight:800;">Xatolik yuz berdi</div>`;
    }
}

function renderOrderTerminalCard(o: any) {
    const customer = o.profiles;
    const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
    const statusColors = { confirmed: '#3b82f6', delivering: '#f59e0b', delivered: '#22c55e', cancelled: '#ef4444' };

    return `
        <div class="card" style="padding:22px; border-radius:32px; border:2px solid #f1f5f9; background:white; margin-bottom:20px; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;">
            <div style="position:absolute; top:0; left:0; width:6px; height:100%; background:${statusColors[o.status] || '#ccc'};"></div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                <div>
                    <div style="font-weight:900; font-size:1rem; color:var(--text);">ORD-${o.id.toString().substring(0,8).toUpperCase()}</div>
                    <div style="font-size:0.65rem; color:var(--gray); font-weight:800; margin-top:2px;">${new Date(o.created_at).toLocaleString('uz-UZ', {hour:'2-digit', minute:'2-digit', day:'numeric', month:'short'})}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:900; font-size:1.1rem; color:var(--primary);">${o.delivery_cost.toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                    <div style="font-size:0.6rem; font-weight:900; color:var(--gray); opacity:0.8; text-transform:uppercase; letter-spacing:0.5px;">XIZMAT HAQI</div>
                </div>
            </div>

            <!-- MIJOZ MA'LUMOTI (FULL DETAIL) -->
            <div style="background:#f8fafc; padding:18px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:18px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:38px; height:38px; border-radius:12px; background:white; overflow:hidden; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                        ${customer?.avatar_url ? `<img src="${customer.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user" style="color:#cbd5e1;"></i>`}
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:0.85rem;">${fullName}</div>
                        <a href="tel:${o.phone_number}" style="font-size:0.75rem; font-weight:800; color:var(--primary); text-decoration:none;"><i class="fas fa-phone"></i> ${o.phone_number}</a>
                    </div>
                    ${o.status === 'delivering' ? `<a href="tel:${o.phone_number}" style="width:40px; height:40px; border-radius:12px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; text-decoration:none; box-shadow:0 5px 15px rgba(34,197,94,0.3);"><i class="fas fa-phone-alt"></i></a>` : ''}
                </div>
                
                <div style="font-size:0.8rem; font-weight:700; color:var(--text); line-height:1.5; margin-bottom:10px;">
                    <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-right:5px;"></i> ${o.address_text}
                </div>
                
                ${o.comment ? `<div style="font-size:0.75rem; font-weight:700; color:#856404; background:#fffbeb; padding:10px; border-radius:12px; border:1px dashed #fef3c7;">"${o.comment}"</div>` : ''}
            </div>

            <!-- ACTION BUTTONS -->
            <div style="display:flex; gap:10px;">
                ${o.latitude ? `<button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:55px; height:55px; border-radius:18px; flex-shrink:0;"><i class="fas fa-location-arrow"></i></button>` : ''}
                
                ${currentTab === 'new' ? `
                    <button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:55px; border-radius:18px; font-weight:900; font-size:0.85rem; letter-spacing:0.5px;">
                        QABUL QILISH <i class="fas fa-check-circle" style="margin-left:8px;"></i>
                    </button>
                ` : currentTab === 'active' ? `
                    <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:55px; border-radius:18px; font-weight:900; font-size:0.85rem; background:var(--dark); box-shadow:none;">
                        YAKUNLASH (TOPHIRILDI) <i class="fas fa-flag-checkered" style="margin-left:8px;"></i>
                    </button>
                ` : `
                    <div style="flex:1; text-align:center; padding:15px; background:#f0fdf4; border-radius:18px; color:#16a34a; font-weight:900; font-size:0.75rem;">
                        <i class="fas fa-check-double"></i> YETKAZIB BERILGAN
                    </div>
                `}
            </div>
        </div>
    `;
}

// Fix: Declaring as a regular function and assigning to window to avoid TypeScript property errors
export function switchCourierTab(tab: string) {
    currentTab = tab;
    updateTabUI();
    loadTerminalData();
}
(window as any).switchCourierTab = switchCourierTab;

function updateTabUI() {
    const tabs = ['new', 'active', 'history'];
    tabs.forEach(t => {
        const el = document.getElementById(`tab_${t}`);
        if(el) {
            el.style.background = currentTab === t ? 'white' : 'transparent';
            el.style.color = currentTab === t ? 'var(--primary)' : 'var(--gray)';
            el.style.boxShadow = currentTab === t ? 'var(--shadow-sm)' : 'none';
        }
    });
}

function startGeoTracking() {
    if (!navigator.geolocation) return;
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            await supabase.from('profiles').update({ live_lat: latitude, live_lng: longitude, last_active: new Date().toISOString() }).eq('id', user.id);
        },
        null,
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

(window as any).toggleCourierStatus = async () => {
    const { data: p } = await supabase.from('profiles').select('active_status, is_busy').eq('id', user.id).single();
    if (p.is_busy) return showToast("Hozir buyurtmadagi kurer holatni o'zgartira olmaydi!");

    const newStatus = !p.active_status;
    await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    renderCourierDashboard();
    showToast(newStatus ? "Siz onlaynsiz! 🛵" : "Siz oflaynsiz. Dam oling!");
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    const { data: p } = await supabase.from('profiles').select('is_busy, active_status').eq('id', user.id).single();
    if(!p.active_status) return showToast("Avval START tugmasini bosing!");
    if(p.is_busy) return showToast("Sizda allaqachon faol buyurtma bor!");

    if(!confirm("Ushbu buyurtmani qabul qilasizmi?")) return;

    try {
        const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if(error) throw error;

        await supabase.from('profiles').update({ is_busy: true }).eq('id', user.id);
        await supabase.from('courier_logs').insert({ courier_id: user.id, order_id: oid, action_text: "Yangi buyurtmani qabul qildi" });

        showToast("Buyurtma qabul qilindi! Oq yo'l! 🛵");
        // Fix: Call the local switchCourierTab function directly
        switchCourierTab('active');
    } catch(e) {
        showToast("Xato: Kechikdingiz yoki ulanishda xato.");
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Buyurtma mijozga topshirildimi?")) return;

    try {
        const { data: order } = await supabase.from('orders').select('delivery_cost').eq('id', oid).single();
        const { data: p } = await supabase.from('profiles').select('balance').eq('id', user.id).single();

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: (p.balance || 0) + order.delivery_cost, is_busy: false }).eq('id', user.id);
        await supabase.from('courier_logs').insert({ courier_id: user.id, order_id: oid, action_text: "Buyurtmani muvaffaqiyatli yetkazdi ✅" });

        showToast("Tabriklaymiz! Xizmat haqi balansingizga qo'shildi. 💰");
        // Fix: Call the local switchCourierTab function directly
        switchCourierTab('history');
        await loadProfileData();
    } catch(e) {
        showToast("Xatolik yuz berdi.");
    }
};
