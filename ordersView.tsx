
import { supabase, user, showToast } from "./index.tsx";

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
                <button class="btn btn-primary" style="margin-top: 2rem; width: 100%;" onclick="navTo('home')">XARID BOSHLASH</button>
            </div>
        `;
        return;
    }

    list.innerHTML = orders.map(o => `
        <div class="card" style="margin-bottom:0; border:1px solid #f1f5f9; padding:20px; border-radius:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:0.75rem; color:var(--gray); font-weight:800;">#ORD-${o.id.toString().substring(0,6)}</span>
                <span style="padding:4px 10px; border-radius:8px; font-size:0.65rem; font-weight:900; text-transform:uppercase; background:${o.status === 'delivered' ? '#f0fdf4' : '#fff7ed'}; color:${o.status === 'delivered' ? '#16a34a' : '#ea580c'};">
                    ${o.status === 'delivered' ? 'Yetkazilgan' : 'Jarayonda'}
                </span>
            </div>
            
            <div style="margin-bottom:15px;">
                <p style="font-size:0.85rem; font-weight:600; color:var(--gray);">${new Date(o.created_at).toLocaleDateString()}</p>
                <h4 style="font-weight:900; font-size:1.2rem; color:var(--text); margin-top:4px;">${o.total_price.toLocaleString()} UZS</h4>
            </div>

            ${o.status === 'delivered' && !o.rating ? `
                <div style="border-top: 1px dashed #e2e8f0; padding-top: 15px; text-align: center;">
                    <p style="font-size: 0.75rem; font-weight: 800; color: var(--gray); margin-bottom: 10px;">XIZMATNI BAHOLANG:</p>
                    <div style="display: flex; justify-content: center; gap: 10px; font-size: 1.5rem; color: #eab308;">
                        ${[1, 2, 3, 4, 5].map(star => `<i class="far fa-star" onclick="rateOrder(${o.id}, ${star})" style="cursor:pointer;"></i>`).join('')}
                    </div>
                </div>
            ` : o.rating ? `
                <div style="border-top: 1px dashed #e2e8f0; padding-top: 10px; text-align: center; color: #eab308;">
                    ${Array.from({length: o.rating}).map(() => `<i class="fas fa-star" style="font-size:0.8rem;"></i>`).join('')}
                    <span style="font-size: 0.7rem; font-weight: 800; color: var(--gray); margin-left: 5px;">Baholangan</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

(window as any).rateOrder = async (orderId: number, rating: number) => {
    showToast("Baholash uchun rahmat! ⭐");
    const { error } = await supabase.from('orders').update({ rating }).eq('id', orderId);
    if(!error) renderOrdersView();
};
