
import { supabase, showToast } from "./index.tsx";

const DISPLAY_ENVIRONMENTS = [
    { id: 'home', label: 'Asosiy Sahifa' },
    { id: 'category', label: 'Kategoriyalar' },
    { id: 'cart', label: 'Savat' },
    { id: 'profile', label: 'Profil' }
];

export async function renderAdminAds() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:25px; min-height: 500px;">
            <!-- BANNERLAR RO'YXATI -->
            <div>
                <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-weight:900; display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-images" style="color:var(--primary);"></i> Bannerlar
                        </h3>
                        <label class="btn btn-primary" style="height:40px; width:auto; padding:0 15px; border-radius:12px; cursor:pointer; font-size:0.7rem;">
                            <input type="file" id="bannerUploadInput" style="display:none;" onchange="uploadAdminBanner(this)">
                            <i class="fas fa-plus"></i> QO'SHISH
                        </label>
                    </div>
                    
                    <div id="adminBannersList" style="display:flex; flex-direction:column; gap:18px;">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
                    </div>
                </div>
            </div>

            <!-- BROADCAST VA SOZLAMALAR -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:28px; padding:25px; background:var(--dark); color:white; border:none;">
                    <h3 style="font-weight:900; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-bullhorn" style="color:var(--primary);"></i> Broadcast
                    </h3>
                    <p style="font-size:0.75rem; opacity:0.6; margin-bottom:20px;">Barcha mijozlarga push-bildirishnoma yuborish.</p>
                    
                    <input type="text" id="bcTitle" placeholder="Sarlavha..." style="background:rgba(255,255,255,0.08); border:none; color:white; margin-bottom:12px;">
                    <textarea id="bcBody" placeholder="Xabar matni..." style="background:rgba(255,255,255,0.08); border:none; color:white; height:100px; padding:15px; border-radius:15px; font-size:0.85rem; margin-bottom:20px;"></textarea>
                    
                    <button class="btn btn-primary" id="btnSendBC" style="width:100%; height:55px;" onclick="sendBroadcastFinal()">
                        YUBORISH <i class="fas fa-paper-plane"></i>
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

    const { data: banners } = await supabase.from('banners').select('*').order('priority', { ascending: false });

    if(!banners?.length) {
        listEl.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--gray); font-weight:800;">Hali bannerlar yo\'q.</div>';
        return;
    }

    listEl.innerHTML = banners.map(b => `
        <div class="card" style="padding:15px; border-radius:22px; border:1px solid #f1f5f9; background:white; box-shadow:0 5px 15px rgba(0,0,0,0.02);">
            <div style="display:flex; gap:15px;">
                <div style="width:100px; height:65px; border-radius:12px; overflow:hidden; border:1px solid #f1f5f9;">
                    <img src="${b.image_url}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-weight:900; font-size:0.75rem;">Banner #${b.id}</div>
                        <button class="btn" style="width:28px; height:28px; border-radius:8px; background:#fee2e2; color:var(--danger); padding:0; border:none;" onclick="deleteAdminBanner(${b.id})">
                            <i class="fas fa-trash" style="font-size:0.8rem;"></i>
                        </button>
                    </div>
                    <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.6rem; font-weight:800; color:var(--gray);">PRIORITY:</span>
                        <input type="number" value="${b.priority || 0}" style="width:55px; height:28px; margin:0; font-size:0.75rem; border-radius:8px; text-align:center;" onchange="updateBannerPriority(${b.id}, this.value)">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

(window as any).updateBannerPriority = async (id: number, val: string) => {
    await supabase.from('banners').update({ priority: parseInt(val) || 0 }).eq('id', id);
    showToast("Saqlandi");
};

(window as any).uploadAdminBanner = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    showToast("Yuklanmoqda...");
    const fileName = `${Date.now()}_banner.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('products').upload(`banners/${fileName}`, file);
    if(uploadError) return showToast("Upload xato!");
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`banners/${fileName}`);
    await supabase.from('banners').insert({ image_url: publicUrl, is_active: true, priority: 0 });
    loadAdminBanners();
};

(window as any).deleteAdminBanner = async (id: number) => {
    if(!confirm("Banner o'chirilsinmi?")) return;
    await supabase.from('banners').delete().eq('id', id);
    loadAdminBanners();
};

(window as any).sendBroadcastFinal = async () => {
    const title = (document.getElementById('bcTitle') as HTMLInputElement).value;
    const body = (document.getElementById('bcBody') as HTMLTextAreaElement).value;
    if(!title || !body) return showToast("Matnni to'ldiring");
    await supabase.from('notifications').insert({ title, body });
    showToast("Barchaga yuborildi! 📢");
};
