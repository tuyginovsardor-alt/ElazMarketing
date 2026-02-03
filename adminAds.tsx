
import { supabase, showToast } from "./index.tsx";

const DISPLAY_ENVIRONMENTS = [
    { id: 'home', label: 'Asosiy Sahifa' },
    { id: 'category', label: 'Kategoriyalar' },
    { id: 'cart', label: 'Savat' },
    { id: 'profile', label: 'Profil' },
    { id: 'search', label: 'Qidiruv' }
];

export async function renderAdminAds() {
    const container = document.getElementById('admin_tab_marketing');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:30px; height: calc(100vh - 180px);">
            <!-- CHAP TOMON: BANNERLAR NAZORATI -->
            <div style="overflow-y:auto; padding-right:10px;">
                <div class="card" style="border-radius:28px; padding:25px; border:none; box-shadow:var(--shadow-sm); background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-weight:900; color:var(--text); display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-images" style="color:var(--primary);"></i> Bannerlar Nazorati
                        </h3>
                        <label class="btn btn-primary" style="height:40px; width:auto; padding:0 15px; border-radius:12px; cursor:pointer; font-size:0.7rem;">
                            <input type="file" id="bannerUploadInput" style="display:none;" onchange="uploadAdminBanner(this)">
                            <i class="fas fa-plus mr-2"></i> YANGI BANNER
                        </label>
                    </div>
                    
                    <div id="adminBannersList" style="display:flex; flex-direction:column; gap:20px;">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                    </div>
                </div>
            </div>

            <!-- O'NG TOMON: BROADCAST VA SOZLAMALAR -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:28px; padding:25px; background:var(--dark); color:white; border:none; box-shadow:var(--shadow-lg);">
                    <h3 style="font-weight:900; margin-bottom:15px; display:flex; align-items:center; gap:12px;">
                        <i class="fas fa-bullhorn" style="color:var(--primary);"></i> Broadcast Xabar
                    </h3>
                    <p style="font-size:0.75rem; opacity:0.7; margin-bottom:20px;">Yuborilgan xabar barcha mijozlarning ilovasidagi bildirishnomalar bo'limida ko'rinadi.</p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="color:white; opacity:0.8; font-size:0.65rem; font-weight:800; text-transform:uppercase;">Xabar sarlavhasi</label>
                        <input type="text" id="bcTitle" placeholder="Masalan: Hafta oxiri 20% chegirma!" style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.1); color:white; margin-top:8px;">
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="color:white; opacity:0.8; font-size:0.65rem; font-weight:800; text-transform:uppercase;">Xabar matni</label>
                        <textarea id="bcBody" placeholder="Chegirma shartlarini yozing..." style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.1); color:white; height:100px; margin-top:8px; border-radius:16px; padding:15px; font-size:0.85rem;"></textarea>
                    </div>
                    
                    <button class="btn btn-primary" id="btnSendBC" style="width:100%; height:55px; font-weight:900; font-size:1rem;" onclick="sendBroadcastFinal()">
                        BARCHAGA YUBORISH <i class="fas fa-paper-plane"></i>
                    </button>
                </div>

                <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <h4 style="font-weight:900; margin-bottom:10px;">Muhim eslatma</h4>
                    <p style="font-size:0.75rem; color:var(--gray); line-height:1.6;">Bannerlar tartibi (Priority) qanchalik baland bo'lsa, u ro'yxatda shunchalik birinchi ko'rinadi. Joylashuv muhitlarini tanlash orqali reklamani maqsadli ko'rsatishingiz mumkin.</p>
                </div>
            </div>
        </div>
    `;

    loadAdminBanners();
}

async function loadAdminBanners() {
    const listEl = document.getElementById('adminBannersList');
    if(!listEl) return;

    const { data: banners, error } = await supabase.from('banners').select('*').order('priority', { ascending: false });

    if(error || !banners?.length) {
        listEl.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--gray); font-weight:700;">Hozircha bannerlar yo\'q.</div>';
        return;
    }

    listEl.innerHTML = banners.map(b => {
        const locations = b.display_locations || ['home'];
        
        return `
            <div class="card" style="border-radius:22px; border:1px solid #f1f5f9; background:white; padding:15px; box-shadow:0 4px 15px rgba(0,0,0,0.02);">
                <div style="display:flex; gap:15px;">
                    <div style="width:120px; height:80px; border-radius:12px; overflow:hidden; border:1px solid #f1f5f9; shrink:0;">
                        <img src="${b.image_url}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div style="font-weight:900; font-size:0.8rem; color:var(--text); text-transform:uppercase;">Banner #${b.id}</div>
                            <div style="display:flex; gap:5px;">
                                <button class="btn" style="width:28px; height:28px; border-radius:8px; background:#f1f5f9; color:var(--text); padding:0;" onclick="toggleBannerStatus(${b.id}, ${b.is_active})">
                                    <i class="fas ${b.is_active ? 'fa-eye' : 'fa-eye-slash'}"></i>
                                </button>
                                <button class="btn" style="width:28px; height:28px; border-radius:8px; background:#fee2e2; color:var(--danger); padding:0;" onclick="deleteAdminBanner(${b.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
                            <span style="font-size:0.65rem; font-weight:800; color:var(--gray);">TARTIB:</span>
                            <input type="number" value="${b.priority || 0}" style="width:60px; height:30px; margin:0; padding:0 8px; font-size:0.8rem; border-radius:8px;" onchange="updateBannerPriority(${b.id}, this.value)">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top:15px; border-top:1px solid #f8fafc; padding-top:12px;">
                    <div style="font-size:0.65rem; font-weight:800; color:var(--gray); margin-bottom:10px; text-transform:uppercase;">KO'RINISH JOYI:</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${DISPLAY_ENVIRONMENTS.map(env => `
                            <label style="display:flex; align-items:center; gap:5px; background:${locations.includes(env.id) ? 'var(--primary-light)' : '#f8fafc'}; color:${locations.includes(env.id) ? 'var(--primary)' : 'var(--gray)'}; padding:5px 10px; border-radius:10px; font-size:0.65rem; font-weight:800; cursor:pointer; border:1.5px solid ${locations.includes(env.id) ? 'var(--primary)' : 'transparent'};">
                                <input type="checkbox" style="display:none;" ${locations.includes(env.id) ? 'checked' : ''} onchange="toggleBannerLocation(${b.id}, '${env.id}', this.checked)">
                                ${env.label}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

