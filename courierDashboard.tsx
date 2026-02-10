
import { supabase, showToast, user, loadProfileData, showView } from "./index.tsx";

let currentTab = 'new'; // 'new', 'active', 'history'
let courierProfile: any = null;

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    showView('orders');
    
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    courierProfile = p;

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
                    <button onclick="window.toggleCourierStatus()" class="btn" style="height:42px; padding:0 20px; border-radius:12px; background:${isOnline ? 'rgba(239,68,68,0.1)' : 'var(--primary)'}; color:${isOnline ? '#ef4444' : 'white'}; border:none; font-size:0.75rem;">
                        ${isOnline ? 'STOP' : 'START'}
                    </button>
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
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1.2; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">BO'SH BUYURTMALAR</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">MENING ISHIM</button>
                <button onclick="window.switchCourierTab('history')" id="tab_history" style="flex:1; height:45px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; cursor:pointer; transition:0.3s;">TARIX</button>
            </div>

            <div id="courierTerminalFeed">
                <div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
            </div>
        </div>
    `;

    updateTabUI();
    loadTerminalData();
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed) return;

    try {
        let query = supabase.from('orders').select(`*, profiles!user_id(first_name, last_name, avatar_url)`);

        if(currentTab === 'new') {
            // Ham pending ham confirmed buyurtmalar kuryerlarga pickup uchun ochiladi (Automatic Dispatch)
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
            const isBusy = courierProfile?.is_busy;

            return `
            <div class="card" style="padding:22px; border-radius:28px; border:1.5px solid #f1f5f9; background:white; margin-bottom:15px; position:relative; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div>
                        <div style="font-weight:900; font-size:0.85rem; color:var(--gray);">#ORD-${o.id.toString().substring(0,6)}</div>
                        <div style="font-weight:900; font-size:1.1rem; color:var(--text);">${o.total_price.toLocaleString()} so'm</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:0.9rem;">+${o.delivery_cost.toLocaleString()} so'm</div>
                        <div style="font-size:0.6rem; font-weight:800; color:var(--gray);">XIZMAT HAQI</div>
                    </div>
                </div>

                <div style="background:#eff6ff; padding:15px; border-radius:20px; margin-bottom:15px; border:1px solid #dbeafe;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                         <div style="width:36px; height:36px; border-radius:10px; background:white; display:flex; align-items:center; justify-content:center; color:#3b82f6;">
                            <i class="fas fa-user"></i>
                         </div>
                         <div>
                            <div style="font-weight:900; font-size:0.9rem; color:#1e40af;">${fullName}</div>
                            <div style="font-size:0.75rem; color:#3b82f6; font-weight:800;">${o.phone_number}</div>
                         </div>
                    </div>
                    <div style="font-size:0.8rem; font-weight:700; color:var(--gray);"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> ${o.address_text}</div>
                    ${o.comment ? `<div style="margin-top:10px; padding-top:10px; border-top:1px dashed #dbeafe; font-size:0.75rem; font-weight:700; color:#1e40af;">💬 Izoh: ${o.comment}</div>` : ''}
                </div>

                <div style="display:flex; gap:10px;">
                    ${currentTab === 'new' ? `
                        <button onclick="window.terminalAcceptOrder(${o.id})" 
                                ${isBusy ? 'disabled' : ''} 
                                class="btn btn-primary" 
                                style="flex:1; height:50px; border-radius:14px; background:${isBusy ? '#cbd5e1' : 'var(--dark)'}; opacity:${isBusy ? '0.6' : '1'};">
                            ${isBusy ? 'BANDSIZ' : 'QABUL QILISH'}
                        </button>
                    ` : currentTab === 'active' ? `
                        <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1.5; height:50px; border-radius:14px;">
                            YAKUNLASH (TOPSHIRILDI)
                        </button>
                        <button onclick="window.terminalTransferOrder(${o.id})" class="btn" style="flex:1; height:50px; border-radius:14px; background:#fff1f2; color:#ef4444; border:none; font-weight:800; font-size:0.75rem;">
                            RAD ETISH
                        </button>
                    ` : `
                        <div style="flex:1; text-align:center; font-weight:900; color:#22c55e; font-size:0.8rem;">
                            <i class="fas fa-check-circle"></i> YETKAZIB BERILGAN
                        </div>
                    `}
                    ${o.latitude ? `<button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:50px; height:50px; border-radius:14px;"><i class="fas fa-location-arrow"></i></button>` : ''}
                    ${currentTab === 'active' ? `<a href="tel:${o.phone_number}" class="btn" style="width:50px; height:50px; border-radius:14px; background:#f0fdf4; color:#22c55e; display:flex; align-items:center; justify-content:center; text-decoration:none;"><i class="fas fa-phone-alt"></i></a>` : ''}
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
    if (courierProfile?.is_busy) return showToast("Aktiv buyurtmangiz bor!");
    const newStatus = !courierProfile?.active_status;
    await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    renderCourierDashboard();
    showToast(newStatus ? "Siz onlaynsiz! 🛵" : "Siz oflaynsiz.");
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!courierProfile?.active_status) return showToast("Avval START bosing!");
    if(courierProfile?.is_busy) return showToast("Siz bandasiz!");

    if(!confirm("Ushbu buyurtmani qabul qilasizmi?")) return;

    try {
        const { error } = await supabase.from('orders')
            .update({ courier_id: user.id, status: 'delivering' })
            .eq('id', oid)
            .is('courier_id', null);

        if(error) throw error;

        await supabase.from('profiles').update({ is_busy: true }).eq('id', user.id);
        showToast("Buyurtma qabul qilindi! 🚀");
        switchCourierTab('active');
    } catch(e) {
        showToast("Xato: Buyurtma allaqachon olingan bo'lishi mumkin.");
        loadTerminalData();
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Buyurtma topshirildimi?")) return;

    try {
        const { data: order } = await supabase.from('orders').select('delivery_cost').eq('id', oid).single();
        const { data: p } = await supabase.from('profiles').select('balance').eq('id', user.id).single();

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: (p.balance || 0) + order.delivery_cost, is_busy: false }).eq('id', user.id);

        showToast("Ishingiz uchun rahmat! 💰");
        switchCourierTab('history');
    } catch(e) {
        showToast("Xatolik yuz berdi.");
    }
};

(window as any).terminalTransferOrder = async (oid: number) => {
    if(!confirm("Ushbu buyurtmani rad etib, boshqa kuryerlarga uzatmoqchimisiz?")) return;

    try {
        await supabase.from('orders').update({ courier_id: null, status: 'pending' }).eq('id', oid);
        await supabase.from('profiles').update({ is_busy: false }).eq('id', user.id);

        showToast("Buyurtma bo'shatildi.");
        switchCourierTab('new');
    } catch(e) {
        showToast("Xatolik yuz berdi.");
    }
};
