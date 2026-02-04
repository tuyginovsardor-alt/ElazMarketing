
import { supabase, tg } from './bot-config.js';
import { KB } from './bot-keyboards.js';

export async function handleAuth(chatId, text, session) {
    // LOGIN
    if (text === "🔑 Kirish") {
        session.step = 'login_email';
        return tg('sendMessage', { chat_id: chatId, text: "📧 <b>Gmail</b> manzilingizni yuboring:", parse_mode: 'HTML', reply_markup: KB.cancel });
    }
    if (session.step === 'login_email') {
        session.email = text;
        session.step = 'login_pass';
        return tg('sendMessage', { chat_id: chatId, text: "🔐 <b>Parol</b>ni kiriting:", parse_mode: 'HTML' });
    }
    if (session.step === 'login_pass') {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email: session.email, password: text });
        if (error) {
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "❌ <b>Xatolik:</b> Ma'lumotlar noto'g'ri.", parse_mode: 'HTML', reply_markup: KB.welcome });
        }
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        session.step = 'idle';
        return tg('sendMessage', { chat_id: chatId, text: "✅ Tizimga muvaffaqiyatli kirdingiz!", reply_markup: KB.user });
    }

    // REGISTER
    if (text === "📝 Ro'yxatdan o'tish") {
        session.step = 'reg_name';
        return tg('sendMessage', { chat_id: chatId, text: "👤 <b>Ismingiz</b>ni kiriting:", parse_mode: 'HTML', reply_markup: KB.cancel });
    }
    if (session.step === 'reg_name') {
        session.reg_name = text;
        session.step = 'reg_email';
        return tg('sendMessage', { chat_id: chatId, text: "📧 <b>Gmail</b> manzilingizni yuboring:", parse_mode: 'HTML' });
    }
    if (session.step === 'reg_email') {
        session.reg_email = text;
        session.step = 'reg_pass';
        return tg('sendMessage', { chat_id: chatId, text: "🔐 <b>Parol</b> o'ylab toping:", parse_mode: 'HTML' });
    }
    if (session.step === 'reg_pass') {
        const { data: auth, error } = await supabase.auth.signUp({ email: session.reg_email, password: text });
        if (error) {
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "❌ <b>Xatolik:</b> " + error.message, parse_mode: 'HTML', reply_markup: KB.welcome });
        }
        await supabase.from('profiles').insert({ id: auth.user.id, email: session.reg_email, first_name: session.reg_name, telegram_id: chatId, role: 'user' });
        session.step = 'idle';
        return tg('sendMessage', { chat_id: chatId, text: "✨ <b>Tabriklaymiz!</b> Ro'yxatdan o'tdingiz.", parse_mode: 'HTML', reply_markup: KB.user });
    }
}
