import { supabase, showToast, profile } from "./index.tsx";

export async function loadFinanceData() {
    const placeholder = document.getElementById('adminFinancePlaceholder');
    placeholder.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

    const { data: users } = await supabase.from('profiles').select('id, email, first_name, last_name, balance, role').limit(20);

    placeholder.innerHTML = `
        <div class="card">
            <h4>Foydalanuvchini boshqarish</h4>
            <input type="text" id="finSearchUser" placeholder="Gmail kiriting">
            <div class="form-row" style="margin-top:10px;">
                <input type="number" id="finAmount" placeholder="Summa">
                <select id="finAction">
                    <option value="transfer">Balansga qo'shish (+)</option>
                    <option value="fine">Jarima solish (-)</option>
                    <option value="warning">Ogohlantirish berish (!)</option>
                </select>
            </div>
            <textarea id="finReason" placeholder="Izoh..." style="margin-top:10px;"></textarea>
            <button class="btn btn-dark" style="margin-top:15px;" onclick="processUserAdminAction()">TASDIQLASH</button>
        </div>

        <h4>Foydalanuvchilar ro'yxati</h4>
        <div style="max-height: 400px; overflow-y: auto;">
            ${users?.map(u => `
                <div class="card" style="padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:700;">${u.first_name} ${u.last_name}</div>
                        <div style="font-size:0.75rem; color:var(--gray);">${u.email}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="color:var(--primary); font-weight:bold;">${(u.balance || 0).toLocaleString()} so'm</div>
                        <button class="btn" style="padding:4px 8px; font-size:0.6rem; width:auto; background:var(--dark); color:white;" onclick="selectUserForAction('${u.email}')">Tanlash</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

(window as any).selectUserForAction = (email: string) => {
    (document.getElementById('finSearchUser') as HTMLInputElement).value = email;
    showToast("Foydalanuvchi tanlandi");
};

(window as any).processUserAdminAction = async () => {
    const search = (document.getElementById('finSearchUser') as HTMLInputElement).value;
    const amount = parseInt((document.getElementById('finAmount') as HTMLInputElement).value) || 0;
    const action = (document.getElementById('finAction') as HTMLSelectElement).value;
    const reason = (document.getElementById('finReason') as HTMLTextAreaElement).value;

    const { data: target } = await supabase.from('profiles').select('*').eq('email', search).maybeSingle();
    if(!target) return showToast("Foydalanuvchi topilmadi");

    if(action === 'warning') {
        await supabase.from('user_warnings').insert({ user_id: target.id, admin_id: profile.id, reason });
        showToast("Ogohlantirish berildi");
    } else {
        const newBal = action === 'transfer' ? target.balance + amount : target.balance - amount;
        await supabase.from('profiles').update({ balance: newBal }).eq('id', target.id);
        await supabase.from('transactions').insert({ user_id: target.id, admin_id: profile.id, amount, type: action, description: reason });
        showToast("Balans o'zgartirildi");
        loadFinanceData();
    }
};
