
import { supabase, tg, SITE_URL } from './bot-config.js';
import { KB } from './bot-keyboards.js';

export async function handleAuth(chatId, text, session, msg) {
    // --- LOGIN ---
    if (text === "🔑 Kirish") {
        session.step = 'login_email';
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: "🔑 <b>KIRISH</b>\n\nGmail manzilingizni yuboring:", 
            parse_mode: 'HTML', 
            reply_markup: KB.cancel 
        });
    }
    if (session.step === 'login_email') {
        session.email = text;
        session.step = 'login_pass';
        return tg('sendMessage', { chat_id: chatId, text: "🔐 <b>PAROLINGIZNI</b> yuboring:", parse_mode: 'HTML' });
    }
    if (session.step === 'login_pass') {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email: session.email, password: text });
        if (error) {
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "❌ <b>XATO:</b> Gmail yoki parol noto'g'ri.", parse_mode: 'HTML', reply_markup: KB.welcome });
        }
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', auth.user.id);
        session.step = 'idle';
        return tg('sendMessage', { chat_id: chatId, text: "✅ <b>Muvaffaqiyatli kirdingiz!</b>", parse_mode: 'HTML', reply_markup: KB.user });
    }

    // --- REGISTER ---
    if (text === "📝 Ro'yxatdan o'tish") {
        session.step = 'reg_name';
        return tg('sendMessage', { chat_id: chatId, text: "👤 <b>ISM VA FAMILIYA</b>ingizni kiriting:", parse_mode: 'HTML', reply_markup: KB.cancel });
    }
    if (session.step === 'reg_name') {
        session.reg_name = text;
        session.step = 'reg_email';
        return tg('sendMessage', { chat_id: chatId, text: "📧 <b>GMAIL</b> manzilingizni kiriting:", parse_mode: 'HTML' });
    }
    if (session.step === 'reg_email') {
        session.reg_email = text;
        session.step = 'reg_pass';
        return tg('sendMessage', { chat_id: chatId, text: "🔐 <b>PAROL</b> o'ylab toping (min 6 belgi):", parse_mode: 'HTML' });
    }
    if (session.step === 'reg_pass') {
        session.reg_pass = text;
        session.step = 'reg_phone';
        return tg('sendMessage', { chat_id: chatId, text: "📱 <b>TELEFON</b> raqamingizni pastdagi tugma orqali yuboring:", parse_mode: 'HTML', reply_markup: KB.share_contact });
    }
    if (session.step === 'reg_phone' && msg.contact) {
        session.reg_phone = msg.contact.phone_number;
        const otp = Math.floor(100000 + Math.random() * 900000);
        session.generated_otp = otp;
        session.step = 'reg_otp';
        console.log(`[OTP FOR ${chatId}]: ${otp}`);
        return tg('sendMessage', { 
            chat_id: chatId, 
            text: `📩 <b>TASDIQLASH KODI</b>\n\nGmailingizga 6 xonali kod yubordik, shuni kiriting:\n\n<i>(Demo uchun: <code>${otp}</code>)</i>`, 
            parse_mode: 'HTML', 
            reply_markup: KB.cancel 
        });
    }
    if (session.step === 'reg_otp') {
        if (text == session.generated_otp) {
            const { data: auth, error } = await supabase.auth.signUp({ email: session.reg_email, password: session.reg_pass });
            if (error) {
                session.step = 'idle';
                return tg('sendMessage', { chat_id: chatId, text: "❌ <b>XATOLIK:</b> " + error.message, parse_mode: 'HTML', reply_markup: KB.welcome });
            }
            await supabase.from('profiles').insert({ 
                id: auth.user.id, email: session.reg_email, first_name: session.reg_name, 
                telegram_id: chatId, phone: session.reg_phone, role: 'user', balance: 0
            });
            session.step = 'idle';
            return tg('sendMessage', { chat_id: chatId, text: "✨ <b>TABRIKLAYMIZ!</b>\nRo'yxatdan o'tdingiz.", parse_mode: 'HTML', reply_markup: KB.user });
        } else {
            return tg('sendMessage', { chat_id: chatId, text: "⚠️ <b>Kod noto'g'ri.</b> Qayta kiriting:" });
        }
    }
}
