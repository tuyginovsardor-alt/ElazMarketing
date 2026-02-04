
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
        
        // Update Bottom Nav Avatar
        const navIconContainer = document.getElementById('navProfileIconContainer');
        if (navIconContainer) {
            if (profile?.avatar_url) {
                navIconContainer.innerHTML = `<img src="${profile.avatar_url}" class="nav-profile-img">`;
            } else {
                navIconContainer.innerHTML = `<i class="far fa-user-circle" style="font-size: 1.6rem;"></i>`;
            }
        }

        // Update Header Actions
        const ha = document.getElementById('headerActions');
        if(ha && profile) {
            if(profile.role === 'admin' || profile.role === 'staff') {
                ha.innerHTML = `<button class="admin-badge-top" onclick="enterAdminPanel()">ADMIN</button>`;
            } else {
                ha.innerHTML = ``;
            }
        }
    } catch (e) { console.error(e); }
}

export async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        user = session.user;
        await loadProfileData();
        
        const urlParams = new URLSearchParams(window.location.search);
        const viewMode = urlParams.get('view');
        if (viewMode) {
            (window as any).navTo(viewMode);
        } else {
            (window as any).navTo('home');
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

// Fix: Added addToCart to index.tsx as it is required by other views like productDetails.tsx and home.tsx
export async function addToCart(productId: number, quantity: number = 1) {
    if (!user) {
        showToast("Savatga qo'shish uchun tizimga kiring");
        return;
    }
    try {
        const { data: existing, error: fetchError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from('cart_items')
                .insert([{ user_id: user.id, product_id: productId, quantity }]);
            if (insertError) throw insertError;
        }
        showToast("Savatga qo'shildi! 🛒");
    } catch (e: any) {
        showToast("Xatolik: " + e.message);
    }
}
(window as any).addToCart = addToCart;

// Fix: Added openProductDetails to index.tsx to handle product detail view opening from home.tsx
export async function openProductDetails(productId: number) {
    const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
    if (product && !error) {
        const { renderProductDetails } = await import("./productDetails.tsx");
        renderProductDetails(product);
    } else {
        showToast("Mahsulot topilmadi");
    }
}
(window as any).openProductDetails = openProductDetails;

// Fix: Added toggleLike to index.tsx to handle wishlist functionality in home.tsx
export async function toggleLike(productId: number, iconEl: HTMLElement) {
    if (!user) {
        showToast("Tizimga kiring");
        return;
    }
    try {
        const { data: existing } = await supabase.from('wishlist').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
        if (existing) {
            await supabase.from('wishlist').delete().eq('id', existing.id);
            iconEl.classList.remove('fas');
            iconEl.classList.add('far');
            iconEl.style.color = '#cbd5e1';
        } else {
            await supabase.from('wishlist').insert([{ user_id: user.id, product_id: productId }]);
            iconEl.classList.remove('far');
            iconEl.classList.add('fas');
            iconEl.style.color = '#f43f5e';
        }
    } catch (e: any) {
        showToast("Xatolik: " + e.message);
    }
}
(window as any).toggleLike = toggleLike;

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
    const showNavHeader = ['home', 'cart', 'profile', 'orders', 'saved'].includes(viewId);
    if(header) header.style.display = showNavHeader ? 'flex' : 'none';
    if(nav) nav.style.display = showNavHeader ? 'flex' : 'none';
}
(window as any).showView = showView;

// Fix: Exported navTo so it can be imported in other modules like profile.tsx
export const navTo = (view: string) => {
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
};
(window as any).navTo = navTo;

// Fix: Exported enterAdminPanel so it can be imported in other modules like profile.tsx
export const enterAdminPanel = () => {
    if(!profile || (profile.role !== 'admin' && profile.role !== 'staff')) return showToast("Ruxsat yo'q");
    const panel = document.getElementById('adminPanel');
    const app = document.getElementById('appContainer');
    if(panel && app) { 
        panel.style.display = 'flex'; 
        app.style.display = 'none'; 
        import("./admin.tsx").then(m => (window as any).switchAdminTab('dash')); 
    }
};
(window as any).enterAdminPanel = enterAdminPanel;

if (typeof window !== 'undefined') {
    window.onload = () => { checkAuth(); };
}
