
import { supabase, showToast, navTo } from "./index.tsx";

export async function switchAdminTab(tab: string) {
    const panel = document.getElementById('adminPanel');
    if(!panel) return;

    panel.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; background:#f1f5f9;">
            <header style="padding:1.2rem 1.5rem; background:white; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:900; font-size:1.1rem; color:var(--dark); display:flex; align-items:center; gap:12px;">
                    <div style="width:36px; height:36px; background:var(--gradient); border-radius:10px; display:flex; align-items:center; justify-content:center; color:white;">
                        <i class="fas fa-shield-halved"></i>
                    </div>
                    ELAZ <span style="font-weight:400; color:var(--primary);">CONTROL</span>
                </div>
                <button class="btn" style="height:42px; padding:0 20px; font-size:0.75rem; background:var(--dark); color:white; border-radius:12px; font-weight:800;" onclick="navTo('profile')">
                    CHIQISH <i class="fas fa-sign-out-alt" style="margin-left:8px;"></i>
                </button>
            </header>
            
            <nav style="display:flex; background:white; border-bottom:1px solid #e2e8f0; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;">
                <div class="admin-tab" onclick="switchAdminTab('dash')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'dash' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'dash' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">ANALITIKA</div>
                <div class="admin-tab" onclick="switchAdminTab('inv')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'inv' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'inv' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">SKLAD</div>
                <div class="admin-tab" onclick="switchAdminTab('orders')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'orders' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'orders' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">BUYURTMALAR</div>
                <div class="admin-tab" onclick="switchAdminTab('users')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'users' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'users' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">FOYDALANUVCHILAR</div>
                <div class="admin-tab" onclick="switchAdminTab('bot')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'bot' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'bot' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">BOT</div>
                <div class="admin-tab" onclick="switchAdminTab('ads')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'ads' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'ads' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">MARKETING</div>
                <div class="admin-tab" onclick="switchAdminTab('settings')" style="padding:18px 22px; font-weight:800; font-size:0.7rem; cursor:pointer; color:${tab === 'settings' ? 'var(--primary)' : '#94a3b8'}; border-bottom:3px solid ${tab === 'settings' ? 'var(--primary)' : 'transparent'}; transition:0.3s;">SOZLAMALAR</div>
            </nav>

            <div id="adminTabContent" style="flex:1; overflow-y:auto; padding:20px; background:#f8fafc;">
                <div style="text-align:center; padding:50px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
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
        } else if(tab === 'users') {
            const { renderAdminUsers } = await import("./adminUsers.tsx");
            renderAdminUsers();
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
        content.innerHTML = `<div style="text-align:center; padding:40px; color:var(--danger);">Xatolik: ${e.message}</div>`;
    }
}
