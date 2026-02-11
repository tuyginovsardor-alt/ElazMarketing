
import { supabase, showToast, user, loadProfileData, showView, playNotificationSound, navTo } from "./index.tsx";

let currentTab = 'new'; 
let courierProfile: any = null;

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    showView('orders');
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if(!p) return;
    courierProfile = p;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- HEADER -->
            <div style="background:var(--dark); color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:50px 25px 30px; border-radius:0 0 40px 40px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h1 style="font-weight:900; font-size:1.3rem;">KURER TERMINALI</h1>
                        <span style="font-size:0.65rem; color:${courierProfile.active_status ? '#22c55e' : '#ef4444'}; font-weight:800; text-transform:uppercase;">
                            ${courierProfile.active_status ? '🟢 ONLAYN (ISHDA)' : '🔴 OFLAYN (DAM)'}
                        </span>
                    </div>
                    <button onclick="window.toggleCourierStatus()" class="btn" style="height:42px; padding:0 20px; border-radius:12px; font-size:0.75rem; background:${courierProfile.active_status ? 'rgba(239,68,68,0.1)' : 'var(--primary)'}; color:${courierProfile.active_status ? '#ef4444' : 'white'}; border:none;">
                        ${courierProfile.active_status ? 'STOP' : 'START'}
                    </button>
                </div>
            </div>

            <!-- TABS -->
            <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:20px; margin-bottom:20px; gap:5px;">
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1; height:45px; border-radius:16px; border:none; font-weight:900; font-size:0.65rem;">BO'SH ISH</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:45px; border-radius:16px; border:none; font-weight:900; font-size:0.65rem;">FAOL</button>
                <button onclick="window.switchCourierTab('history')" id="tab_history" style="flex:1; height:45px; border-radius:16px; border:none; font-weight:900; font-size:0.65rem;">TARIX</button>
            </div>

            <div id="courierTerminalFeed"></div>
        </div>
    `;

    updateTabUI();
    loadTerminalData();
}

async function loadTerminalData() {
    const feed = document.getElementById('courierTerminalFeed');
    if(!feed) return;

    feed.innerHTML = '<div style="text-align:center; padding:4rem;"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>';

    let query = supabase.from('orders').select('*, profiles!user_id(*)');
    if(currentTab === 'new') query = query.in('status', ['confirmed', 'pending']).is('courier_id', null);
    else if(currentTab === 'active') query = query.eq('courier_id', user.id).eq('status', 'delivering');
    else query = query.eq('courier_id', user.id).eq('status', 'delivered').order('created_at', { ascending: false }).limit(10);

    const { data: orders } = await query;

    if(!orders?.length) {
        feed.innerHTML = `<div style="text-align:center; padding:5rem; opacity:0.4;"><i class="fas fa-inbox fa-3x"></i><p style="font-weight:800; font-size:0.85rem; margin-top:10px;">Ma'lumot yo'q</p></div>`;
        return;
    }

    feed.innerHTML = orders.map(o => {
        const cust = (o as any).profiles;
        const fullName = `${cust?.first_name || ''} ${cust?.last_name || ''}`.trim() || "Mijoz";
        const items = o.items ? o.items.split('|').map(i => {
            const parts = i.split(':::');
            return { img: parts[0], desc: parts[1] };
        }) : [];

        const isCash = o.payment_method === 'cash';

        return `
            <div class="card" style="padding:22px; border-radius:30px; border:2px solid #f1f5f9; background:white; margin-bottom:20px; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
                    <div>
                        <div style="font-weight:900; font-size:1rem; color:var(--text);">#ORD-${o.id.toString().substring(0,8)}</div>
                        <div style="font-size:0.65rem; color:var(--gray); font-weight:800; margin-top:4px;">
                            <i class="fas fa-clock"></i> ${new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                            • <i class="fas fa-${o.requested_transport === 'car' ? 'car' : o.requested_transport === 'bicycle' ? 'bicycle' : 'walking'}"></i> ${o.requested_transport.toUpperCase()}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem;">+${o.delivery_cost.toLocaleString()}</div>
                        <div style="font-size:0.55rem; font-weight:900; color:var(--gray);">XIZMAT HAQI</div>
                    </div>
                </div>

                <div style="background:#f8fafc; padding:15px; border-radius:22px; border:1px solid #f1f5f9; margin-bottom:15px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                        <div style="width:42px; height:42px; border-radius:12px; background:white; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:var(--primary); font-size:1.2rem;"><i class="fas fa-user-circle"></i></div>
                        <div>
                            <div style="font-weight:900; font-size:0.9rem;">${fullName}</div>
                            <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">${cust?.email || 'Gmail yo\'q'}</div>
                        </div>
                    </div>
                    <div style="font-size:0.8rem; font-weight:800; color:var(--text);"><i class="fas fa-map-marker-alt" style="color:var(--danger);"></i> ${o.address_text}</div>
                    <a href="tel:${o.phone_number}" style="display:flex; align-items:center; gap:10px; margin-top:12px; text-decoration:none; background:#f0fdf4; color:#16a34a; padding:10px; border-radius:12px; font-weight:900; font-size:0.8rem; justify-content:center; border:1px solid #dcfce7;">
                        <i class="fas fa-phone"></i> ${o.phone_number}
                    </a>
                </div>

                <div style="margin-bottom:15px;">
                    <p style="font-size:0.65rem; font-weight:900; color:var(--gray); margin-bottom:10px;">MAHSULOTLAR RO'YXATI:</p>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${items.map(i => `
                            <div style="display:flex; align-items:center; gap:10px; background:#fff; padding:6px; border-radius:12px; border:1px solid #f1f5f9;">
                                <img src="${i.img}" style="width:35px; height:35px; border-radius:8px; object-fit:cover;">
                                <span style="font-size:0.75rem; font-weight:800;">${i.desc}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${o.comment ? `
                    <div style="background:#fffbeb; border:1.5px dashed #fcd34d; padding:12px; border-radius:15px; margin-bottom:20px;">
                        <div style="font-size:0.55rem; font-weight:900; color:#b45309; text-transform:uppercase;">Mijoz izohi:</div>
                        <div style="font-size:0.8rem; font-weight:700; color:#92400e;">"${o.comment}"</div>
                    </div>
                ` : ''}

                ${isCash ? `
                    <div style="background:#fef2f2; border:2px solid #fee2e2; padding:18px; border-radius:22px; text-align:center; margin-bottom:20px;">
                        <div style="font-size:0.65rem; font-weight:900; color:var(--danger); letter-spacing:1px;">MIJOZDAN OLINADIGAN SUMMA:</div>
                        <div style="font-size:1.6rem; font-weight:900; color:var(--danger);">${o.total_price.toLocaleString()} UZS</div>
                        <div style="font-size:0.6rem; font-weight:800; color:#991b1b; margin-top:5px;"><i class="fas fa-money-bill-wave"></i> TO'LOV TURI: NAQD</div>
                    </div>
                ` : `
                    <div style="background:#f0fdf4; border:2px solid #dcfce7; padding:18px; border-radius:22px; text-align:center; margin-bottom:20px;">
                        <div style="font-size:0.65rem; font-weight:900; color:#16a34a; letter-spacing:1px;">TO'LANGAN (KARTA):</div>
                        <div style="font-size:1.6rem; font-weight:900; color:#16a34a;">0 <small style="font-size:0.8rem;">UZS</small></div>
                        <div style="font-size:0.6rem; font-weight:800; color:#166534; margin-top:5px;"><i class="fas fa-check-circle"></i> FAQAT DOSTAVKA QILING</div>
                    </div>
                `}

                <div style="display:flex; gap:10px;">
                    ${currentTab === 'new' ? `
                        <button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; background:var(--dark);">QABUL QILISH</button>
                    ` : currentTab === 'active' ? `
                        <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px;">TOPSHIRILDI</button>
                    ` : ''}
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:55px; height:55px; border-radius:15px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;"><i class="fas fa-location-dot"></i></button>
                </div>
            </div>
        `;
    }).join('');
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
    renderCourierDashboard();
    showToast(newStatus ? "Siz ONLAYNsiz! ✅" : "Siz OFLAYNsiz. 🔴");
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!courierProfile?.active_status) return showToast("Avval START bosing! 🚦");
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
    if(!error) {
        showToast("Buyurtma olindi! 🚀");
        switchCourierTab('active');
    } else showToast("Xato: Buyurtma band.");
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Buyurtma topshirildimi? 🏁")) return;
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    showToast("Yakunlandi! 💰");
    renderCourierDashboard();
    switchCourierTab('history');
};
