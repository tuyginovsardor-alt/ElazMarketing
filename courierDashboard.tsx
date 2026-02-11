
import { supabase, showToast, user, profile, showView, playNotificationSound, navTo } from "./index.tsx";

let currentTab = 'new'; 
let courierProfile: any = null;

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    showView('orders');
    
    // Eng oxirgi profil ma'lumotlarini olish
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if(!p) return;
    courierProfile = p;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- PREMIUM COURIER HEADER -->
            <div style="background:var(--dark); color:white; margin:-1.2rem -1.2rem 25px -1.2rem; padding:55px 25px 35px; border-radius:0 0 45px 45px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <h1 style="font-weight:900; font-size:1.4rem; letter-spacing:-0.5px;">KURER TERMINALI</h1>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:${courierProfile.active_status ? '#22c55e' : '#ef4444'}; box-shadow: 0 0 10px ${courierProfile.active_status ? '#22c55e' : '#ef4444'};"></div>
                            <span style="font-size:0.7rem; font-weight:800; opacity:0.8; letter-spacing:1px;">${courierProfile.active_status ? 'ISH REJIMIDA' : 'DAM OLISHDA'}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.toggleCourierStatus()" class="btn" style="height:45px; padding:0 22px; border-radius:15px; background:${courierProfile.active_status ? 'rgba(239,68,68,0.15)' : 'var(--primary)'}; color:${courierProfile.active_status ? '#ef4444' : 'white'}; border:none; font-size:0.75rem; font-weight:900;">
                            ${courierProfile.active_status ? 'STOP' : 'START'}
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:12px;">
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:22px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Mening Balansim</div>
                        <div style="font-weight:900; font-size:1.2rem; color:var(--primary); margin-top:3px;">${(courierProfile.balance || 0).toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:22px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Reyting</div>
                        <div style="font-weight:900; font-size:1.2rem; color:#f59e0b; margin-top:3px;">⭐ ${(courierProfile.rating || 5.0).toFixed(1)}</div>
                    </div>
                </div>
            </div>

            <!-- TABS -->
            <div style="display:flex; background:#f1f5f9; padding:6px; border-radius:22px; margin-bottom:25px; gap:5px;">
                <button onclick="window.switchCourierTab('new')" id="tab_new" style="flex:1.2; height:48px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">YANGI ISH</button>
                <button onclick="window.switchCourierTab('active')" id="tab_active" style="flex:1; height:48px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">FAOL</button>
                <button onclick="window.switchCourierTab('history')" id="tab_history" style="flex:1; height:48px; border-radius:18px; border:none; font-weight:900; font-size:0.65rem; transition:0.3s;">TARIX</button>
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

    feed.innerHTML = '<div style="text-align:center; padding:5rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>';

    let query = supabase.from('orders').select('*, profiles!user_id(*)');
    
    if(currentTab === 'new') {
        query = query.in('status', ['pending', 'confirmed']).is('courier_id', null).order('created_at', { ascending: false });
    } else if(currentTab === 'active') {
        query = query.eq('courier_id', user.id).eq('status', 'delivering');
    } else {
        query = query.eq('courier_id', user.id).eq('status', 'delivered').order('created_at', { ascending: false }).limit(15);
    }

    const { data: orders } = await query;

    if(!orders?.length) {
        feed.innerHTML = `
            <div style="text-align:center; padding:5rem 20px; opacity:0.3;">
                <i class="fas fa-inbox fa-4x" style="margin-bottom:15px;"></i>
                <p style="font-weight:900; font-size:0.9rem; letter-spacing:1px;">BO'SHLIQ...</p>
            </div>`;
        return;
    }

    feed.innerHTML = orders.map(o => {
        const customer = (o as any).profiles;
        const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
        const customerEmail = customer?.email || "Email mavjud emas";
        
        // Mahsulotlarni rasm va miqdori bilan parse qilish
        const itemsList = o.items ? o.items.split('|').map(item => {
            const parts = item.split(':::');
            return { img: parts[0], desc: parts[1] };
        }) : [];

        const isCash = o.payment_method === 'cash';

        return `
            <div class="card" style="padding:22px; border-radius:35px; border:2.5px solid #f1f5f9; background:white; margin-bottom:25px; box-shadow:var(--shadow-sm); position:relative;">
                
                <!-- ORDER TOP BAR -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
                    <div>
                        <div style="font-weight:900; font-size:1rem; color:var(--text);">#ORD-${o.id.toString().substring(0,8)}</div>
                        <div style="display:flex; align-items:center; gap:6px; margin-top:4px; font-size:0.65rem; font-weight:800; color:var(--gray);">
                            <i class="fas fa-clock"></i> ${new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            • <i class="fas fa-${o.requested_transport === 'car' ? 'car' : 'bicycle'}"></i> ${o.requested_transport.toUpperCase()}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; color:var(--primary); font-size:1.1rem;">+${o.delivery_cost.toLocaleString()} <small style="font-size:0.5rem;">UZS</small></div>
                        <div style="font-size:0.55rem; font-weight:900; color:var(--gray); letter-spacing:0.5px;">XIZMAT HAQI</div>
                    </div>
                </div>

                <!-- CUSTOMER BOX -->
                <div style="background:#f8fafc; padding:18px; border-radius:24px; border:1.5px solid #f1f5f9; margin-bottom:18px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <div style="width:45px; height:45px; border-radius:15px; background:white; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:var(--primary); font-size:1.3rem;">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div style="overflow:hidden;">
                            <div style="font-weight:900; font-size:0.95rem; color:var(--text); white-space:nowrap; text-overflow:ellipsis;">${fullName}</div>
                            <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">${customerEmail}</div>
                        </div>
                    </div>
                    <div style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:flex-start; gap:10px; line-height:1.4;">
                        <i class="fas fa-location-dot" style="color:var(--danger); margin-top:3px;"></i> 
                        <span>${o.address_text}</span>
                    </div>
                    <a href="tel:${o.phone_number}" style="display:flex; align-items:center; gap:10px; margin-top:15px; text-decoration:none; background:#f0fdf4; color:#16a34a; padding:12px; border-radius:14px; font-weight:900; font-size:0.8rem; justify-content:center; border:1px solid #dcfce7;">
                        <i class="fas fa-phone-alt"></i> ${o.phone_number}
                    </a>
                </div>

                <!-- ITEMS LIST -->
                <div style="margin-bottom:18px;">
                    <p style="font-size:0.6rem; font-weight:900; color:var(--gray); margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">Mahsulotlar tarkibi:</p>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${itemsList.map(item => `
                            <div style="display:flex; align-items:center; gap:12px; background:#fff; padding:8px; border-radius:15px; border:1.5px solid #f8fafc;">
                                <div style="width:40px; height:40px; border-radius:10px; overflow:hidden; background:#f1f5f9; flex-shrink:0;">
                                    <img src="${item.img || 'https://via.placeholder.com/50'}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                                <div style="font-size:0.8rem; font-weight:800; color:var(--text); line-height:1.2;">${item.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- SPECIAL COMMENT -->
                ${o.comment ? `
                    <div style="background:#fffbeb; border:1.5px dashed #fcd34d; padding:15px; border-radius:20px; margin-bottom:18px;">
                        <div style="font-size:0.55rem; font-weight:900; color:#b45309; text-transform:uppercase; margin-bottom:5px;">MIJOZ IZOHI:</div>
                        <div style="font-size:0.85rem; font-weight:700; color:#92400e; font-style:italic;">"${o.comment}"</div>
                    </div>
                ` : ''}

                <!-- PAYMENT INFO - THE MOST IMPORTANT PART -->
                ${isCash ? `
                    <div style="background:#fef2f2; border:2.5px solid #fee2e2; padding:22px; border-radius:28px; text-align:center; margin-bottom:20px; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.05);">
                        <div style="font-size:0.7rem; font-weight:900; color:var(--danger); letter-spacing:1.5px; margin-bottom:8px;">MIJOZDAN OLINADIGAN NAQD SUMMA:</div>
                        <div style="font-size:2rem; font-weight:900; color:var(--danger); line-height:1;">${o.total_price.toLocaleString()} <small style="font-size:0.9rem;">UZS</small></div>
                        <div style="display:inline-flex; align-items:center; gap:6px; margin-top:12px; background:rgba(239, 68, 68, 0.1); padding:4px 12px; border-radius:10px; font-size:0.6rem; font-weight:900; color:#991b1b;">
                            <i class="fas fa-money-bill-wave"></i> TO'LOV TURI: NAQD PUL
                        </div>
                    </div>
                ` : `
                    <div style="background:#f0fdf4; border:2.5px solid #dcfce7; padding:22px; border-radius:28px; text-align:center; margin-bottom:20px;">
                        <div style="font-size:0.7rem; font-weight:900; color:#16a34a; letter-spacing:1.5px; margin-bottom:8px;">TO'LANGAN (KARTA):</div>
                        <div style="font-size:2rem; font-weight:900; color:#16a34a; line-height:1;">0 <small style="font-size:0.9rem;">UZS</small></div>
                        <div style="display:inline-flex; align-items:center; gap:6px; margin-top:12px; background:rgba(22, 163, 74, 0.1); padding:4px 12px; border-radius:10px; font-size:0.6rem; font-weight:900; color:#166534;">
                            <i class="fas fa-check-circle"></i> FAQAT TOPSHIRING
                        </div>
                    </div>
                `}

                <!-- ACTIONS -->
                <div style="display:flex; gap:12px;">
                    ${currentTab === 'new' ? `
                        <button onclick="window.terminalAcceptOrder(${o.id})" class="btn btn-primary" style="flex:1; height:62px; border-radius:20px; background:var(--dark); font-size:0.9rem;">QABUL QILISH</button>
                    ` : currentTab === 'active' ? `
                        <button onclick="window.terminalFinishOrder(${o.id})" class="btn btn-primary" style="flex:1; height:62px; border-radius:20px; font-size:0.9rem;">TOPSHIRILDI (YAKUNLASH)</button>
                    ` : ''}
                    <button onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')" class="btn btn-outline" style="width:62px; height:62px; border-radius:20px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe; font-size:1.3rem;"><i class="fas fa-location-arrow"></i></button>
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
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if(!error) {
        showToast(newStatus ? "Siz ONLAYNsiz! ✅" : "Siz OFLAYNsiz. 🔴");
        renderCourierDashboard();
    }
};

(window as any).terminalAcceptOrder = async (oid: number) => {
    if(!courierProfile?.active_status) return showToast("Avval START bosing! 🚦");
    const { error } = await supabase.from('orders').update({ courier_id: user.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
    if(!error) {
        await supabase.from('profiles').update({ is_busy: true }).eq('id', user.id);
        showToast("Buyurtma qabul qilindi! 🚀");
        switchCourierTab('active');
    } else {
        showToast("Xato: Buyurtmani boshqa kurer oldi.");
    }
};

(window as any).terminalFinishOrder = async (oid: number) => {
    if(!confirm("Mijozga topshirildimi va pul olindimi? 🏁")) return;
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
    if(!error) {
        await supabase.from('profiles').update({ is_busy: false }).eq('id', user.id);
        showToast("Muvaffaqiyatli yakunlandi! 💰");
        renderCourierDashboard();
        switchCourierTab('history');
    }
};
