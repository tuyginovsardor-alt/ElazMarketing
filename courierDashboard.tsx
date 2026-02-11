
import { supabase, showToast, user, loadProfileData, showView, playNotificationSound, navTo } from "./index.tsx";

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

    if (courierProfile.role === 'courier' && courierProfile.is_approved === false) {
        container.innerHTML = `
            <div style="padding: 4rem 2rem; text-align: center; animation: fadeIn 0.4s;">
                <div style="width:100px; height:100px; background:#fff7ed; color:#ea580c; border-radius:35px; display:inline-flex; align-items:center; justify-content:center; font-size:3rem; margin-bottom:2rem; border:2px solid #ffedd5;">
                    <i class="fas fa-user-clock"></i>
                </div>
                <h2 style="font-weight:900; color:var(--text);">Tasdiqlanish kutilmoqda</h2>
                <p style="color:var(--gray); margin-top:15px; font-weight:600; font-size:0.9rem;">Sizning kuryerlik profilingiz adminlar tomonidan ko'rib chiqilmoqda.</p>
                <button class="btn btn-primary" style="width:100%; margin-top:2rem; border-radius:18px;" onclick="window.location.reload()">TEKSHIRISH</button>
                <button class="btn btn-outline" style="width:100%; margin-top:10px; border-radius:18px;" onclick="navTo('profile')">PROFILGA QAYTISH</button>
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
    }, null, { enableHighAccuracy: true });
}

function stopLocationTracking() {
    if (locationWatcher) navigator.geolocation.clearWatch(locationWatcher);
    locationWatcher = null;
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed) return;

    try {
        let query = supabase.from('orders').select(`*, profiles!user_id(*)`);

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
            feed.innerHTML = `<div style="text-align:center; padding:5rem 20px; opacity:0.4;"><i class="fas fa-inbox fa-3x" style="margin-bottom:15px;"></i><p style="font-weight:800; font-size:0.9rem;">${currentTab === 'new' ? 'Yangi buyurtmalar yo\'q' : 'Ma\'lumot yo\'q'}</p></div>`;
            return;
        }

        feed.innerHTML = orders.map(o => {
            const customer = (o as any).profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
            const customerEmail = customer?.email || "Email yo'q";
            const orderDate = new Date(o.created_at);
            const timeStr = orderDate.toLocaleString('uz-UZ', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
            
            // Transport belgilari
            const transportIcon = o.requested_transport === 'car' ? 'fa-car' : o.requested_transport === 'bicycle' ? 'fa-bicycle' : 'fa-walking';
            const transportLabel = o.requested_transport === 'car' ? 'AVTOMOBIL' : o.requested_transport === 'bicycle' ? 'VELO' : 'PIYODA';

            // Mahsulotlarni parse qilish (format: image_url:::name (qty unit)|...)
            const itemsList = o.items ? o.items.split('|').map(item => {
                const parts = item.split(':::');
                return { img: parts[0], name: parts[1] };
            }) : [];

            return `
            <div class="card" style="padding:22px; border-radius:30px; border:2.5px solid #f1f5f9; background:white; margin-bottom:20px; box-shadow:var(--shadow-sm); position:relative;">
                
                <!-- TOP INFO -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <div style="font-weight:900; font-size:0.7rem; color:var(--gray); text-transform:uppercase;">
                            <i class="fas fa-clock"></i> ${timeStr}
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <div style="background:#f1f5f9; padding:4px 10px; border-radius:8px; font-size:0.6rem; font-weight:900; color:var(--dark);">
                                <i class="fas ${transportIcon}"></i> ${transportLabel}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem;">+${o.delivery_cost.toLocaleString()} <small>UZS</small></div>
                        <div style="font-size:0.55rem; font-weight:900; color:var(--gray); letter-spacing:0.5px;">XIZMAT HAQI</div>
                    </div>
                </div>

                <!-- CUSTOMER INFO -->
                <div style="background:#f8fafc; padding:18px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:15px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <div style="width:45px; height:45px; border-radius:14px; background:white; display:flex; align-items:center; justify-content:center; color:var(--primary); border:1px solid #e2e8f0; font-size:1.2rem;">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div style="overflow:hidden;">
                            <div style="font-weight:900; font-size:0.95rem; color:var(--text); white-space:nowrap; text-overflow:ellipsis;">${fullName}</div>
                            <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">${customerEmail}</div>
                        </div>
                    </div>
                    <div style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:flex-start; gap:10px;">
                        <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-top:3px;"></i> 
                        <span>${o.address_text}</span>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <a href="tel:${o.phone_number}" class="btn btn-outline" style="flex:1; height:45px; border-radius:12px; border-color:#dcfce7; background:#f0fdf4; color:#16a34a; text-decoration:none; font-size:0.75rem;">
                            <i class="fas fa-phone"></i> QO'NG'IROQ
                        </a>
                    </div>
                </div>

                <!-- ORDER ITEMS -->
                <div style="margin-bottom:15px;">
                    <div style="font-size:0.65rem; font-weight:900; color:var(--gray); margin-bottom:10px; text-transform:uppercase;">Buyurtma tarkibi:</div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${itemsList.map(item => `
                            <div style="display:flex; align-items:center; gap:12px; background:#fff; padding:8px; border-radius:14px; border:1px solid #f1f5f9;">
                                <div style="width:35px; height:35px; border-radius:8px; overflow:hidden; background:#f8fafc; flex-shrink:0;">
                                    <img src="${item.img || 'https://via.placeholder.com/50'}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                                <div style="font-size:0.75rem; font-weight:800; color:var(--text);">${item.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- COMMENT -->
                ${o.comment ? `
                    <div style="background:#fff7ed; padding:15px; border-radius:18px; border:1px dashed #fdba74; margin-bottom:20px; position:relative;">
                        <div style="position:absolute; top:-10px; left:20px; background:#ea580c; color:white; font-size:0.5rem; font-weight:900; padding:2px 8px; border-radius:5px;">IZOH</div>
                        <div style="font-size:0.8rem; font-weight:700; color:#9a3412; font-style:italic;">" ${o.comment} "</div>
                    </div>
                ` : ''}

                <!-- ACTIONS -->
                <div style="display:flex; gap:10px;">
                    ${currentTab === 'new' ? `<button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; background:var(--dark);">QABUL QILISH</button>` : currentTab === 'active' ? `<button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px;">TOPSHIRILDI</button>` : ''}
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:55px; height:55px; border-radius:15px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;"><i class="fas fa-location-dot"></i></button>
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
            el.style.boxShadow = currentTab === t ? 'var(--shadow-sm)' : 'none';
        }
    });
}

(window as any).toggleCourierStatus = async () => {
    const newStatus = !courierProfile?.active_status;
    await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if (newStatus) startLocationTracking();
    else stopLocationTracking();
    renderCourierDashboard();
    showToast(newStatus ? "Siz ONLAYNsiz! ✅" : "Siz OFLAYNsiz. 🔴");
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!courierProfile?.active_status) return showToast("Avval START bosing! 🚦");
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
    if(!error) {
        await supabase.from('profiles').update({ is_busy: true }).eq('id', user.id);
        showToast("Buyurtma olindi! 🚀");
        switchCourierTab('active');
    } else {
        showToast("Xato: Buyurtma band. ⚠️");
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Mijozga topshirildimi? 🏁")) return;
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    await supabase.from('profiles').update({ is_busy: false }).eq('id', user.id);
    showToast("Muvaffaqiyatli yakunlandi! 💰");
    renderCourierDashboard();
    switchCourierTab('history');
};
