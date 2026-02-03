
import React, { useState } from 'react';
import { ZONE_OPTIONS } from '../constants';

const OrderSimulator: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setLog([]);
    addLog("Yangi buyurtma (ORD-9921) yaratildi...");
    
    setTimeout(() => {
      addLog("Supabase: Holati 'confirmed' bo'lgan buyurtma aniqlandi.");
    }, 1000);

    setTimeout(() => {
      addLog("Filtrlash: 'Guliston shahri' dagi Onlayn kurerlar qidirilmoqda...");
    }, 2000);

    setTimeout(() => {
      addLog("Topildi: 3 ta mos kurer aniqlandi.");
    }, 3000);

    setTimeout(() => {
      addLog("Masofani hisoblash: Haversine formulasi qo'llanilmoqda...");
    }, 4000);

    setTimeout(() => {
      addLog("Push-bildirishnoma: Eng yaqin kurerga (Jasur A.) yuborildi ✅");
      setIsSimulating(false);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Dispatcher Simulyatori</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ushbu bo'limda kurerlarni buyurtmalarga avtomatik biriktirish logikasini test qilishingiz mumkin.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="p-4 border border-dashed border-gray-300 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buyurtma hududi</label>
              <select className="w-full p-2 border rounded-md bg-gray-50">
                {ZONE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            
            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all ${isSimulating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95'}`}
            >
              {isSimulating ? (
                <><i className="fas fa-circle-notch animate-spin mr-2"></i> Simulyatsiya qilinmoqda...</>
              ) : (
                <><i className="fas fa-play mr-2"></i> Test buyurtmani boshlash</>
              )}
            </button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto border-2 border-gray-800 shadow-inner">
            <div className="mb-2 text-gray-500 border-b border-gray-800 pb-1">System Logs:</div>
            {log.length === 0 && <div className="text-gray-600 italic">Boshlash tugmasini bosing...</div>}
            {log.map((line, i) => (
              <div key={i} className="mb-1">{line}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center">
          <i className="fas fa-info-circle mr-2"></i> Ishlash prinsipi
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Yangi buyurtma tushganda uning koordinatalari va hududi aniqlanadi.</li>
          <li>2. Supabase'dan shu hududga mas'ul va 🟢 'Ishlamoqdaman' holatidagi kurerlar filtrlanadi.</li>
          <li>3. Masofa <code className="bg-blue-100 px-1 font-bold">Haversine</code> formulasi bo'yicha hisoblanadi.</li>
          <li>4. Eng yaqin kurerga Telegram orqali bildirishnoma va ✅ Qabul qilish tugmasi yuboriladi.</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderSimulator;
