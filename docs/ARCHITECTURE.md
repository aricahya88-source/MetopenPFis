# Arsitektur METOPEN PFIS LMS v2.0

```text
Browser/PWA
  ├─ /api/lms → Next.js server → Supabase REST/PostgreSQL
  └─ /api/gas → Next.js server → Apps Script upload-only → Google Drive
```

## Database

Supabase PostgreSQL menyimpan semua data terstruktur LMS. `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan pada runtime server Next.js. RLS aktif dan tidak ada akses tabel langsung dari browser.

## Authentication

Login aplikasi tetap NIM/email + PIN agar data pengguna lama kompatibel. PIN disimpan sebagai SHA-256 dari `salt:pin:PIN_PEPPER`; session aplikasi ditandatangani dengan `APP_SESSION_SECRET`.

## File

Apps Script hanya menjadi bridge upload ke Google Drive. `/api/gas` terlebih dahulu memvalidasi session LMS, lalu meneruskan payload ke Apps Script menggunakan secret server-to-server. File besar dipecah menjadi chunk kecil di browser dan dirakit kembali di Apps Script; database hanya menyimpan nama, MIME type, dan URL file.

## Karya Mahasiswa

`/projects` mengambil submission terbaru Tugas 1–5 lewat `/api/lms`. Halaman detail memperlihatkan evidence proyek dan sumber artikel, tetapi tidak mengembalikan nilai atau feedback dosen.
