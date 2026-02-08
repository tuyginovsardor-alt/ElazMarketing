
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

export async function loadProfileData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session?.user) return null;
        user = session.user;

        // Profilni olishga harakat qilamiz
        let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (error) {
            console.error("Profile fetch error:", error);
            // Agar RLS xatosi bo'lsa, sessiyani yangilashga urinib ko'ramiz
            if (error.code === 'PGRST116') {
                console.warn("Profile not found, creating new one...");
            } else {
                return null;
            }
        }

        // Agar profil yo'q bo'lsa, yangi yaratamiz
        if (!data) {
            const newProfile = { 
                id: user.id, 
                email: user.email, 
                first_name: user.user_metadata?.full_name || user.user_metadata?.first_name || user.email?.split('@')[0],
                role: 'user', 
                balance: 0
            };
            
            const { data: inserted, error: insError } = await supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();
            
            if (insError) {
                console.error("Profile insert error:", insError);
                // Agar insert xatosi bo'lsa, xatolikni ko'rsatamiz
                showToast("Profilni yaratib bo'lmadi. Sahifani yangilang.");
                return null;
            }
            data = inserted;
        }
        
        profile = data;
        
        // Navigatsiya ikonkasini yangilash
        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            navIconContainer.innerHTML = profile?.avatar_url ? `<img src="${profile.avatar_url}" class="nav-profile-img">` : `<i class="far fa-user-circle" style="font-size: 1.6rem;"></i>`;
        }
        
        return profile;
    } catch (e) { 
        console.error("Global Profile Load Error:", e);
        return null;
    }
}

export const navTo = async (view: string) => {
    // Har safar navigatsiya bo'lganda profilni yangilab olish xavfsizroq
    if (view === 'profile') {
        await loadProfileData();
    }

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
        const prof = await loadProfileData();
        if (prof) {
            navTo('home');
        } else {
            // Agar profilni o'qib bo'lmasa, authga qaytaramiz yoki xato beramiz
            showView('auth');
            renderAuthView('login');
        }
    } else {
        showView('auth');
        renderAuthView('login');
    }
}
window.onload = checkAuth;

// --- GLOBAL NAV ACTIONS ---

(window as any).enterAdminPanel = async () => {
    const { switchAdminTab } = await import("./admin.tsx");
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if(app) app.style.display = 'none';
    if(admin) admin.style.display = 'flex';
    switchAdminTab('dash');
};

(window as any).openPayment = async () => {
    const { openPaymentView } = await import("./payment.tsx");
    openPaymentView();
};

(window as any).openCourierDashboard = async () => {
    navTo('orders');
    const { renderCourierDashboard } = await import("./courierDashboard.tsx");
    renderCourierDashboard();
};

(window as any).openCourierRegistration = async () => {
    const { openCourierRegistrationForm } = await import("./courierRegistration.tsx");
    openCourierRegistrationForm();
};

(window as any).openSupportCenter = async () => {
    const { renderSupportView } = await import("./supportView.tsx");
    renderSupportView();
};

(window as any).openProfileSecurity = async () => {
    const { openProfileSecurity } = await import("./security.tsx");
    openProfileSecurity();
};

export const addToCart = async (productId: number, qty: number = 1) => {
    if(!user) return showToast("Tizimga kiring");
    try {
        const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
        if(existing) await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
        else await supabase.from('cart_items').insert([{ user_id: user.id, product_id: productId, quantity: qty }]);
        showToast("Savatga qo'shildi! 🛒");
    } catch (e) { showToast("Xatolik!"); }
};
(window as any).addToCart = addToCart;

export const toggleFavorite = async (productId: number) => {
    if(!user) return showToast("Tizimga kiring");
    const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
    if(existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
        showToast("Sevimli ro'yxatidan o'chirildi");
    } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
        showToast("Sevimli ro'yxatiga qo'shildi ❤️");
    }
};
(window as any).toggleFavorite = toggleFavorite;
