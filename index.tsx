
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";
import { renderProfileView } from "./profile.tsx";
import { renderHomeView } from "./home.tsx";
import { renderCartView } from "./cart.tsx";
import { renderOrdersView } from "./ordersView.tsx";
import { renderSavedView } from "./savedView.tsx";
import "./productDetails.tsx"; // Global funksiyalarni (openProductDetailsById) yuklash uchun

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || "";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;
export let adminBackupProfile: any = null;

// --- GLOBAL ACTIONS ---

(window as any).requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        showToast("Bildirishnomalar yoqildi! 🔔");
    }
};

const sendOrderNotification = (order: any) => {
    if (Notification.permission === 'granted') {
        const n = new Notification("YANGI BUYURTMA! 🛍️", {
            body: `Summa: ${order.total_price.toLocaleString()} UZS\nManzil: ${order.address_text || 'Belgilangan'}`,
            icon: 'https://ncbbjlduisavvxyscxbk.supabase.co/storage/v1/object/public/products/app_icon.png'
        });
        n.onclick = () => { window.focus(); navTo('orders'); };
        
        // Ovozli xabar
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(() => {});
    }
};

(window as any).openProfileEdit = async () => {
    const { openProfileEdit } = await import("./profileEdit.tsx");
    openProfileEdit();
};

(window as any).openPayment = async () => {
    const { openPaymentView } = await import("./payment.tsx");
    openPaymentView();
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

(window as any).openLegal = async (type: any) => {
    const { openLegal } = await import("./legal.tsx");
    openLegal(type);
};

(window as any).enterAdminPanel = async () => {
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if(app && admin) {
        app.style.display = 'none';
        admin.style.display = 'flex';
        const { switchAdminTab } = await import("./admin.tsx");
        switchAdminTab('dash');
    }
};

(window as any).exitAdminPanel = () => {
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if(app) app.style.display = 'flex';
    if(admin) admin.style.display = 'none';
};

(window as any).impersonateUser = (targetProfile: any) => {
    if(!adminBackupProfile) adminBackupProfile = { ...profile };
    profile = { ...targetProfile };
    const existingBanner = document.getElementById('impersonationBanner');
    if(existingBanner) existingBanner.remove();
    const banner = document.createElement('div');
    banner.id = 'impersonationBanner';
    banner.style.cssText = "position:fixed; top:0; left:0; width:100%; background:var(--danger); color:white; text-align:center; padding:10px; font-size:0.7rem; font-weight:900; z-index:10000; letter-spacing:1px;";
    banner.innerHTML = `MIJOZ REJIMIDA: ${targetProfile.first_name.toUpperCase()} <button onclick="window.stopImpersonating()" style="margin-left:15px; background:white; color:var(--danger); border:none; padding:4px 10px; border-radius:8px; font-weight:900; cursor:pointer;">ADMIN REJIMIGA QAYTISH</button>`;
    document.body.appendChild(banner);
    (window as any).exitAdminPanel();
    navTo('home');
};

(window as any).stopImpersonating = () => {
    if(adminBackupProfile) { profile = { ...adminBackupProfile }; adminBackupProfile = null; }
    const banner = document.getElementById('impersonationBanner');
    if(banner) banner.remove();
    navTo('profile');
};

(window as any).handleSignOut = async () => {
    if(!confirm("Tizimdan chiqmoqchimisiz?")) return;
    await supabase.auth.signOut();
    window.location.reload();
};

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

export async function addToCart(productId: number, quantity: number = 1) {
    if (!user) return showToast("Savatga qo'shish uchun tizimga kiring");
    try {
        const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
        if (existing) {
            await supabase.from('cart_items').update({ quantity: parseFloat((existing.quantity + quantity).toFixed(2)) }).eq('id', existing.id);
        } else {
            await supabase.from('cart_items').insert([{ user_id: user.id, product_id: productId, quantity: parseFloat(quantity.toFixed(2)) }]);
        }
        showToast("Savatga qo'shildi! 🛒");
    } catch (e) { showToast("Xatolik yuz berdi"); }
}
(window as any).addToCart = addToCart;

// --- NAVIGATION & REALTIME ---
export const navTo = async (view: string) => {
    if (!profile && user) await loadProfileData();

    if (profile?.role === 'courier' && view === 'orders') {
        const { renderCourierDashboard } = await import("./courierDashboard.tsx");
        showView('orders'); 
        renderCourierDashboard(user, profile);
        updateNavActive('orders');
        return;
    }

    showView(view);
    updateNavActive(view);
    
    try {
        if(view === 'home') renderHomeView();
        if(view === 'saved') renderSavedView();
        if(view === 'cart') renderCartView();
        if(view === 'orders') renderOrdersView();
        if(view === 'profile') renderProfileView(profile);
    } catch (e) { console.error("View rendering error:", e); }
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
    const isMainView = ['home', 'cart', 'profile', 'orders', 'saved'].includes(viewId);
    document.getElementById('appHeader')!.style.display = isMainView ? 'flex' : 'none';
    document.getElementById('bottomNav')!.style.display = isMainView ? 'flex' : 'none';
}
(window as any).showView = showView;

export async function loadProfileData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session?.user) return null;
        user = session.user;
        let { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        profile = data;
        
        // --- REALTIME NOTIFICATIONS ---
        if (profile?.role === 'admin' || profile?.role === 'courier') {
            supabase.channel('orders-monitor')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
                sendOrderNotification(payload.new);
            }).subscribe();
            
            if (Notification.permission === 'default') {
                setTimeout(() => (window as any).requestNotificationPermission(), 5000);
            }
        }

        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            navIconContainer.innerHTML = profile?.avatar_url ? `<img src="${profile.avatar_url}" class="nav-profile-img">` : `<i class="far fa-user-circle" style="font-size: 1.6rem;"></i>`;
        }
        return profile;
    } catch (e) { return null; }
}

export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        user = session.user;
        const p = await loadProfileData();
        navTo(p?.role === 'courier' ? 'orders' : 'home');
    } else {
        showView('auth');
        renderAuthView('login');
    }
}
window.onload = checkAuth;
