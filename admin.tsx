
export async function switchAdminTab(tab: string) {
    try {
        const titles: Record<string, string> = { 
            dash: 'Analitika Tizimi', 
            inv: 'Mahsulotlar Ombori', 
            orders: 'Buyurtmalar Nazorati', 
            users: 'Mijozlar va Kuryerlar',
            marketing: 'Marketing va Reklama',
            bot: 'ELAZ Bot Engine (v2.5)',
            settings: 'Tizim Sozlamalari'
        };
        
        const titleEl = document.getElementById('adminTabTitle');
        if(titleEl) titleEl.innerText = titles[tab] || 'Admin Panel';

        // Tablarni yashirish
        const tabs = ['dash', 'inv', 'orders', 'users', 'marketing', 'settings', 'bot'];
        tabs.forEach(t => {
            const el = document.getElementById('admin_tab_' + t);
            if(el) el.style.display = 'none';
        });

        // Navigatsiya holatini yangilash
        document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
        
        const target = document.getElementById('admin_tab_' + tab);
        if(target) target.style.display = 'block';
        
        // Faol menyuni belgilash
        const navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(item => {
            const label = (item as HTMLElement).innerText.toLowerCase();
            if (label.includes(tab.toLowerCase()) || 
                (tab === 'dash' && label.includes('analitika')) || 
                (tab === 'bot' && (label.includes('bot') || label.includes('robot')))) {
                item.classList.add('active');
            }
        });

        // Dinamik yuklash (Bu xatolikni oldini oladi)
        switch(tab) {
            case 'dash': 
                const dash = await import("./adminDashboard.tsx");
                dash.renderAdminDashboard(); 
                break;
            case 'inv': 
                const inv = await import("./adminInventory.tsx");
                inv.renderAdminInventory(); 
                break;
            case 'orders': 
                const ord = await import("./adminOrders.tsx");
                ord.renderAdminOrders(); 
                break;
            case 'users': 
                const usr = await import("./adminUsers.tsx");
                usr.renderAdminUsers(); 
                break;
            case 'bot': 
                const b = await import("./adminBot.tsx");
                b.renderAdminBot();
                break;
            case 'marketing': 
                const m = await import("./adminAds.tsx");
                m.renderAdminAds(); 
                break;
            case 'settings': 
                const s = await import("./adminSettings.tsx");
                s.renderAdminSettings(); 
                break;
        }
    } catch (err) {
        console.error("Admin Navigation Error:", err);
        import("./index.tsx").then(m => m.showToast("Bo'limni yuklashda xatolik yuz berdi."));
    }
}

// Window globalga ulaymiz
(window as any).switchAdminTab = switchAdminTab;
