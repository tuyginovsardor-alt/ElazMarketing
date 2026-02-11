
import { supabase, showToast, user, profile, showView, playNotificationSound, navTo } from "./index.tsx";

let currentTab = 'new'; 
let cProfile: any = null;

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    // Eng oxirgi profil ma'lumotlarini yuklash (oq sahifa muammosini oldini olish uchun)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if(!p) {
        container.innerHTML = '<div style="text-align:center; padding:5rem;">Profil yuklanmadi. Qayta urinib ko\'ring.</div>';
        return;
    }
    cProfile = p;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- PREMIUM COURIER HEADER -->
            <div style="background:var(--dark); color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:55px 25px 35px; border-radius:0 0 45px 45px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <h1 style="font-weight:900; font-size:1.4rem; letter-spacing:-0.5px;">KURER TERMINALI</h1>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:${cProfile.active_status ? '#22c55e' : '#ef4444'}; box-shadow: 0 0 10px ${cProfile.active_status ? '#22c55e' : '#ef4444'};"></div>
                            <span style="font-size:0.7rem; font-weight:800; opacity:0.8; letter-spacing:1px;">${cProfile.active_status ? 'ISH REJIMIDA' : 'DAM OLISHDA'}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.toggleCourierStatus()" class="btn" style="height:45px; padding:0 22px; border-radius:15px; background:${cProfile.active_status ? 'rgba(239,68,68,0.15)' : 'var(--primary)'}; color:${cProfile.active_status ? '#ef4444' : 'white'}; border:none; font-size:0.75rem; font-weight:900;">
                            ${cProfile.active_status ? 'STOP' : 'START'}
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.55rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Balans</div>
                        <div style="font-weight:900; font-size:1.1rem; color:var(--primary);">${(cProfile.balance || 0).toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                    </div>
                    <div onclick="window.switchCourierTab('profile')" style="background:rgba(255,255,255,0.05); padding:12px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                        <div style="font-size:0.55rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Transport</div>
                        <div style="font-weight:900; font-size:0.8rem; margin-top:3px;"><i class="fas ${getTransportIcon(cProfile.transport_type)}"></i> ${cProfile.transport_type.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            <!-- TABS -->
            <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:22px; margin-bottom:25px; gap:5px;">
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1.2; height:48px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">YANGI ISH</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:48px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">FAOL</button>
                <button onclick="window.switchCourierTab('profile')" id="tab_profile" style="flex:1; height:48px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">PROFIL</button>
            </div>

            <div id="courierTerminalFeed"></div>
        </div>
    `;

    updateTabUI();
    loadTerminalData();
}

function getTransportIcon(type: string) {
    if(type === 'walking') return 'fa-walking';
    if(type === 'bicycle') return 'fa-bicycle';
    if(type === 'car') return 'fa-car';
    return 'fa-shuffle';
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed) return;

    if(currentTab === 'profile') {
        renderCourierProfileSettings(feed);
        return;
    }

    feed.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';

    let query = supabase.from('orders').select('*, profiles!user_id(*)');
    
    if(currentTab === 'new') {
        query = query.in('status', ['pending', 'confirmed']).is('courier_id', null).order('created_at', { ascending: false });
    } else {
        query = query.eq('courier_id', user.id).eq('status', 'delivering');
    }

    const { data: orders } = await query;

    if(!orders?.length) {
        feed.innerHTML = `<div style="text-align:center; padding:5rem 20px; opacity:0.3;"><i class="fas fa-inbox fa-4x"></i><p style="font-weight:900; margin-top:10px;">BO'SHLIQ...</p></div>`;
        return;
    }

    feed.innerHTML = orders.map(o => {
        const customer = (o as any).profiles;
        const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
        const itemsList = o.items ? o.items.split('|').map(item => {
            const parts = item.split(':::');
            return { img: parts[0], desc: parts[1] };
        }) : [];

        return `
            <div class="card" style="padding:22px; border-radius:35px; border:2.5px solid #f1f5f9; background:white; margin-bottom:25px; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <div>
                        <div style="font-weight:900; font-size:1rem;">#ORD-${o.id.toString().substring(0,8)}</div>
                        <div style="font-size:0.65rem; color:var(--gray); font-weight:800; margin-top:4px;">
                            <i class="fas fa-clock"></i> ${new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            • <i class="fas ${getTransportIcon(o.requested_transport)}"></i> ${o.requested_transport.toUpperCase()}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem;">+${o.delivery_cost.toLocaleString()}</div>
                    </div>
                </div>

                <div style="background:#f8fafc; padding:15px; border-radius:24px; margin-bottom:15px;">
                    <div style="font-weight:900; font-size:0.9rem;">${fullName}</div>
                    <div style="font-size:0.8rem; font-weight:800; margin-top:5px;"><i class="fas fa-location-dot" style="color:var(--danger);"></i> ${o.address_text}</div>
                </div>

                <div style="margin-bottom:15px;">
                    ${itemsList.map(item => `
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; background:#fff; padding:6px; border-radius:12px; border:1.5px solid #f1f5f9;">
                            <img src="${item.img || 'https://via.placeholder.com/50'}" style="width:35px; height:35px; border-radius:8px; object-fit:cover;">
                            <span style="font-size:0.75rem; font-weight:800;">${item.desc}</span>
                        </div>
                    `).join('')}
                </div>

                ${o.payment_method === 'cash' ? `
                    <div style="background:#fef2f2; border:1px solid #fee2e2; padding:18px; border-radius:24px; text-align:center; margin-bottom:20px;">
                        <div style="font-size:0.65rem; font-weight:900; color:var(--danger); letter-spacing:1px; margin-bottom:5px;">MIJOZDAN OLINADIGAN NAQD PUL:</div>
                        <div style="font-size:1.6rem; font-weight:900; color:var(--danger);">${o.total_price.toLocaleString()} UZS</div>
                    </div>
                ` : `
                    <div style="background:#f0fdf4; border:1px solid #dcfce7; padding:18px; border-radius:24px; text-align:center; margin-bottom:20px;">
                        <div style="font-size:0.65rem; font-weight:900; color:#16a34a; letter-spacing:1px; margin-bottom:5px;">TO'LANGAN (KARTADAN):</div>
                        <div style="font-size:1.6rem; font-weight:900; color:#16a34a;">0 UZS</div>
                    </div>
                `}

                <div style="display:flex; gap:10px;">
                    ${currentTab === 'new' ? `
                        <button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:60px; border-radius:18px; background:var(--dark);">QABUL QILISH</button>
                    ` : `
                        <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:60px; border-radius:18px;">TOPSHIRILDI (YAKUNLASH)</button>
                    `}
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:60px; height:60px; border-radius:18px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;"><i class="fas fa-location-arrow"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderCourierProfileSettings(feed: HTMLElement) {
    feed.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out;">
            <div class="card" style="padding:25px; border-radius:30px; background:white; border:1.5px solid #f1f5f9; margin-bottom:20px;">
                <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:20px;">Transport turini o'zgartirish</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div onclick="window.updateCourierTransport('walking')" style="padding:15px; border:2px solid ${cProfile.transport_type === 'walking' ? 'var(--primary)' : '#f1f5f9'}; background:${cProfile.transport_type === 'walking' ? 'var(--primary-light)' : 'white'}; border-radius:18px; text-align:center; cursor:pointer;">
                        <i class="fas fa-walking" style="font-size:1.4rem; color:${cProfile.transport_type === 'walking' ? 'var(--primary)' : 'var(--gray)'}"></i>
                        <div style="font-size:0.7rem; font-weight:900; margin-top:5px;">PIYODA</div>
                    </div>
                    <div onclick="window.updateCourierTransport('bicycle')" style="padding:15px; border:2px solid ${cProfile.transport_type === 'bicycle' ? 'var(--primary)' : '#f1f5f9'}; background:${cProfile.transport_type === 'bicycle' ? 'var(--primary-light)' : 'white'}; border-radius:18px; text-align:center; cursor:pointer;">
                        <i class="fas fa-bicycle" style="font-size:1.4rem; color:${cProfile.transport_type === 'bicycle' ? 'var(--primary)' : 'var(--gray)'}"></i>
                        <div style="font-size:0.7rem; font-weight:900; margin-top:5px;">VELO</div>
                    </div>
                    <div onclick="window.updateCourierTransport('car')" style="padding:15px; border:2px solid ${cProfile.transport_type === 'car' ? 'var(--primary)' : '#f1f5f9'}; background:${cProfile.transport_type === 'car' ? 'var(--primary-light)' : 'white'}; border-radius:18px; text-align:center; cursor:pointer;">
                        <i class="fas fa-car" style="font-size:1.4rem; color:${cProfile.transport_type === 'car' ? 'var(--primary)' : 'var(--gray)'}"></i>
                        <div style="font-size:0.7rem; font-weight:900; margin-top:5px;">MASHINA</div>
                    </div>
                    <div onclick="window.updateCourierTransport('mixed')" style="padding:15px; border:2px solid ${cProfile.transport_type === 'mixed' ? 'var(--primary)' : '#f1f5f9'}; background:${cProfile.transport_type === 'mixed' ? 'var(--primary-light)' : 'white'}; border-radius:18px; text-align:center; cursor:pointer;">
                        <i class="fas fa-shuffle" style="font-size:1.4rem; color:${cProfile.transport_type === 'mixed' ? 'var(--primary)' : 'var(--gray)'}"></i>
                        <div style="font-size:0.7rem; font-weight:900; margin-top:5px;">ARALASH</div>
                    </div>
                </div>
            </div>

            <div class="card" style="padding:25px; border-radius:30px; background:white; border:1.5px solid #f1f5f9; text-align:center;">
                <p style="font-size:0.8rem; color:var(--gray); font-weight:600;">Profil ma'lumotlari bo'yicha yordam kerak bo'lsa admin bilan bog'laning.</p>
                <button onclick="window.openSupportCenter()" class="btn btn-outline" style="width:100%; margin-top:15px; height:55px; border-radius:15px;">ADMIN BILAN ALOQA</button>
            </div>
        </div>
    `;
}

(window as any).updateCourierTransport = async (type: string) => {
    const { error } = await supabase.from('profiles').update({ transport_type: type }).eq('id', user.id);
    if(!error) {
        showToast("Transport turi yangilandi! 🔄");
        renderCourierDashboard();
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
    await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    renderCourierDashboard();
    showToast(newStatus ? "Siz ONLAYNsiz! ✅" : "Siz OFLAYNsiz. 🔴");
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!cProfile?.active_status) return showToast("Avval START bosing! 🚦");
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
    if(!error) {
        showToast("Buyurtma qabul qilindi! 🚀");
        switchCourierTab('active');
    } else showToast("Xato: Buyurtmani boshqa kurer oldi.");
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Mijozga topshirildimi va pul olindimi? 🏁")) return;
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    showToast("Muvaffaqiyatli yakunlandi! 💰");
    renderCourierDashboard();
};
