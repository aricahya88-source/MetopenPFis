# METOPEN PFIS LMS v2.0.0 — Supabase Edition

LMS/PWA untuk mata kuliah **Metode Penelitian Pendidikan Fisika (PFS115036, 3 SKS, Semester 5)**. Versi 2.0 memindahkan database akademik dari Google Sheets/Apps Script ke **Supabase PostgreSQL**. Google Apps Script tetap dipakai khusus sebagai jembatan unggah file ke Google Drive.

## Perubahan utama v2.0

- **Supabase/PostgreSQL** menjadi database utama untuk pengguna, pertemuan, materi, aktivitas, diskusi, submission, rubrik, nilai, pengumuman, dan log.
- Browser tidak menerima `SUPABASE_SERVICE_ROLE_KEY`; seluruh akses database lewat **Next.js `/api/lms`**.
- **Google Apps Script bukan database lagi**. Folder `apps-script/` hanya menangani upload file ke Google Drive dan dilindungi `UPLOAD_BRIDGE_SECRET`. File sampai 5 MB dipecah menjadi chunk kecil saat melewati route server agar upload tetap stabil di hosting serverless.
- Tugas 1 — Analisis Isu menyediakan **5 slot sumber artikel tetap**. Setiap slot dapat berisi URL artikel/DOI, PDF, atau keduanya. Metadata artikel disimpan di tabel `submission_articles`; file PDF tetap di Drive.
- Menu **Karya Mahasiswa** menampilkan submission terbaru Tugas 1–5 milik seluruh mahasiswa yang sudah login. Isi proyek, link, file, serta 5 artikel Tugas 1 dapat dibuka oleh mahasiswa lain untuk peer learning.
- **Nilai, rubrik skor, dan feedback dosen tetap privat**; tidak ditampilkan pada galeri Karya Mahasiswa.
- Submission tetap mendukung versi/revisi.
- Login lama NIM/email + PIN dipertahankan. Hash PIN lama dapat dimigrasikan tanpa reset selama `PIN_PEPPER` lama ikut dipindahkan.

## Arsitektur

```text
Browser / PWA
    |
    +--> Next.js /api/lms --------> Supabase PostgreSQL
    |         (service role server-only)
    |
    +--> Next.js /api/gas --------> Google Apps Script upload-only
                                      |
                                      +--> Google Drive
```

## Struktur penting

- `src/app/api/lms/route.ts` — API LMS berbasis Supabase.
- `src/lib/server/supabase.ts` — PostgREST server-side.
- `src/lib/server/session.ts` — login/PIN/session server-side.
- `src/app/projects/` — Karya Mahasiswa.
- `src/app/tasks/[id]/page.tsx` — termasuk 5 input artikel pada Tugas 1.
- `supabase/schema.sql` — schema PostgreSQL.
- `tools/migrate-xlsx-to-supabase.mjs` — migrasi spreadsheet lama ke Supabase.
- `tools/create-admin.mjs` — membuat/reset admin instalasi baru.
- `apps-script/` — Apps Script upload-only.
- `apps-script-legacy/` — backend Google Sheets lama, **referensi migrasi saja dan tidak dipakai runtime v2.0**.

## Instalasi singkat

1. Buat project Supabase dan jalankan `supabase/schema.sql` di SQL Editor. Untuk instalasi baru, lanjutkan dengan `supabase/seed.sql` agar 16 pertemuan, materi, aktivitas, diskusi, dan rubrik langsung tersedia.
2. Isi environment variable dari `.env.example`.
3. Untuk upgrade instalasi lama, unduh **Google Spreadsheet database asli** sebagai XLSX lalu jalankan:
   ```bash
   npm run migrate:supabase -- /path/ke/database-lama.xlsx
   ```
   Gunakan file spreadsheet asli karena sheet `USERS` harus membawa `pin_salt` dan `pin_hash`.
4. Salin nilai `PIN_PEPPER` dari Script Properties backend Apps Script lama ke environment Vercel/Next.js. Ini membuat PIN mahasiswa lama tetap berlaku.
5. Deploy folder `apps-script/` sebagai Apps Script Web App. Jalankan `setupUploadBridge()` sekali untuk membuat secret upload.
6. Isi `APPS_SCRIPT_URL` dan `APPS_SCRIPT_UPLOAD_SECRET` pada environment frontend.
7. Jalankan `npm install`, `npm run lint:content`, dan `npm run build`, lalu deploy ke Vercel.

Untuk instalasi Supabase baru tanpa database lama, setelah schema dibuat jalankan:

```bash
npm run create:admin -- --nim ADMIN --name "Administrator" --pin 123456
```

Panduan lengkap ada di `PETUNJUK_PEMASANGAN.md`.

## Keamanan

`SUPABASE_SERVICE_ROLE_KEY`, `APP_SESSION_SECRET`, `PIN_PEPPER`, dan `APPS_SCRIPT_UPLOAD_SECRET` hanya boleh berada di environment server. RLS diaktifkan pada seluruh tabel dan browser tidak diberi policy akses langsung. Karya mahasiswa dibuka melalui API aplikasi untuk pengguna yang sudah login, bukan sebagai tabel Supabase publik.
