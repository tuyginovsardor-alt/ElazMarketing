
-- 1. Kuryerlik arizalari uchun jadval
CREATE TABLE IF NOT EXISTS public.courier_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    transport_type TEXT NOT NULL,
    phone TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Bot sessiyalarini bazada kesh qilish (Cookie o'rniga)
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    chat_id BIGINT PRIMARY KEY,
    step TEXT DEFAULT 'start',
    session_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS Politsiyalari
ALTER TABLE public.courier_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all applications" ON public.courier_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
);

CREATE POLICY "Users can create their own application" ON public.courier_applications FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- 4. Funksiya: Masofani hisoblash (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT) 
RETURNS FLOAT AS $$
DECLARE 
    R FLOAT := 6371; -- Yer radiusi (km)
    dlat FLOAT;
    dlon FLOAT;
    a FLOAT;
    c FLOAT;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;
