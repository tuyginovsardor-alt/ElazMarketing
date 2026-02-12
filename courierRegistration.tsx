
import { supabase, showToast, openOverlay, closeOverlay, user, profile } from "./index.tsx";

export function openCourierRegistrationForm() {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding:10px;"></i>
                <h2 style="font-weight:900; font-size:1.2rem;">Kuryerlikka ariza</h2>
            </div>

            <div class="card" style="border-radius:28px; padding:25px; border:1px solid #f1f5f9; margin-bottom:25px;">
                <div style="text-align:center; margin-bottom:25px;">
                    <div style="width:80px; height:80px; background:var(--primary-light); color:var(--primary); border-radius:30px; display:inline-flex; align-items:center; justify-content:center; font-size:2.2rem; margin-bottom:15px;">
                        <i class="fas fa-motorcycle"></i>
                    </div>
                    <p style="font-size:0.9rem; color:var(--text); font-weight:700;">ELAZ MARKET kuryerlar jamoasiga qo'shiling!</p>
                </div>
                
                <h4 style="font-weight:900; margin:0 0 15px; font-size:1rem;">1. Transport turi</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:30px;">
                    <div class="transport-opt" id="t_walking" onclick="selectRegTransport('walking')" style="border:2px solid #f1f5f9; padding:15px; border-radius:20px; text-align:center; cursor:pointer;">
                        <i class="fas fa-walking" style="font-size:1.4rem; color:var(--gray);"></i>
                        <div style="font-size:0.7rem; font-weight:800; margin-top:5px;">Piyoda</div>
                    </div>
                    <div class="transport-opt" id="t_car" onclick="selectRegTransport('car')" style="border:2px solid #f1f5f9; padding:15px; border-radius:20px; text-align:center; cursor:pointer;">
                        <i class="fas fa-car" style="font-size:1.4rem; color:var(--gray);"></i>
                        <div style="font-size:0.7rem; font-weight:800; margin-top:5px;">Mashina</div>
                    </div>
                </div>

                <h4 style="font-weight:900; margin:0 0 15px; font-size:1rem;">2. Xizmat hududi</h4>
                <div style="background:#f8fafc; padding:18px; border-radius:18px; font-weight:800; border:1.5px solid #f1f5f9; color:var(--text);">
                    <i class="fas fa-map-marker-alt" style="color:var(--danger); margin-right:8px;"></i> Bag'dod tumani
                </div>
            </div>

            <button class="btn btn-primary" id="btnSubmitCourier" style="width:100%; height:65px; border-radius:24px;" onclick="submitCourierApplication()">
                ARIZA YUBORISH <i class="fas fa-paper-plane" style="margin-left:8px;"></i>
            </button>
        </div>
    `;

    openOverlay('checkoutOverlay');
}

(window as any).openCourierRegistrationForm = openCourierRegistrationForm;

let selectedRegTransport = 'walking';
(window as any).selectRegTransport = (type: string) => {
    selectedRegTransport = type;
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
    if(!profile || !user) return showToast("Tizimga kiring");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    try {
        const { error } = await supabase.from('courier_applications').insert({
            user_id: user.id,
            full_name: profile.first_name,
            phone: profile.phone,
            transport_type: selectedRegTransport,
            status: 'pending'
        });

        if (error) throw error;
        showToast("Arizangiz yuborildi! ✅");
        closeOverlay('checkoutOverlay');
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "ARIZA YUBORISH";
    }
};
