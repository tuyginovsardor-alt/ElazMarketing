
-- 1. PROFILES JADVALI UCHUN TO'LIQ OCHIQLIK (O'Z-O'ZINI BOSHQARISH)
-- Avvalgi politsiyalarni o'chiramiz
DROP POLICY IF EXISTS "Profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert" ON public.profiles;

-- Ko'rish: Har kim o'zini ko'ra oladi, adminlar hammani
CREATE POLICY "Profiles select" ON public.profiles 
FOR SELECT USING (auth.uid() = id OR public.is_authorized_system());

-- Yaratish: Yangi user o'zi uchun profil ochishi mumkin
CREATE POLICY "Profiles insert" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Yangilash: User o'zining Ismi, Familiyasi, Tel va Avatarini o'zgartira oladi
CREATE POLICY "Profiles update" ON public.profiles 
FOR UPDATE USING (auth.uid() = id OR public.is_authorized_system());

-- 2. STORAGE (RASMLAR) UCHUN POLITSALARI
-- Diqqat: ALTER TABLE storage.objects buyrug'isiz faqat politsiyalarni yozamiz
-- Agar SQL Editor-da xato bersa, buni Supabase Dashboard -> Storage -> Policies bo'limidan qo'lda qilish kerak

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING ( bucket_id = 'products' );

DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users Can Update Own Objects" ON storage.objects;
CREATE POLICY "Users Can Update Own Objects" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'products' 
  AND (auth.uid() = owner OR public.is_authorized_system())
);

-- 3. XAVFSIZLIK TRIGGERI (BALANSNI HIMOYALASH)
-- Bu trigger user o'z pulini o'zi ko'paytirishini taqiqlaydi
CREATE OR REPLACE FUNCTION public.protect_sensitive_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Agar user admin bo'lmasa va balance yoki role-ni o'zgartirmoqchi bo'lsa
  IF NOT public.is_authorized_system() THEN
    IF (OLD.balance IS DISTINCT FROM NEW.balance OR OLD.role IS DISTINCT FROM NEW.role) THEN
       -- Balans va Role o'zgarmasligi kerak, qolgan hamma narsa (ism, rasm) o'zgarishi mumkin
       NEW.balance := OLD.balance;
       NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_sensitive_profiles ON public.profiles;
CREATE TRIGGER tr_protect_sensitive_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profiles();
