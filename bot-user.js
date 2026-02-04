
import { supabase, tg, SITE_URL } from './bot-config.js';

export async function handleUser(chatId, text, profile) {
    if (text === "🛒 Savatim") {
        const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
        if (!items?.length) return tg('sendMessage', { chat_id: chatId, text: "🛒 <b>Savatingiz bo'sh.</b>", parse_mode: 'HTML' });
        
        let list = "🛒 <b>SAVATINGIZ:</b>\n\n";
        items.forEach((i, idx) => {
            list += `${idx+1}. ${i.products.name} (${i.quantity} dona)\n`;
        });
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: list, 
            parse_mode: 'HTML', 
            reply_markup: { inline_keyboard: [[{ text: "💳 Rasmiylashtirish", web_app: { url: SITE_URL + "/cart" } }]] } 
        });
    }

    if (text === "👤 Profil") {
        const txt = `👤 <b>PROFIL</b>\n\n<b>Mijoz:</b> ${profile.first_name}\n<b>Balans:</b> ${profile.balance.toLocaleString()} UZS`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML' });
    }

    if (text === "🛵 Kuryer bo'lish") {
        await supabase.from('courier_applications').insert({ user_id: profile.id, full_name: profile.first_name });
        return tg('sendMessage', { chat_id: chatId, text: "✅ <b>Arizangiz yuborildi.</b>\nAdminlar uni ko'rib chiqib, siz bilan bog'lanishadi.", parse_mode: 'HTML' });
    }
}
