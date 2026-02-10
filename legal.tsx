
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

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">2. BUYURTMA VA TO'LOV SHARTLARI</h4>
                <p>2.1. Xaridor savat orqali mahsulotlarni tanlaydi va shaxsiy ma'lumotlarini aniq ko'rsatadi.</p>
                <p>2.2. To'lovlar naqd pul yoki hamyon balansi orqali amalga oshiriladi.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">3. YETKAZIB BERISH TARTIBI</h4>
                <p>3.1. Yetkazib berish Bag'dod tumani bo'ylab 30-60 daqiqa ichida amalga oshiriladi.</p>
                <p>3.2. Xaridor mahsulotni kuryerdan olayotgan vaqtda tekshirishi shart.</p>
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
                <p>1.1. <b>Shaxsiy ma'lumotlar:</b> Ism, telefon raqami va manzilingiz.</p>
                <p>1.2. <b>Geolokatsiya:</b> Buyurtmani kuryerga yo'naltirish uchun joylashuvingiz.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">2. MA'LUMOTLAR HIMOYA QILISHI</h4>
                <p>2.1. Barcha ma'lumotlar shifrlash protokollari orqali himoyalangan.</p>
                <p>2.2. Biz ma'lumotlaringizni uchinchi shaxslarga sotmaymiz.</p>
            </div>
        `
    },
    rules: {
        title: "Foydalanish qoidalari",
        content: `
            <div style="text-align: justify; font-size: 0.95rem; color: #334155; line-height: 1.8; padding-bottom:50px;">
                <p style="font-weight: 800; color: var(--text); border-left: 5px solid #f59e0b; padding: 18px; background: #fffbeb; border-radius: 16px; margin-bottom: 30px;">
                    Platformadan foydalanish jarayonida quyidagi qoidalarga amal qilishingiz so'raladi.
                </p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">1. FOYDALANUVCHI MAJBURIYATLARI</h4>
                <p>1.1. Ro'yxatdan o'tayotganda haqiqiy ism va telefon raqamini ko'rsatish.</p>
                <p>1.2. Buyurtma berilgandan so'ng kuryer bilan aloqada bo'lish.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">2. TAQIQLANGAN HARAKATLAR</h4>
                <p>2.1. Yolg'on buyurtmalar berish yoki platformani asossiz yuklash.</p>
                <p>2.2. Boshqa foydalanuvchilarning hisobidan foydalanish.</p>

                <h4 style="color: var(--text); margin-top: 30px; font-weight: 900; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">3. JAZO CHORALARI</h4>
                <p>3.1. Qoidalarni buzgan foydalanuvchilar akkaunti bloklanishi mumkin.</p>
            </div>
        `
    }
};

export function openLegal(type: 'offer' | 'privacy' | 'rules') {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:15px 10px; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text); padding: 5px;"></i>
                <h2 style="font-weight:900; font-size:1.2rem;">${LEGAL_TEXTS[type].title}</h2>
            </div>
            <div style="padding:0 20px;">
                ${LEGAL_TEXTS[type].content}
            </div>
        </div>
    `;
    openOverlay('checkoutOverlay');
}
