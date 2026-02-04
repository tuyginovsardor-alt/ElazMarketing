
import { supabase } from "./index.tsx";
import { sendMessage } from "./botAPI.tsx";

const SITE_URL = "https://elaz-marketing.vercel.app";

export const USER_MENU = {
    keyboard: [
        [{ text: "🛒 Savatim" }, { text: "🏢 Saytni ochish" }],
        [{ text: "🛵 Kuryer bo'lish" }, { text: "👤 Profil" }],
        [{ text: "🆘 Yordam markazi" }]
    ],
    resize_keyboard: true
};

export async function handleUserMessage(chatId: number, text: string, token: string, profile: any) {
    // 1. SAVAT FUNKSIYASI
    if (text.includes("Savatim")) {
        const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
        
        if (!items?.length) {
            await sendMessage(chatId, "🛒 <b>Savatingiz bo'sh.</b>\n\nMahsulot qo'shish uchun saytga o'ting.", token, {
                inline_keyboard: [[{ text: "🛍️ XARID QILISH", url: SITE_URL }]]
            });
        } else {
            let list = "🛒 <b>SIZNING SAVATINGIZ:</b>\n\n";
            let total = 0;
            items.forEach((item, i) => {
                const sub = item.products.price * item.quantity;
                total += sub;
                list += `${i+1}. ${item.products.name} - ${item.quantity} x ${item.products.price.toLocaleString()} = <b>${sub.toLocaleString()} UZS</b>\n`;
            });
            list += `\n💰 <b>JAMI: ${total.toLocaleString()} UZS</b>`;
            
            await sendMessage(chatId, list, token, {
                inline_keyboard: [[{ text: "💳 RASMIYLASHTIRISH", url: `${SITE_URL}?view=cart` }]]
            });
        }
    } 

    // 2. SAYTNI OCHISH
    else if (text.includes("Saytni ochish")) {
        await sendMessage(chatId, "🏢 <b>ELAZ MARKET</b>\n\nBag'dod tumanidagi eng qulay savdo platformasiga xush kelibsiz! Buyurtma berish uchun quyidagi tugmani bosing:", token, {
            inline_keyboard: [[{ text: "🌐 SAYTGA O'TISH", web_app: { url: SITE_URL } }]]
        });
    } 

    // 3. KURERLIKKA ARIZA
    else if (text.includes("Kuryer bo'lish")) {
        await sendMessage(chatId, "🛵 <b>KURERLIKKA ARIZA TOPSHIRISH</b>\n\nKurer bo'lish uchun quyidagi ma'lumotlarni yuboring yoki saytdagi formani to'ldiring.", token, {
            inline_keyboard: [
                [{ text: "📝 BOT ORQALI ARIZA", callback_data: "apply_bot" }],
                [{ text: "🌐 SAYT ORQALI ARIZA", url: `${SITE_URL}?apply=true` }]
            ]
        });
    }

    // 4. PROFIL
    else if (text.includes("Profil")) {
        await sendMessage(chatId, `👤 <b>MIJOZ MA'LUMOTLARI:</b>\n\n<b>Ism:</b> ${profile.first_name}\n<b>Balans:</b> ${profile.balance.toLocaleString()} UZS\n<b>Manzil:</b> ${profile.district || 'Kiritilmagan'}\n<b>ID:</b> <code>${profile.id.substring(0,8)}</code>`, token, USER_MENU);
    }

    // 5. YORDAM MARKAZI
    else if (text.includes("Yordam markazi")) {
        await sendMessage(chatId, "🆘 <b>YORDAM MARKAZI</b>\n\nMuammo yoki savolingiz bormi? Mutaxassis bilan bog'laning yoki xabar qoldiring.", token, {
            inline_keyboard: [
                [{ text: "💬 ADMIN BILAN ALOQA", url: "https://t.me/elaz_admin" }],
                [{ text: "📞 TELEFON QILISH", callback_data: "call_support" }]
            ]
        });
    }
}

export async function handleUserCallback(callback: any, token: string, profile: any) {
    if (callback.data === "apply_bot") {
        await sendMessage(callback.from.id, "📝 <b>ARIZA QABUL QILINDI.</b>\n\nSizning profilingiz kurerlikka ko'rib chiqish uchun yuborildi.", token);
        await supabase.from('courier_applications').insert({
            user_id: profile.id,
            full_name: profile.first_name,
            phone: profile.phone,
            status: 'pending'
        });
    }
}
