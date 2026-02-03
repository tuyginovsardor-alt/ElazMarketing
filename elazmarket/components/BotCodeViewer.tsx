
import React from 'react';

const BotCodeViewer: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 p-4 text-white font-bold flex justify-between items-center">
          <span><i className="fas fa-database mr-2"></i> Supabase SQL Schema (Xavfsiz Versiya)</span>
          <span className="text-[10px] bg-indigo-500 px-2 py-1 rounded">v2.2</span>
        </div>
        <div className="p-6">
          <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-wider">
            Mavjud jadvallarga tegmagan holda, faqat yetishmayotgan qismlarni qo'shish uchun ushbu kodni SQL Editor-da ishlating:
          </p>
          <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed shadow-inner">
{`-- 1. Profiles jadvalini yaratish (agar yo'q bo'lsa)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'courier',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Yetishmayotgan ustunlarni xavfsiz qo'shish (DO block orqali)
DO $$ 
BEGIN 
    -- Profiles uchun ustunlar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='telegram_id') THEN
        ALTER TABLE public.profiles ADD COLUMN telegram_id BIGINT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_approved') THEN
        ALTER TABLE public.profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='active_status') THEN
        ALTER TABLE public.profiles ADD COLUMN active_status BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='balance') THEN
        ALTER TABLE public.profiles ADD COLUMN balance INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='rating') THEN
        ALTER TABLE public.profiles ADD COLUMN rating DECIMAL DEFAULT 5.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='transport_type') THEN
        ALTER TABLE public.profiles ADD COLUMN transport_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lat') THEN
        ALTER TABLE public.profiles ADD COLUMN lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lng') THEN
        ALTER TABLE public.profiles ADD COLUMN lng DOUBLE PRECISION;
    END IF;

    -- Orders jadvalini tekshirish
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        CREATE TABLE public.orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_name TEXT,
            address TEXT,
            district TEXT,
            items TEXT,
            delivery_cost INTEGER,
            status TEXT DEFAULT 'pending',
            courier_id UUID REFERENCES public.profiles(id),
            lat DOUBLE PRECISION,
            lng DOUBLE PRECISION,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
    END IF;
END $$;

-- 3. Row Level Security (RLS) ni yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Politsiyalarni xavfsiz yaratish
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Profiles') THEN
        CREATE POLICY "Public Access Profiles" ON public.profiles FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Orders') THEN
        CREATE POLICY "Public Access Orders" ON public.orders FOR ALL USING (true);
    END IF;
END $$;`}
          </pre>
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
            <i className="fas fa-check-circle mr-2"></i>
            <b>Xavfsiz Rejim:</b> Ushbu skript `DO $$ BEGIN ... END $$` blokidan foydalanadi. Bu shuni anglatadiki, agar ustun yoki jadval allaqachon mavjud bo'lsa, u unga tegmaydi va xatolik bermaydi. Faqat yetishmayotgan qismlarni yaratadi.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotCodeViewer;
