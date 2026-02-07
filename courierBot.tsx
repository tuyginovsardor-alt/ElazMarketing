
import { supabase, showToast } from "./index.tsx";
import { sendMessage, answerCallback, editMessage } from "./botAPI.tsx";

export const COURIER_MENU = {
    keyboard: [
        [{ text: "📦 Bo'sh buyurtmalar" }, { text: "🚀 Faol buyurtmalar" }],
        [{ text: "🟢 Onlayn" }, { text: "🔴 Oflayn" }],
        [{ text: "👤 Profil" }, { text: "❌ Chiqish" }]
    ],
    resize_keyboard: true
};

export async function handleCourierMessage(chatId: number, text: string, token: string, profile: any) {
    if (text.includes("Onlayn")) {
        await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
        await sendMessage(chatId, "🟢 <b>SIZ ONLAYNSIZ!</b>\nYangi buyurtmalar haqida xabar beramiz.", token, COURIER_MENU);
    } 
    else if (text.includes("Oflayn")) {
        await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
        await sendMessage(chatId, "🔴 <b>SIZ OFLAYNSIZ.</b>", token, COURIER_MENU);
    } 
    else if (text.includes("Bo'sh buyurtmalar")) {
        const { data: orders } = await supabase
            .from('orders')
            .select('*, profiles!user_id(first_name, last_name)')
            .eq('status', 'confirmed')
            .is('courier_id', null);

        if (!orders?.length) return sendMessage(chatId, "Hozircha bo'sh buyurtmalar yo'q.", token);
        
        for (const o of orders) {
            const customer = (o as any).profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
            
            const msg = `
📦 <b>BUYURTMA #${o.id.toString().substring(0,8)}</b>
👤 Mijoz: ${fullName}
📞 Tel: ${o.phone_number}
📍 Manzil: ${o.address_text}
💰 Pul: ${o.delivery_cost.toLocaleString()} UZS
            `;

            await sendMessage(chatId, msg, token, {
                inline_keyboard: [
                    [{ text: "✅ Qabul qilish", callback_data: `accept_${o.id}` }],
                    [{ text: "📍 Xarita", url: `https://www.google.com/maps?q=${o.latitude},${o.longitude}` }]
                ]
            });
        }
    }
    else if (text.includes("Faol buyurtmalar")) {
        const { data: active } = await supabase
            .from('orders')
            .select('*, profiles!user_id(first_name, last_name)')
            .eq('courier_id', profile.id)
            .eq('status', 'delivering');

        if (!active?.length) return sendMessage(chatId, "Sizda faol buyurtmalar yo'q.", token);
        
        for (const o of active) {
            const customer = (o as any).profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";

            const msg = `
🚚 <b>YETKAZILMOQDA...</b>
🆔 #${o.id.toString().substring(0,8)}
👤 Mijoz: ${fullName}
📞 Tel: ${o.phone_number}
📍 ${o.address_text}
            `;

            await sendMessage(chatId, msg, token, {
                inline_keyboard: [
                    [{ text: "📞 TELEFON", url: `tel:${o.phone_number}` }],
                    [{ text: "🏁 Yakunlash", callback_data: `finish_${o.id}` }, { text: "❌ Rad etish", callback_data: `reject_${o.id}` }]
                ]
            });
        }
    }
}

export async function handleCourierCallback(callback: any, token: string, profile: any) {
    const data = callback.data;
    if (data.startsWith('accept_')) {
        const oid = data.split('_')[1];
        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if (!error) {
            await answerCallback(callback.id, "Buyurtma olindi! ✅", token);
            await editMessage(callback.message.chat.id, callback.message.message_id, `✅ <b>BUYURTMA OLINDI.</b>\nEndi "Faol buyurtmalar" bo'limida boshqaring.`, token);
        } else {
            await answerCallback(callback.id, "❌ Kechikdingiz!", token);
        }
    }
}
