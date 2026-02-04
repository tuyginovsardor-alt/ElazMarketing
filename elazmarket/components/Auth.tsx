
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CONFIG, TRANSPORT_OPTIONS } from '../constants';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

interface AuthProps {
  onSession: (session: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onSession }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [transport, setTransport] = useState('Piyoda');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Fix: Cast supabase.auth to any to bypass incorrect type definitions in the environment
        const { data, error: authError } = await (supabase.auth as any).signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        onSession(data.session);
      } else {
        // Fix: Cast supabase.auth to any to bypass incorrect type definitions in the environment
        const { data, error: authError } = await (supabase.auth as any).signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              transport_type: transport,
            }
          }
        });
        if (authError) throw authError;
        
        // Profiles jadvaliga yozish (Auth trigger bo'lmasa)
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            email: email,
            transport_type: transport,
            role: 'courier',
            is_approved: false, // Default: tasdiqlanmagan
            active_status: false,
            balance: 0,
            rating: 5.0
          });
        }
        
        alert("Pochtangizga tasdiqlash xati yuborildi! Iltimos, Gmailingizni tekshiring.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-indigo-900">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 text-blue-600 rounded-2xl mb-4">
            <i className="fas fa-bolt text-3xl"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">ELAZ MARKET</h2>
          <p className="text-gray-500 text-sm mt-2">{isLogin ? 'Tizimga kirish' : 'Kurer sifatida ro\'yxatdan o\'tish'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">F.I.SH</label>
              <input 
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Ism va Familiya"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Gmail Manzil</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Parol</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Transport turi</label>
              <select 
                value={transport} onChange={(e) => setTransport(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
              >
                {TRANSPORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">{error}</p>}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-gray-400"
          >
            {loading ? <i className="fas fa-circle-notch animate-spin"></i> : (isLogin ? 'KIRISH' : 'RO\'YXATDAN O\'TISH')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            {isLogin ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kirish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
