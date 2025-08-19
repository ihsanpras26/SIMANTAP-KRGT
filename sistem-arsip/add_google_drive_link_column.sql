-- Menambahkan kolom googleDriveLink ke tabel arsip
ALTER TABLE arsip ADD COLUMN IF NOT EXISTS googleDriveLink TEXT;

-- Menambahkan komentar untuk kolom baru
COMMENT ON COLUMN arsip.googleDriveLink IS 'Link Google Drive untuk dokumen scan arsip';

-- Update existing records (optional - set to NULL by default)
-- UPDATE arsip SET googleDriveLink = NULL WHERE googleDriveLink IS NULL;