
-- Profiles jadvaliga yangi ustunlar qo'shish
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_token TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_token_expires TIMESTAMP WITH TIME ZONE;

-- Kuryerlik arizalari uchun jadval (Mavjud bo'lsa tegilmaydi)
CREATE TABLE IF NOT EXISTS public.courier_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    transport_type TEXT,
    phone TEXT,
    work_zones TEXT[],
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
