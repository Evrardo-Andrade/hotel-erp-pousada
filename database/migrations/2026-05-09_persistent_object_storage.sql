ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS image_storage_key TEXT;

ALTER TABLE guest_documents
  ADD COLUMN IF NOT EXISTS storage_key TEXT,
  ADD COLUMN IF NOT EXISTS bucket_name TEXT;