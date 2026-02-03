
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Profile, Order } from '../types';
import { CONFIG } from '../constants';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const Dashboard: React.FC = () => {
  const [couriers, setCouriers] = useState<Profile[]>([]);
  const [pendingCouriers, setPendingCouriers] = useState<Profile[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // 1. Tasdiqlangan kurerlar
    const { data: approved } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', true)
      .eq('role', 'courier');
    
    // 2. Tasdiqlanmagan kurerlar
    const { data: pending } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', false)
      .eq('role', 'courier');

    // 3. Faol buyurtmalar
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'delivered')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (approved) setCouriers(approved);
    if (pending) setPendingCouriers(pending);
    if (orders) setActiveOrders(orders);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    // Real-time updates for profiles
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', table: 'profiles' }, () => fetchData())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const approveCourier = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', id);
    
    if (error) alert("Xatolik: " + error.message);
    else fetchData();
  };

  const deleteCourier = async (id: string) => {
    if (window.confirm("Haqiqatdan ham ushbu kurer so'rovini o'chirmoqchimisiz?")) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) alert("Xatolik: " + error.message);
      else fetchData();
    }
  };

  if (loading && couriers.length === 0) {
    return <div className="p-10 text-center text-gray-500 animate-pulse font-black uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* 1. Tasdiqlash kutilayotgan kurerlar (PENDING APPROVALS) */}
      {pendingCouriers.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-amber-100/50">
          <div className="p-6 border-b border-amber-200 flex justify-between items-center bg-amber-100/50">
            <h2 className="font-black text-amber-800 flex items-center text-lg">
              <i className="fas fa-user-clock mr-3"></i> TASDIQLASH KUTILMOQDA ({pendingCouriers.length})
            </h2>
            <span className="bg-amber-500 text-white text-[10px] px-3 py-1 rounded-full font-black animate-bounce uppercase">Yangi so'rovlar</span>
          </div>
          <div className="divide-y divide-amber-200">
            {pendingCouriers.map(courier => (
              <div key={courier.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-amber-100/20 transition-colors">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                    <i className="fas fa-user-ninja text-xl"></i>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{courier.full_name}</p>
                    <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">{courier.transport_type} • {courier.phone || 'Tel kiritilmagan'}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">{courier.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2 w-full md:w-auto">
                  <button 
                    onClick={() => approveCourier(courier.id)}
                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 uppercase tracking-widest transition-all active:scale-95"
                  >
                    Tasdiqlash
                  </button>
                  <button 
                    onClick={() => deleteCourier(courier.id)}
                    className="flex-1 md:flex-none bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-black text-[10px] px-6 py-3 rounded-xl uppercase tracking-widest transition-all"
                  >
                    Rad etish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
            <i className="fas fa-users text-2xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faol kurerlar</p>
            <p className="text-3xl font-black text-gray-800">{couriers.filter(c => c.active_status).length}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
            <i className="fas fa-box text-2xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jarayonda</p>
            <p className="text-3xl font-black text-gray-800">{activeOrders.length}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
            <i className="fas fa-star text-2xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jami kurerlar</p>
            <p className="text-3xl font-black text-gray-800">{couriers.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courier List */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-black text-gray-800 flex items-center">
              <i className="fas fa-id-badge mr-3 text-blue-500"></i> TASDIQLANGAN KURERLAR
            </h2>
            <button className="text-blue-600 font-bold text-xs hover:underline uppercase tracking-widest">Barchasi</button>
          </div>
          <div className="divide-y divide-gray-50">
            {couriers.length === 0 ? (
              <p className="p-10 text-center text-gray-400 text-sm">Hali tasdiqlangan kurerlar yo'q.</p>
            ) : (
              couriers.map(courier => (
                <div key={courier.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${courier.active_status ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-gray-300'}`}></div>
                    <div>
                      <p className="font-black text-gray-800">{courier.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{courier.transport_type} • ID: {courier.telegram_id || 'Ulanmagan'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">{courier.balance.toLocaleString()} uzs</p>
                    <p className="text-[10px] text-amber-500 font-black">⭐ {courier.rating}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-black text-gray-800 flex items-center">
              <i className="fas fa-shopping-basket mr-3 text-orange-500"></i> FAOL BUYURTMALAR
            </h2>
            <span className="bg-orange-100 text-orange-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">LIVE</span>
          </div>
          <div className="p-6 space-y-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <i className="fas fa-inbox text-5xl mb-4 text-gray-100"></i>
                <p className="font-bold uppercase tracking-widest text-xs">Hozircha faol buyurtmalar yo'q</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="border border-blue-50 rounded-[2rem] p-5 bg-blue-50/30 hover:bg-blue-50/50 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase">#{order.id.substring(0,8)}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-black text-gray-800 text-lg">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1"><i className="fas fa-map-marker-alt text-rose-400 mr-2"></i> {order.address}</p>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-blue-100/50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] mr-2">
                        <i className="fas fa-user-ninja"></i>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Kurer: <b className="text-gray-800">{order.courier_id ? 'Biriktirilgan' : 'Kutilmoqda'}</b></span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">+{order.delivery_cost.toLocaleString()} uzs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
