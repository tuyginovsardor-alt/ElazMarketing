
import { supabase } from "./index.tsx";
import { sendMessage } from "./botAPI.tsx";

// MIJOZ MENYUSI
export const USER_MENU = {
    keyboard: [
        [{ text: "🛒 Savatim" }, { text: "🏢 Saytni ochish" }],
        [{ text: "🛵 Kuryer bo'lish" }, { text: "👤 Profil" }]
    ],
    resize_keyboard: true
};

// KURYER MENYUSI
export const COURIER_MENU = {
    keyboard: [
        [{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }],
        [{ text: "📦 Faol buyurtmalar" }, { text: "👤 Profil" }]
    ],
    resize_keyboard: true
};

export async function handleUserActions(chatId: number, text: string, token: string, profile: any) {
    const cleanText = text.replace(/[^\w\sа-яА-Я]/gi, '').trim(); // Emojilarsiz tekshirish uchun

    if (text.includes("Savatim")) {
        await sendMessage(chatId, "Sizning savatingiz ilovada mavjud. Xaridni davom ettirish uchun saytga o'ting.", token, {
            inline_keyboard: [[{ text: "🛒 SAVATGA O'TISH", url: "https://elaz-marketing.vercel.app/view=cart" }]]
        });
    } else if (text.includes("Saytni ochish")) {
        await sendMessage(chatId, "<b>ELAZ MARKET</b> rasmiy platformasi:", token, {
            inline_keyboard: [[{ text: "🌐 SAYTNI OCHISH", url: "https://elaz-marketing.vercel.app" }]]
        });
    } else if (text.includes("Kuryer bo'lish")) {
        await sendMessage(chatId, "Kuryerlikka ariza berish uchun ilovadagi profilingizga o'ting.", token, {
            inline_keyboard: [[{ text: "🛵 ARIZA BERISH", url: "https://elaz-marketing.vercel.app/view=profile" }]]
        });
    } else if (text.includes("Profil")) {
        await sendMessage(chatId, `👤 <b>MIJOZ PROFILI</b>\n\nIsm: ${profile.first_name}\nBalans: ${profile.balance.toLocaleString()} UZS\nHudud: ${profile.district || 'Belgilanmagan'}`, token);
    }
}

export async function handleCourierActions(chatId: number, text: string, token: string, profile: any) {
    if (text.includes("Ishga tushish")) {
        await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
        await sendMessage(chatId, "🟢 <b>ONLAYN.</b> Yangi buyurtmalarni kutavering!", token, COURIER_MENU);
    } else if (text.includes("Dam olish")) {
        await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
        await sendMessage(chatId, "🔴 <b>OFFLINE.</b> Dam oling!", token, COURIER_MENU);
    } else if (text.includes("Faol buyurtmalar")) {
        const { data: orders } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
        if (!orders?.length) {
            await sendMessage(chatId, "Hozircha sizda faol buyurtmalar yo'q.", token);
        } else {
            for (const o of orders) {
                await sendMessage(chatId, `📦 <b>BUYURTMA #ORD-${o.id}</b>\n\n📍 Manzil: ${o.address_text}\n💰 Summa: ${o.total_price.toLocaleString()} UZS`, token);
            }
        }
    } else if (text.includes("Profil")) {
        await sendMessage(chatId, `🚛 <b>KURER MA'LUMOTLARI</b>\n\nIsm: ${profile.first_name}\nBalans: ${profile.balance.toLocaleString()} UZS\nReyting: ⭐ ${profile.rating || 5.0}\nHolat: ${profile.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}`, token);
    }
}
