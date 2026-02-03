import { supabase, profile, openOverlay, showToast, closeOverlay } from "./index.tsx";

(window as any).openPayoutView = () => {
    const placeholder = document.getElementById('payoutPlaceholder');
    placeholder.innerHTML = `
        <div class="card">
            <p style="font-size:0.85rem; color:#666;">Yechib olish mumkin bo'lgan mablag'</p>
            <h2 style="color:var(--primary); margin:5px 0;">${(profile.balance || 0).toLocaleString()} so'm</h2>
        </div>

        <div class="card">
            <label>Karta raqami yoki Telefon</label>
            <input type="text" id="payoutTarget" placeholder="8600 .... .... ....">
            
            <label>Summa</label>
            <input type="number" id="payoutAmount" placeholder="Summani kiriting...">
            
            <p style="font-size:0.75rem; color:var(--gray); margin-top:10px;">
                * Komissiya: 1%<br>
                * Minimal yechish: 10,000 so'm
            </p>
            
            <button class="btn btn-dark" style="margin-top:1.5rem;" onclick="requestPayout()">YECHIB OLISHGA SO'ROV</button>
        </div>
    `;
    openOverlay('payoutOverlay');
};

(window as any).requestPayout = async () => {
    const target = (document.getElementById('payoutTarget') as HTMLInputElement).value;
    const amount = parseInt((document.getElementById('payoutAmount') as HTMLInputElement).value);

    if(!target || !amount) return showToast("Barcha maydonlarni to'ldiring");
    if(amount < 10000) return showToast("Minimal yechish 10,000 so'm");
    if(amount > profile.balance) return showToast("Balansda yetarli mablag' yo'q");

    const { error } = await supabase.from('payout_requests').insert({
        user_id: profile.id,
        target,
        amount,
        status: 'pending'
    });

    if(!error) {
        showToast("So'rovingiz adminlarga yuborildi!");
        closeOverlay('payoutOverlay');
    } else {
        showToast("Xatolik: " + error.message);
    }
};
