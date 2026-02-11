
import { supabase, tg } from './bot-config.js';

export async function handleCourier(chatId, text, profile) {
    // 1. BO'SH BUYURTMALAR
    if (text === "📦 Bo'sh buyurtmalar") {
        const { data: orders } = await supabase
            .from('orders')
            .select('*, profiles!user_id(first_name, last_name)')
            .eq('status', 'confirmed')
            .is('courier_id', null)
            .limit(10);

        if (!orders?.length) return tg('sendMessage', { chat_id: chatId, text: "📭 Hozircha bo'sh buyurtmalar yo'q." });
        
        for (const o of orders) {
            const customer = o.profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
            const isCash = o.payment_method === 'cash';
            
            let itemsSummary = "";
            if(o.items) {
                itemsSummary = o.items.split('|').map((item, idx) => {
                    const name = item.split(':::')[1];
                    return `  ${idx+1}. ${name}`;
                }).join('\n');
            }

            const txt = `
📦 <b>YANGI BUYURTMA #${o.id.toString().substring(0,8)}</b>
──────────────────
👤 <b>Mijoz:</b> ${fullName}
📞 <b>Tel:</b> <code>${o.phone_number}</code>
📍 <b>Manzil:</b> ${o.address_text}

🛒 <b>Mahsulotlar:</b>
${itemsSummary || 'Ma\'lumot yo\'q'}

💰 <b>Dostavka haqi:</b> ${o.delivery_cost.toLocaleString()} UZS
${isCash ? `🔴 <b>NAQD PUL YIG'ISH: ${o.total_price.toLocaleString()} UZS</b>` : `🟢 <b>KARTADAN TO'LANGAN</b>`}
──────────────────`;

            const keyboard = {
                inline_keyboard: [
                    [{ text: "✅ QABUL QILISH", callback_data: `accept_${o.id}` }],
                    [{ text: "📍 Xaritada ko'rish", url: `https://www.google.com/maps?q=${o.latitude},${o.longitude}` }]
                ]
            };

            await tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: keyboard });
        }
    }

    // 2. FAOL BUYURTMALAR
    if (text === "🚀 Faol buyurtmalar") {
        const { data: active } = await supabase
            .from('orders')
            .select('*, profiles!user_id(first_name, last_name)')
            .eq('courier_id', profile.id)
            .eq('status', 'delivering');

        if (!active?.length) return tg('sendMessage', { chat_id: chatId, text: "Sizda hozircha faol buyurtmalar yo'q." });
        
        for (const o of active) {
            const customer = o.profiles;
            const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : "Mijoz";
            const isCash = o.payment_method === 'cash';

            const txt = `
🚀 <b>FAOL BUYURTMA #${o.id.toString().substring(0,8)}</b>
──────────────────
👤 <b>Mijoz:</b> ${fullName}
📞 <b>Tel:</b> <code>${o.phone_number}</code>
📍 <b>Manzil:</b> ${o.address_text}
💬 <b>Izoh:</b> ${o.comment || 'Yo\'q'}
──────────────────
${isCash ? `⚠️ <b>MIJOZDAN OLING: ${o.total_price.toLocaleString()} UZS</b>` : `✅ <b>TO'LOV QILINGAN</b>`}
──────────────────`;

            const keyboard = { 
                inline_keyboard: [
                    [{ text: "📞 MIJOZGA QO'NG'IROQ", url: `tel:${o.phone_number}` }],
                    [{ text: "🏁 TOPSHIRILDI (YAKUNLASH)", callback_data: `finish_${o.id}` }],
                    [{ text: "❌ RAD ETISH", callback_data: `reject_${o.id}` }]
                ] 
            };

            await tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: keyboard });
        }
    }

    // 3. ONLAYN / OFLAYN
    if (text === "🟢 Onlayn") {
        await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
        return tg('sendMessage', { chat_id: chatId, text: "🟢 <b>SIZ ONLAYNSIZ.</b> Yangi buyurtmalar haqida xabar beramiz! 🛵" });
    }
    if (text === "🔴 Oflayn") {
        await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
        return tg('sendMessage', { chat_id: chatId, text: "🔴 <b>SIZ OFLAYNSIZ.</b> Dam oling!" });
    }

    // 4. PROFIL
    if (text === "👤 Profil") {
        const txt = `
👤 <b>KURER PROFILI</b>
──────────────────
👤 <b>Ism:</b> ${profile.first_name}
💰 <b>Balans:</b> ${profile.balance.toLocaleString()} UZS
⭐ <b>Reyting:</b> ${profile.rating || 5.0}
🛵 <b>Status:</b> ${profile.active_status ? '🟢 Ishda' : '🔴 Dam olishda'}`;
        
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML' });
    }
}

export async function handleCallbacks(cb) {
    const data = cb.data;
    const chatId = cb.from.id;
    const { data: profile } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
    if (!profile) return;

    if (data.startsWith('accept_')) {
        const oid = data.split('_')[1];
        const { error } = await supabase.from('orders').update({ courier_id: profile.id, status: 'delivering' }).eq('id', oid).is('courier_id', null);
        if (error) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Xato yoki buyurtma olingan!", show_alert: true });
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✅ Qabul qilindi!" });
        await tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: `✅ <b>BUYURTMA SIZNIKI!</b>\n\nIltimos, mijoz bilan bog'lanib, manzili tomon yo'lga chiqing.`, parse_mode: 'HTML' });
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        if(!order) return;

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost, is_busy: false }).eq('id', profile.id);
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "🏁 Buyurtma muvaffaqiyatli topshirildi!" });
        return tg('editMessageText', { chat_id: chatId, message_id: cb.message.message_id, text: `🏁 <b>YAXSHI ISH!</b>\n\nBuyurtma yakunlandi. Daromad: ${order.delivery_cost.toLocaleString()} UZS`, parse_mode: 'HTML' });
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        await supabase.from('profiles').update({ is_busy: false }).eq('id', profile.id);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Buyurtma rad etildi." });
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id });
    }
}
