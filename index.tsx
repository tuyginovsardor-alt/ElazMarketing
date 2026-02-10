
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";
import { renderProfileView } from "./profile.tsx";
import { renderHomeView } from "./home.tsx";
import { renderCartView } from "./cart.tsx";
import { renderOrdersView } from "./ordersView.tsx";
import { renderSavedView } from "./savedView.tsx";

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase keys are missing! Check your environment variables.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;

// --- NOTIFICATION & SOUND UTILS ---
export function playNotificationSound() {
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=message-incoming-132126.mp3');
    audio.play().catch(e => console.log("Ovoz ijro etilmadi"));
}

export async function requestPermissions() {
    if ("Notification" in window) {
        await Notification.requestPermission();
    }
}

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
        if (!data && !error) {
            const newProfile = { 
                id: user.id, email: user.email, 
                first_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                role: 'user', balance: 0
            };
            const { data: inserted } = await supabase.from('profiles').insert([newProfile]).select().single();
            data = inserted;
        }
        profile = data;
        
        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer && profile) {
            navIconContainer.innerHTML = profile.avatar_url ? 
                `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                `<i class="far fa-user-circle" style="font-size:1.3rem;"></i>`;
        }
        return profile;
    } catch (e) { 
        console.error("Profile load error", e);
        return null; 
    }
}

// --- NAVIGATION ---
export const navTo = async (view: string) => {
    if (view === 'profile') await loadProfileData();

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
    const map: any = { home:0, saved:1, cart:2, orders:3, profile:4 };
    if(navItems[map[view]]) navItems[map[view]].classList.add('active');
}

export function showView(viewId: string) {
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
    } catch (e) { showToast("Xatolik yuz berdi!"); }
}
(window as any).addToCart = addToCart;
