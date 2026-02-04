
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";
import { renderProfileView } from "./profile.tsx";
import { renderHomeView } from "./home.tsx";
import { renderCartView } from "./cart.tsx";
import { renderOrdersView } from "./ordersView.tsx";
import { renderSavedView } from "./savedView.tsx";
import { renderWelcomeView } from "./welcome.tsx";

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;
let currentOverlayId: string | null = null;

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
        currentOverlayId = id;
        window.history.pushState({ overlay: id }, "", "");
    }
}
(window as any).openOverlay = openOverlay;

export function closeOverlay(id: string) {
    const el = document.getElementById(id);
    if(el) {
        el.style.display = 'none';
        if(currentOverlayId === id) currentOverlayId = null;
    }
}
(window as any).closeOverlay = closeOverlay;

window.onpopstate = () => {
    const overlays = document.querySelectorAll('.overlay');
    overlays.forEach(ov => {
        (ov as HTMLElement).style.display = 'none';
    });
    currentOverlayId = null;
};

// Mahsulot batafsil oynasini ochish
(window as any).openProductDetails = async (id: number) => {
    const { data: prod } = await supabase.from('products').select('*').eq('id', id).single();
    if (prod) {
        const { renderProductDetails } = await import("./productDetails.tsx");
        renderProductDetails(prod);
    }
};

(window as any).toggleLike = async (id: number, el: HTMLElement) => {
    if(!user) return showToast("Tizimga kiring");
    const isLiked = el.classList.contains('fas');
    if(isLiked) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', id);
        el.classList.replace('fas', 'far'); el.style.color = '#cbd5e1';
    } else {
        await supabase.from('wishlist').insert({ user_id: user.id, product_id: id });
        el.classList.replace('far', 'fas'); el.style.color = '#f43f5e';
        showToast("Tanlanganlarga qo'shildi ❤️");
    }
};

export const addToCart = async (id: number, qty = 1) => {
    if(!user) return showToast("Tizimga kiring");
    
    const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', id).maybeSingle();
    
    if(existing) {
        const { error } = await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
        if(!error) showToast("Savatdagi miqdor yangilandi! 🛒");
    } else {
        const { error } = await supabase.from('cart_items').insert([{ user_id: user.id, product_id: id, quantity: qty }]);
        if(!error) showToast("Savatga qo'shildi! 🛒");
    }
};
(window as any).addToCart = addToCart;

export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        user = session.user;
        await loadProfileData();
        
        const urlParams = new URLSearchParams(window.location.search);
        const applyMode = urlParams.get('apply') === 'true';
        const viewMode = urlParams.get('view');

        if (applyMode) {
            const { openCourierRegistrationForm } = await import("./courierRegistration.tsx");
            openCourierRegistrationForm();
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (viewMode) {
            (window as any).navTo(viewMode);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (!profile?.district) {
            import("./location.tsx").then(m => m.openLocationSetup());
        } else {
            if(profile.role === 'courier') {
                (window as any).navTo('courier');
            } else {
                (window as any).navTo('home');
            }
        }
    } else {
        user = null; profile = null;
        if(!localStorage.getItem('welcomeShown')) {
            showView('welcome');
            renderWelcomeView(() => {
                localStorage.setItem('welcomeShown', 'true');
                showView('auth');
                renderAuthView('login');
            });
        } else {
            showView('auth');
            renderAuthView('login');
        }
    }
}

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
                first_name: user.user_metadata?.full_name || user.user_metadata?.first_name || user.email?.split('@')[0],
                role: 'user', 
                balance: 0
            }]).select().single();
            data = inserted;
        }
        profile = data;
        
        // --- DINAMIK NAV ICON YANGILASH ---
        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            if (profile?.avatar_url) {
                navIconContainer.innerHTML = `<img src="${profile.avatar_url}" class="nav-profile-img">`;
            } else {
                navIconContainer.innerHTML = `<i class="far fa-user-circle"></i>`;
            }
        }

        const rb = document.getElementById('roleBadge');
        if(rb && profile) rb.innerHTML = `<span style="background:var(--primary-light); color:var(--primary); padding:6px 14px; border-radius:14px; font-size:0.65rem; font-weight:900; text-transform:uppercase; border:1px solid var(--primary);">${profile.role}</span>`;
    } catch (e) { console.error(e); }
}

export const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};
(window as any).handleSignOut = handleSignOut;

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
    const showNavHeader = ['home', 'cart', 'profile', 'orders', 'saved', 'courier'].includes(viewId);
    if(header) header.style.display = showNavHeader ? 'flex' : 'none';
    if(nav) nav.style.display = showNavHeader ? 'flex' : 'none';
}
(window as any).showView = showView;

(window as any).navTo = (view: string) => {
    showView(view);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const navItems = document.querySelectorAll('.nav-item');
    if(view === 'home') navItems[0].classList.add('active');
    if(view === 'saved') navItems[1].classList.add('active');
    if(view === 'cart') navItems[2].classList.add('active');
    if(view === 'orders') navItems[3].classList.add('active');
    if(view === 'profile') navItems[4].classList.add('active');
    
    if(view === 'home') renderHomeView();
    if(view === 'saved') renderSavedView();
    if(view === 'cart') renderCartView();
    if(view === 'orders') renderOrdersView();
    if(view === 'profile') renderProfileView(profile);
    if(view === 'courier') import("./courierDashboard.tsx").then(m => m.renderCourierDashboard());
};

(window as any).enterAdminPanel = () => {
    if(!profile || (profile.role !== 'admin' && profile.role !== 'staff')) return showToast("Ruxsat yo'q");
    const panel = document.getElementById('adminPanel');
    const app = document.getElementById('appContainer');
    if(panel && app) { 
        panel.style.display = 'flex'; 
        app.style.display = 'none'; 
        import("./admin.tsx").then(m => (window as any).switchAdminTab('dash')); 
    }
};

(window as any).exitAdminPanel = () => {
    const panel = document.getElementById('adminPanel');
    const app = document.getElementById('appContainer');
    if(panel && app) {
        panel.style.display = 'none';
        app.style.display = 'flex';
    }
    (window as any).navTo('profile');
};

if (typeof window !== 'undefined') {
    window.onload = () => { checkAuth(); };
}
