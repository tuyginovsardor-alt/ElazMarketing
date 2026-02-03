
import { supabase, showToast } from "./index.tsx";

export async function renderAdminAds() {
    const container = document.getElementById('admin_tab_marketing');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
            <!-- CHAP TOMON: BANNERLAR -->
            <div>
                <div class="card" style="border-radius:28px; padding:25px; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-weight:900; color:var(--text); display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-images" style="color:var(--primary);"></i> Bannerlar Nazorati
                        </h3>
                        <label class="btn btn-outline" style="height:40px; width:40px; padding:0; border-radius:12px; cursor:pointer;">
                            <input type="file" id="bannerUploadInput" style="display:none;" onchange="uploadAdminBanner(this)">
                            <i class="fas fa-plus"></i>
                        </label>
                    </div>
                    
                    <div id="adminBannersList" style="display:flex; flex-direction:column; gap:15px;">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                    </div>
                </div>
            </div>

            <!-- O'NG TOMON: BROADCAST -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:28px; padding:25px; background:var(--dark); color:white; border:none; box-shadow:var(--shadow-lg);">
                    <h3 style="font-weight:900; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
                        <i class="fas fa-bullhorn" style="color:var(--primary);"></i> Broadcast Xabar
                    </h3>
                    <p style="font-size:0.8rem; opacity:0.7; margin-bottom:25px;">Yuborilgan xabar barcha mijozlarning ilovasidagi bildirishnomalar bo'limida ko'rinadi.</p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="color:white; opacity:0.8; font-size:0.7rem; font-weight:800; text-transform:uppercase;">Xabar sarlavhasi</label>
                        <input type="text" id="bcTitle" placeholder="Masalan: Hafta oxiri 20% chegirma!" style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.1); color:white; margin-top:8px;">
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="color:white; opacity:0.8; font-size:0.7rem; font-weight:800; text-transform:uppercase;">Xabar matni</label>
                        <textarea id="bcBody" placeholder="Chegirma shartlarini yozing..." style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.1); color:white; height:120px; margin-top:8px; border-radius:16px; padding:15px;"></textarea>
                    </div>
                    
                    <button class="btn btn-primary" id="btnSendBC" style="width:100%; height:60px; font-weight:900; font-size:1.1rem;" onclick="sendBroadcastFinal()">
                        BARCHAGA YUBORISH <i class="fas fa-paper-plane"></i>
                    </button>
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

    listEl.innerHTML = banners.map(b => `
        <div style="position:relative; border-radius:20px; overflow:hidden; border:1px solid #f1f5f9; background:white; padding:10px;">
            <img src="${b.image_url}" style="width:100%; height:140px; object-fit:cover; border-radius:15px; display:block; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">TARTIB:</div>
                    <input type="number" value="${b.priority || 0}" style="width:60px; height:32px; margin:0; padding:0 8px; font-size:0.8rem;" onchange="updateBannerPriority(${b.id}, this.value)">
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn" style="width:32px; height:32px; border-radius:10px; background:#fee2e2; color:var(--danger); padding:0;" onclick="deleteAdminBanner(${b.id})"><i class="fas fa-trash"></i></button>
                    <button class="btn" style="width:32px; height:32px; border-radius:10px; background:${b.is_active ? 'var(--primary-light)' : '#f1f5f9'}; color:${b.is_active ? 'var(--primary)' : '#94a3b8'}; padding:0;" onclick="toggleBannerStatus(${b.id}, ${b.is_active})">
                        <i class="fas ${b.is_active ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

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
            priority: 0
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
