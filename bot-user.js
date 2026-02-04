
import { supabase, tg, SITE_URL } from './bot-config.js';
import { KB } from './bot-keyboards.js';

export async function handleUser(chatId, text, profile) {
    if (text === "🛒 Savatim") {
        const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', profile.id);
        if (!items?.length) return tg('sendMessage', { chat_id: chatId, text: "🛒 <b>Savatingiz hozircha bo'sh.</b>\n\nMahsulotlarni tanlash uchun saytga o'ting.", parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🛍️ XARID QILISH", web_app: { url: SITE_URL } }]] } });
        
        let list = "🛒 <b>SAVATINGIZ:</b>\n\n";
        let total = 0;
        items.forEach((i, idx) => {
            const sub = i.products.price * i.quantity;
            total += sub;
            list += `<b>${idx+1}.</b> ${i.products.name} (${i.quantity} x ${i.products.price.toLocaleString()})\n`;
        });
        list += `\n💰 <b>JAMI: ${total.toLocaleString()} UZS</b>`;
        return tg('sendMessage', { chat_id: chatId, text: list, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "💳 RASMIYLASHTIRISH", web_app: { url: `${SITE_URL}/cart` } }]] } });
    }

    if (text === "👤 Profil") {
        const txt = `
👤 <b>MIJOZ PROFILI</b>
──────────────────
📧 <b>Gmail:</b> <code>${profile.email}</code>
👤 <b>Ism:</b> ${profile.first_name}
📱 <b>Tel:</b> ${profile.phone || 'Noma\'lum'}
💰 <b>Balans:</b> <code>${profile.balance.toLocaleString()} UZS</code>
🆔 <b>Role:</b> <code>${profile.role.toUpperCase()}</code>
──────────────────`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML' });
    }

    if (text === "🛵 Kuryer bo'lish") {
        const txt = `🛵 <b>KURYERLIKKA ARIZA</b>\n\nSiz <b>ELAZ MARKET</b> kuryerlar jamoasiga qo'shilish niyatidasiz.\n\n<b>Sizning ma'lumotlaringiz:</b>\n👤 Ism: ${profile.first_name}\n📱 Tel: ${profile.phone}\n\nArizani yuborishni tasdiqlaysizmi?`;
        return tg('sendMessage', { chat_id: chatId, text: txt, parse_mode: 'HTML', reply_markup: KB.confirm_apply(profile.id) });
    }
}
