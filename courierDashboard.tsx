
import { supabase, showToast } from "./index.tsx";

let currentTab = 'new'; 
let cUser: any = null;
let cProfile: any = null;
let ordersSubscription: any = null;

export async function renderCourierDashboard(userObj: any, profileObj: any) {
    const container = document.getElementById('ordersView');
    if(!container) return;

    cUser = userObj;
    cProfile = profileObj;

    // Real-time ulanish (Yangi buyurtmalar tushsa xabar berish)
    if (!ordersSubscription) {
        ordersSubscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                if (currentTab !== 'profile') loadTerminalData();
            })
            .subscribe();
    }

    try {
        const { data: fresh } = await supabase.from('profiles').select('*').eq('id', cUser.id).single();
        if(fresh) cProfile = fresh;

        container.innerHTML = `
            <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out; width:100%;">
                <!-- PREMIUM DARK HEADER -->
                <div style="background:#0f172a; color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:60px 25px 35px; border-radius:0 0 40px 40px; box-shadow:var(--shadow-lg);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                        <div>
                            <h1 style="font-weight:900; font-size:1.5rem; letter-spacing:-0.5px;">TERMINAL <span style="color:var(--primary); font-weight:400;">PRO</span></h1>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                                <div style="width:10px; height:10px; border-radius:50%; background:${cProfile.active_status ? '#22c55e' : '#ef4444'}; box-shadow: 0 0 10px ${cProfile.active_status ? '#22c55e' : '#ef4444'};"></div>
                                <span style="font-size:0.7rem; font-weight:800; opacity:0.8; letter-spacing:1px;">${cProfile.active_status ? 'ONLAYN' : 'OFLAYN'}</span>
                            </div>
                        </div>
                        <button onclick="window.toggleCourierStatus()" class="btn" style="height:48px; padding:0 25px; border-radius:16px; background:${cProfile.active_status ? 'rgba(239,68,68,0.2)' : 'var(--primary)'}; color:${cProfile.active_status ? '#f87171' : 'white'}; border:none; font-size:0.75rem; font-weight:900;">
                            ${cProfile.active_status ? 'STOP' : 'START'}
                        </button>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:22px; border:1px solid rgba(255,255,255,0.1);">
                            <div style="font-size:0.55rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Balans</div>
                            <div style="font-weight:900; font-size:1.2rem; color:var(--primary);">${(cProfile.balance || 0).toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:22px; border:1px solid rgba(255,255,255,0.1);">
                            <div style="font-size:0.55rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Transport</div>
                            <div style="font-weight:900; font-size:0.85rem; margin-top:3px;"><i class="fas ${getTransportIcon(cProfile.transport_type)}"></i> ${(cProfile.transport_type || 'Piyoda').toUpperCase()}</div>
                        </div>
                    </div>
                </div>

                <!-- NEW COMPACT TABS -->
                <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:20px; margin-bottom:25px; gap:5px;">
                    <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1.2; height:46px; border-radius:15px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s; position:relative;">YANGI ISH <span id="newOrdersBadge" style="display:none; position:absolute; top:5px; right:5px; background:var(--danger); color:white; width:16px; height:16px; border-radius:50%; font-size:0.5rem; line-height:16px;">!</span></button>
                    <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:46px; border-radius:15px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">FAOL</button>
                    <button onclick="window.switchCourierTab('profile')" id="tab_profile" style="flex:1; height:46px; border-radius:15px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">SOZLAMALAR</button>
                </div>

                <div id="courierTerminalFeed"></div>
            </div>
        `;
        updateTabUI();
        loadTerminalData();
    } catch (e) { container.innerHTML = 'Xatolik...'; }
}

