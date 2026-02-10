
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

    const isOnline = courierProfile?.active_status || false;
    const isBusy = courierProfile?.is_busy || false;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="background:var(--dark); color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:50px 25px 30px; border-radius:0 0 40px 40px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <h1 style="font-weight:900; font-size:1.4rem; letter-spacing:-0.5px;">KURER TERMINALI</h1>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:${isOnline ? '#22c55e' : '#ef4444'}; box-shadow:0 0 10px ${isOnline ? '#22c55e88' : '#ef444488'};"></div>
                            <span style="font-size:0.7rem; font-weight:800; opacity:0.8;">${isOnline ? 'ISH REJIMIDA' : 'DAM OLISHDA'}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.refreshTerminal()" class="btn" style="width:42px; height:42px; border-radius:12px; background:rgba(255,255,255,0.1); border:none; color:white;"><i class="fas fa-sync-alt"></i></button>
                        <button onclick="window.toggleCourierStatus()" class="btn" style="height:42px; padding:0 20px; border-radius:12px; background:${isOnline ? 'rgba(239,68,68,0.2)' : 'var(--primary)'}; color:${isOnline ? '#ef4444' : 'white'}; border:none; font-size:0.75rem; font-weight:900;">
                            ${isOnline ? 'STOP' : 'START'}
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.6; letter-spacing:0.5px;">DAROMAD</div>
                        <div style="font-weight:900; font-size:1.1rem; color:var(--primary);">${(courierProfile?.balance || 0).toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.6; letter-spacing:0.5px;">HOLATINGIZ</div>
                        <div style="font-weight:900; font-size:0.9rem; color:${isBusy ? '#f59e0b' : '#22c55e'};">${isBusy ? 'BAND' : 'BO\'SH'}</div>
                    </div>
                </div>
            </div>

            <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:22px; margin-bottom:20px; gap:5px;">
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1.2; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">YANGI ISH</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">FAOL</button>
                <button onclick="window.switchCourierTab('history')" id="tab_history" style="flex:1; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">TARIX</button>
            </div>

            <div id="courierTerminalFeed">
                <div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    updateTabUI();
    loadTerminalData();
    setupCourierRealtime();
}

(window as any).refreshTerminal = () => {
    loadTerminalData();
    showToast("Yangilandi 🔄");
};

