# Panduan Setup RLS (Row Level Security) Supabase

## Masalah: Data Tidak Terdeteksi Setelah Mengaktifkan RLS

Setelah mengaktifkan RLS di Supabase, data tidak muncul karena belum ada **policy** yang mengizinkan akses ke tabel. RLS memblokir semua akses secara default sampai ada policy yang eksplisit mengizinkan.

## Solusi: Jalankan Script RLS Policies

### Langkah 1: Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka menu **SQL Editor** di sidebar kiri

### Langkah 2: Jalankan Script Setup
1. Buka file `setup_rls_policies.sql` yang telah dibuat
2. Copy seluruh isi file tersebut
3. Paste ke SQL Editor di Supabase
4. Klik **Run** untuk menjalankan script

### Langkah 3: Verifikasi Setup
Setelah menjalankan script, jalankan query berikut untuk memverifikasi:

```sql
-- Cek apakah RLS sudah aktif
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('arsip', 'klasifikasi');

-- Cek policies yang sudah dibuat
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename IN ('arsip', 'klasifikasi');
```

## Struktur Database yang Diperlukan

### Tabel `arsip`
```sql
CREATE TABLE IF NOT EXISTS arsip (
    id SERIAL PRIMARY KEY,
    nomorSurat VARCHAR(255),
    tanggalSurat DATE,
    pengirim VARCHAR(255),
    tujuanSurat VARCHAR(255),
    perihal TEXT,
    kodeKlasifikasi VARCHAR(50),
    filePath VARCHAR(500),
    fileName VARCHAR(255),
    tanggalRetensi DATE,
    googleDriveLink TEXT,
    googleDriveFileId VARCHAR(255),
    googleDriveViewLink TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel `klasifikasi`
```sql
CREATE TABLE IF NOT EXISTS klasifikasi (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    deskripsi TEXT NOT NULL,
    retensiAktif INTEGER DEFAULT 5,
    retensiInaktif INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### 1. Error "permission denied for table"
**Penyebab:** RLS aktif tapi belum ada policy
**Solusi:** Jalankan script `setup_rls_policies.sql`

### 2. Data masih tidak muncul setelah setup policy
**Penyebab:** Mungkin ada error di aplikasi atau koneksi database
**Solusi:** 
- Cek console browser untuk error JavaScript
- Pastikan environment variables (.env) sudah benar
- Restart development server (`npm run dev`)

### 3. Error "relation does not exist"
**Penyebab:** Tabel belum dibuat
**Solusi:** Buat tabel menggunakan SQL di atas

### 4. Ingin keamanan yang lebih ketat
**Solusi:** Ganti policy dengan yang lebih restrictive:

```sql
-- Hapus policy lama
DROP POLICY IF EXISTS "Allow public read access on arsip" ON arsip;

-- Buat policy baru untuk authenticated users saja
CREATE POLICY "Authenticated users only" ON arsip
    FOR ALL
    USING (auth.role() = 'authenticated');
```

## Catatan Keamanan

⚠️ **PENTING:** Policy yang dibuat memberikan akses penuh kepada semua user (termasuk anonymous users). Ini cocok untuk development dan aplikasi internal.

Untuk aplikasi production, pertimbangkan:
1. Implementasi sistem autentikasi
2. Pembatasan akses berdasarkan role
3. Validasi data yang lebih ketat
4. Audit logging

## Bantuan Lebih Lanjut

Jika masih mengalami masalah:
1. Cek [Dokumentasi RLS Supabase](https://supabase.com/docs/guides/auth/row-level-security)
2. Periksa logs di Supabase Dashboard > Logs
3. Gunakan browser developer tools untuk debug JavaScript errors