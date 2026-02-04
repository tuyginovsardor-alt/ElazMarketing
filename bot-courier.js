
import { supabase, tg } from './bot-config.js';

export async function handleCourier(chatId, text, profile) {
    if (text === "📦 Bo'sh buyurtmalar") {
        const { data: orders } = await supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null);
        if (!orders?.length) return tg('sendMessage', { chat_id: chatId, text: "📭 Hozircha bo'sh buyurtmalar yo'q." });
        
        for (const o of orders) {
            const txt = `📦 <b>BUYURTMA #ORD-${o.id.toString().substring(0,8)}</b>\n📍 Manzil: ${o.address_text}\n💰 Dostavka: <b>${o.delivery_cost.toLocaleString()}</b> UZS`;
            await tg('sendMessage', { 
                chat_id: chatId, text: txt, parse_mode: 'HTML', 
                reply_markup: { inline_keyboard: [[{ text: "✅ QABUL QILISH", callback_data: `accept_${o.id}` }]] } 
            });
        }
    }

    if (text === "🚀 Faol buyurtmalar") {
        const { data: active } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
        if (!active?.length) return tg('sendMessage', { chat_id: chatId, text: "Sizda hozircha faol buyurtmalar yo'q." });
        
        for (const o of active) {
            const txt = `🚚 <b>YETKAZIB BERISH</b>\n\n🆔 #${o.id.toString().substring(0,8)}\n📞 Mijoz: ${o.phone_number}\n📍 Manzil: ${o.address_text}`;
            await tg('sendMessage', { 
                chat_id: chatId, text: txt, parse_mode: 'HTML', 
                reply_markup: { 
                    inline_keyboard: [
                        [{ text: "🏁 YETKAZILDI", callback_data: `finish_${o.id}` }],
                        [{ text: "❌ RAD ETISH", callback_data: `reject_${o.id}` }]
                    ] 
                } 
            });
        }
    }

    if (text === "🟢 Onlayn") {
        await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
        return tg('sendMessage', { chat_id: chatId, text: "🟢 <b>SIZ ONLAYNSIZ.</b> Yangi buyurtmalar keladi!" });
    }

    if (text === "🔴 Oflayn") {
        await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
        return tg('sendMessage', { chat_id: chatId, text: "🔴 <b>SIZ OFLAYNSIZ.</b>" });
    }

    if (text === "📊 Tarix") {
        const { data: hist } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivered');
        const earned = hist?.reduce((a, b) => a + b.delivery_cost, 0) || 0;
        return tg('sendMessage', { chat_id: chatId, text: `📊 <b>STATISTIKA</b>\n\n✅ Bajardigiz: ${hist?.length || 0} ta\n💰 Daromad: ${earned.toLocaleString()} UZS`, parse_mode: 'HTML' });
    }

    if (text === "👤 Profil") {
        const txt = `🛵 <b>KURER PROFILI</b>\n\n👤 <b>Ism:</b> ${profile.first_name}\n📱 <b>Tel:</b> ${profile.phone}\n💰 <b>Balans:</b> ${profile.balance.toLocaleString()} UZS\n⭐ <b>Reyting:</b> ${profile.rating || 5.0}\n\nStatus: ${profile.active_status ? '🟢 Faol' : '🔴 Oflayn'}`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML' });
    }
}

export async function handleCallbacks(cb) {
    const data = cb.data;
    const chatId = cb.from.id;
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();

    if (data.startsWith('confirm_courier_')) {
        await supabase.from('courier_applications').insert({ user_id: profile.id, full_name: profile.first_name, status: 'pending' });
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "📬 <b>ARIZANGIZ YUBORILDI!</b>\nAdminlar tasdiqlashini kuting.", parse_mode: 'HTML' });
    }

    if (data.startsWith('accept_')) {
        const oid = data.split('_')[1];
        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if (error) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Zakaz olib bo'lingan!" });
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "✅ <b>QABUL QILINDI!</b>\n'Faol buyurtmalar' bo'limida ko'ring.", parse_mode: 'HTML' });
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost }).eq('id', profile.id);
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "🏁 <b>BUYURTMA YAKUNLANDI!</b>", parse_mode: 'HTML' });
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id });
    }
}
