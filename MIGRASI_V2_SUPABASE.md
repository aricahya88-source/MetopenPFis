# Checklist Migrasi METOPEN PFIS v1 → v2 Supabase

## A. Sebelum mengganti backend

1. Backup repository lama.
2. Backup Google Spreadsheet database lama.
3. Unduh spreadsheet asli sebagai `.xlsx`.
4. Catat nilai **PIN_PEPPER** dari Script Properties Apps Script lama.
5. Catat `ROOT_FOLDER_ID` Google Drive yang akan tetap dipakai untuk file.

## B. Supabase

1. Buat project Supabase.
2. Jalankan `supabase/schema.sql`.
3. Bila instalasi baru tanpa data lama, jalankan `supabase/seed.sql`.
4. Ambil `Project URL` dan `service_role key` dari project settings.

## C. Environment Next.js / Vercel

Isi:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SESSION_SECRET`
- `PIN_PEPPER` (nilai lama jika migrasi)
- `APPS_SCRIPT_URL`
- `APPS_SCRIPT_UPLOAD_SECRET`

## D. Migrasi data lama

```bash
npm install
npm run migrate:supabase -- /path/database-lama.xlsx
```

Setelah selesai, cek tabel `users`, `weeks`, `activities`, `submissions`, `grades`, dan `rubrics` di Supabase Table Editor.

## E. Apps Script upload-only

1. Buat/bersihkan project Apps Script upload.
2. Salin **hanya** isi folder `apps-script/` v2.
3. Isi `ROOT_FOLDER_ID` di `apps-script/Config.gs`.
4. Jalankan `setupUploadBridge()`.
5. Salin secret hasil log ke `APPS_SCRIPT_UPLOAD_SECRET`.
6. Deploy sebagai Web App dan isi URL `/exec` ke `APPS_SCRIPT_URL`.
7. Upload file >1,25 MB otomatis menggunakan mekanisme chunk; tidak perlu pengaturan tambahan.

> Folder `apps-script-legacy/` jangan dideploy. Folder itu hanya referensi backend v1.

## F. Verifikasi fungsional

1. Login admin dan mahasiswa lama menggunakan PIN lama.
2. Pastikan 16 pertemuan dan materi muncul.
3. Buka Tugas 1 dan pastikan ada tepat 5 slot artikel.
4. Uji satu URL artikel dan satu PDF artikel.
5. Submit Tugas 1 dan cek `submissions` + `submission_articles` di Supabase.
6. Login mahasiswa lain dan buka **Karya Mahasiswa**; pastikan proyek dan artikel dapat dilihat.
7. Pastikan nilai/feedback dosen tidak muncul di Karya Mahasiswa.
8. Uji Tugas 5 upload proposal PDF.
9. Uji Gradebook dan backup XLSX admin.