(window as any).toggleBannerLocation = async (id: number, envId: string, isChecked: boolean) => {
    const { data: b } = await supabase.from('banners').select('display_locations').eq('id', id).single();
    let locations = b.display_locations || [];
    
    if(isChecked) {
        if(!locations.includes(envId)) locations.push(envId);
    } else {
        locations = locations.filter(l => l !== envId);
    }
    
    await supabase.from('banners').update({ display_locations: locations }).eq('id', id);
    loadAdminBanners();
};

(window as any).updateBannerPriority = async (id: number, val: string) => {
    await supabase.from('banners').update({ priority: parseInt(val) || 0 }).eq('id', id);
    showToast("Tartib yangilandi");
};

(window as any).uploadAdminBanner = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;

    showToast("Banner yuklanmoqda...");
    const fileName = `${Date.now()}_banner.${file.name.split('.').pop()}`;
    const filePath = `banners/${fileName}`;

    try {
        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
        if(uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);

        const { error: dbError } = await supabase.from('banners').insert({
            image_url: publicUrl,
            is_active: true,
            priority: 0,
            display_locations: ['home'] // Default faqat home da ko'rinadi
        });

        if(dbError) throw dbError;

        showToast("Banner muvaffaqiyatli qo'shildi! 🖼️");
        loadAdminBanners();
    } catch (e: any) {
        showToast("Xato: " + e.message);
    }
};

(window as any).deleteAdminBanner = async (id: number) => {
    if(!confirm("Banner o'chirilsinmi?")) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if(!error) {
        showToast("O'chirildi");
        loadAdminBanners();
    }
};

(window as any).toggleBannerStatus = async (id: number, current: boolean) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id);
    loadAdminBanners();
};

(window as any).sendBroadcastFinal = async () => {
    const btn = document.getElementById('btnSendBC') as HTMLButtonElement;
    const title = (document.getElementById('bcTitle') as HTMLInputElement).value.trim();
    const body = (document.getElementById('bcBody') as HTMLTextAreaElement).value.trim();

    if(!title || !body) return showToast("Sarlavha va matnni to'ldiring");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: null,
            title,
            body
        });

        if(error) throw error;

        showToast("Xabar barcha mijozlarga yuborildi! 📢");
        (document.getElementById('bcTitle') as HTMLInputElement).value = '';
        (document.getElementById('bcBody') as HTMLTextAreaElement).value = '';
    } catch (e: any) {
        showToast("Xato: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'BARCHAGA YUBORISH <i class="fas fa-paper-plane"></i>';
    }
};
