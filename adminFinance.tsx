
import { supabase, showToast, profile as adminProfile } from "./index.tsx";

export async function renderAdminFinance() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    // Balans limitini olish
    const { data: limitSet } = await supabase.from('app_settings').select('value').eq('key', 'max_balance_limit').maybeSingle();
    const currentLimit = limitSet?.value || 200000;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:25px;">
            <!-- BALANS BOSHQARUVI -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="card" style="border-radius:28px; padding:25px; background:white; border:1.5px solid #e2e8f0;">
                    <h3 style="font-weight:900; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-wallet" style="color:var(--primary);"></i> Hisob Boshqaruvi
                    </h3>
                    
                    <div style="position:relative; margin-bottom:15px;">
                        <input type="text" id="finUserSearch" placeholder="Foydalanuvchi Gmaili..." style="height:54px; padding-left:45px; margin:0;">
                        <i class="fas fa-search" style="position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--gray);"></i>
                    </div>
                    
                    <button class="btn btn-outline" style="width:100%; height:48px; font-size:0.75rem; margin-bottom:20px;" onclick="searchUserForFinance()">FOYDALANUVCHINI TOPISH</button>

                    <div id="foundUserDetail" style="display:none; background:#f8fafc; padding:20px; border-radius:20px; border:1px dashed #cbd5e1; margin-bottom:20px;">
                         <!-- Foydalanuvchi ma'lumotlari bu yerga chiqadi -->
                    </div>

                    <div id="financeActions" style="display:none;">
                        <label style="font-size:0.65rem; font-weight:800; color:var(--gray); display:block; margin-bottom:8px;">SUMMA (UZS)</label>
                        <input type="number" id="finAmount" placeholder="10000" style="height:54px; margin-bottom:15px;">
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                            <button class="btn btn-primary" style="height:50px; font-size:0.75rem;" onclick="executeTransaction('income')">TO'LDIRISH (+)</button>
                            <button class="btn" style="height:50px; font-size:0.75rem; background:#fee2e2; color:var(--danger); border:none;" onclick="executeTransaction('expense')">AYIRISH (-)</button>
                        </div>

                        <label style="font-size:0.65rem; font-weight:800; color:var(--gray); display:block; margin-bottom:8px;">ROLE O'ZGARTIRISH</label>
                        <div style="display:flex; gap:10px;">
                            <select id="newRoleSelect" style="height:50px; flex:1; margin:0;">
                                <option value="user">USER</option>
                                <option value="courier">COURIER</option>
                                <option value="staff">STAFF</option>
                                <option value="admin">ADMIN</option>
                            </select>
                            <button class="btn btn-dark" style="height:50px; width:60px;" onclick="changeUserRole()"><i class="fas fa-save"></i></button>
                        </div>
                    </div>
                </div>

                <div class="card" style="border-radius:28px; padding:25px; background:white; border:1.5px solid #e2e8f0;">
                    <h3 style="font-weight:900; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-cog" style="color:var(--gray);"></i> Tizim Sozlamalari
                    </h3>
                    <label style="font-size:0.65rem; font-weight:800; color:var(--gray);">MAKSIMAL BALANS CHEGARASI (RLS LIMIT)</label>
                    <input type="number" id="maxBalLimitInput" value="${currentLimit}" style="height:54px; margin-top:8px;">
                    <button class="btn btn-dark" style="width:100%; height:48px; margin-top:10px;" onclick="saveBalanceLimit()">LIMITNI SAQLASH</button>
                </div>
            </div>

            <!-- TRANZAKSIYALAR TARIXI -->
            <div class="card" style="border-radius:28px; padding:25px; background:white; border:1.5px solid #e2e8f0; display:flex; flex-direction:column;">
                <h3 style="font-weight:900; margin-bottom:20px;"><i class="fas fa-history" style="color:#3b82f6;"></i> So'nggi Amallar</h3>
                <div id="adminTransHistory" style="flex:1; overflow-y:auto; font-size:0.8rem;">
                    <div style="text-align:center; padding:3rem; color:var(--gray);">Tarix yuklanmoqda...</div>
                </div>
            </div>
        </div>
    `;

    loadAdminTransactions();
}

let selectedFinUser: any = null;

// Fix: Define searchUserForFinance as a named function so it can be called internally and attached to window
export async function searchUserForFinance() {
    const email = (document.getElementById('finUserSearch') as HTMLInputElement).value.trim();
    if(!email) return showToast("Emailni kiriting!");

    try {
        const { data: user, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
        if(error) throw error;
        if(!user) return showToast("Foydalanuvchi topilmadi!");

        selectedFinUser = user;
        const detail = document.getElementById('foundUserDetail');
        const actions = document.getElementById('financeActions');
        const roleSel = document.getElementById('newRoleSelect') as HTMLSelectElement;

        if(detail && actions) {
            detail.style.display = 'block';
            actions.style.display = 'block';
            detail.innerHTML = `
                <div style="font-weight:900; color:var(--text);">${user.first_name || 'Noma\'lum'}</div>
                <div style="font-size:0.7rem; color:var(--gray); margin-bottom:10px;">${user.email}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.65rem; font-weight:800; color:var(--primary); background:var(--primary-light); padding:3px 8px; border-radius:5px;">${user.role.toUpperCase()}</span>
                    <b style="font-size:1rem;">${(user.balance || 0).toLocaleString()} UZS</b>
                </div>
            `;
            if(roleSel) roleSel.value = user.role;
        }
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
}
(window as any).searchUserForFinance = searchUserForFinance;

// Fix: Define executeTransaction as a named function to call searchUserForFinance correctly
export async function executeTransaction(type: 'income' | 'expense') {
    if(!selectedFinUser) return;
    const amount = parseInt((document.getElementById('finAmount') as HTMLInputElement).value);
    if(!amount || amount <= 0) return showToast("To'g'ri summani kiriting!");

    try {
        // Balans limitini tekshirish
        const { data: limitSet } = await supabase.from('app_settings').select('value').eq('key', 'max_balance_limit').maybeSingle();
        const maxLimit = limitSet?.value || 200000;

        const newBalance = type === 'income' ? selectedFinUser.balance + amount : selectedFinUser.balance - amount;
        
        if(newBalance > maxLimit && type === 'income') {
            return showToast(`Xato: Balans chegara (${maxLimit.toLocaleString()} UZS) dan oshib ketmoqda!`);
        }

        const { error: updErr } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', selectedFinUser.id);
        if(updErr) throw updErr;

        // Tranzaksiya yozish
        await supabase.from('transactions').insert({
            user_id: selectedFinUser.id,
            admin_id: adminProfile.id,
            amount: amount,
            type: type,
            description: `Admin (${adminProfile.first_name}) tomonidan ${type === 'income' ? 'to\'ldirildi' : 'yechildi'}`
        });

        showToast("Balans muvaffaqiyatli yangilandi! ✅");
        searchUserForFinance(); // Refresh UI
        loadAdminTransactions();
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
}
(window as any).executeTransaction = executeTransaction;

// Fix: Define changeUserRole as a named function to call searchUserForFinance correctly
export async function changeUserRole() {
    if(!selectedFinUser) return;
    const newRole = (document.getElementById('newRoleSelect') as HTMLSelectElement).value;
    if(!confirm(`Foydalanuvchi rolesini ${newRole.toUpperCase()} ga o'zgartirasizmi?`)) return;

    try {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', selectedFinUser.id);
        if(error) throw error;
        showToast("Role o'zgartirildi! ✨");
        searchUserForFinance();
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
}
(window as any).changeUserRole = changeUserRole;

