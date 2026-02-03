
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Auth from './components/Auth';
import CourierDashboard from './components/CourierDashboard';
import BotRunner from './components/BotRunner';
import Dashboard from './components/Dashboard';
import OrderSimulator from './components/OrderSimulator';
import BotCodeViewer from './components/BotCodeViewer';
import { CONFIG } from './constants';
import { Profile } from './types';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'simulator' | 'code'>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-400 font-black tracking-widest animate-pulse">ELAZ SYSTEM LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row overflow-hidden">
      {/* Chap tomon: Bot Engine (Har doim faol) */}
      <div className="lg:w-1/3 w-full bg-gray-900 p-4 lg:p-6 overflow-y-auto border-r border-gray-800 shadow-2xl z-20">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <i className="fas fa-robot"></i>
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter">ELAZ ENGINE</h1>
          </div>
          <span className="text-[10px] text-gray-500 font-mono font-bold bg-gray-800 px-2 py-1 rounded">v2.5.0-STABLE</span>
        </div>
        
        {/* Bot har doim shu yerda ishlaydi, login bo'lsa ham bo'lmasa ham */}
        <BotRunner />
      </div>

      {/* O'ng tomon: Kontent (Auth yoki Dashboard) */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!session ? (
          <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-200">
            <Auth onSession={setSession} />
          </div>
        ) : profile && !profile.is_approved ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md border border-gray-100 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <i className="fas fa-shield-halved text-4xl"></i>
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-4">Kutish rejimida</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Sizning kurerlik profilingiz yaratildi. Endi administrator uni tasdiqlashi kerak. Tasdiqlangach bot sizga xabar yuboradi.
              </p>
              <button onClick={handleLogout} className="text-gray-400 font-bold hover:text-red-500 transition-colors uppercase text-xs tracking-widest">
                Chiqish <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>
        ) : profile ? (
          <div className="p-0">
            {/* Admin/Kurer Dashboard tanlovi */}
            {profile.role === 'admin' ? (
              <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
                <div className="flex flex-wrap gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    DASHBOARD
                  </button>
                  <button 
                    onClick={() => setActiveView('simulator')}
                    className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeView === 'simulator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    SIMULATOR
                  </button>
                  <button 
                    onClick={() => setActiveView('code')}
                    className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeView === 'code' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    SQL SCHEMA
                  </button>
                </div>
                
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'simulator' && <OrderSimulator />}
                {activeView === 'code' && <BotCodeViewer />}
                
                <div className="pt-10 border-t border-gray-200">
                  <button onClick={handleLogout} className="text-red-500 font-black text-sm hover:underline">
                    <i className="fas fa-sign-out-alt mr-2"></i> TIZIMDAN CHIQISH
                  </button>
                </div>
              </div>
            ) : (
              <CourierDashboard profile={profile} onLogout={handleLogout} />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <p className="text-red-500 font-black">Xatolik: Profil yuklanmadi!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
