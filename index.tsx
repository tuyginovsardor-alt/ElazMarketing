
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";
import { renderProfileView } from "./profile.tsx";
import { renderHomeView } from "./home.tsx";
import { renderCartView } from "./cart.tsx";
import { renderOrdersView } from "./ordersView.tsx";
import { renderSavedView } from "./savedView.tsx";
import { renderWelcomeView } from "./welcome.tsx";

// Global modullarni import qilish
import "./legal.tsx";
import "./security.tsx";

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || "";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;

export function showToast(msg: string) {
    const t = document.getElementById('toast');
    if(t) {
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => { if(t) t.style.display = 'none'; }, 3000);
    }
}
(window as any).showToast = showToast;

export function openOverlay(id: string) {
    const el = document.getElementById(id);
    if(el) {
        el.style.display = 'block';
        window.history.pushState({ overlay: id }, "", "");
    }
}
(window as any).openOverlay = openOverlay;

export function closeOverlay(id: string) {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
}
(window as any).closeOverlay = closeOverlay;

// --- CART FUNKSIYALARI (GLOBAL) ---

// Implement and export addToCart function to be used by home and product details views
export async function addToCart(productId: number, qty: number = 1) {
    if(!user) return showToast("Savatga qo'shish uchun tizimga kiring");
    
    try {
        const { data: existing } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        if(existing) {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + qty })
                .eq('id', existing.id);
            if(error) throw error;
        } else {
            const { error } = await supabase
                .from('cart_items')
                .insert([{ user_id: user.id, product_id: productId, quantity: qty }]);
            if(error) throw error;
        }
        showToast("Savatga qo'shildi! 🛒");
    } catch (e: any) {
        console.error(e);
        showToast("Xatolik: Savatga qo'shib bo'lmadi");
    }
}
(window as any).addToCart = addToCart;

// --- PROFIL FUNKSIYALARI (GLOBAL) ---

(window as any).openCourierRegistration = async () => {
    showToast("Yuklanmoqda...");
    try {
        const { openCourierRegistrationForm } = await import("./courierRegistration.tsx");
        openCourierRegistrationForm();
    } catch (e) {
        console.error(e);
        showToast("Kuryer sahifasini yuklab bo'lmadi");
    }
};

(window as any).openSupportCenter = async () => {
    showToast("Bog'lanish...");
    try {
        const { renderSupportView } = await import("./supportView.tsx");
        renderSupportView();
    } catch (e) {
        console.error(e);
        showToast("Yordam sahifasini yuklab bo'lmadi");
    }
};

(window as any).openCourierDashboard = async () => {
    try {
        const { renderCourierDashboard } = await import("./courierDashboard.tsx");
        renderCourierDashboard();
    } catch (e) {
        console.error(e);
        showToast("Dashboard yuklanmadi");
    }
};

(window as any).enterAdminPanel = async () => {
    if(!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
        showToast("Ruxsat yo'q!");
        return;
    }
    const panel = document.getElementById('adminPanel');
    const app = document.getElementById('appContainer');
    if(panel && app) { 
        panel.style.display = 'flex'; 
        app.style.display = 'none'; 
        const { switchAdminTab } = await import("./admin.tsx");
        switchAdminTab('dash'); 
    }
};

(window as any).connectToBot = async () => {
    if(!profile) return showToast("Tizimga kiring");
    const token = Math.random().toString(36).substring(2, 15);
    showToast("Telegramga yo'naltirilmoqda...");
    const { error } = await supabase.from('profiles').update({ link_token: token }).eq('id', profile.id);
    if(!error) {
        const botUsername = "elaz_market_bot"; 
        window.open(`https://t.me/${botUsername}?start=${token}`, '_blank');
    } else {
        showToast("Xatolik: " + error.message);
    }
};

// --- STANDART NAVIGATSIYA ---

export async function loadProfileData() {
    const { data: { session } } = await supabase.auth.getSession();
    if(!session?.user) return;
    user = session.user;
    try {
        let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (!data && !error) {
            const { data: inserted } = await supabase.from('profiles').insert([{ 
                id: user.id, 
                email: user.email, 
                first_name: user.user_metadata?.first_name || user.email?.split('@')[0],
                role: 'user', 
                balance: 0
            }]).select().single();
            data = inserted;
        }
        profile = data;
        
        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            if (profile?.avatar_url) {
                navIconContainer.innerHTML = `<img src="${profile.avatar_url}" class="nav-profile-img">`;
            } else {
                navIconContainer.innerHTML = `<i class="far fa-user-circle" style="font-size: 1.6rem;"></i>`;
            }
        }
    } catch (e) { console.error(e); }
}

export const navTo = (view: string) => {
    showView(view);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItems = document.querySelectorAll('.nav-item');
    if(view === 'home') navItems[0]?.classList.add('active');
    if(view === 'saved') navItems[1]?.classList.add('active');
    if(view === 'cart') navItems[2]?.classList.add('active');
    if(view === 'orders') navItems[3]?.classList.add('active');
    if(view === 'profile') navItems[4]?.classList.add('active');
    
    if(view === 'home') renderHomeView();
    if(view === 'saved') renderSavedView();
    if(view === 'cart') renderCartView();
    if(view === 'orders') renderOrdersView();
    if(view === 'profile') renderProfileView(profile);
};
(window as any).navTo = navTo;

export function showView(viewId: string) {
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if(app) app.style.display = 'flex';
    if(admin) admin.style.display = 'none';

    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(viewId + 'View') || document.getElementById('homeView');
    if(target) target.classList.add('active');
    
    const header = document.getElementById('appHeader');
    const nav = document.getElementById('bottomNav');
    const showNavHeader = ['home', 'cart', 'profile', 'orders', 'saved'].includes(viewId);
    if(header) header.style.display = showNavHeader ? 'flex' : 'none';
    if(nav) nav.style.display = showNavHeader ? 'flex' : 'none';
}
(window as any).showView = showView;

export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        user = session.user;
        await loadProfileData();
        navTo('home');
    } else {
        showView('auth');
        renderAuthView('login');
    }
}
window.onload = checkAuth;
