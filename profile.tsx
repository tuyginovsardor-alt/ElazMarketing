
import { user, supabase, showToast, navTo } from "./index.tsx";

export async function renderProfileView(profileData: any) {
    const container = document.getElementById('profileView');
    if(!container || !user) return;
    
    const isAdmin = profileData?.role === 'admin' || profileData?.role === 'staff';
    const isCourier = profileData?.role === 'courier';

    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    container.innerHTML = `
        <div style="padding-bottom:100px; animation: fadeIn 0.4s ease-out;">
            <!-- PREMIUM HEADER -->
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius:0 0 45px 45px; margin:-1.2rem -1.2rem 25px -1.2rem; padding:50px 25px 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position:relative; overflow:hidden;">
                
                <div style="display:flex; align-items:center; gap:18px; position:relative; z-index:1;">
                    <div style="position:relative; flex-shrink: 0;">
                        <div style="width:85px; height:85px; min-width:85px; min-height:85px; border-radius:28px; background:white; overflow:hidden; border:4px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; box-shadow:0 10px 20px rgba(0,0,0,0.2);">
                            ${profileData?.avatar_url ? 
                                `<img src="${profileData.avatar_url}" style="width:100%; height:100%; object-fit:cover; display:block;">` : 
                                `<i class="fas fa-user-circle" style="font-size:3.5rem; color:var(--primary);"></i>`
                            }
                        </div>
                        <div onclick="window.openProfileEdit()" style="position:absolute; bottom:-4px; right:-4px; width:30px; height:30px; background:var(--primary); border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; border:3px solid white; cursor:pointer;">
                            <i class="fas fa-pen" style="font-size:0.7rem;"></i>
                        </div>
                    </div>
                    <div style="flex:1; color:white; min-width:0;">
                        <h2 style="font-weight:900; font-size:1.3rem; letter-spacing:-0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${profileData?.first_name || 'Mijoz'}</h2>
                        <div style="font-size:0.7rem; font-weight:700; opacity:0.6; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.email}</div>
                        <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:8px; margin-top:10px; font-size:0.6rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fas fa-crown" style="color:#fbbf24;"></i> ${profileData?.role === 'admin' ? 'Administrator' : (profileData?.role === 'courier' ? 'Kuryer' : 'Mijoz')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- QUICK STATS -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:-35px; padding:0 10px; margin-bottom:25px;">
                <div style="background:white; padding:15px 10px; border-radius:22px; text-align:center; box-shadow: 0 8px 20px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">
                    <div style="font-size:0.55rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Hamyon</div>
                    <div style="font-weight:900; color:var(--primary); font-size:0.85rem;">${(profileData?.balance || 0).toLocaleString()}</div>
                </div>
                <div onclick="navTo('orders')" style="background:white; padding:15px 10px; border-radius:22px; text-align:center; box-shadow: 0 8px 20px rgba(0,0,0,0.05); border:1px solid #f1f5f9; cursor:pointer;">
                    <div style="font-size:0.55rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Xaridlar</div>
                    <div style="font-weight:900; color:var(--dark); font-size:0.85rem;">${totalOrders || 0} ta</div>
                </div>
                <div style="background:white; padding:15px 10px; border-radius:22px; text-align:center; box-shadow: 0 8px 20px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">
                    <div style="font-size:0.55rem; font-weight:900; color:var(--gray); text-transform:uppercase; margin-bottom:5px;">Reyting</div>
                    <div style="font-weight:900; color:#eab308; font-size:0.85rem;">⭐ 5.0</div>
                </div>
            </div>

            <!-- MAIN MENU -->
            <div style="background:white; border-radius:32px; border:1.5px solid #f1f5f9; overflow:hidden; margin-bottom:25px;">
                ${isAdmin ? `
                    <div onclick="window.enterAdminPanel()" style="display:flex; align-items:center; gap:15px; padding:20px; border-bottom:1px solid #f8fafc; cursor:pointer; background:#fff7ed;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#f97316; color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-halved"></i></div>
                        <span style="flex:1; font-weight:900; color:#9a3412; font-size:0.9rem;">ADMIN PANELI</span>
                        <i class="fas fa-chevron-right" style="color:#fdba74; font-size:0.8rem;"></i>
                    </div>
                ` : ''}

                <div onclick="window.openProfileEdit()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f8fafc; color:var(--dark); display:flex; align-items:center; justify-content:center;"><i class="fas fa-user-edit"></i></div>
                    <div style="flex:1;"><div style="font-weight:800; font-size:0.9rem;">Profil sozlamalari</div></div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div onclick="window.openPaymentView()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; border-bottom:1px solid #f8fafc; cursor:pointer;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#f0fdf4; color:var(--primary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-wallet"></i></div>
                    <div style="flex:1;"><div style="font-weight:800; font-size:0.9rem;">Mening hamyonim</div></div>
                    <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                </div>

                <div onclick="window.handleSignOut()" style="display:flex; align-items:center; gap:15px; padding:18px 20px; cursor:pointer; color:var(--danger);">
                    <div style="width:40px; height:40px; border-radius:12px; background:#fef2f2; color:var(--danger); display:flex; align-items:center; justify-content:center;"><i class="fas fa-power-off"></i></div>
                    <div style="flex:1;"><div style="font-weight:800; font-size:0.9rem;">Tizimdan chiqish</div></div>
                </div>
            </div>
        </div>
    `;
}
