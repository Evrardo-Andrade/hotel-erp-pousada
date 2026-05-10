ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS image_storage_key TEXT;

ALTER TABLE guest_documents
  ADD COLUMN IF NOT EXISTS storage_key TEXT,
  ADD COLUMN IF NOT EXISTS bucket_name TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-documents', 'guest-documents', false)
ON CONFLICT (id) DO NOTHING;
