ALTER TABLE public.vip_cards ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'vip';
CREATE INDEX IF NOT EXISTS idx_vip_cards_purpose ON public.vip_cards(purpose);