export async function saveBalanceLimit() {
    const limit = parseInt((document.getElementById('maxBalLimitInput') as HTMLInputElement).value);
    if(!limit || limit < 0) return showToast("Noto'g'ri qiymat!");

    try {
        const { error } = await supabase.from('app_settings').upsert({ key: 'max_balance_limit', value: limit }, { onConflict: 'key' });
        if(error) throw error;
        showToast("Balans limiti saqlandi! 🛡️");
    } catch(e: any) {
        showToast("Xato: " + e.message);
    }
}
(window as any).saveBalanceLimit = saveBalanceLimit;

async function loadAdminTransactions() {
    const list = document.getElementById('adminTransHistory');
    if(!list) return;

    try {
        const { data: trans, error } = await supabase
            .from('transactions')
            .select(`*, profiles:user_id(first_name, email)`)
            .order('created_at', { ascending: false })
            .limit(20);

        if(error) throw error;

        if(!trans?.length) {
            list.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--gray);">Hali amallar mavjud emas.</div>';
            return;
        }

        list.innerHTML = trans.map(t => `
            <div style="padding:12px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:800;">${(t as any).profiles?.first_name || 'Ismsiz'}</div>
                    <div style="font-size:0.65rem; color:var(--gray);">${(t as any).profiles?.email}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:900; color:${t.type === 'income' ? 'var(--primary)' : 'var(--danger)'}">
                        ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </div>
                    <div style="font-size:0.6rem; color:var(--gray);">${new Date(t.created_at).toLocaleTimeString()}</div>
                </div>
            </div>
        `).join('');
    } catch(e) {
        list.innerHTML = '<div style="text-align:center; color:var(--danger);">Yuklashda xato!</div>';
    }
}
