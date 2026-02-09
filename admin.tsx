
import { supabase, showToast, navTo } from "./index.tsx";

export async function switchAdminTab(tab: string) {
    const panel = document.getElementById('adminPanel');
    if(!panel) return;

    panel.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; background:#f8fafc;">
            <!-- ADMIN HEADER -->
            <header style="padding:1rem 1.5rem; background:white; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:900; font-size:1rem; color:#0f172a; display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; background:var(--gradient); border-radius:8px; display:flex; align-items:center; justify-content:center; color:white;">
                        <i class="fas fa-shield-halved" style="font-size:0.9rem;"></i>
                    </div>
                    <span style="letter-spacing:-0.5px;">ELAZ <span style="color:var(--primary); font-weight:600;">CONTROL</span></span>
                </div>
                <button class="btn" style="height:38px; padding:0 15px; font-size:0.7rem; background:#1e293b; color:white; border-radius:10px; font-weight:800; border:none;" onclick="window.exitAdminPanel()">
                    CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:6px;"></i>
                </button>
            </header>
            
            <!-- ADMIN TABS (YANGILANGAN) -->
            <nav style="display:flex; background:white; border-bottom:1px solid #e2e8f0; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;">
                <div class="admin-tab" onclick="window.switchAdminTab('dash')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'dash' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'dash' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">ANALITIKA</div>
                <div class="admin-tab" onclick="window.switchAdminTab('inv')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'inv' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'inv' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">SKLAD</div>
                <div class="admin-tab" onclick="window.switchAdminTab('orders')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'orders' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'orders' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">BUYURTMALAR</div>
                <div class="admin-tab" onclick="window.switchAdminTab('couriers')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'couriers' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'couriers' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">KURYERLAR</div>
                <div class="admin-tab" onclick="window.switchAdminTab('users')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'users' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'users' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">FOYDALANUVCHILAR</div>
                <div class="admin-tab" onclick="window.switchAdminTab('fin')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'fin' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'fin' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">MOLIYA</div>
            </nav>

            <div id="adminTabContent" style="flex:1; overflow-y:auto; padding:20px; background:#f8fafc;">
                <div style="text-align:center; padding:100px 20px;">
                    <i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary); margin-bottom:15px;"></i>
                    <p style="font-weight:800; color:#94a3b8; font-size:0.8rem;">YUKLANMOQDA...</p>
                </div>
            </div>
        </div>
    `;

    renderTabContent(tab);
}
(window as any).switchAdminTab = switchAdminTab;

async function renderTabContent(tab: string) {
    const content = document.getElementById('adminTabContent');
    if(!content) return;

    try {
        if(tab === 'dash') {
            const { renderAdminDashboard } = await import("./adminDashboard.tsx");
            renderAdminDashboard();
        } else if(tab === 'inv') {
            const { renderAdminInventory } = await import("./adminInventory.tsx");
            renderAdminInventory();
        } else if(tab === 'orders') {
            const { renderAdminOrders } = await import("./adminOrders.tsx");
            renderAdminOrders();
        } else if(tab === 'couriers') {
            const { renderAdminCouriers } = await import("./adminCouriers.tsx");
            renderAdminCouriers();
        } else if(tab === 'users') {
            const { renderAdminUsers } = await import("./adminUsers.tsx");
            renderAdminUsers();
        } else if(tab === 'fin') {
            const { renderAdminFinance } = await import("./adminFinance.tsx");
            renderAdminFinance();
        }
    } catch (e: any) {
        content.innerHTML = `<div style="text-align:center; padding:50px; color:var(--danger); font-weight:800;">Xato: ${e.message}</div>`;
    }
}
