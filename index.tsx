
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";
import { renderProfileView } from "./profile.tsx";
import { renderHomeView } from "./home.tsx";
import { renderCartView } from "./cart.tsx";
import { renderOrdersView } from "./ordersView.tsx";
import { renderSavedView } from "./savedView.tsx";

// Modullarni ishga tushirish (global window funksiyalari uchun)
import "./productDetails.tsx"; 
import "./profileEdit.tsx";
import "./payment.tsx";
import "./security.tsx";
import "./courierRegistration.tsx";
import "./supportView.tsx";
import "./legal.tsx";

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || "";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;

// --- GLOBAL ACTIONS ---
export const showToast = (msg: string) => {
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
};
(window as any).showToast = showToast;

export const openOverlay = (id: string) => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'flex';
};
(window as any).openOverlay = openOverlay;

export const closeOverlay = (id: string) => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
};
(window as any).closeOverlay = closeOverlay;

export const addToCart = async (productId: number, qty: number = 1) => {
    if(!user) return showToast("Savatga qo'shish uchun tizimga kiring");
    try {
        const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
        if(existing) {
            await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
        } else {
            await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: qty });
        }
        showToast("Savatga qo'shildi! 🛒");
    } catch(e) {
        showToast("Xato yuz berdi");
    }
};
(window as any).addToCart = addToCart;

export const navTo = async (view: string) => {
    if (!profile && user) await loadProfileData();
    
    // Kuryer uchun maxsus orders view (Courier Dashboard)
    if (profile?.role === 'courier' && view === 'orders') {
        const { renderCourierDashboard } = await import("./courierDashboard.tsx");
        showView('orders'); 
        renderCourierDashboard(user, profile);
        return;
    }

    showView(view);
    if(view === 'home') renderHomeView();
    if(view === 'saved') renderSavedView();
    if(view === 'cart') renderCartView();
    if(view === 'orders') renderOrdersView();
    if(view === 'profile') renderProfileView(profile);
};
(window as any).navTo = navTo;

export function showView(viewId: string) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(viewId + 'View') || document.getElementById('homeView');
    if(target) target.classList.add('active');
    
    // Navigatsiya holatini yangilash
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(n => (n as any).onclick?.toString().includes(`'${viewId}'`));
    if(activeNav) activeNav.classList.add('active');

    const isMainView = ['home', 'cart', 'profile', 'orders', 'saved'].includes(viewId);
    const header = document.getElementById('appHeader');
    const bottomNav = document.getElementById('bottomNav');
    if (header) header.style.display = isMainView ? 'flex' : 'none';
    if (bottomNav) bottomNav.style.display = isMainView ? 'flex' : 'none';
}

export async function loadProfileData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session?.user) return null;
        user = session.user;
        let { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (!data) {
            const { data: newProfile } = await supabase.from('profiles').insert({
                id: user.id,
                phone: user.phone || null,
                email: user.email || null,
                first_name: user.user_metadata?.full_name || 'Mijoz',
                role: 'user',
                balance: 0
            }).select().single();
            data = newProfile;
        }
        
        profile = data;
        return profile;
    } catch (e) { return null; }
}

export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        user = session.user;
        const p = await loadProfileData();
        if (p && !p.region) {
            const { openLocationSetup } = await import("./location.tsx");
            openLocationSetup();
        } else {
            navTo(p?.role === 'courier' ? 'orders' : 'home');
        }
    } else {
        showView('auth');
        renderAuthView('phone');
    }
}

(window as any).enterAdminPanel = async () => {
    const { switchAdminTab } = await import("./admin.tsx");
    const app = document.getElementById('appContainer');
    const admin = document.getElementById('adminPanel');
    if (app) app.style.display = 'none';
    if (admin) {
        admin.style.display = 'block';
        switchAdminTab('dash');
    }
};

(window as any).handleSignOut = async () => {
    if(!confirm("Tizimdan chiqmoqchimisiz?")) return;
    await supabase.auth.signOut();
    window.location.reload();
};

window.onload = checkAuth;
