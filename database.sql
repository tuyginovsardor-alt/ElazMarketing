
-- 1. Orders jadvali uchun RLSni tozalash va qayta yoqish
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can view unassigned orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Couriers can update unassigned orders" ON public.orders;

-- 2. Mijoz faqat o'z buyurtmalarini ko'radi
CREATE POLICY "Users can view own orders" ON public.orders 
FOR SELECT USING (auth.uid() = user_id);

-- 3. KURERLAR UCHUN MAXSUS: 
-- a) Hali kurer biriktirilmagan (null) va statusi 'pending'/'confirmed' bo'lganlarni HAMMA kurer ko'ra oladi
-- b) O'zi qabul qilgan buyurtmalarni ko'ra oladi
CREATE POLICY "Couriers can view available orders" ON public.orders
FOR SELECT USING (
  (courier_id IS NULL AND status IN ('pending', 'confirmed', 'awaiting_payment')) 
  OR 
  (auth.uid() = courier_id)
);

-- 4. Kurer buyurtmani qabul qilishi (update) uchun ruxsat
CREATE POLICY "Couriers can accept available orders" ON public.orders
FOR UPDATE USING (
  (courier_id IS NULL AND status IN ('pending', 'confirmed'))
  OR
  (auth.uid() = courier_id)
)
WITH CHECK (
  (courier_id IS NULL OR auth.uid() = courier_id)
);

-- 5. Profiles jadvali uchun SELECT ruxsati (kurerlar mijoz ismini ko'rishi uchun)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);
