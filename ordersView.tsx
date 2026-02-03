
import { supabase, user } from "./index.tsx";

export async function renderOrdersView() {
    const container = document.getElementById('ordersView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding-bottom:100px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight:900; font-size:1.8rem;">Buyurtmalarim</h2>
                <div style="background:var(--primary-light); color:var(--primary); width:45px; height:45px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-clock-rotate-left"></i>
                </div>
            </div>
            
            <div id="ordersList" style="display: flex; flex-direction: column; gap: 15px;">
                <div style="text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
            </div>
        </div>
    `;

    if(!user) return;

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.getElementById('ordersList');
    if(!list) return;

    if(error || !orders?.length) {
        list.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <div style="width: 100px; height: 100px; background: #f8fafc; border-radius: 35px; display: inline-flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 3rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3 style="font-weight: 800; color: var(--text);">Buyurtmalar yo'q</h3>
                <p style="color: var(--gray); font-size: 0.9rem; margin-top: 0.5rem;">Sizda hali hech qanday buyurtma mavjud emas.</p>
                <button class="btn btn-primary" style="margin-top: 2rem; width: 100%;" onclick="navTo('home')">XARID BOSHLASH</button>
            </div>
        `;
        return;
    }

    list.innerHTML = orders.map(o => `
        <div class="card" style="margin-bottom:0; border:1px solid #f1f5f9; box-shadow:0 4px 15px rgba(0,0,0,0.01);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:0.75rem; color:var(--gray); font-weight:800;">ID: #${o.id.toString().slice(-6)}</span>
                <span class="badge badge-${o.status}">${o.status === 'delivered' ? 'Yetkazilgan' : o.status === 'pending' ? 'Kutilmoqda' : 'Bekor qilingan'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <p style="font-size:0.85rem; font-weight:600; color:var(--gray);">${new Date(o.created_at).toLocaleDateString()}</p>
                    <h4 style="font-weight:900; font-size:1.1rem; color:var(--text); margin-top:4px;">${o.total_price.toLocaleString()} UZS</h4>
                </div>
                <button class="btn btn-outline" style="width:40px; height:40px; padding:0; border-radius:12px; font-size:0.8rem;" onclick="showToast('Batafsil ma\\'lumot yaqin orada...')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}
