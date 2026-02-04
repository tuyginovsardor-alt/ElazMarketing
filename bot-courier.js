
import { supabase, tg } from './bot-config.js';

export async function handleCourier(chatId, text, profile) {
    if (text === "📦 Bo'sh buyurtmalar") {
        const { data: orders } = await supabase.from('orders').select('*').eq('status', 'confirmed').is('courier_id', null);
        if (!orders?.length) return tg('sendMessage', { chat_id: chatId, text: "📭 Hozircha bo'sh buyurtmalar yo'q." });
        
        for (const o of orders) {
            const txt = `📦 <b>YANGI BUYURTMA</b>\n\n📍 ${o.address_text}\n💰 Dostavka: <b>${o.delivery_cost.toLocaleString()}</b> UZS`;
            await tg('sendMessage', { 
                chat_id: chatId, 
                text: txt, 
                parse_mode: 'HTML', 
                reply_markup: { inline_keyboard: [[{ text: "✅ Qabul qilish", callback_data: `accept_${o.id}` }]] } 
            });
        }
    }

    if (text === "🚀 Faol buyurtmalar") {
        const { data: active } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivering');
        if (!active?.length) return tg('sendMessage', { chat_id: chatId, text: "Sizda faol buyurtmalar yo'q." });
        
        for (const o of active) {
            const txt = `🚚 <b>YETKAZILMOQDA...</b>\n\n📞 Tel: ${o.phone_number}\n📍 ${o.address_text}`;
            await tg('sendMessage', { 
                chat_id: chatId, 
                text: txt, 
                parse_mode: 'HTML', 
                reply_markup: { 
                    inline_keyboard: [
                        [{ text: "🏁 Yakunlash", callback_data: `finish_${o.id}` }],
                        [{ text: "❌ Rad etish", callback_data: `reject_${o.id}` }]
                    ] 
                } 
            });
        }
    }
    
    if (text === "📊 Tarix") {
        const { data: hist } = await supabase.from('orders').select('*').eq('courier_id', profile.id).eq('status', 'delivered');
        return tg('sendMessage', { chat_id: chatId, text: `📊 <b>STATISTIKA</b>\n\n✅ Bajardigiz: ${hist?.length || 0} ta\n💰 Daromad: ${hist?.reduce((a,b)=>a+b.delivery_cost, 0).toLocaleString()} UZS`, parse_mode: 'HTML' });
    }
}

export async function handleCourierCallbacks(cb, token) {
    const data = cb.data;
    const chatId = cb.from.id;
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).single();

    if (data.startsWith('accept_')) {
        const oid = data.split('_')[1];
        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if (error) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Kechikdingiz!" });
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "✅ <b>Sizga biriktirildi!</b>", parse_mode: 'HTML' });
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost }).eq('id', profile.id);
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "🏁 <b>Buyurtma yakunlandi!</b>", parse_mode: 'HTML' });
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id });
    }
}
