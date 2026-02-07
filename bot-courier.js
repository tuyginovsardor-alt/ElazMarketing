
import { supabase, tg } from './bot-config.js';

/**
 * Yangi buyurtma tushganda barcha onlayn kuryerlarga xabar yuborish funksiyasi.
 * Bu funksiyani bot-main.js yoki ma'lumotlar bazasi o'zgarganda chaqirish mumkin.
 */
export async function notifyOnlineCouriers(order) {
    const { data: couriers } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('role', 'courier')
        .eq('active_status', true);

    if (!couriers || !couriers.length) return;

    const txt = `
🔔 <b>YANGI BUYURTMA KELDI!</b>
──────────────────
💰 <b>Narxi:</b> ${order.total_price.toLocaleString()} UZS
📍 <b>Manzil:</b> ${order.address_text}
🛵 <b>Dostavka:</b> ${order.delivery_cost.toLocaleString()} UZS
──────────────────
<i>Buyurtmani ilova yoki bot orqali qabul qilishingiz mumkin.</i>`;

    const keyboard = {
        inline_keyboard: [
            [{ text: "✅ QABUL QILISH", callback_data: `accept_${order.id}` }],
            [{ text: "🌐 SAYTDA OCHISH", url: `https://elaz-marketing.vercel.app/orders` }]
        ]
    };

    for (const c of couriers) {
        if (c.telegram_id) {
            await tg('sendMessage', { 
                chat_id: c.telegram_id, 
                text: txt, 
                parse_mode: 'HTML', 
                reply_markup: keyboard 
            });
        }
    }
}

