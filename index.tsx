
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

// --- NOTIFICATION & SOUND UTILS ---
export function playNotificationSound() {
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=message-incoming-132126.mp3');
    audio.play().catch(e => console.log("Ovoz ijro etilmadi (User interaction kerak)"));
}

export async function requestPermissions() {
    if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") console.log("Bildirishnomalar yoqildi");
    }
}

export function sendPush(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
    showToast(body);
}

// --- GLOBAL UTILS ---
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

// --- PROFILE LOADING ---
export async function loadProfileData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session?.user) return null;
        user = session.user;

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

        // --- AVTOMATIK TASDIQLASH (ESKI KURYERLAR UCHUN) ---
        // Agar roli kuryer bo'lsa-yu, is_approved hali false bo'lsa, uni true qilib qo'yamiz (bir marta)
        if (data.role === 'courier' && data.is_approved === false) {
            console.log("Eski kuryer aniqlandi, avtomatik tasdiqlanmoqda...");
            const { data: updated } = await supabase.from('profiles').update({ is_approved: true }).eq('id', user.id).select().single();
            if (updated) data = updated;
        }

        profile = data;
        
        setupClientOrderMonitoring();

        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            navIconContainer.innerHTML = profile?.avatar_url ? `<img src="${profile.avatar_url}" class="nav-profile-img">` : `<i class="far fa-user-circle" style="font-size: 1.6rem;"></i>`;
        }
        return profile;
    } catch (e) { return null; }
}

function setupClientOrderMonitoring() {
    if (!user) return;
    supabase.channel('client_orders')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            if (oldStatus !== newStatus) {
                if (newStatus === 'delivering') {
                    sendPush("ELAZ MARKET", "🛵 Kuryer buyurtmangizni qabul qildi va yo'lga chiqdi!");
                    playNotificationSound();
                } else if (newStatus === 'delivered') {
                    sendPush("ELAZ MARKET", "✅ Buyurtmangiz yetkazib berildi. Yoqimli ishtaha!");
                    playNotificationSound();
                }
                if (document.getElementById('ordersView')?.classList.contains('active')) renderOrdersView();
            }
        }).subscribe();
}

// --- NAVIGATION ---
export const navTo = async (view: string) => {
    if (view === 'profile') await loadProfileData();

    if(view === 'orders' && profile?.role === 'courier') {
        const { renderCourierDashboard } = await import("./courierDashboard.tsx");
        showView('orders');
        renderCourierDashboard();
        updateNavActive('orders');
        return;
    }

    showView(view);
    updateNavActive(view);
    
    if(view === 'home') renderHomeView();
    if(view === 'saved') renderSavedView();
    if(view === 'cart') renderCartView();
    if(view === 'orders') renderOrdersView();
    if(view === 'profile') renderProfileView(profile);
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
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(viewId + 'View') || document.getElementById('homeView');
    if(target) target.classList.add('active');
    
    const header = document.getElementById('appHeader');
    const nav = document.getElementById('bottomNav');
    const showNavHeader = ['home', 'cart', 'profile', 'orders', 'saved'].includes(viewId);
    
    if(header) header.style.display = showNavHeader ? 'flex' : 'none';
    if(nav) nav.style.display = showNavHeader ? 'flex' : 'none';

    if(app && admin && admin.style.display === 'flex' && showNavHeader) {
        app.style.display = 'flex';
        admin.style.display = 'none';
    }
}
(window as any).showView = showView;

export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        user = session.user;
        await loadProfileData();
        requestPermissions();
        navTo('home');
    } else {
        showView('auth');
        renderAuthView('login');
    }
}
window.onload = checkAuth;

// --- PROFILE FEATURE INDEXING ---
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
    if(confirm("Tizimdan chiqmoqchimisiz?")) {
        await supabase.auth.signOut();
        window.location.reload();
    }
};

export async function addToCart(productId: number, qty: number = 1) {
    if(!user) return showToast("Iltimos, avval tizimga kiring 🔑");
    try {
        const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
        if(existing) {
            await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
        } else {
            await supabase.from('cart_items').insert([{ user_id: user.id, product_id: productId, quantity: qty }]);
        }
        showToast("Savatga qo'shildi! 🛒");
        const cartView = document.getElementById('cartView');
        if(cartView?.classList.contains('active')) renderCartView();
    } catch (e) { showToast("Xatolik yuz berdi!"); }
}
(window as any).addToCart = addToCart;
