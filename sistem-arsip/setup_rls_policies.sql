-- Setup RLS Policies untuk Sistem Arsip Digital
-- Jalankan script ini di Supabase SQL Editor setelah mengaktifkan RLS

-- 1. Enable RLS pada tabel arsip (jika belum aktif)
ALTER TABLE arsip ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS pada tabel klasifikasi (jika belum aktif)
ALTER TABLE klasifikasi ENABLE ROW LEVEL SECURITY;

-- 3. Buat policy untuk tabel arsip - izinkan semua operasi untuk semua user
-- Policy untuk SELECT (membaca data)
CREATE POLICY "Allow public read access on arsip" ON arsip
    FOR SELECT
    USING (true);

-- Policy untuk INSERT (menambah data)
CREATE POLICY "Allow public insert access on arsip" ON arsip
    FOR INSERT
    WITH CHECK (true);

-- Policy untuk UPDATE (mengubah data)
CREATE POLICY "Allow public update access on arsip" ON arsip
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy untuk DELETE (menghapus data)
CREATE POLICY "Allow public delete access on arsip" ON arsip
    FOR DELETE
    USING (true);

-- 4. Buat policy untuk tabel klasifikasi - izinkan semua operasi untuk semua user
-- Policy untuk SELECT (membaca data)
CREATE POLICY "Allow public read access on klasifikasi" ON klasifikasi
    FOR SELECT
    USING (true);

-- Policy untuk INSERT (menambah data)
CREATE POLICY "Allow public insert access on klasifikasi" ON klasifikasi
    FOR INSERT
    WITH CHECK (true);

-- Policy untuk UPDATE (mengubah data)
CREATE POLICY "Allow public update access on klasifikasi" ON klasifikasi
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy untuk DELETE (menghapus data)
CREATE POLICY "Allow public delete access on klasifikasi" ON klasifikasi
    FOR DELETE
    USING (true);

-- 5. Verifikasi bahwa policies telah dibuat
-- Jalankan query ini untuk memeriksa policies yang aktif:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('arsip', 'klasifikasi');

-- CATATAN KEAMANAN:
-- Policy di atas memberikan akses penuh kepada semua user (termasuk anonymous users)
-- Untuk aplikasi production, pertimbangkan untuk:
-- 1. Membuat sistem autentikasi yang lebih ketat
-- 2. Membatasi akses berdasarkan role user
-- 3. Menambahkan validasi data yang lebih ketat

-- Contoh policy yang lebih ketat (opsional):
-- CREATE POLICY "Authenticated users only" ON arsip
--     FOR ALL
--     USING (auth.role() = 'authenticated');