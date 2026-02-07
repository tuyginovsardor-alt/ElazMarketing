
import { supabase, showToast, profile, user, loadProfileData } from "./index.tsx";

export async function renderCourierDashboard() {
    const container = document.getElementById('ordersView');
    if(!container || !user) return;

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const isOnline = p?.active_status || false;

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; background:white; padding:15px; border-radius:24px; border:1px solid #f1f5f9;">
                <div>
                    <h2 style="font-weight:900; font-size:1.4rem;">Kuryer Ish Joyi</h2>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                        <div style="width:10px; height:10px; border-radius:50%; background:${isOnline ? '#22c55e' : '#ef4444'}; box-shadow: 0 0 10px ${isOnline ? '#22c55e80' : '#ef444480'};"></div>
                        <span style="font-size:0.75rem; color:${isOnline ? '#16a34a' : '#b91c1c'}; font-weight:800; text-transform:uppercase;">
                            ${isOnline ? 'Online' : 'Oflayn'}
                        </span>
                    </div>
                </div>
                <button class="btn ${isOnline ? 'btn-outline' : 'btn-primary'}" style="height:48px; min-width:140px; padding:0 20px; font-size:0.8rem; border-radius:15px;" onclick="toggleCourierStatus()">
                    <i class="fas ${isOnline ? 'fa-pause' : 'fa-play'}"></i> ${isOnline ? 'DAM OLISH' : 'ISHGA TUSHISH'}
                </button>
            </div>
            
            <h3 style="font-weight:900; font-size:1.1rem; margin-bottom:15px; padding-left:10px;">Yangi buyurtmalar:</h3>
            <div id="courierOrdersContent">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    loadCourierOrders();
}

(window as any).toggleCourierStatus = async () => {
    const { data: p } = await supabase.from('profiles').select('active_status').eq('id', user.id).single();
    const newStatus = !p.active_status;
    
    const { error } = await supabase.from('profiles').update({ active_status: newStatus }).eq('id', user.id);
    if(!error) {
        showToast(newStatus ? "Siz onlaynsiz! 🛵" : "Oflayn rejimga o'tdingiz.");
        renderCourierDashboard();
    }
};