export async function handleCourier(chatId, text, profile) {
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
            
            const txt = `
📦 <b>BUYURTMA #${o.id.toString().substring(0,8)}</b>
──────────────────
👤 <b>Mijoz:</b> ${fullName}
📞 <b>Tel:</b> <code>${o.phone_number}</code>
📍 <b>Manzil:</b> ${o.address_text}
──────────────────
💰 <b>Dostavka:</b> ${o.delivery_cost.toLocaleString()} UZS
💵 <b>Jami:</b> ${o.total_price.toLocaleString()} UZS`;

            const keyboard = {
                inline_keyboard: [
                    [{ text: "✅ QABUL QILISH", callback_data: `accept_${o.id}` }],
                    [{ text: "📍 Xaritada ko'rish", url: `https://www.google.com/maps?q=${o.latitude},${o.longitude}` }]
                ]
            };

            await tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: keyboard });
        }
    }

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

            const txt = `
🚀 <b>FAOL BUYURTMA #${o.id.toString().substring(0,8)}</b>
──────────────────
👤 <b>Mijoz:</b> ${fullName}
📞 <b>Tel:</b> <code>${o.phone_number}</code>
📍 <b>Manzil:</b> ${o.address_text}
💬 <b>Izoh:</b> ${o.comment || 'Yo\'q'}
──────────────────`;

            const keyboard = { 
                inline_keyboard: [
                    [{ text: "📞 MIJOZGA QO'NG'IROQ", url: `tel:${o.phone_number}` }],
                    [{ text: "🏁 YETKAZILDI (PUL OLINDI)", callback_data: `finish_${o.id}` }],
                    [{ text: "❌ RAD ETISH", callback_data: `reject_${o.id}` }]
                ] 
            };

            await tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: keyboard });
            
            // Xaritani (Location) alohida tashlash
            if (o.latitude && o.longitude) {
                await tg('sendLocation', {
                    chat_id: chatId,
                    latitude: o.latitude,
                    longitude: o.longitude
                });
            }
        }
    }

    if (text === "📊 Tarix") {
        const { data: hist, error } = await supabase
            .from('orders')
            .select('*')
            .eq('courier_id', profile.id)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) return tg('sendMessage', { chat_id: chatId, text: "Xatolik yuz berdi." });

        const totalEarned = hist?.reduce((a, b) => a + b.delivery_cost, 0) || 0;
        let historyTxt = `📊 <b>SIZNING TARIXINGIZ</b>\n\n✅ <b>Bajarilgan:</b> ${hist?.length || 0} ta\n💰 <b>Jami daromad:</b> ${totalEarned.toLocaleString()} UZS\n\n`;

        if (hist?.length) {
            historyTxt += `<b>So'nggi 10 ta:</b>\n`;
            hist.forEach((h, i) => {
                historyTxt += `${i+1}. #${h.id.toString().substring(0,6)} - ${h.delivery_cost.toLocaleString()} UZS\n`;
            });
        }

        return tg('sendMessage', { 
            chat_id: chatId, 
            text: historyTxt, 
            parse_mode: 'HTML' 
        });
    }

    if (text === "🟢 Onlayn") {
        await supabase.from('profiles').update({ active_status: true }).eq('id', profile.id);
        return tg('sendMessage', { chat_id: chatId, text: "🟢 <b>SIZ ONLAYNSIZ.</b> Yangi buyurtmalar kelsa xabar beramiz! 🛵" });
    }

    if (text === "🔴 Oflayn") {
        await supabase.from('profiles').update({ active_status: false }).eq('id', profile.id);
        return tg('sendMessage', { chat_id: chatId, text: "🔴 <b>SIZ OFLAYNSIZ.</b> Dam oling!" });
    }

    if (text === "👤 Profil") {
        const txt = `
👤 <b>KURER PROFILI</b>
──────────────────
👤 <b>Ism:</b> ${profile.first_name}
💰 <b>Balans:</b> ${profile.balance.toLocaleString()} UZS
⭐ <b>Reyting:</b> ${profile.rating || 5.0}
🛵 <b>Status:</b> ${profile.active_status ? '🟢 Faol' : '🔴 Oflayn'}`;
        
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
        
        // Buyurtmani tekshirish va biriktirish
        const { data: order, error } = await supabase
            .from('orders')
            .update({ courier_id: profile.id, status: 'delivering' })
            .eq('id', oid)
            .is('courier_id', null)
            .select()
            .single();

        if (error || !order) {
            return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Kechikdingiz! Buyurtma allaqachon olingan.", show_alert: true });
        }
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "✅ Buyurtma qabul qilindi!" });
        
        await tg('editMessageText', { 
            chat_id: chatId, 
            message_id: cb.message.message_id, 
            text: `✅ <b>BUYURTMA SIZGA BIRIKTIRILDI!</b>\n\nManzil: ${order.address_text}\n\nMijoz bilan bog'laning.`,
            parse_mode: 'HTML' 
        });

        // Kuryerga lokatsiyani tashlash
        if (order.latitude && order.longitude) {
            await tg('sendLocation', {
                chat_id: chatId,
                latitude: order.latitude,
                longitude: order.longitude
            });
        }
    }

    if (data.startsWith('finish_')) {
        const oid = data.split('_')[1];
        const { data: order } = await supabase.from('orders').select('*').eq('id', oid).single();
        if(!order) return;

        await supabase.from('orders').update({ status: 'delivered' }).eq('id', oid);
        await supabase.from('profiles').update({ balance: profile.balance + order.delivery_cost }).eq('id', profile.id);
        
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "🏁 Buyurtma yakunlandi! Pul balansingizga qo'shildi." });
        return tg('editMessageText', { 
            chat_id: chatId, 
            message_id: cb.message.message_id, 
            text: `🏁 <b>BUYURTMA #${order.id.toString().substring(0,8)} YAKUNLANDI!</b>\n\nDaromadingiz: ${order.delivery_cost.toLocaleString()} UZS`,
            parse_mode: 'HTML' 
        });
    }

    if (data.startsWith('reject_')) {
        const oid = data.split('_')[1];
        await supabase.from('orders').update({ courier_id: null, status: 'confirmed' }).eq('id', oid);
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Buyurtma rad etildi va boshqalarga qaytarildi." });
        return tg('deleteMessage', { chat_id: chatId, message_id: cb.message.message_id });
    }
}
