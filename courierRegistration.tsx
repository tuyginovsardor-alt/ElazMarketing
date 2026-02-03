
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

let selectedTransport = 'walking';

(window as any).selectTransport = (type: string) => {
    selectedTransport = type;
    document.querySelectorAll('.transport-opt').forEach(opt => {
        (opt as HTMLElement).style.borderColor = '#f1f5f9';
        (opt as HTMLElement).style.background = 'white';
    });
    const target = document.getElementById(`t_${type}`);
    if(target) {
        target.style.borderColor = 'var(--primary)';
        target.style.background = 'var(--primary-light)';
    }
};

(window as any).submitCourierApplication = async () => {
    const btn = document.getElementById('btnSubmitCourier') as HTMLButtonElement;
    const zoneInputs = document.querySelectorAll('input[name="work_zone"]:checked');
    const zones = Array.from(zoneInputs).map((i: any) => i.value);

    if(!profile || !user) return showToast("Tizimga kiring");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    // Xatolikni oldini olish uchun ma'lumotlarni tayyorlaymiz
    const applicationData: any = {
        user_id: user.id,
        full_name: `${profile.first_name} ${profile.last_name || ''}`,
        phone: profile.phone,
        transport_type: selectedTransport,
        status: 'pending'
    };

    try {
        // Birinchi marta work_zones bilan yuborib ko'ramiz
        const { error } = await supabase.from('courier_applications').insert({
            ...applicationData,
            work_zones: zones
        });

        if (error) {
            // Agar kesh xatosi bo'lsa, work_zones'siz yuboramiz (faqat bir marta retry)
            if (error.message.includes('work_zones') || error.message.includes('schema cache')) {
                console.warn("Schema cache error detected, retrying without work_zones column...");
                const { error: secondError } = await supabase.from('courier_applications').insert(applicationData);
                if (secondError) throw secondError;
            } else {
                throw error;
            }
        }

        showToast("Arizangiz muvaffaqiyatli yuborildi! ✅");
        closeOverlay('checkoutOverlay');
        
    } catch (e: any) {
        console.error("Application Error:", e);
        showToast("Xatolik: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'ARIZA YUBORISH <i class="fas fa-paper-plane"></i>';
    }
};
