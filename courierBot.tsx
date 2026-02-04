
import { supabase } from "./index.tsx";
import { sendMessage, answerCallback, editMessage } from "./botAPI.tsx";

export const COURIER_MENU = {
    keyboard: [
        [{ text: "🟢 Ishga tushish" }, { text: "🔴 Dam olish" }],
        [{ text: "📦 Faol buyurtmalar" }, { text: "👤 Profil" }]
    ],
    resize_keyboard: true
};

export async function handleCourierMessage(chatId: number, text: string, token: string, profile: any) {
    if (text.includes("Ishga tushish")) {
        await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
        await sendMessage(chatId, "🟢 <b>ONLAYN.</b> Buyurtmalar tushsa sizga xabar beramiz!", token, COURIER_MENU);
    } 
    else if (text.includes("Dam olish")) {
        await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
        await sendMessage(chatId, "🔴 <b>OFLAYN.</b> Dam oling!", token, COURIER_MENU);
    } 
    else if (text.includes("Faol buyurtmalar")) {
        const { data: orders } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
        if (!orders?.length) {
            await sendMessage(chatId, "Hozircha sizda yetkazilayotgan faol buyurtmalar yo'q.", token);
        } else {
            for (const o of orders) {
                await sendMessage(chatId, `📦 <b>BUYURTMA #ORD-${o.id}</b>\n📍 Manzil: ${o.address_text}\n💰 Summa: ${o.total_price.toLocaleString()} UZS\n📞 Tel: ${o.phone_number}`, token);
            }
        }
    } 
    else if (text.includes("Profil")) {
        await sendMessage(chatId, `🚛 <b>KURER PROFILI</b>\n\nIsm: ${profile.first_name}\nBalans: ${profile.balance.toLocaleString()} UZS\nStatus: ${profile.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}`, token, COURIER_MENU);
    }
}

export async function handleCourierCallback(callback: any, token: string, profile: any) {
    const data = callback.data;
    if (data.startsWith('accept_')) {
        const orderId = data.split('_')[1];
        const { data: order } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', orderId).is('courier_id', null).select().single();

        if (order) {
            await answerCallback(callback.id, "Buyurtma olindi! ✅", token);
            await editMessage(callback.message.chat.id, callback.message.message_id, `✅ <b>BUYURTMA #ORD-${orderId} QABUL QILINDI.</b>\n\n📍 Manzil: ${order.address_text}\n💰 Summa: ${order.total_price.toLocaleString()} UZS`, token);
        } else {
            await answerCallback(callback.id, "Kechikdingiz, boshqa kurer oldi ❌", token);
        }
    }
}
