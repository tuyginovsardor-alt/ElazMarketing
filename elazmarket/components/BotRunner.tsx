
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

interface LogEntry {
  id: number;
  time: string;
  type: 'in' | 'out' | 'sys' | 'err';
  user: string;
  msg: string;
}

const BotRunner: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const offsetRef = useRef<number>(0);
  const isPollingActive = useRef<boolean>(false);
  const sessions = useRef<{ [key: number]: any }>({});

  const addLog = (type: 'in' | 'out' | 'sys' | 'err', user: string, msg: string) => {
    setLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type, user, msg },
      ...prev.slice(0, 49)
    ]);
  };

  const startPolling = async () => {
    if (isPollingActive.current) return;
    isPollingActive.current = true;
    addLog('sys', 'SYSTEM', 'ELAZ Engine started ✅');

    while (isPollingActive.current) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getUpdates?offset=${offsetRef.current}&timeout=30`);
        const data = await response.json();
        if (data.ok && data.result) {
          for (const update of data.result) {
            await handleUpdate(update);
            offsetRef.current = update.update_id + 1;
          }
        }
      } catch (err) {
        await new Promise(r => setTimeout(r, 5000));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  const sendMessage = async (chatId: number, text: string, replyMarkup?: any) => {
    try {
      await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup, parse_mode: 'HTML' })
      });
      addLog('out', `BOT -> ${chatId}`, text.substring(0, 50));
    } catch (e) {
      addLog('err', 'SEND', 'Failed to send message');
    }
  };

  const handleUpdate = async (update: any) => {
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const fromName = msg.from.first_name || 'User';

    addLog('in', fromName, text || '[Action]');

    // Initialize session if not exists
    if (!sessions.current[chatId]) {
      sessions.current[chatId] = { step: 'welcome', history: [], data: {} };
    }
    const session = sessions.current[chatId];

    // Global Reset
    if (text === '/start' || text === '❌ Bekor qilish') {
      session.step = 'welcome';
      session.history = [];
      session.data = {};
      await sendMessage(chatId, `🏢 <b>ELAZ MARKET Kurer Tizimi</b>\n\nAssalomu alaykum! Tizimdan foydalanish uchun quyidagilardan birini tanlang:`, {
        keyboard: [[{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }]],
        resize_keyboard: true
      });
      return;
    }

    // Back logic
    if (text === '⬅️ Orqaga') {
      if (session.history.length > 0) {
        const lastStep = session.history.pop();
        session.step = lastStep;
        // Trigger re-prompt by simulating the entry command
        let triggerText = '';
        if (lastStep === 'welcome') triggerText = '/start';
        else if (lastStep === 'reg_name') triggerText = "📝 Ro'yxatdan o'tish";
        else if (lastStep === 'login_email') triggerText = "🔑 Kirish";
        // Simple steps re-render
        await handleUpdate({ message: { chat: { id: chatId }, text: triggerText, from: msg.from, is_internal: true } });
        return;
      } else {
        await handleUpdate({ message: { chat: { id: chatId }, text: '/start', from: msg.from } });
        return;
      }
    }

    // --- REGISTRATION FLOW ---
    if (text === "📝 Ro'yxatdan o'tish") {
      session.history.push('welcome');
      session.step = 'reg_name';
      await sendMessage(chatId, "<b>1/6. Shaxsingiz</b>\n\nIsm va familiyangizni kiriting:", {
        keyboard: [[{ text: "❌ Bekor qilish" }]], resize_keyboard: true
      });
    } 
    else if (session.step === 'reg_name' && !update.message.is_internal) {
      session.data.fullName = text;
      session.history.push('reg_name');
      session.step = 'reg_email';
      await sendMessage(chatId, "<b>2/6. Email</b>\n\nGmail manzilingizni kiriting:", {
        keyboard: [[{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]], resize_keyboard: true
      });
    }
    else if (session.step === 'reg_email' && !update.message.is_internal) {
      session.data.email = text;
      session.history.push('reg_email');
      session.step = 'reg_pass';
      await sendMessage(chatId, "<b>3/6. Parol</b>\n\nTizim uchun parol o'ylab toping (kamida 6 ta belgi):");
    }
    else if (session.step === 'reg_pass' && !update.message.is_internal) {
      session.data.password = text;
      session.history.push('reg_pass');
      session.step = 'reg_transport';
      await sendMessage(chatId, "<b>4/6. Transport</b>\n\nYetkazib berish usulini tanlang:", {
        keyboard: [[{ text: "🚶 Piyoda" }, { text: "🚲 Velosiped" }], [{ text: "🚗 Mashina" }], [{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]],
        resize_keyboard: true
      });
    }
    else if (session.step === 'reg_transport' && !update.message.is_internal) {
      const ts = ["🚶 Piyoda", "🚲 Velosiped", "🚗 Mashina"];
      if (ts.includes(text)) {
        session.data.transport = text.split(' ')[1];
        session.history.push('reg_transport');
        session.step = 'reg_location';
        await sendMessage(chatId, "<b>5/6. Hudud</b>\n\nHozirgi turgan joyingizni yuboring (📍 tugmasini bosing):", {
          keyboard: [[{ text: "📍 Joylashuvni ulashish", request_location: true }], [{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]],
          resize_keyboard: true
        });
      }
    }
    else if (session.step === 'reg_location' && (msg.location || update.message.is_internal)) {
      if (msg.location) {
        session.data.lat = msg.location.latitude;
        session.data.lng = msg.location.longitude;
        session.history.push('reg_location');
        session.step = 'reg_phone';
        await sendMessage(chatId, "<b>6/6. Telefon</b>\n\nTelefon raqamingizni yuboring (📱 tugmasini bosing):", {
          keyboard: [[{ text: "📱 Kontaktni yuborish", request_contact: true }], [{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]],
          resize_keyboard: true
        });
      }
    }
    else if (session.step === 'reg_phone' && (msg.contact || update.message.is_internal)) {
      const phone = msg.contact ? msg.contact.phone_number : text;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: session.data.email,
        password: session.data.password,
      });

      if (authError) {
        await sendMessage(chatId, `❌ Xatolik: ${authError.message}\nBoshqatdan urinib ko'ring.`);
        session.step = 'welcome';
      } else if (authData.user) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          telegram_id: chatId,
          full_name: session.data.fullName,
          email: session.data.email,
          phone: phone,
          transport_type: session.data.transport,
          lat: session.data.lat,
          lng: session.data.lng,
          is_approved: false
        });
        await sendMessage(chatId, "✅ <b>Ro'yxatdan o'tdingiz!</b>\nAdmin tasdiqlashini kuting. Tasdiqlanganingizdan so'ng xabar beramiz.", {
          keyboard: [[{ text: "🔑 Kirish" }]], resize_keyboard: true
        });
        session.step = 'welcome';
      }
    }

    // --- LOGIN FLOW ---
    else if (text === "🔑 Kirish") {
      session.history.push('welcome');
      session.step = 'login_email';
      await sendMessage(chatId, "📧 Gmail manzilingizni kiriting:", {
        keyboard: [[{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]], resize_keyboard: true
      });
    }
    else if (session.step === 'login_email' && !update.message.is_internal) {
      session.loginEmail = text;
      session.history.push('login_email');
      session.step = 'login_pass';
      await sendMessage(chatId, "🔐 Parolingizni kiriting:", {
        keyboard: [[{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]], resize_keyboard: true
      });
    }
    else if (session.step === 'login_pass' && !update.message.is_internal) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: session.loginEmail,
        password: text
      });

      if (authError) {
        await sendMessage(chatId, "❌ <b>Xatolik:</b> Gmail yoki parol noto'g'ri. Qayta urinib ko'ring:", {
          keyboard: [[{ text: "⬅️ Orqaga" }, { text: "❌ Bekor qilish" }]], resize_keyboard: true
        });
      } else if (authData.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
        if (profile) {
          await supabase.from('profiles').update({ telegram_id: chatId }).eq('id', profile.id);
          if (profile.is_approved) {
            session.step = 'authenticated';
            await sendMessage(chatId, `✅ <b>Xush kelibsiz, ${profile.full_name}!</b>`, {
              keyboard: [[{ text: "🟢 Ishni boshlash" }, { text: "🔴 Dam olish" }], [{ text: "👤 Profil" }, { text: "❌ Chiqish" }]],
              resize_keyboard: true
            });
          } else {
            await sendMessage(chatId, "⏳ <b>Profilingiz hali admin tomonidan tasdiqlanmagan.</b>\nIltimos, kuting. Tasdiqlangach barcha imkoniyatlar ochiladi.", {
              keyboard: [[{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }]],
              resize_keyboard: true
            });
            session.step = 'welcome';
          }
        }
      }
    }

    // --- AUTHENTICATED ACTIONS ---
    else if (session.step === 'authenticated') {
      if (text === '👤 Profil') {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).single();
        await sendMessage(chatId, `👤 <b>PROFILINGIZ:</b>\n\nIsm: ${p.full_name}\nTransport: ${p.transport_type}\nBalans: ${p.balance.toLocaleString()} uzs\nReyting: ⭐ ${p.rating}\nHolat: ${p.active_status ? '🟢 Onlayn' : '🔴 Oflayn'}`);
      } else if (text === '🟢 Ishni boshlash') {
        await supabase.from('profiles').update({ active_status: true }).eq('telegram_id', chatId);
        await sendMessage(chatId, "🟢 <b>Siz ONLAYN holatdasiz.</b> Yangi buyurtmalar kutavering!");
      } else if (text === '🔴 Dam olish') {
        await supabase.from('profiles').update({ active_status: false }).eq('telegram_id', chatId);
        await sendMessage(chatId, "🔴 <b>Siz dam olish rejimidasiz.</b>");
      } else if (text === '❌ Chiqish') {
        await supabase.auth.signOut();
        session.step = 'welcome';
        await handleUpdate({ message: { chat: { id: chatId }, text: '/start', from: msg.from } });
      }
    }

    sessions.current[chatId] = session;
  };

  useEffect(() => {
    startPolling();
    return () => { isPollingActive.current = false; };
  }, []);

  return (
    <div className="flex flex-col h-full bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-white font-black tracking-widest uppercase">Bot Engine Live</span>
        </div>
        <button onClick={() => setLogs([])} className="text-[9px] text-gray-500 hover:text-white uppercase font-bold">Clear</button>
      </div>
      <div className="flex-1 p-3 font-mono text-[10px] overflow-y-auto scroll-smooth space-y-1">
        {logs.map(log => (
          <div key={log.id} className={`flex space-x-2 pb-1 border-b border-gray-900/50 ${log.type === 'err' ? 'bg-red-950/20' : ''}`}>
            <span className="text-gray-600 shrink-0">{log.time.split(' ')[0]}</span>
            <span className={`shrink-0 font-bold ${log.type === 'in' ? 'text-green-500' : log.type === 'out' ? 'text-blue-500' : log.type === 'err' ? 'text-red-500' : 'text-amber-500'}`}>
              {log.type === 'in' ? '>>>' : log.type === 'out' ? '<<<' : '###'}
            </span>
            <span className="text-gray-300 break-words">
              <b className="text-gray-100">{log.user}:</b> {log.msg}
            </span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-gray-700 italic text-center py-20 uppercase tracking-widest">Listening...</div>}
      </div>
    </div>
  );
};

export default BotRunner;
