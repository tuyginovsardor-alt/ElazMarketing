
-- ========================================================
-- 1. JADVALLARNI YARATISH (IDEMPOTENT)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'courier', 'staff', 'admin')),
    balance INTEGER DEFAULT 0,
    region TEXT,
    district TEXT,
    telegram_id BIGINT UNIQUE,
    link_token TEXT,
    active_status BOOLEAN DEFAULT false,
    transport_type TEXT,
    rating DECIMAL DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'dona',
    stock_qty DECIMAL DEFAULT 10,
    image_url TEXT,
    images TEXT[],
    description TEXT,
    marketing_tag TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    quantity DECIMAL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    courier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_price INTEGER,
    delivery_cost INTEGER DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    phone_number TEXT,
    address_text TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    comment TEXT,
    payment_method TEXT DEFAULT 'cash',
    requested_transport TEXT DEFAULT 'walking',
    rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.bot_configs (
    id SERIAL PRIMARY KEY,
    name TEXT,
    username TEXT,
    token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.banners (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    link_url TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.courier_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    transport_type TEXT,
    work_zones TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- 2. YORDAMCHI FUNKSIYALAR (REKURSIYA OLDINI OLISH)
-- ========================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 3. RLS YOQISH VA POLISYALARNI TUZATISH
-- ========================================================

-- RLS yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 1. Profiles politsiyalari
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. Products
DROP POLICY IF EXISTS "Products public select" ON public.products;
CREATE POLICY "Products public select" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products admin manage" ON public.products;
CREATE POLICY "Products admin manage" ON public.products FOR ALL USING (public.is_admin());

-- 3. Cart & Favorites
DROP POLICY IF EXISTS "Cart owner access" ON public.cart_items;
CREATE POLICY "Cart owner access" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Favorites owner access" ON public.favorites;
CREATE POLICY "Favorites owner access" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- 4. Orders
DROP POLICY IF EXISTS "Orders access" ON public.orders;
CREATE POLICY "Orders access" ON public.orders FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() = courier_id OR 
    public.is_admin()
);

-- 5. Transactions
DROP POLICY IF EXISTS "Transactions select" ON public.transactions;
CREATE POLICY "Transactions select" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 6. Settings & Banners
DROP POLICY IF EXISTS "Public select settings" ON public.app_settings;
CREATE POLICY "Public select settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage settings" ON public.app_settings;
CREATE POLICY "Admin manage settings" ON public.app_settings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Banners public select" ON public.banners;
CREATE POLICY "Banners public select" ON public.banners FOR SELECT USING (true);

-- ========================================================
-- 4. PROFILE PROTECTION TRIGGER (BALANSNI HIMOYALASH)
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_profile_protection()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Oddiy foydalanuvchi balansini va rolesini o'zi o'zgartira olmaydi
    NEW.balance := OLD.balance;
    NEW.role := OLD.role;
    NEW.id := OLD.id;
    NEW.email := OLD.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profile_protection ON public.profiles;
CREATE TRIGGER trigger_profile_protection
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_protection();
