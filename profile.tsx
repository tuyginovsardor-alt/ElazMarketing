
import { user, supabase, showToast, navTo } from "./index.tsx";

export async function renderProfileView(profileData: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;
    
    const isAdmin = profileData?.role === 'admin' || profileData?.role === 'staff';
    const isCourier = profileData?.role === 'courier';
    const isLinked = !!profileData?.telegram_id;

    // Buyurtmalar statistikasini olish
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    container.innerHTML = `
        <div style="padding-bottom:120px; animation: fadeIn 0.4s ease-out;">
            <!-- PREMIUM HEADER -->
            <div style="background:var(--gradient); border-radius:0 0 45px 45px; margin:-1.2rem -1.2rem 25px -1.2rem; padding:60px 25px 40px; box-shadow:var(--shadow-lg); position:relative; overflow:hidden;">
                <!-- Bezak elementlari -->
                <div style="position:absolute; top:-20px; right:-20px; width:150px; height:150px; background:rgba(255,255,255,0.1); border-radius:50%; blur:40px;"></div>
                
                <div style="display:flex; align-items:center; gap:22px; position:relative; z-index:1;">
                    <div style="position:relative;">
                        <div style="width:100px; height:100px; border-radius:35px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                            ${profileData?.avatar_url ? `<img src="${profileData.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-circle" style="font-size:4rem; color:var(--primary);"></i>`}
                        </div>
                        <div onclick="window.openProfileEdit()" style="position:absolute; bottom:-5px; right:-5px; width:35px; height:35px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--primary); box-shadow:var(--shadow-sm); cursor:pointer;">
                            <i class="fas fa-camera" style="font-size:0.9rem;"></i>
                        </div>
                    </div>
                    <div style="flex:1; color:white;">
                        <h2 style="font-weight:900; font-size:1.6rem; letter-spacing:-0.5px;">${profileData?.first_name || 'Mijoz'}</h2>
                        <div style="font-size:0.75rem; font-weight:700; opacity:0.8; margin-top:2px;">${user.email}</div>
                        <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:10px; margin-top:10px; font-size:0.65rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fas fa-crown" style="color:#fbbf24;"></i> ${profileData?.role === 'admin' ? 'Administrator' : (profileData?.role === 'courier' ? 'Kuryer' : 'Doimiy Mijoz')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- QUICK STATS -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:25px; margin-top:-45px; padding:0 10px; position:relative; z-index:10;">
                <div class="card" style="padding:15px; border-radius:22px; text-align:center; border:none; box-shadow:var(--shadow-lg);">
                    <div style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Hamyon</div>
                    <div style="font-weight:900; color:var(--primary); font-size:0.9rem;">${(profileData?.balance || 0).toLocaleString()}</div>
                </div>
                <div class="card" style="padding:15px; border-radius:22px; text-align:center; border:none; box-shadow:var(--shadow-lg);" onclick="navTo('orders')">
                    <div style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Buyurtmalar</div>
                    <div style="font-weight:900; color:var(--text); font-size:0.9rem;">${totalOrders || 0} ta</div>
                </div>
                <div class="card" style="padding:15px; border-radius:22px; text-align:center; border:none; box-shadow:var(--shadow-lg);">
                    <div style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Reyting</div>
                    <div style="font-weight:900; color:#eab308; font-size:0.9rem;">⭐ 5.0</div>
                </div>
            </div>

            <!-- BOT LINKING -->
            ${!isLinked ? `
                <div onclick="window.generateBotLink()" class="card" style="background:#eff6ff; border:1.5px solid #dbeafe; padding:18px; border-radius:28px; margin-bottom:25px; display:flex; align-items:center; gap:15px; cursor:pointer;">
                    <div style="width:48px; height:48px; border-radius:15px; background:white; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.4rem; box-shadow:0 8px 20px rgba(59,130,246,0.1);"><i class="fab fa-telegram"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:900; font-size:0.9rem; color:#1e40af;">Telegram Botni ulash</div>
                        <p style="font-size:0.65rem; color:#3b82f6; font-weight:700;">Buyurtmalar haqida xabar olish uchun</p>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#3b82f6; opacity:0.5;"></i>
                </div>
            ` : ''}

            <!-- MAIN MENU -->
            <div class="card" style="padding:8px; border-radius:32px; background:white; margin-bottom:25px; border:1.5px solid #f1f5f9;">
                
                ${isAdmin ? `
                    <div onclick="window.enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer; background:#fff7ed; border-radius:25px 25px 0 0;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#f97316; color:white; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 15px rgba(249,115,22,0.2);"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:900; color:#9a3412; font-size:0.9rem;">ADMIN PANELI</span>
                        <span style="background:#ea580c; color:white; padding:2px 8px; border-radius:8px; font-size:0.6rem; font-weight:900;">SUPERUSER</span>
                    </div>
                ` : ''}

                <div onclick="window.openProfileEdit()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f8fafc; color:var(--text); display:flex; align-items:center; justify-content:center;"><i class="fas fa-user-edit"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:800; font-size:0.9rem;">Profilni tahrirlash</div>
                        <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">Ism, telefon va hududni o'zgartirish</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div onclick="window.openPayment()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f0fdf4; color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-wallet"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:800; font-size:0.9rem;">Mening hamyonim</div>
                        <div style="font-size:0.7rem; color:var(--gray); font-weight:700;">Balansni to'ldirish va tranzaksiyalar</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                ${isCourier ? `
                    <div onclick="navTo('orders')" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer; background:#f5f3ff;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#eef2ff; color:#4f46e5; display:flex; align-items:center; justify-content:center;"><i class="fas fa-motorcycle"></i></div>
                        <span style="flex:1; font-weight:900; color:#4338ca; font-size:0.9rem;">KURYER TERMINALI</span>
                        <span style="background:var(--primary); color:white; padding:2px 8px; border-radius:8px; font-size:0.6rem; font-weight:900;">LIVE</span>
                    </div>
                ` : `
                    <div onclick="window.openCourierRegistration()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#fffbeb; color:#d97706; display:flex; align-items:center; justify-content:center;"><i class="fas fa-truck-fast"></i></div>
                        <span style="flex:1; font-weight:800; font-size:0.9rem;">Kuryer sifatida ishlash</span>
                        <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>
                `}

                <div onclick="window.openSupportCenter()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center;"><i class="fas fa-headset"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Yordam va Aloqa</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div onclick="window.openProfileSecurity()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                    <span style="flex:1; font-weight:800; font-size:0.9rem;">Xavfsizlik sozlamalari</span>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>
            </div>

            <!-- LEGAL & APP INFO -->
            <div style="padding:0 15px; margin-bottom:25px;">
                <div style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center; opacity:0.6;">
                    <span onclick="window.openLegal('offer')" style="font-size:0.7rem; font-weight:800; cursor:pointer; text-decoration:underline;">Ommaviy oferta</span>
                    <span onclick="window.openLegal('privacy')" style="font-size:0.7rem; font-weight:800; cursor:pointer; text-decoration:underline;">Maxfiylik siyosati</span>
                    <span onclick="window.openLegal('rules')" style="font-size:0.7rem; font-weight:800; cursor:pointer; text-decoration:underline;">Qoidalar</span>
                </div>
                <div style="text-align:center; margin-top:15px; font-size:0.6rem; color:var(--gray); font-weight:700;">ELAZ MARKET v2.5.0-STABLE | Barcha huquqlar himoyalangan</div>
            </div>

            <button class="btn" style="width:100%; color:var(--danger); border:2.5px solid #fee2e2; height:65px; border-radius:28px; font-weight:900; background:white; letter-spacing:1px;" onclick="window.handleSignOut()">
                <i class="fas fa-power-off"></i> TIZIMDAN CHIQISH
            </button>
        </div>
    `;
}
