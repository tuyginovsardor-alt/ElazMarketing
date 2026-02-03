
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CONFIG, TRANSPORT_OPTIONS } from '../constants';
import { Profile, Order } from '../types';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

interface Props {
  profile: Profile;
  onLogout: () => void;
}

const CourierDashboard: React.FC<Props> = ({ profile: initialProfile, onLogout }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'profile'>('home');
  const [isOnline, setIsOnline] = useState(profile.active_status);
  const [orders, setOrders] = useState<Order[]>([]);

  // Statusni o'zgartirish
  const toggleStatus = async (statusOverride?: boolean) => {
    const newStatus = statusOverride !== undefined ? statusOverride : !isOnline;
    const { error } = await supabase
      .from('profiles')
      .update({ active_status: newStatus })
      .eq('id', profile.id);
    
    if (!error) setIsOnline(newStatus);
  };

  // Buyurtmani qabul qilish logikasi (Statusni avtomatik band qilish)
  const acceptOrder = async (orderId: string) => {
    // 1. Buyurtmani biriktirish
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivering', courier_id: profile.id })
      .eq('id', orderId);

    if (!error) {
      // 2. Kurer statusini avtomatik "Band" (Offline) qilish yoki maxsus "Delivering" statusiga o'tkazish
      await toggleStatus(false); 
      alert("Buyurtma qabul qilindi! Sizning holatingiz 'Band' rejimiga o'tkazildi.");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('courier_id', profile.id)
        .in('status', ['confirmed', 'delivering']);
      if (data) setOrders(data);
    };
    fetchOrders();
  }, [profile.id]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white p-6 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-gray-800">ELAZ Courier</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
              {profile.is_approved ? '✅ Tasdiqlangan Kurer' : '⏳ Tasdiqlanmoqda'}
            </p>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-gray-50 rounded-xl text-red-500 flex items-center justify-center border border-gray-100">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 space-y-6">
        {activeTab === 'home' && (
          <>
            {/* Dynamic Status Display */}
            <div className={`p-6 rounded-[2.5rem] shadow-xl border-2 transition-all duration-500 ${isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`font-black text-xl ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isOnline ? 'ONLINE' : 'BAND / OFFLINE'}
                  </h3>
                  <p className={`text-xs font-bold opacity-60 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isOnline ? 'Buyurtmalar qabul qilinmoqda' : 'Yangi buyurtmalar kelmaydi'}
                  </p>
                </div>
                <button 
                  onClick={() => toggleStatus()}
                  className={`w-14 h-7 rounded-full relative transition-all ${isOnline ? 'bg-emerald-500' : 'bg-rose-400'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${isOnline ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Hamyon</p>
                <h2 className="text-xl font-black text-gray-800">{profile.balance.toLocaleString()} <small className="text-[10px]">uzs</small></h2>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Reyting</p>
                <div className="flex items-center text-amber-500">
                  <span className="font-black text-xl mr-1">{profile.rating}</span>
                  <i className="fas fa-star text-[10px]"></i>
                </div>
              </div>
            </div>

            {/* Orders Section Preview */}
            <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-indigo-200 shadow-xl text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <h3 className="text-lg font-black mb-1">Aktiv Buyurtmalar</h3>
              <p className="text-xs text-indigo-100 mb-4">{orders.length} ta yetkazilmoqda</p>
              <button 
                onClick={() => setActiveTab('orders')}
                className="bg-white text-indigo-600 font-black text-[10px] px-6 py-2 rounded-full uppercase tracking-widest shadow-lg"
              >
                Ko'rish
              </button>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-gray-800">Buyurtmalar</h2>
            {orders.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <i className="fas fa-box-open text-3xl"></i>
                </div>
                <p className="text-gray-400 font-bold">Hozircha buyurtmalar yo'q</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">#{order.id.substring(0,8)}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 text-lg">{order.customer_name}</h4>
                    <p className="text-xs text-gray-500 flex items-start mt-1">
                      <i className="fas fa-map-marker-alt text-rose-500 mr-2 mt-0.5"></i>
                      {order.address}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">To'lov: {order.delivery_cost.toLocaleString()} uzs</div>
                    <button className="bg-gray-900 text-white font-black text-[10px] px-5 py-2 rounded-xl shadow-lg">DETALLLAR</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
               <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                  <i className="fas fa-user-ninja text-4xl"></i>
               </div>
               <h2 className="text-xl font-black text-gray-800">{profile.full_name}</h2>
               <p className="text-xs text-gray-400 font-bold">{profile.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                <i className="fas fa-truck text-blue-500"></i>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Transport</p>
                  <p className="text-sm font-black text-gray-800">{profile.transport_type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                <i className="fas fa-home text-orange-500"></i>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Manzil</p>
                  <p className="text-sm font-black text-gray-800">{profile.address || 'Kiritilmagan'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around p-3 z-30 shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 px-6 rounded-2xl transition-all ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <i className="fas fa-bolt text-lg"></i>
          <span className="text-[9px] font-black mt-1">HOME</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center p-2 px-6 rounded-2xl transition-all ${activeTab === 'orders' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <i className="fas fa-box text-lg"></i>
          <span className="text-[9px] font-black mt-1">ORDERS</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 px-6 rounded-2xl transition-all ${activeTab === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <i className="fas fa-user text-lg"></i>
          <span className="text-[9px] font-black mt-1">PROFILE</span>
        </button>
      </nav>
    </div>
  );
};

export default CourierDashboard;
