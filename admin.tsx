
import { supabase, showToast, navTo } from "./index.tsx";

export async function switchAdminTab(tab: string) {
    const panel = document.getElementById('adminPanel');
    if(!panel) return;

    panel.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column;">
            <header style="padding:1.5rem; background:white; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:900; font-size:1.2rem; color:var(--dark);">
                    <i class="fas fa-shield-halved" style="color:var(--primary); margin-right:10px;"></i>
                    BOSHQARUV <span style="font-weight:400;">PANELI</span>
                </div>
                <button class="btn" style="height:40px; padding:0 20px; font-size:0.8rem; background:var(--dark); color:white; border-radius:12px;" onclick="navTo('profile')">
                    ILOVAGA QAYTISH
                </button>
            </header>
            
            <nav style="display:flex; background:white; border-bottom:1px solid #f1f5f9; overflow-x:auto;">
                <div class="admin-tab ${tab === 'dash' ? 'active' : ''}" onclick="switchAdminTab('dash')" style="padding:15px 25px; font-weight:800; font-size:0.8rem; cursor:pointer; color:${tab === 'dash' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'dash' ? 'var(--primary)' : 'transparent'};">ANALITIKA</div>
                <div class="admin-tab ${tab === 'inv' ? 'active' : ''}" onclick="switchAdminTab('inv')" style="padding:15px 25px; font-weight:800; font-size:0.8rem; cursor:pointer; color:${tab === 'inv' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'inv' ? 'var(--primary)' : 'transparent'};">SKLAD</div>
                <div class="admin-tab ${tab === 'orders' ? 'active' : ''}" onclick="switchAdminTab('orders')" style="padding:15px 25px; font-weight:800; font-size:0.8rem; cursor:pointer; color:${tab === 'orders' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'orders' ? 'var(--primary)' : 'transparent'};">BUYURTMALAR</div>
                <div class="admin-tab ${tab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')" style="padding:15px 25px; font-weight:800; font-size:0.8rem; cursor:pointer; color:${tab === 'users' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'users' ? 'var(--primary)' : 'transparent'};">FOYDALANUVCHILAR</div>
            </nav>

            <div id="adminTabContent" style="flex:1; overflow-y:auto; padding:20px; background:#f8fafc;">
                <div style="text-align:center; padding:50px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
            </div>
        </div>
    `;

    renderTabContent(tab);
}
(window as any).switchAdminTab = switchAdminTab;

async function renderTabContent(tab: string) {
    const content = document.getElementById('adminTabContent');
    if(!content) return;

    if(tab === 'dash') {
        const { data: prods } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { data: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { data: orders } = await supabase.from('orders').select('*', { count: 'exact', head: true });

        content.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div class="card" style="border:none; box-shadow:var(--shadow-sm); text-align:center;">
                    <div style="font-size:1.5rem; font-weight:900; color:var(--primary);">${prods || 0}</div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray);">MAHSULOTLAR</div>
                </div>
                <div class="card" style="border:none; box-shadow:var(--shadow-sm); text-align:center;">
                    <div style="font-size:1.5rem; font-weight:900; color:#3b82f6;">${users || 0}</div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray);">MIJOZLAR</div>
                </div>
                <div class="card" style="border:none; box-shadow:var(--shadow-sm); text-align:center;">
                    <div style="font-size:1.5rem; font-weight:900; color:var(--danger);">${orders || 0}</div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--gray);">BUYURTMALAR</div>
                </div>
            </div>
        `;
    } else if(tab === 'inv') {
        const { renderAdminInventory } = await import("./adminInventory.tsx");
        renderAdminInventory();
    } else if(tab === 'orders') {
        const { renderAdminOrders } = await import("./adminOrders.tsx");
        renderAdminOrders();
    } else if(tab === 'users') {
        const { renderAdminUsers } = await import("./adminUsers.tsx");
        renderAdminUsers();
    }
}
