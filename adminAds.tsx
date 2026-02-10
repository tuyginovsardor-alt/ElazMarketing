
import { supabase, showToast } from "./index.tsx";

export async function renderAdminAds() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:25px; animation: fadeIn 0.3s ease-out;">
            <!-- BANNERLAR RO'YXATI -->
            <div>
                <div class="card" style="border-radius:28px; padding:25px; background:white; border:none; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-weight:900; display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-images" style="color:var(--primary);"></i> Reklama Bannerlari
                        </h3>
                        <label class="btn btn-primary" style="height:42px; width:auto; padding:0 20px; border-radius:14px; cursor:pointer; font-size:0.75rem;">
                            <input type="file" id="bannerUploadInput" style="display:none;" onchange="window.uploadAdminBanner(this)">
                            <i class="fas fa-plus"></i> YANGI QO'SHISH
                        </label>
                    </div>
                    
                    <div id="adminBannersList" style="display:flex; flex-direction:column; gap:15px;">
                        <div style="text-align:center; padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></div>
                    </div>
                </div>
            </div>

            <!-- BROADCAST VA STATS -->
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div class="card" style="border-radius:28px; padding:25px; background:var(--dark); color:white; border:none; box-shadow:var(--shadow-lg);">
                    <h3 style="font-weight:900; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-bullhorn" style="color:var(--primary);"></i> Umumiy Xabar (Broadcast)
                    </h3>
                    <p style="font-size:0.7rem; opacity:0.6; margin-bottom:20px; font-weight:700;">Barcha foydalanuvchilarning botiga va ilova bildirishnomasiga yuboriladi.</p>
                    
                    <input type="text" id="bcTitle" placeholder="Sarlavha (masalan: Yangi chegirma!)" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:white; margin-bottom:12px; height:50px;">
                    <textarea id="bcBody" placeholder="Xabar matni..." style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:white; height:120px; padding:15px; border-radius:15px; font-size:0.85rem; margin-bottom:20px;"></textarea>
                    
                    <button class="btn btn-primary" id="btnSendBC" style="width:100%; height:55px; border-radius:18px;" onclick="window.sendBroadcastFinal()">
                        YUBORISH <i class="fas fa-paper-plane" style="margin-left:8px;"></i>
                    </button>
                </div>

                <div class="card" style="border-radius:28px; padding:25px; background:white; border:1.5px solid #f1f5f9;">
                    <h3 style="font-weight:900; font-size:1rem; margin-bottom:15px;">Marketing bo'yicha maslahat:</h3>
                    <p style="font-size:0.75rem; color:var(--gray); line-height:1.6; font-weight:600;">
                        1. Banner rasmlari <b>16:9</b> o'lchamda bo'lishi maqsadga muvofiq.<br>
                        2. Rasmdagi matnlar katta va oson o'qiladigan bo'lsin.<br>
                        3. Broadcast xabarlarini haftada ko'pi bilan 2 marta yuboring, aks holda mijozlar botni bloklashi mumkin.
                    </p>
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

    if(error) {
        listEl.innerHTML = `<div style="color:var(--danger); text-align:center;">Yuklashda xato!</div>`;
        return;
    }

    if(!banners?.length) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:4rem; background:#f8fafc; border-radius:22px; border:2px dashed #e2e8f0;">
                <i class="fas fa-image-slash fa-3x" style="color:#cbd5e1; margin-bottom:15px;"></i>
                <p style="color:var(--gray); font-weight:800; font-size:0.8rem;">Hali bannerlar mavjud emas.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = banners.map(b => `
        <div class="card" style="padding:15px; border-radius:22px; border:1.5px solid #f1f5f9; background:white; position:relative; overflow:hidden;">
            <div style="display:flex; gap:15px; align-items:center;">
                <div style="width:130px; height:75px; border-radius:14px; overflow:hidden; border:1px solid #f1f5f9; background:#f8fafc; flex-shrink:0;">
                    <img src="${b.image_url}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:0.6rem; font-weight:900; color:var(--gray); text-transform:uppercase; letter-spacing:1px;">ID: #${b.id}</span>
                        <div style="display:flex; gap:8px;">
                            <button class="btn" style="width:34px; height:34px; border-radius:10px; background:#f0fdf4; color:var(--primary); padding:0; border:none;" onclick="window.toggleBannerStatus(${b.id}, ${b.is_active})" title="${b.is_active ? 'O\'chirish' : 'Yoqish'}">
                                <i class="fas ${b.is_active ? 'fa-eye' : 'fa-eye-slash'}"></i>
                            </button>
                            <button class="btn" style="width:34px; height:34px; border-radius:10px; background:#fef2f2; color:var(--danger); padding:0; border:none;" onclick="window.deleteAdminBanner(${b.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.65rem; font-weight:800; color:var(--gray);">NAVBAT:</span>
                        <input type="number" value="${b.priority || 0}" style="width:60px; height:32px; margin:0; font-size:0.8rem; border-radius:8px; text-align:center; padding:0;" onchange="window.updateBannerPriority(${b.id}, this.value)">
                        ${b.is_active ? `<span style="font-size:0.6rem; font-weight:900; color:var(--primary); background:var(--primary-light); padding:3px 8px; border-radius:6px;">AKTIV</span>` : `<span style="font-size:0.6rem; font-weight:900; color:var(--gray); background:#f1f5f9; padding:3px 8px; border-radius:6px;">O'CHIQ</span>`}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

(window as any).toggleBannerStatus = async (id: number, current: boolean) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id);
    loadAdminBanners();
};

(window as any).updateBannerPriority = async (id: number, val: string) => {
    await supabase.from('banners').update({ priority: parseInt(val) || 0 }).eq('id', id);
    showToast("Navbat yangilandi");
};

(window as any).uploadAdminBanner = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if(!file) return;
    
    showToast("Rasm yuklanmoqda...");
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `banner_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('products').upload(`banners/${fileName}`, file);
        if(uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`banners/${fileName}`);
        
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
    if(!confirm("Banner butunlay o'chirilsinmi?")) return;
    await supabase.from('banners').delete().eq('id', id);
    showToast("O'chirildi");
    loadAdminBanners();
};

(window as any).sendBroadcastFinal = async () => {
    const title = (document.getElementById('bcTitle') as HTMLInputElement).value.trim();
    const body = (document.getElementById('bcBody') as HTMLTextAreaElement).value.trim();
    const btn = document.getElementById('btnSendBC') as HTMLButtonElement;

    if(!title || !body) return showToast("Sarlavha va matnni to'ldiring!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> YUBORILMOQDA...';

    try {
        // Notifications jadvaliga yozish (Bu yerdan botlar yoki edge function xabarni ilib oladi)
        const { error } = await supabase.from('notifications').insert({ title, body });
        if(error) throw error;

        showToast("Broadcast muvaffaqiyatli yuborildi! 📢");
        (document.getElementById('bcTitle') as HTMLInputElement).value = "";
        (document.getElementById('bcBody') as HTMLTextAreaElement).value = "";
    } catch (e: any) {
        showToast("Xato: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "YUBORISH";
    }
};