function getTransportIcon(type: string) {
    if(type?.toLowerCase() === 'walking') return 'fa-walking';
    if(type?.toLowerCase() === 'bicycle') return 'fa-bicycle';
    if(type?.toLowerCase() === 'car') return 'fa-car';
    return 'fa-motorcycle';
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed || !cUser) return;

    if(currentTab === 'profile') { return renderCourierProfileSettings(feed); }

    feed.innerHTML = '<div style="text-align:center; padding:4rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';

    let query = supabase.from('orders').select('*, profiles!user_id(*)');
    
    if(currentTab === 'new') {
        // Hamma uchun ochiq buyurtmalar (birinchi ulgurgan oladi)
        query = query.in('status', ['pending', 'confirmed']).is('courier_id', null).order('created_at', { ascending: false });
    } else {
        // Faqat kurerga tegishli bo'lgan jarayondagi buyurtmalar
        query = query.eq('courier_id', cUser.id).eq('status', 'delivering');
    }

    const { data: orders } = await query;
    const badge = document.getElementById('newOrdersBadge');
    if(currentTab === 'new' && badge) badge.style.display = orders?.length ? 'block' : 'none';

    if(!orders?.length) {
        feed.innerHTML = `<div style="text-align:center; padding:5rem 20px; opacity:0.3;"><i class="fas fa-inbox fa-4x"></i><p style="font-weight:900; margin-top:10px; font-size:0.7rem;">BUYURTMALAR YO'Q</p></div>`;
        return;
    }

    feed.innerHTML = orders.map(o => {
        const customer = (o as any).profiles;
        const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
        const itemsList = o.items ? o.items.split('|').map(item => {
            const parts = item.split(':::');
            return { desc: parts[1] || parts[0] };
        }) : [];

        return `
            <div class="card" style="padding:24px; border-radius:35px; border:2px solid #f1f5f9; background:white; margin-bottom:20px; box-shadow:var(--shadow-sm); animation: slideUp 0.3s ease-out;">
                <div style="display:flex; justify-content:space-between; margin-bottom:18px; border-bottom:1px dashed #f1f5f9; padding-bottom:15px;">
                    <div>
                        <div style="font-weight:900; font-size:1.1rem; color:#0f172a;">#ORD-${o.id.toString().substring(0,8)}</div>
                        <div style="font-size:0.65rem; color:var(--gray); font-weight:800; margin-top:4px; display:flex; align-items:center; gap:5px;">
                            <i class="fas fa-clock"></i> ${new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            • <i class="fas ${getTransportIcon(o.requested_transport)}"></i> ${o.requested_transport?.toUpperCase()}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem;">+${(o.delivery_cost || 0).toLocaleString()}</div>
                        <div style="font-size:0.55rem; font-weight:800; color:var(--gray);">YETKAZISH</div>
                    </div>
                </div>

                <div style="background:#f8fafc; padding:18px; border-radius:24px; margin-bottom:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:900; font-size:0.95rem;">${fullName}</div>
                        <a href="tel:${o.phone_number}" style="width:38px; height:38px; background:var(--primary); color:white; border-radius:12px; display:flex; align-items:center; justify-content:center; text-decoration:none;"><i class="fas fa-phone"></i></a>
                    </div>
                    <div style="font-size:0.8rem; font-weight:800; margin-top:8px; color:var(--gray); display:flex; gap:8px;">
                        <i class="fas fa-location-dot" style="color:var(--danger); margin-top:3px;"></i> 
                        <span>${o.address_text || "Xaritada belgilangan"}</span>
                    </div>
                </div>

                <div style="margin-bottom:20px;">
                    <div style="font-size:0.6rem; font-weight:900; color:var(--gray); margin-bottom:10px; text-transform:uppercase;">Buyurtma tarkibi:</div>
                    ${itemsList.map(item => `<div style="font-size:0.75rem; font-weight:800; margin-bottom:5px; padding:8px 12px; background:#fcfcfd; border-radius:10px; border:1px solid #f1f5f9;">• ${item.desc}</div>`).join('')}
                </div>

                ${o.payment_method === 'cash' ? `
                    <div style="background:#fff1f2; border:1.5px solid #fee2e2; padding:18px; border-radius:24px; text-align:center; margin-bottom:22px;">
                        <div style="font-size:0.6rem; font-weight:900; color:var(--danger); letter-spacing:1px; margin-bottom:4px;">MIJOZDAN OLINADIGAN NAQD:</div>
                        <div style="font-size:1.6rem; font-weight:900; color:var(--danger);">${(o.total_price || 0).toLocaleString()} UZS</div>
                    </div>
                ` : `
                    <div style="background:#f0fdf4; border:1.5px solid #dcfce7; padding:18px; border-radius:24px; text-align:center; margin-bottom:22px;">
                        <div style="font-size:0.6rem; font-weight:900; color:#16a34a; letter-spacing:1px; margin-bottom:4px;">TO'LANGAN (KARTADAN):</div>
                        <div style="font-size:1.4rem; font-weight:900; color:#16a34a;">0 UZS</div>
                    </div>
                `}

                <div style="display:flex; gap:12px;">
                    ${currentTab === 'new' ? `
                        <button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:64px; border-radius:20px; background:#0f172a; font-size:1rem; box-shadow: 0 10px 20px rgba(15,23,42,0.15);">QABUL QILISH</button>
                    ` : `
                        <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:64px; border-radius:20px; font-size:1rem;">TOPSHIRILDI 🏁</button>
                    `}
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:64px; height:64px; border-radius:20px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;"><i class="fas fa-location-arrow"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderCourierProfileSettings(feed: HTMLElement) {
    feed.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out;">
            <div class="card" style="padding:25px; border-radius:30px; background:white; border:1.5px solid #f1f5f9; margin-bottom:20px;">
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:20px;">Transport turi</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    ${['walking', 'bicycle', 'car', 'mixed'].map(t => `
                        <div onclick="window.updateCourierTransport('${t}')" style="padding:15px; border:2.5px solid ${cProfile.transport_type === t ? 'var(--primary)' : '#f1f5f9'}; background:${cProfile.transport_type === t ? 'var(--primary-light)' : 'white'}; border-radius:20px; text-align:center; cursor:pointer;">
                            <i class="fas ${getTransportIcon(t)}" style="font-size:1.5rem; color:${cProfile.transport_type === t ? 'var(--primary)' : 'var(--gray)'}"></i>
                            <div style="font-size:0.65rem; font-weight:900; margin-top:6px;">${t.toUpperCase()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="card" style="padding:25px; border-radius:30px; background:white; border:1.5px solid #f1f5f9; text-align:center;">
                <p style="font-size:0.8rem; color:var(--gray); font-weight:700;">Terminal bo'yicha yordam kerak bo'lsa:</p>
                <button onclick="window.open('https://t.me/elaz_support')" class="btn btn-outline" style="width:100%; margin-top:15px; height:58px; border-radius:18px; background:#f8fafc;">ADMIN BILAN BOG'LANISH</button>
            </div>
        </div>
    `;
}

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!cProfile?.active_status) return showToast("Avval START bosing! 🚦");
    
    // ATOMIK YANGILASH: faqat courier_id bo'sh bo'lsagina olamiz
    const { error } = await supabase
        .from('orders')
        .update({ courier_id: cUser.id, status: 'delivering' })
        .eq('id', oid)
        .is('courier_id', null);

    if(!error) {
        showToast("Buyurtma sizniki! 🚀");
        // Fix: Use local function directly to avoid Window property error in TypeScript
        switchCourierTab('active');
    } else {
        showToast("Kechikdingiz, boshqa kurer olib qo'ydi! ⚠️");
        loadTerminalData();
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Mijozga topshirildimi va to'lov qilindimi? 🏁")) return;
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    if(!error) {
        showToast("Buyurtma yakunlandi! 💰");
        loadTerminalData();
    }
};

(window as any).updateCourierTransport = async (type: string) => {
    const { error } = await supabase.from('profiles').update({ transport_type: type }).eq('id', cUser.id);
    if(!error) {
        showToast("Yangilandi!");
        cProfile.transport_type = type;
        renderCourierDashboard(cUser, cProfile);
    }
};

export function switchCourierTab(tab: string) {
    currentTab = tab;
    updateTabUI();
    loadTerminalData();
}
(window as any).switchCourierTab = switchCourierTab;

function updateTabUI() {
    ['new', 'active', 'profile'].forEach(t => {
        const el = document.getElementById(`tab_${t}`);
        if(el) {
            el.style.background = currentTab === t ? 'white' : 'transparent';
            el.style.color = currentTab === t ? 'var(--primary)' : 'var(--gray)';
            el.style.boxShadow = currentTab === t ? 'var(--shadow-sm)' : 'none';
        }
    });
}

(window as any).toggleCourierStatus = async () => {
    const newStatus = !cProfile?.active_status;
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', cUser.id);
    if(!error) {
        cProfile.active_status = newStatus;
        renderCourierDashboard(cUser, cProfile);
        showToast(newStatus ? "Siz ONLAYNsiz! ✅" : "Siz OFLAYNsiz. 🔴");
    }
};
