
import { supabase, tg, SITE_URL } from './bot-config.js';
import { KB } from './bot-keyboards.js';

export async function handleUser(chatId, text, profile) {
    if (text === "🛒 Savatim") {
        const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
        if (!items?.length) return tg('sendMessage', { chat_id: chatId, text: "🛒 <b>Savatingiz bo'sh.</b>", parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🛍️ XARID QILISH", url: SITE_URL }]] } });
        
        let list = "🛒 <b>SAVATINGIZ:</b>\n\n";
        items.forEach((i, idx) => list += `${idx+1}. ${i.products.name} (${i.quantity} dona)\n`);
        return tg('sendMessage', { chat_id: chatId, text: list, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "💳 TO'LOV QILISH", url: SITE_URL + "/cart" }]] } });
    }

    if (text === "👤 Profil") {
        const txt = `
👤 <b>SHAXSIY PROFIL</b>
──────────────────
📧 <b>Gmail:</b> <code>${profile.email}</code>
👤 <b>Ism:</b> ${profile.first_name}
📱 <b>Tel:</b> ${profile.phone || 'Noma\'lum'}
💰 <b>Balans:</b> <code>${(profile.balance || 0).toLocaleString()} UZS</code>
🆔 <b>Role:</b> <code>${profile.role.toUpperCase()}</code>
──────────────────`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML' });
    }

    if (text === "🛵 Kuryer bo'lish") {
        const txt = `🛵 <b>KURYERLIKKA ARIZA</b>\n\n<b>Ma'lumotlar:</b>\n👤 Ism: ${profile.first_name}\n📱 Tel: ${profile.phone}\n\n<i>Arizani adminlarga yuborishni tasdiqlaysizmi?</i>`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: KB.confirm_apply(profile.id) });
    }
}
