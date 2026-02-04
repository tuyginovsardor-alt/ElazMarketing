
import { openOverlay, closeOverlay } from "./index.tsx";

const LEGAL_TEXTS = {
    offer: {
        title: "Ommaviy oferta shartnomasi",
        content: `
            <div style="text-align: justify; font-size: 0.95rem; color: #334155; line-height: 1.8; padding-bottom:50px;">
                <p style="font-weight: 800; color: var(--text); border-left: 5px solid var(--primary); padding: 18px; background: var(--primary-light); border-radius: 16px; margin-bottom: 30px;">
                    Mazkur hujjat "ELAZ MARKET" platformasi orqali mahsulot sotib olish bo'yicha rasmiy ommaviy kelishuv (oferta) hisoblanadi.
                </p>
                
                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">1. UMUMIY QOIDALAR</h4>
                <p>1.1. Ushbu Oferta O'zbekiston Respublikasi Fuqarolik kodeksining 367-moddasiga muvofiq ochiq taklif hisoblanadi.</p>
                <p>1.2. Foydalanuvchi ilovada ro'yxatdan o'tgan yoki buyurtma bergan paytdan boshlab ushbu shartlarni to'liq qabul qilgan hisoblanadi.</p>
                <p>1.3. Sotuvchi (ELAZ MARKET) istalgan vaqtda shartlarni bir tomonlama o'zgartirish huquqiga ega.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">2. BUYURTMA VA TO'LOV SHARTLARI</h4>
                <p>2.1. Xaridor savat orqali mahsulotlarni tanlaydi va shaxsiy ma'lumotlarini (ism, telefon, manzil) aniq ko'rsatadi.</p>
                <p>2.2. To'lovlar naqd pul, hamyon balansi yoki elektron to'lov tizimlari orqali amalga oshiriladi.</p>
                <p>2.3. Buyurtma berilgan vaqtdagi narx yakuniy hisoblanadi va o'zgarmaydi.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">3. YETKAZIB BERISH TARTIBI</h4>
                <p>3.1. Yetkazib berish Bag'dod tumani va Guliston shahri bo'ylab 30-60 daqiqa ichida amalga oshiriladi.</p>
                <p>3.2. Fors-major holatlarida (tabiiy ofatlar, yo'l yopilishi) yetkazib berish vaqti biroz kechikishi mumkin.</p>
                <p>3.3. Xaridor mahsulotni kuryerdan olayotgan vaqtda uning sifati va miqdorini tekshirishi shart.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">4. MAHSULOTNI QAYTARISH</h4>
                <p>4.1. Sifatsiz yoki yaroqlilik muddati o'tgan mahsulot aniqlansa, u kuryer ishtirokida almashtiriladi yoki puli qaytariladi.</p>
                <p>4.2. Sifatli oziq-ovqat mahsulotlari qabul qilib olingandan so'ng qaytarib olinmaydi.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">5. TOMONLARNING JAVOBGARLIGI</h4>
                <p>5.1. Sotuvchi mahsulotning butunligi va gigiyena talablariga rioya qilinishi uchun javobgar.</p>
                <p>5.2. Xaridor noto'g'ri telefon raqami yoki manzil ko'rsatganligi sababli yuzaga kelgan muammolar uchun o'zi javobgar.</p>
            </div>
        `
    },
    privacy: {
        title: "Maxfiylik siyosati",
        content: `
            <div style="text-align: justify; font-size: 0.95rem; color: #334155; line-height: 1.8; padding-bottom:50px;">
                <p style="font-weight: 800; color: var(--text); border-left: 5px solid #3b82f6; padding: 18px; background: #eff6ff; border-radius: 16px; margin-bottom: 30px;">
                    Sizning shaxsiy ma'lumotlaringiz xavfsizligini ta'minlash biz uchun eng ustuvor vazifadir.
                </p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">1. MA'LUMOTLARNI TO'PLASH</h4>
                <p>1.1. <b>Shaxsiy ma'lumotlar:</b> Ism, familiya, telefon raqami va manzilingiz.</p>
                <p>1.2. <b>Geolokatsiya:</b> Buyurtmani aniq kuryerga yo'naltirish uchun sizning joylashuvingiz.</p>
                <p>1.3. <b>Texnik ma'lumotlar:</b> Qurilma turi va ilovadan foydalanish statistikasi.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">2. MA'LUMOTLARDAN FOYDALANISH</h4>
                <p>2.1. Buyurtmalarni rasmiylashtirish va manzilingizni kuryerga bildirish.</p>
                <p>2.2. Xizmat sifatini oshirish va sizga maxsus chegirmalar haqida xabar berish.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">3. MA'LUMOTLAR HIMOYA QILISHI</h4>
                <p>3.1. Barcha ma'lumotlar SSL shifrlash protokollari orqali himoyalangan.</p>
                <p>3.2. Biz sizning ma'lumotlaringizni hech qachon uchinchi shaxslarga sotmaymiz.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">4. FOYDALANUVCHI HUQUQLARI</h4>
                <p>4.1. Siz istalgan vaqtda shaxsiy ma'lumotlaringizni tahrirlashingiz yoki o'chirishingiz mumkin.</p>
                <p>4.2. Geolokatsiya ruxsatini istalgan vaqtda rad etish huquqiga egasiz.</p>

                <div style="margin-top: 60px; text-align: center; font-size: 0.8rem; color: var(--gray); font-weight: 700;">
                    Oxirgi yangilanish: 2024-yil 25-may
                </div>
            </div>
        `
    }
};

export function openLegal(type: 'offer' | 'privacy') {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding: 10px;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">${LEGAL_TEXTS[type].title}</h2>
            </div>
            <div style="padding:0 5px;">
                ${LEGAL_TEXTS[type].content}
            </div>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).openLegal = openLegal;
