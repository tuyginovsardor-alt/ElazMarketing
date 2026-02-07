
-- Profiles jadvaliga yangi ustunlar qo'shish
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_token TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_token_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transport_type TEXT DEFAULT 'walking';

-- Orders jadvaliga kerakli ustunlarni qo'shish
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS requested_transport TEXT DEFAULT 'walking';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Kuryerlik arizalari uchun jadval
CREATE TABLE IF NOT EXISTS public.courier_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    transport_type TEXT DEFAULT 'walking',
    phone TEXT,
    work_zones TEXT[],
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Schema keshini yangilash haqida xabar
NOTIFY pgrst, 'reload schema';
