
import { supabase, showToast, openOverlay, closeOverlay, user, profile } from "./index.tsx";

export function openCourierRegistrationForm() {
    const placeholder = document.getElementById('checkoutPlaceholder');
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
                    <p style="font-size:0.9rem; color:var(--text); font-weight:700; line-height:1.6;">ELAZ MARKET kuryerlar jamoasiga qo'shiling!</p>
                </div>
                
                <h4 style="font-weight:900; margin:0 0 15px; font-size:1rem; color:var(--text);">1. Transport turi</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:30px;">
                    <div class="transport-opt" id="t_walking" onclick="selectTransport('walking')" style="border:2px solid #f1f5f9; padding:15px; border-radius:20px; text-align:center; cursor:pointer; transition:0.3s;">
                        <i class="fas fa-walking" style="font-size:1.4rem; color:var(--gray);"></i>
                        <div style="font-size:0.7rem; font-weight:800; margin-top:5px;">Piyoda</div>
                    </div>
                    <div class="transport-opt" id="t_bicycle" onclick="selectTransport('bicycle')" style="border:2px solid #f1f5f9; padding:15px; border-radius:20px; text-align:center; cursor:pointer; transition:0.3s;">
                        <i class="fas fa-bicycle" style="font-size:1.4rem; color:var(--gray);"></i>
                        <div style="font-size:0.7rem; font-weight:800; margin-top:5px;">Velo</div>
                    </div>
                    <div class="transport-opt" id="t_car" onclick="selectTransport('car')" style="border:2px solid #f1f5f9; padding:15px; border-radius:20px; text-align:center; cursor:pointer; transition:0.3s;">
                        <i class="fas fa-car" style="font-size:1.4rem; color:var(--gray);"></i>
                        <div style="font-size:0.7rem; font-weight:800; margin-top:5px;">Mashina</div>
                    </div>
                    <div class="transport-opt" id="t_mixed" onclick="selectTransport('mixed')" style="border:2px solid var(--primary); padding:15px; border-radius:20px; text-align:center; cursor:pointer; transition:0.3s; background:var(--primary-light);">
                        <i class="fas fa-shuffle" style="font-size:1.4rem; color:var(--primary);"></i>
                        <div style="font-size:0.7rem; font-weight:800; margin-top:5px;">Aralash</div>
                    </div>
                </div>

                <h4 style="font-weight:900; margin:0 0 15px; font-size:1rem; color:var(--text);">2. Xizmat hududi</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:18px; border-radius:18px; cursor:pointer;">
                        <span style="font-weight:700;">Tuman Markazi</span>
                        <input type="checkbox" name="work_zone" value="Tuman Markazi" checked style="width:20px; height:20px;">
                    </label>
                    <label style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:18px; border-radius:18px; cursor:pointer;">
                        <span style="font-weight:700;">Guliston shahri</span>
                        <input type="checkbox" name="work_zone" value="Guliston shahri" checked style="width:20px; height:20px;">
                    </label>
                </div>
            </div>

            <button class="btn btn-primary" id="btnSubmitCourier" style="width:100%; height:65px; border-radius:24px;" onclick="submitCourierApplication()">
                ARIZA YUBORISH <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

    openOverlay('checkoutOverlay');
}

let selectedTransport = 'mixed';

(window as any).selectTransport = (type: string) => {
    selectedTransport = type;
    document.querySelectorAll('.transport-opt').forEach(opt => {
        (opt as HTMLElement).style.borderColor = '#f1f5f9';
        (opt as HTMLElement).style.background = 'white';
        const icon = (opt as HTMLElement).querySelector('i');
        if(icon) icon.style.color = 'var(--gray)';
    });
    const target = document.getElementById(`t_${type}`);
    if(target) {
        target.style.borderColor = 'var(--primary)';
        target.style.background = 'var(--primary-light)';
        const icon = target.querySelector('i');
        if(icon) icon.style.color = 'var(--primary)';
    }
};

(window as any).submitCourierApplication = async () => {
    const btn = document.getElementById('btnSubmitCourier') as HTMLButtonElement;
    const zoneInputs = document.querySelectorAll('input[name="work_zone"]:checked');
    const zones = Array.from(zoneInputs).map((i: any) => i.value);

    if(!profile || !user) return showToast("Tizimga kiring");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    const applicationData: any = {
        user_id: user.id,
        full_name: `${profile.first_name} ${profile.last_name || ''}`,
        phone: profile.phone,
        transport_type: selectedTransport,
        status: 'pending',
        work_zones: zones
    };

    try {
        const { error } = await supabase.from('courier_applications').insert(applicationData);
        if (error) throw error;
        showToast("Arizangiz yuborildi! ✅");
        closeOverlay('checkoutOverlay');
    } catch (e: any) {
        showToast("Xatolik: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'ARIZA YUBORISH <i class="fas fa-paper-plane"></i>';
    }
};
