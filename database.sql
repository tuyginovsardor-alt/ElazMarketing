
-- Savatdagi miqdorni o'nlik son qilish (masalan 1.1 kg yoki 0.5 ltr uchun)
ALTER TABLE public.cart_items 
ALTER COLUMN quantity TYPE NUMERIC(10, 2);

-- Schema keshini yangilash
NOTIFY pgrst, 'reload schema';