function setupCourierRealtime() {
    supabase.channel('courier_global_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (courierProfile?.active_status) {
                if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && (payload.new.status === 'confirmed' || payload.new.status === 'pending') && !payload.new.courier_id)) {
                    playNotificationSound();
                    showToast("🔔 Yangi buyurtma keldi!");
                    if (currentTab === 'new') loadTerminalData();
                }
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
        let query = supabase.from('orders').select(`*, profiles!user_id(first_name, last_name, avatar_url)`);

        if(currentTab === 'new') {
            query = query.in('status', ['pending', 'confirmed']).is('courier_id', null).order('created_at', { ascending: false });
        } else if(currentTab === 'active') {
            query = query.eq('courier_id', user.id).eq('status', 'delivering');
        } else {
            query = query.eq('courier_id', user.id).eq('status', 'delivered').order('created_at', { ascending: false }).limit(10);
        }

        const { data: orders, error } = await query;
        if(error) throw error;

        if(!orders?.length) {
            feed.innerHTML = `
                <div style="text-align:center; padding:5rem 20px; opacity:0.4;">
                    <div style="font-size:4rem; color:#cbd5e1; margin-bottom:20px;"><i class="fas fa-inbox"></i></div>
                    <p style="font-weight:800; font-size:0.9rem; color:var(--gray);">${currentTab === 'new' ? 'Yangi buyurtmalar yo\'q' : 'Ma\'lumot topilmadi'}</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = orders.map(o => {
            const customer = (o as any).profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
            const orderDate = new Date(o.created_at);
            const dateStr = orderDate.toLocaleDateString('uz-UZ', { day:'numeric', month:'short' });
            const timeStr = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Mahsulotlarni formatlash (image_url:::Name (Qty Unit)|...)
            const items = o.items ? o.items.split('|').map(str => {
                const parts = str.split(':::');
                return { img: parts[0], name: parts[1] };
            }) : [];

            // To'lov usuli dizayni
            const isCash = o.payment_method === 'cash';
            const payLabel = isCash ? 'NAQD TO\'LOV' : (o.payment_method === 'wallet' ? 'HAMYONDAN' : 'KARTADAN');
            const payIcon = isCash ? 'fa-money-bill-wave' : 'fa-wallet';
            const payColor = isCash ? '#16a34a' : '#3b82f6';

            return `
            <div class="card" style="padding:22px; border-radius:32px; border:1.5px solid #f1f5f9; background:white; margin-bottom:20px; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;">
                <!-- STATUS VA VAQT -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div style="font-weight:900; font-size:0.7rem; color:var(--gray); background:#f8fafc; padding:5px 12px; border-radius:10px; display:flex; align-items:center; gap:6px;">
                        <i class="far fa-clock" style="color:var(--primary);"></i> ${dateStr}, ${timeStr}
                    </div>
                    <div style="font-size:0.65rem; font-weight:900; color:${payColor}; background:${payColor}15; padding:5px 12px; border-radius:10px; display:flex; align-items:center; gap:6px;">
                        <i class="fas ${payIcon}"></i> ${payLabel}
                    </div>
                </div>

                <!-- MAHSULOTLAR RO'YXATI -->
                <div style="background:#f9fafb; padding:15px; border-radius:24px; margin-bottom:18px; border:1px solid #f1f5f9;">
                    <div style="font-size:0.65rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.5px;">XARID TARKIBI:</div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${items.map(it => `
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:38px; height:38px; border-radius:10px; background:white; border:1px solid #e2e8f0; overflow:hidden; flex-shrink:0;">
                                    <img src="${it.img || 'https://via.placeholder.com/50'}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                                <div style="font-size:0.8rem; font-weight:800; color:var(--text); line-height:1.2;">${it.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- MIJOZ VA MANZIL -->
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:44px; height:44px; border-radius:14px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.1rem; border:1px solid #dbeafe;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:0.95rem; color:var(--text);">${fullName}</div>
                        <div style="font-size:0.75rem; font-weight:700; color:var(--gray);"><i class="fas fa-phone-alt" style="font-size:0.6rem;"></i> ${o.phone_number}</div>
                    </div>
                    <button onclick="window.open('tel:${o.phone_number}')" style="width:40px; height:40px; border-radius:12px; background:var(--primary-light); color:var(--primary); border:none;"><i class="fas fa-phone"></i></button>
                </div>

                <div style="background:#fff7ed; padding:15px; border-radius:20px; border:1px solid #ffedd5; margin-bottom:20px;">
                    <div style="display:flex; gap:10px; align-items:flex-start;">
                        <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-top:3px;"></i>
                        <div>
                            <div style="font-size:0.8rem; font-weight:800; color:var(--text);">${o.address_text || 'Xaritada ko\'rsatilgan'}</div>
                            ${o.comment ? `<div style="font-size:0.7rem; font-weight:700; color:#ea580c; margin-top:5px; font-style:italic;">💬 "${o.comment}"</div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- HISOB-KITOB -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 5px; border-top:1.5px dashed #e2e8f0; margin-bottom:15px;">
                    <div>
                        <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase;">MIJOZDAN OLINADI:</div>
                        <div style="font-weight:900; font-size:1.3rem; color:${isCash ? 'var(--text)' : 'var(--gray)'};">
                            ${isCash ? o.total_price.toLocaleString() : '0'} <small style="font-size:0.6rem;">UZS</small>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.6rem; font-weight:800; color:var(--primary); text-transform:uppercase;">SIZNING DAROMADINGIZ:</div>
                        <div style="font-weight:900; font-size:1.1rem; color:var(--primary);">
                            +${o.delivery_cost.toLocaleString()} <small style="font-size:0.6rem;">UZS</small>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:12px;">
                    ${currentTab === 'new' ? `
                        <button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:60px; border-radius:18px; background:var(--dark); font-size:0.9rem; letter-spacing:0.5px;">QABUL QILISH</button>
                    ` : currentTab === 'active' ? `
                        <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:60px; border-radius:18px; font-size:0.9rem; letter-spacing:0.5px;">TOPSHIRILDI (OK)</button>
                    ` : `
                        <div style="flex:1; text-align:center; padding:15px; background:var(--primary-light); color:var(--primary); border-radius:18px; font-weight:900; font-size:0.8rem;">YETKAZIB BERILGAN</div>
                    `}
                    
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:60px; height:60px; border-radius:18px; background:#eff6ff; color:#3b82f6; border:none; display:flex; align-items:center; justify-content:center;">
                        <i class="fas fa-location-arrow" style="font-size:1.4rem;"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    } catch(e) {
        console.error(e);
        feed.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--danger); font-weight:800;">Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.</div>`;
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
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if(!error) {
        courierProfile.active_status = newStatus;
        if (newStatus) startLocationTracking();
        else stopLocationTracking();
        renderCourierDashboard();
        showToast(newStatus ? "ISHNI BOSHLADINGIZ! 🟢" : "DAM OLISH REJIMIDASIZ 🔴");
    }
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!courierProfile?.active_status) return showToast("Avval START bosing! 🔴");
    
    const { data, error } = await supabase
        .from('orders')
        .update({ courier_id: user.id, status: 'delivering' })
        .eq('id', oid)
        .is('courier_id', null)
        .select();

    if(!error && data && data.length > 0) {
        await supabase.from('profiles').update({ is_busy: true }).eq('id', user.id);
        showToast("ZAKAZ QABUL QILINDI! 🛵💨");
        switchCourierTab('active');
    } else {
        showToast("Kechikdingiz, boshqa kuryer olib qo'ydi! 💨");
        loadTerminalData();
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Mijozga topshirildimi va to'lov tushdimi?")) return;
    
    const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
    if(!order) return;

    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    
    if(!error) {
        const newBal = (courierProfile.balance || 0) + (order.delivery_cost || 0);
        await supabase.from('profiles').update({ balance: newBal, is_busy: false }).eq('id', user.id);
        
        await supabase.from('courier_logs').insert({
            courier_id: user.id,
            order_id: oid,
            action_text: `Zakaz yopildi. Daromad: +${order.delivery_cost} UZS`
        });

        showToast("BARAKA TOPING! 💰✨");
        await loadProfileData();
        renderCourierDashboard();
        switchCourierTab('history');
    }
};
