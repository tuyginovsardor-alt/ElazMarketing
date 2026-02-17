
import { createClient } from '@supabase/supabase-js';
import { renderAuthView } from "./auth.tsx";

const SUPABASE_URL = 'https://ncbbjlduisavvxyscxbk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYmJqbGR1aXNhdnZ4eXNjeGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Mjc4NTcsImV4cCI6MjA4NTUwMzg1N30.ueODBB5TN2QiG-2HpNNKSr45EX5aPp4u6AaBN22b2xk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let user: any = null;
export let profile: any = null;

export function showToast(message: string) {
    const existing = document.getElementById('toast-msg');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.cssText = "position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.95); color:white; padding:14px 28px; border-radius:20px; font-size:0.85rem; font-weight:800; z-index:10000; box-shadow:0 10px 25px rgba(0,0,0,0.2); pointer-events:none; transition: 0.3s; animation: fadeIn 0.3s;";
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function navTo(view: string) {
    showView(view);
}

export function showView(viewId: string) {
    const views = ['welcome', 'auth', 'home', 'cart', 'orders', 'saved', 'profile'];
    views.forEach(v => {
        const el = document.getElementById(v + 'View');
        if (el) el.style.display = v === viewId ? 'block' : 'none';
    });
    
    const header = document.getElementById('appHeader');
    const nav = document.getElementById('bottomNav');
    const isAuthRelated = ['welcome', 'auth'].includes(viewId);
    
    if (header) header.style.display = isAuthRelated ? 'none' : 'flex';
    if (nav) nav.style.display = isAuthRelated ? 'none' : 'flex';

    if (viewId === 'home') {
        import("./home.tsx").then(m => m.renderHomeView());
    } else if (viewId === 'profile') {
        import("./profile.tsx").then(m => m.renderProfileView(profile));
    } else if (viewId === 'cart') {
        import("./cart.tsx").then(m => m.renderCartView());
    } else if (viewId === 'orders') {
        if (profile?.role === 'courier') {
            import("./courierDashboard.tsx").then(m => m.renderCourierDashboard(user, profile));
        } else {
            import("./ordersView.tsx").then(m => m.renderOrdersView());
        }
    } else if (viewId === 'saved') {
        import("./savedView.tsx").then(m => m.renderSavedView());
    }

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${viewId}'"]`);
    if(activeNav) activeNav.classList.add('active');
}

export function openOverlay(id: string) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'block';
        el.style.animation = 'fadeIn 0.3s ease-out';
    }
}

export function closeOverlay(id: string) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

export async function loadProfileData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    user = session.user;
    
    // 1. Avval ID bo'yicha qidiramiz
    let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    
    // 2. Agar topilmasa, telefon orqali qidirib ko'ramiz (OTP bilan ochilgan bo'lsa)
    if (!data && !error) {
        let phone = '';
        if(user.email && user.email.endsWith('@elaz.uz')) {
            phone = user.email.split('@')[0];
        } else if (user.user_metadata?.phone) {
            phone = user.user_metadata.phone;
        }

        if (phone) {
            const { data: phoneProfile } = await supabase.from('profiles').select('*').eq('phone', phone).maybeSingle();
            if(phoneProfile) {
                // Vaqtinchalik profilni haqiqiy Auth ID bilan bog'laymiz
                await supabase.from('profiles').update({ id: user.id, email: user.email }).eq('phone', phone);
                data = { ...phoneProfile, id: user.id, email: user.email };
            }
        }

        // 3. Agar hali ham topilmasa, yangi profil yaratamiz
        if(!data) {
            const { data: newProfile, error: insError } = await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Mijoz',
                role: 'user',
                balance: 0
            }).select().single();
            if (!insError) data = newProfile;
        }
    }

    if (data) {
        profile = data;
        const iconContainer = document.getElementById('navProfileIconContainer');
        if (iconContainer) {
            if (profile.avatar_url) {
                iconContainer.innerHTML = `<img src="${profile.avatar_url}" class="nav-profile-img" onerror="this.innerHTML='<i class=\'far fa-user-circle\'></i>'; this.className='';">`;
            } else {
                iconContainer.innerHTML = `<i class="far fa-user-circle"></i>`;
            }
        }
        return data;
    }
    return null;
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
        renderAuthView('login');
    }
}

export async function addToCart(productId: number, quantity: number = 1) {
    if (!user) {
        showToast("Xarid qilish uchun tizimga kiring");
        return;
    }
    try {
        const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
        if (existing) {
            const newQty = parseFloat((existing.quantity + quantity).toFixed(2));
            await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
        } else {
            await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity });
        }
        showToast("Savatga qo'shildi! 🛒");
    } catch (e: any) {
        showToast("Xato: " + e.message);
    }
}

// Profil paneli va tugmalarini indexlash (Exposure to window)
(window as any).navTo = navTo;
(window as any).addToCart = addToCart;
(window as any).openOverlay = openOverlay;
(window as any).closeOverlay = closeOverlay;

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
    if (app) app.style.display = 'none';
    if (admin) {
        admin.style.display = 'block';
        const { switchAdminTab } = await import("./admin.tsx");
        switchAdminTab('dash');
    }
};

(window as any).generateBotLink = () => {
    window.open('https://t.me/elaz_market_bot', '_blank');
};

(window as any).handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};

(window as any).maskPhone = (input: HTMLInputElement) => {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    let final = "";
    if (val.length > 0) final += "(" + val.substring(0, 2);
    if (val.length > 2) final += ") " + val.substring(2, 5);
    if (val.length > 5) final += "-" + val.substring(5, 7);
    if (val.length > 7) final += "-" + val.substring(7, 9);
    input.value = final;
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
