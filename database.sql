
-- Profiles jadvalidagi transport_type uchun cheklovni yangilash yoki shunchaki tekst sifatida qoldirish
-- Agar oldin constraint bo'lsa, uni drop qilib yangisini qo'shamiz
DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_transport_type_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_transport_type_check 
    CHECK (transport_type IN ('walking', 'bicycle', 'car', 'mixed', 'Piyoda', 'Velosiped', 'Mashina', 'Aralash'));
END $$;
