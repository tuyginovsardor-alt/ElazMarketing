
import { supabase, showToast, openOverlay, closeOverlay, user, profile } from "./index.tsx";

export function openCourierRegistrationForm() {
    const placeholder = document.getElementById('checkoutPlaceholder'); // Reusing overlay
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding:5px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Kuryerlikka ariza</h2>
            </div>

            <div class="card" style="border-radius:28px; padding:25px; border:1px solid #f1f5f9; margin-bottom:25px; box-shadow:var(--shadow-sm);">
                <div style="text-align:center; margin-bottom:25px;">
                    <div style="width:80px; height:80px; background:var(--primary-light); color:var(--primary); border-radius:30px; display:inline-flex; align-items:center; justify-content:center; font-size:2.2rem; margin-bottom:15px;">
                        <i class="fas fa-motorcycle"></i>
                    </div>
                    <p style="font-size:0.9rem; color:var(--text); font-weight:700; line-height:1.6;">ELAZ MARKET kuryerlar jamoasiga qo'shiling va har bir yetkazilgan buyurtma uchun haq oling!</p>
                </div>
                
                <h4 style="font-weight:900; margin:0 0 15px; font-size:1rem; color:var(--text);">1. Transport turi</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:30px;">
                    <div class="transport-opt" id="t_walking" onclick="selectTransport('walking')" style="border:2.5px solid var(--primary); padding:18px 10px; border-radius:22px; text-align:center; cursor:pointer; transition:0.3s; background:var(--primary-light);">
                        <i class="fas fa-walking" style="font-size:1.6rem; color:var(--primary);"></i>
                        <div style="font-size:0.75rem; font-weight:800; margin-top:8px;">Piyoda</div>
                    </div>
                    <div class="transport-opt" id="t_bicycle" onclick="selectTransport('bicycle')" style="border:2.5px solid #f1f5f9; padding:18px 10px; border-radius:22px; text-align:center; cursor:pointer; transition:0.3s;">
                        <i class="fas fa-bicycle" style="font-size:1.6rem; color:var(--gray);"></i>
                        <div style="font-size:0.75rem; font-weight:800; margin-top:8px;">Velo</div>
                    </div>
                    <div class="transport-opt" id="t_car" onclick="selectTransport('car')" style="border:2.5px solid #f1f5f9; padding:18px 10px; border-radius:22px; text-align:center; cursor:pointer; transition:0.3s;">
                        <i class="fas fa-car" style="font-size:1.6rem; color:var(--gray);"></i>
                        <div style="font-size:0.75rem; font-weight:800; margin-top:8px;">Mashina</div>
                    </div>
                </div>

                <h4 style="font-weight:900; margin:0 0 15px; font-size:1rem; color:var(--text);">2. Xizmat hududi (Majburiy)</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:18px; border-radius:18px; cursor:pointer; border:1px solid #f1f5f9;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-map-marker-alt" style="color:var(--primary);"></i>
                            <span style="font-weight:700; font-size:0.95rem;">Tuman Markazi</span>
                        </div>
                        <input type="checkbox" name="work_zone" value="Tuman Markazi" checked style="width:22px; height:22px; margin:0; accent-color:var(--primary);">
                    </label>
                    <label style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:18px; border-radius:18px; cursor:pointer; border:1px solid #f1f5f9;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-city" style="color:var(--primary);"></i>
                            <span style="font-weight:700; font-size:0.95rem;">Guliston shahri</span>
                        </div>
                        <input type="checkbox" name="work_zone" value="Guliston shahri" checked style="width:22px; height:22px; margin:0; accent-color:var(--primary);">
                    </label>
                </div>

                <div style="margin-top:25px; padding:15px; background:#fff7ed; border-radius:15px; border:1px dashed #fdba74;">
                    <p style="font-size:0.75rem; color:#9a3412; font-weight:700; line-height:1.5;">
                        <i class="fas fa-info-circle"></i> Arizangiz adminlar tomonidan 24 soat ichida ko'rib chiqiladi. Tasdiqlangandan so'ng sizga "Kuryer" bo'limi ochiladi.
                    </p>
                </div>
            </div>

            <button class="btn btn-primary" id="btnSubmitCourier" style="width:100%; height:65px; border-radius:24px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="submitCourierApplication()">
                ARIZA YUBORISH <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

    openOverlay('checkoutOverlay');
}

let selectedTransport = 'walking';

(window as any).selectTransport = (type: string) => {
    selectedTransport = type;
    document.querySelectorAll('.transport-opt').forEach(opt => {
        const el = opt as HTMLElement;
        el.style.borderColor = '#f1f5f9';
        el.style.background = 'white';
        const icon = el.querySelector('i');
        const text = el.querySelector('div');
        if (icon) (icon as HTMLElement).style.color = 'var(--gray)';
        if (text) (text as HTMLElement).style.color = 'var(--gray)';
    });
    
    const target = document.getElementById(`t_${type}`);
    if(target) {
        const targetEl = target as HTMLElement;
        targetEl.style.borderColor = 'var(--primary)';
        targetEl.style.background = 'var(--primary-light)';
        const targetIcon = targetEl.querySelector('i');
        const targetText = targetEl.querySelector('div');
        if (targetIcon) (targetIcon as HTMLElement).style.color = 'var(--primary)';
        if (targetText) (targetText as HTMLElement).style.color = 'var(--primary)';
    }
};

(window as any).submitCourierApplication = async () => {
    const btn = document.getElementById('btnSubmitCourier') as HTMLButtonElement;
    const zoneInputs = document.querySelectorAll('input[name="work_zone"]:checked');
    const zones = Array.from(zoneInputs).map((i: any) => i.value);

    if(zones.length === 0) return showToast("Kamida bitta hududni tanlang");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    try {
        const { error } = await supabase.from('courier_applications').insert({
            user_id: user.id,
            transport_type: selectedTransport,
            work_zones: zones,
            status: 'pending'
        });

        if(!error) {
            showToast("Arizangiz muvaffaqiyatli yuborildi! ✅");
            closeOverlay('checkoutOverlay');
            // Profilni qayta yuklash statusni yangilash uchun
            setTimeout(() => {
                import("./profile.tsx").then(m => m.renderProfileView(profile));
            }, 500);
        } else {
            throw error;
        }
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerHTML = 'ARIZA YUBORISH <i class="fas fa-paper-plane"></i>';
    }
};
