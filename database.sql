
-- 1. Kuryerlik arizalari uchun jadval (Yangilangan)
CREATE TABLE IF NOT EXISTS public.courier_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    transport_type TEXT,
    phone TEXT,
    work_zones TEXT[], -- Massiv ko'rinishida hududlar
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Bot sessiyalarini bazada kesh qilish
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    chat_id BIGINT PRIMARY KEY,
    step TEXT DEFAULT 'start',
    session_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS Politsiyalari
ALTER TABLE public.courier_applications ENABLE ROW LEVEL SECURITY;

-- Agar politsiyalar mavjud bo'lsa, xato bermasligi uchun tekshirib yaratamiz
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all applications') THEN
        CREATE POLICY "Admins can view all applications" ON public.courier_applications FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own application') THEN
        CREATE POLICY "Users can create their own application" ON public.courier_applications FOR INSERT WITH CHECK (
            auth.uid() = user_id
        );
    END IF;
END $$;