async function loadCourierOrders() {
    const content = document.getElementById('courierOrdersContent')!;
    
    // Mijoz ma'lumotlari (Profiles) bilan bog'liq holda buyurtmalarni olish
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            profiles!user_id (
                first_name,
                last_name,
                email
            )
        `)
        .eq('status', 'confirmed')
        .is('courier_id', null)
        .order('created_at', { ascending: false });

    if(error) {
        console.error("Courier Orders Load Error:", error);
        content.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--danger); font-weight:800;">Tizimda xatolik yuz berdi.</div>`;
        return;
    }

    if(!orders?.length) {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding:5rem 2rem; border-radius:35px; border:2px dashed #f1f5f9; background:transparent;">
                <i class="fas fa-box-open fa-3x" style="color:#cbd5e1; margin-bottom:15px;"></i>
                <p style="color:var(--gray); font-weight:800;">Hozircha bo'sh buyurtmalar yo'q. Kuting yoki oflayn rejimga o'ting.</p>
            </div>
        `;
        return;
    }

    content.innerHTML = orders.map(o => {
        const customer = (o as any).profiles;
        const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Noma'lum mijoz";
        const email = customer?.email || "Email yo'q";

        return `
        <div class="card" style="padding:22px; border-radius:32px; background:white; border:1.5px solid #f1f5f9; box-shadow:var(--shadow-sm); margin-bottom:20px; position:relative; overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
                <div>
                    <div style="font-weight:900; font-size:1.1rem; color:var(--text);">#ORD-${o.id.toString().substring(0,6)}</div>
                    <div style="font-size:0.7rem; color:var(--gray); font-weight:800; margin-top:2px;">
                        <i class="far fa-clock"></i> ${new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:900; font-size:1.2rem; color:var(--primary);">${o.total_price.toLocaleString()} UZS</div>
                    <div style="font-size:0.65rem; font-weight:800; color:#16a34a; background:#f0fdf4; padding:2px 8px; border-radius:8px; display:inline-block; margin-top:4px;">
                        DAROMAD: ${o.delivery_cost.toLocaleString()}
                    </div>
                </div>
            </div>

            <!-- MIJOZ MA'LUMOTLARI (MUHIM!) -->
            <div style="background:#eff6ff; padding:18px; border-radius:24px; border:1px solid #dbeafe; margin-bottom:18px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:40px; height:40px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#3b82f6; border:1px solid #dbeafe;">
                        <i class="fas fa-user-circle" style="font-size:1.4rem;"></i>
                    </div>
                    <div style="overflow:hidden; flex:1;">
                        <div style="font-weight:900; font-size:1rem; color:#1e40af; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${fullName}</div>
                        <div style="font-size:0.75rem; color:#3b82f6; font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${email}</div>
                    </div>
                    <a href="tel:${o.phone_number}" onclick="event.stopPropagation()" style="width:40px; height:40px; background:#3b82f6; color:white; border-radius:12px; display:flex; align-items:center; justify-content:center; text-decoration:none;">
                        <i class="fas fa-phone"></i>
                    </a>
                </div>
                <div style="font-weight:900; font-size:0.9rem; color:#1e40af; border-top:1px dashed #dbeafe; padding-top:10px;">
                    <i class="fas fa-phone-alt"></i> ${o.phone_number || 'Noma\'lum'}
                </div>
            </div>

            <!-- MANZIL VA IZOH -->
            <div style="background:#f8fafc; padding:18px; border-radius:24px; margin-bottom:18px; border:1px solid #f1f5f9;">
                <div style="font-size:0.9rem; font-weight:700; display:flex; gap:10px; align-items:flex-start; color:var(--text); line-height:1.4;">
                    <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-top:3px;"></i> 
                    <span>${o.address_text || "Manzil ko'rsatilmagan"}</span>
                </div>
                
                ${o.comment ? `
                    <div style="margin-top:12px; padding:12px; background:white; border-radius:15px; font-size:0.8rem; font-weight:700; color:#856404; border:1px dashed #ffeeba;">
                        <i class="fas fa-comment-dots" style="margin-right:6px;"></i> "${o.comment}"
                    </div>
                ` : ''}
            </div>

            <div style="display:flex; gap:10px;">
                ${o.latitude ? `
                    <button class="btn btn-outline" style="width:55px; height:55px; padding:0; border-radius:18px; background:#eff6ff; color:#3b82f6; border-color:#dbeafe;" onclick="window.open('https://www.google.com/maps?q=${o.latitude},${o.longitude}', '_blank')">
                        <i class="fas fa-location-arrow"></i>
                    </button>
                ` : ''}
                <button class="btn btn-primary" style="flex:1; height:55px; border-radius:18px; font-size:1rem; box-shadow:0 8px 20px rgba(34, 197, 94, 0.25);" onclick="acceptOrder(${o.id})">
                    BUYURTMANI OLISH <i class="fas fa-chevron-right" style="margin-left:8px; font-size:0.8rem;"></i>
                </button>
            </div>
        </div>
        `}).join('');
}

(window as any).acceptOrder = async (id: number) => {
    if(!user) return;
    
    // Kuryerni biriktirish va holatni o'zgartirish
    const { error } = await supabase
        .from('orders')
        .update({ 
            courier_id: user.id, 
            status: 'delivering' 
        })
        .eq('id', id)
        .is('courier_id', null);

    if(!error) {
        showToast("Muvaffaqiyatli! Mijozga telefon qiling. 🛵");
        renderCourierDashboard();
    } else {
        showToast("Xatolik: Buyurtma allaqachon olingan bo'lishi mumkin.");
    }
};
