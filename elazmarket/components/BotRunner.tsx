
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

  // --- OTP WATCHER ENGINE (Bazani analiz qilish) ---
  const startOtpWatcher = async () => {
    addLog('sys', 'WATCHER', 'OTP Monitoring active 🔍');
    
    while (isPollingActive.current) {
      try {
        // 1. Pending holatdagi hamma so'rovlarni olish
        const { data: pendingOtps, error } = await supabase
          .from('profiles')
          .select('id, phone, telegram_id, otp_code, first_name')
          .eq('otp_status', 'pending')
          .limit(10);

        if (error) throw error;

        if (pendingOtps && pendingOtps.length > 0) {
          for (const req of pendingOtps) {
            let targetChatId = req.telegram_id;

            // 2. Agar bu qatorda telegram_id bo'lmasa, butun bazadan ushbu raqamga bog'langan ID ni qidiramiz
            if (!targetChatId) {
              const { data: linkedProfile } = await supabase
                .from('profiles')
                .select('telegram_id')
                .eq('phone', req.phone)
                .not('telegram_id', 'is', null)
                .order('created_at', { ascending: false }) // Eng oxirgi ulangan ID ni olish
                .limit(1)
                .maybeSingle();
              
              if (linkedProfile) targetChatId = linkedProfile.telegram_id;
            }

            // 3. Agar Telegram ID topilsa, LICHKASIGA yuboramiz
            if (targetChatId) {
              const msgText = `🔐 <b>ELAZ MARKET: TASDIQLASH KODI</b>\n\nAssalomu alaykum ${req.first_name || 'Foydalanuvchi'}!\n\nSizning kirish kodingiz: <code>${req.otp_code}</code>\n\nKodni saytga kiriting. Uni hech kimga bermang!`;
              
              const res = await sendMessage(Number(targetChatId), msgText);
              
              if (res.ok) {
                // Muvaffaqiyatli: holatni 'sent' qilamiz
                await supabase.from('profiles').update({ otp_status: 'sent', telegram_id: targetChatId }).eq('id', req.id);
                addLog('out', `OTP -> ${req.phone}`, `Lichkaga yuborildi ✅`);
              } else {
                // Xato: masalan foydalanuvchi botni bloklagan
                await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
                addLog('err', `OTP -> ${req.phone}`, `Yuborib bo'lmadi (Bloklangan?)`);
              }
            } else {
              // Botga ulanmagan: foydalanuvchiga saytda xabar chiqishi uchun statusni 'failed' qilamiz
              await supabase.from('profiles').update({ otp_status: 'failed' }).eq('id', req.id);
              addLog('err', `OTP -> ${req.phone}`, `Telegram ulanmagan!`);
            }
          }
        }
      } catch (err: any) {
        console.error("Watcher Error:", err.message);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  const startPolling = async () => {
    if (isPollingActive.current) return;
    isPollingActive.current = true;
    addLog('sys', 'SYSTEM', 'Bot Engine started ✅');

    startOtpWatcher();

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
      const res = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup, parse_mode: 'HTML' })
      });
      return await res.json();
    } catch (e) {
      return { ok: false };
    }
  };

  const handleUpdate = async (update: any) => {
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const fromName = msg.from.first_name || 'User';

    // FOYDALANUVCHI RAQAMINI ULAGANDA
    if (msg.contact) {
        const phone = '+' + msg.contact.phone_number.replace(/\D/g, '');
        
        // Bazada shu raqamli hamma profilga Telegram ID ni yozib chiqamiz
        await supabase.from('profiles').update({ telegram_id: chatId }).eq('phone', phone);
        
        // Agar raqam umuman bo'lmasa, yangi profil ochamiz
        const { data: existing } = await supabase.from('profiles').select('*').eq('phone', phone).maybeSingle();
        if (!existing) {
            await supabase.from('profiles').insert({ phone, telegram_id: chatId, role: 'user', balance: 0 });
        }

        await sendMessage(chatId, "✅ <b>RAQAM MUAFFAQIYATLI ULANDI!</b>\n\nEndi saytda kirish kodingiz shu yerga yuboriladi.", {
            keyboard: [[{ text: "👤 Profil" }]], resize_keyboard: true
        });
        return;
    }

    addLog('in', fromName, text || '[Action]');

    if (text === '/start') {
      await sendMessage(chatId, `🏢 <b>ELAZ MARKET BOT</b>\n\nKodni olish uchun raqamingizni ulashing:`, {
        keyboard: [[{ text: "📱 Raqamni ulash", request_contact: true }]],
        resize_keyboard: true
      });
    }

    if (text === '👤 Profil') {
        const { data: p } = await supabase.from('profiles').select('*').eq('telegram_id', chatId).maybeSingle();
        if (p) {
            await sendMessage(chatId, `👤 <b>PROFIL:</b>\n\nIsm: ${p.first_name || 'Mijoz'}\nBalans: ${p.balance.toLocaleString()} uzs`);
        }
    }
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
          <span className="text-[10px] text-white font-black tracking-widest uppercase">Bot Logic Live</span>
        </div>
        <button onClick={() => setLogs([])} className="text-[9px] text-gray-500 hover:text-white uppercase font-bold">Clear</button>
      </div>
      <div className="flex-1 p-3 font-mono text-[10px] overflow-y-auto scroll-smooth space-y-1">
        {logs.map(log => (
          <div key={log.id} className="flex space-x-2 pb-1 border-b border-gray-900/50">
            <span className="text-gray-600 shrink-0">{log.time.split(' ')[0]}</span>
            <span className={`shrink-0 font-bold ${log.type === 'in' ? 'text-green-500' : log.type === 'out' ? 'text-blue-500' : 'text-amber-500'}`}>
              {log.type === 'in' ? '>>>' : log.type === 'out' ? '<<<' : '###'}
            </span>
            <span className="text-gray-300">
              <b className="text-gray-100">{log.user}:</b> {log.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotRunner;
