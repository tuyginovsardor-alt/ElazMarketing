
import { supabase, tg } from './bot-config.js';

export async function handleCourier(chatId, text, profile) {
    if (text === "📦 Bo'sh buyurtmalar") {
        // Mijoz ma'lumotlari (profiles) bilan birga yuklash
        const { data: orders } = await supabase
            .from('orders')
            .select('*, profiles!user_id(first_name, last_name, email)')
            .eq('status', 'confirmed')
            .is('courier_id', null)
            .limit(10);

        if (!orders?.length) return tg('sendMessage', { chat_id: chatId, text: "📭 Hozircha bo'sh buyurtmalar yo'q." });
        
        for (const o of orders) {
            const customer = o.profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Noma'lum mijoz";
            
            const txt = `
📦 <b>YANGI BUYURTMA #${o.id.toString().substring(0,8)}</b>
──────────────────
👤 <b>Mijoz:</b> ${fullName}
📞 <b>Tel:</b> <code>${o.phone_number}</code>
📍 <b>Manzil:</b> ${o.address_text}
──────────────────
💰 <b>Dostavka:</b> ${o.delivery_cost.toLocaleString()} UZS
💵 <b>Jami summa:</b> ${o.total_price.toLocaleString()} UZS
            `;

            const keyboard = {
                inline_keyboard: [
                    [{ text: "✅ QABUL QILISH", callback_data: `accept_${o.id}` }],
                    [{ text: "📍 Xaritada ko'rish", url: `https://www.google.com/maps?q=${o.latitude},${o.longitude}` }]
                ]
            };

            await tg('sendMessage', { 
                chat_id: chatId, 
                text: txt, 
                parse_mode: 'HTML', 
                reply_markup: keyboard 
            });
        }
    }

    if (text === "🚀 Faol buyurtmalar") {
        const { data: active } = await supabase
            .from('orders')
            .select('*, profiles!user_id(first_name, last_name, email)')
            .eq('courier_id', profile.id)
            .eq('status', 'delivering');

        if (!active?.length) return tg('sendMessage', { chat_id: chatId, text: "Sizda hozircha faol buyurtmalar yo'q." });
        
        for (const o of active) {
            const customer = o.profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Noma'lum mijoz";

            const txt = `
🚀 <b>YETKAZIB BERISH JARAYONIDA</b>
🆔 #${o.id.toString().substring(0,8)}
──────────────────
👤 <b>Mijoz:</b> ${fullName}
📞 <b>Tel:</b> <code>${o.phone_number}</code>
📍 <b>Manzil:</b> ${o.address_text}
💬 <b>Izoh:</b> ${o.comment || 'Yo\'q'}
──────────────────
💰 <b>Dostavka haqi:</b> ${o.delivery_cost.toLocaleString()} UZS
            `;

            const keyboard = { 
                inline_keyboard: [
                    [{ text: "📞 MIJOZGA TELEFON", url: `tel:${o.phone_number}` }],
                    [{ text: "📍 YO'LNI KO'RISH", url: `https://www.google.com/maps?q=${o.latitude},${o.longitude}` }],
                    [{ text: "🏁 YETKAZILDI (PUL OLINDI)", callback_data: `finish_${o.id}` }],
                    [{ text: "❌ BEKOR QILISH", callback_data: `reject_${o.id}` }]
                ] 
            };

            await tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: keyboard });
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
        return tg('sendMessage', { chatId, text: `📊 <b>STATISTIKA</b>\n\n✅ Bajardigiz: ${hist?.length || 0} ta\n💰 Daromad: ${earned.toLocaleString()} UZS`, parse_mode: 'HTML' });
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
    if (!profile) return;

    const token = await (async () => {
        // bot-config dan refreshBotToken ni kutish kerak bo'lishi mumkin, 
        // lekin odatda token global o'zgaruvchida bo'ladi.
        const { BOT_TOKEN } = await import('./bot-config.js');
        return BOT_TOKEN;
    })();

    if (data.startsWith('accept_')) {
        const oid = data.split('_')[1];
        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if (error) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Zakaz olib bo'lingan!", show_alert: true });
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✅ Qabul qilindi!", show_alert: false });
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "✅ <b>BUYURTMA SIZGA BIRIKTIRILDI!</b>\n\nEndi 'Faol buyurtmalar' bo'limida mijoz bilan bog'laning.", parse_mode: 'HTML' });
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        if(!order) return;

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost }).eq('id', profile.id);
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "🏁 Barakalla! Pul hisobingizga qo'shildi." });
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: "🏁 <b>BUYURTMA YAKUNLANDI!</b>", parse_mode: 'HTML' });
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Buyurtma rad etildi." });
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id });
    }
}
