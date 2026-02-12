
import { supabase, profile, openOverlay, showToast, loadProfileData, closeOverlay } from "./index.tsx";

export const openPaymentView = async () => {
    if(!profile) return showToast("Tizimga kiring");
    const placeholder = document.getElementById('paymentPlaceholder');
    if(!placeholder) return;
    
    placeholder.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';
    openOverlay('paymentOverlay');

    try {
        const { data: history } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });

        placeholder.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('paymentOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text);"></i>
                <h2 style="font-weight:900; font-size:1.3rem;">Hamyon va To'lovlar</h2>
            </div>

            <div class="card" style="background:var(--gradient); color:white; text-align:center; border:none; border-radius: 25px; margin-bottom:20px; box-shadow: 0 10px 20px rgba(34,197,94,0.2);">
                <p style="font-size:0.8rem; opacity:0.8; font-weight: 700; letter-spacing:1px;">JORIY BALANS</p>
                <h1 style="font-size:2.4rem; font-weight: 900;">${(profile.balance || 0).toLocaleString()} <small style="font-size:0.9rem;">UZS</small></h1>
            </div>

            <div class="card" style="border-radius: 25px; border: 1.5px solid #f1f5f9;">
                <h3 style="font-weight: 900; font-size: 1.1rem; margin-bottom: 15px; color: var(--text);">Hamyonni to'ldirish</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <button class="btn btn-outline" style="font-size:0.85rem; padding:8px; height: 50px; border-radius: 14px; font-weight:800;" onclick="selectTopUp(50000)">50k</button>
                    <button class="btn btn-outline" style="font-size:0.85rem; padding:8px; height: 50px; border-radius: 14px; font-weight:800;" onclick="selectTopUp(100000)">100k</button>
                    <button class="btn btn-outline" style="font-size:0.85rem; padding:8px; height: 50px; border-radius: 14px; font-weight:800;" onclick="selectTopUp(500000)">500k</button>
                </div>
                <label style="font-size: 0.75rem; font-weight:800; color:var(--gray);">SUMMANI KIRITING (UZS)</label>
                <input type="number" id="topUpAmount" placeholder="10000" style="margin-top:8px; height: 56px; font-size:1.1rem;">
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 20px; border: 1px dashed #cbd5e1;">
                    <p style="font-size: 0.75rem; color: var(--gray); line-height: 1.4; font-weight: 600;">
                        <i class="fas fa-info-circle" style="color: var(--primary);"></i> 
                        To'lov <b>TsPay</b> xavfsiz tizimi orqali amalga oshiriladi. Mablag'lar darhol hisobingizga kelib tushadi.
                    </p>
                </div>

                <button class="btn btn-primary" id="btnProcessPayment" style="width: 100%; height: 64px; font-size: 1.1rem;" onclick="processTopUp()">
                    TO'LOVGA O'TISH <i class="fas fa-external-link-alt"></i>
                </button>
            </div>

            <h4 style="font-weight: 900; font-size: 1.1rem; margin: 30px 0 15px 5px; color: var(--text);">Tranzaksiyalar tarixi</h4>
            <div class="card" style="padding:0; overflow:hidden; border-radius: 25px; border: 1.5px solid #f1f5f9;">
                ${history?.length ? history.map(t => `
                    <div class="history-item" style="display:flex; justify-content:space-between; align-items:center; padding:20px; border-bottom:1px solid #f1f5f9;">
                        <div style="display:flex; align-items:center; gap: 15px;">
                            <div style="width: 44px; height: 44px; border-radius: 14px; background: ${t.type === 'income' || t.type === 'transfer' ? '#f0fdf4' : '#fff1f2'}; color: ${t.type === 'income' || t.type === 'transfer' ? '#22c55e' : '#f43f5e'}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                                <i class="fas ${t.type === 'income' || t.type === 'transfer' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                            </div>
                            <div>
                                <div style="font-size:0.95rem; font-weight:800; color: var(--text);">${t.type === 'income' || t.type === 'transfer' ? 'Hamyon to\'ldirildi' : 'Xarid uchun to\'lov'}</div>
                                <div style="font-size:0.75rem; color:var(--gray); font-weight: 700;">${new Date(t.created_at).toLocaleString('uz-UZ', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                        <div style="font-weight:900; font-size: 1.05rem; color:${t.type === 'income' || t.type === 'transfer' ? 'var(--primary)' : 'var(--danger)'}">
                            ${t.type === 'income' || t.type === 'transfer' ? '+' : '-'}${t.amount.toLocaleString()}
                        </div>
                    </div>
                `).join('') : `
                    <div style="padding:50px 20px; text-align:center; color:var(--gray);">
                        <i class="fas fa-receipt fa-3x" style="opacity:0.1; display:block; margin-bottom: 15px;"></i> 
                        <p style="font-weight:700;">Hali tranzaksiyalar yo'q</p>
                    </div>
                `}
            </div>
        `;
    } catch (e) {
        console.error(e);
        placeholder.innerHTML = '<div style="padding:2rem; color:var(--danger);">Ma\'lumot yuklashda xatolik.</div>';
    }
};

(window as any).openPayment = openPaymentView;
(window as any).openPaymentView = openPaymentView;

(window as any).selectTopUp = (amount: number) => {
    const el = document.getElementById('topUpAmount') as HTMLInputElement;
    if(el) el.value = amount.toString();
};

(window as any).processTopUp = async () => {
    const amtInput = document.getElementById('topUpAmount') as HTMLInputElement;
    const btn = document.getElementById('btnProcessPayment') as HTMLButtonElement;
    const amount = parseInt(amtInput.value);

    if(!amount || amount < 5000) return showToast("Minimal to'ldirish summasi: 5,000 UZS");
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> TO\'LOV YARATILMOQDA...';

    try {
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { 
                action: 'create', 
                amount: amount,
                user_id: profile.id
            }
        });

        if (error) throw error;

        if (data?.status === 'success' && data?.transaction?.url) {
            showToast("To'lov sahifasiga o'tilmoqda...");
            window.location.href = data.transaction.url;
        } else {
            throw new Error(data?.message || "To'lov tizimida xatolik yuz berdi");
        }

    } catch (e: any) {
        console.error("Payment Error:", e);
        showToast("Xatolik: " + (e.message || "Ulanib bo'lmadi"));
        btn.disabled = false;
        btn.innerHTML = "TO'LOVGA O'TISH <i class=\"fas fa-external-link-alt\"></i>";
    }
};
