
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";
import { renderProfileView } from "./profile.tsx";
import { renderHomeView } from "./home.tsx";
import { renderCartView } from "./cart.tsx";
import { renderOrdersView } from "./ordersView.tsx";
import { renderSavedView } from "./savedView.tsx";

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || "";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;
export let adminBackupProfile: any = null;

// --- UTILS ---
export function showToast(msg: string) {
    const t = document.getElementById('toast');
    if(t) {
        t.innerText = msg;
        t.style.display = 'block';
        t.style.animation = 'fadeIn 0.3s forwards';
        setTimeout(() => { 
            if(t) {
                t.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => t.style.display = 'none', 300);
            }
        }, 3000);
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

// --- CART ACTIONS ---
// Added addToCart function to resolve missing export errors in other files
export async function addToCart(productId: number, quantity: number = 1) {
    if (!user) {
        showToast("Savatga qo'shish uchun tizimga kiring");
        return;
    }
    try {
        const { data: existing } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        if (existing) {
            await supabase
                .from('cart_items')
                .update({ quantity: parseFloat((existing.quantity + quantity).toFixed(2)) })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('cart_items')
                .insert([{ user_id: user.id, product_id: productId, quantity: parseFloat(quantity.toFixed(2)) }]);
        }
        showToast("Savatga qo'shildi! 🛒");
    } catch (e) {
        console.error("Add to cart error:", e);
        showToast("Xatolik yuz berdi");
    }
}
(window as any).addToCart = addToCart;

// --- IMPERSONATION ---
export const impersonateUser = (targetProfile: any) => {
    if (!adminBackupProfile) adminBackupProfile = { ...profile };
    profile = targetProfile;
    showToast(`${targetProfile.first_name} hisobiga kirildi 🛡️`);
    updateImpersonationBanner();
    navTo('home');
};
(window as any).impersonateUser = impersonateUser;

export const stopImpersonation = () => {
    if (adminBackupProfile) {
        profile = { ...adminBackupProfile };
        adminBackupProfile = null;
        showToast("Admin rejimiga qaytildi ✨");
        updateImpersonationBanner();
        (window as any).enterAdminPanel();
    }
};
(window as any).stopImpersonation = stopImpersonation;

function updateImpersonationBanner() {
    let banner = document.getElementById('impersonationBanner');
    if (adminBackupProfile && profile) {
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'impersonationBanner';
            banner.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; z-index: 10000;
                background: #3b82f6; color: white; padding: 10px 20px;
                display: flex; justify-content: space-between; align-items: center;
                font-size: 0.75rem; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            `;
            document.body.prepend(banner);
        }
        banner.innerHTML = `
            <span><i class="fas fa-user-secret mr-2"></i> REJIM: ${profile.first_name?.toUpperCase()}</span>
            <button onclick="window.stopImpersonation()" style="background:white; color:#3b82f6; border:none; padding:5px 12px; border-radius:8px; font-weight:900; font-size:0.65rem; cursor:pointer;">QAYTISH</button>
        `;
    } else if (banner) banner.remove();
}

// --- DATA LOADING ---
export async function loadProfileData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session?.user) return null;
        user = session.user;

        if (adminBackupProfile) return profile;

        let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (!data) {
            const newProfile = { 
                id: user.id, email: user.email, 
                first_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                role: 'user', balance: 0, is_approved: false
            };
            const { data: inserted } = await supabase.from('profiles').insert([newProfile]).select().single();
            data = inserted;
        }
        profile = data;
        
        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            navIconContainer.innerHTML = profile?.avatar_url ? `<img src="${profile.avatar_url}" class="nav-profile-img">` : `<i class="far fa-user-circle" style="font-size: 1.6rem;"></i>`;
        }
        return profile;
    } catch (e) { return null; }
}

// --- NAVIGATION CORE ---
export const navTo = async (view: string) => {
    // 1. Profil yuklanganligini tekshirish
    if (!profile && user) {
        await loadProfileData();
    }

    // 2. Kuryer bo'lsa har doim Dashboard'ga yo'naltirish
    if (profile?.role === 'courier') {
        const { renderCourierDashboard } = await import("./courierDashboard.tsx");
        showView('orders'); 
        renderCourierDashboard(user, profile); // Ma'lumotlarni uzatamiz
        updateNavActive('orders');
        return;
    }

    // 3. Mijoz yoki Admin uchun standart navigatsiya
    showView(view);
    updateNavActive(view);
    
    try {
        if(view === 'home') renderHomeView();
        if(view === 'saved') renderSavedView();
        if(view === 'cart') renderCartView();
        if(view === 'orders') renderOrdersView();
        if(view === 'profile') renderProfileView(profile);
    } catch (e) {
        console.error("View rendering error:", e);
    }
};
(window as any).navTo = navTo;

function updateNavActive(view: string) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItems = document.querySelectorAll('.nav-item');
    if(view === 'home') navItems[0]?.classList.add('active');
    if(view === 'saved') navItems[1]?.classList.add('active');
    if(view === 'cart') navItems[2]?.classList.add('active');
    if(view === 'orders') navItems[3]?.classList.add('active');
    if(view === 'profile') navItems[4]?.classList.add('active');
}

export function showView(viewId: string) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(viewId + 'View') || document.getElementById('homeView');
    if(target) target.classList.add('active');
    
    const header = document.getElementById('appHeader');
    const nav = document.getElementById('bottomNav');
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');

    const isMainView = ['home', 'cart', 'profile', 'orders', 'saved'].includes(viewId);
    
    if(header) header.style.display = isMainView ? 'flex' : 'none';
    if(nav) nav.style.display = isMainView ? 'flex' : 'none';

    if(app && admin && admin.style.display === 'flex' && isMainView) {
        app.style.display = 'flex';
        admin.style.display = 'none';
    }
}
(window as any).showView = showView;

// --- BOOTSTRAP ---
export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        user = session.user;
        const p = await loadProfileData();
        // Role aniqlangandan keyin navigatsiya qilamiz
        navTo(p?.role === 'courier' ? 'orders' : 'home');
    } else {
        showView('auth');
        renderAuthView('login');
    }
}
window.onload = checkAuth;

// --- GLOBAL ACTIONS ---
(window as any).enterAdminPanel = async () => {
    const { switchAdminTab } = await import("./admin.tsx");
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if(app) app.style.display = 'none';
    if(admin) {
        admin.style.display = 'flex';
        switchAdminTab('dash');
    }
};

(window as any).handleSignOut = async () => {
    if(confirm("Chiqmoqchimisiz?")) {
        await supabase.auth.signOut();
        window.location.reload();
    }
};
