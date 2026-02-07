
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
                <button class="btn" style="height:38px; padding:0 15px; font-size:0.7rem; background:#1e293b; color:white; border-radius:10px; font-weight:800; border:none;" onclick="exitAdminPanel()">
                    CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:6px;"></i>
                </button>
            </header>
            
            <!-- ADMIN TABS -->
            <nav style="display:flex; background:white; border-bottom:1px solid #e2e8f0; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;">
                <div class="admin-tab" onclick="switchAdminTab('dash')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'dash' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'dash' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">ANALITIKA</div>
                <div class="admin-tab" onclick="switchAdminTab('inv')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'inv' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'inv' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">SKLAD</div>
                <div class="admin-tab" onclick="switchAdminTab('orders')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'orders' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'orders' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">BUYURTMALAR</div>
                <div class="admin-tab" onclick="switchAdminTab('users')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'users' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'users' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">FOYDALANUVCHILAR</div>
                <div class="admin-tab" onclick="switchAdminTab('fin')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'fin' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'fin' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">MOLIYA</div>
                <div class="admin-tab" onclick="switchAdminTab('bot')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'bot' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'bot' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">BOT</div>
                <div class="admin-tab" onclick="switchAdminTab('ads')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'ads' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'ads' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">MARKETING</div>
                <div class="admin-tab" onclick="switchAdminTab('settings')" style="padding:15px 20px; font-weight:800; font-size:0.65rem; cursor:pointer; color:${tab === 'settings' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'settings' ? 'var(--primary)' : 'transparent'}; transition:0.2s; white-space:nowrap; text-transform:uppercase;">SOZLAMALAR</div>
            </nav>

            <div id="adminTabContent" style="flex:1; overflow-y:auto; padding:20px; background:#f8fafc;">
                <div style="text-align:center; padding:100px 20px;">
                    <i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary); margin-bottom:15px;"></i>
                    <p style="font-weight:800; color:#94a3b8; font-size:0.8rem;">MA'LUMOTLAR YUKLANMOQDA...</p>
                </div>
            </div>
        </div>
    `;

    renderTabContent(tab);
}
(window as any).switchAdminTab = switchAdminTab;

(window as any).exitAdminPanel = () => {
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if(app) app.style.display = 'flex';
    if(admin) admin.style.display = 'none';
    navTo('profile');
};

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
        } else if(tab === 'users') {
            const { renderAdminUsers } = await import("./adminUsers.tsx");
            renderAdminUsers();
        } else if(tab === 'fin') {
            const { renderAdminFinance } = await import("./adminFinance.tsx");
            renderAdminFinance();
        } else if(tab === 'bot') {
            const { renderAdminBot } = await import("./adminBot.tsx");
            renderAdminBot();
        } else if(tab === 'ads') {
            const { renderAdminAds } = await import("./adminAds.tsx");
            renderAdminAds();
        } else if(tab === 'settings') {
            const { renderAdminSettings } = await import("./adminSettings.tsx");
            renderAdminSettings();
        }
    } catch (e: any) {
        content.innerHTML = `<div style="text-align:center; padding:50px; color:var(--danger); font-weight:800;">Xatolik yuz berdi: ${e.message}</div>`;
    }
}
