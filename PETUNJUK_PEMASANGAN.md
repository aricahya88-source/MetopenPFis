# Petunjuk Pemasangan METOPEN PFIS LMS v2.0.0

## 1. Kebutuhan

- Node.js 20+
- akun Supabase
- akun Google + satu folder Google Drive khusus file LMS
- project Google Apps Script untuk upload
- Vercel atau hosting Next.js lain

## 2. Buat database Supabase

Buat project Supabase, buka **SQL Editor**, lalu jalankan seluruh isi:

`supabase/schema.sql`

Schema membuat tabel pengguna, pertemuan, materi, aktivitas, submission, `submission_articles`, rubrik, nilai, diskusi, pengumuman, dan tabel kompatibilitas data lama. RLS diaktifkan. Runtime LMS mengakses database dari server Next.js menggunakan service-role key.

**Instalasi baru:** setelah schema, jalankan `supabase/seed.sql`. File ini melakukan upsert 16 pertemuan, 16 materi inti, Tugas 1–5, UTS/UAS, empat diskusi, dan lima rubrik. Jika Anda melakukan migrasi database lama yang sudah berisi seed tersebut, `seed.sql` tidak wajib dijalankan.

## 3. Environment frontend/server

Salin `.env.example` menjadi `.env.local` dan isi:

```env
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
APP_SESSION_SECRET=buat-random-panjang-minimal-24-karakter
PIN_PEPPER=...
APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
APPS_SCRIPT_UPLOAD_SECRET=...
```

Jangan pernah menambahkan `NEXT_PUBLIC_` pada service-role key, PIN pepper, atau upload secret.

## 4. Migrasi database Google Sheets lama

Jika LMS lama sudah berisi mahasiswa/submission/nilai:

1. Buka **Google Spreadsheet database asli** yang sebelumnya dipakai Apps Script.
2. Unduh sebagai **Microsoft Excel (.xlsx)**.
3. Pastikan sheet `USERS` memuat `pin_salt` dan `pin_hash`.
4. Ambil `PIN_PEPPER` dari **Apps Script lama → Project Settings → Script Properties** dan gunakan nilai yang sama di environment baru.
5. Jalankan:

```bash
npm install
npm run migrate:supabase -- /path/database-lama.xlsx
```

Tool migrasi mengimpor tabel dalam urutan dependency dan melakukan upsert sehingga dapat dijalankan ulang bila perlu. Jangan memakai file backup lama yang sengaja mengosongkan hash PIN untuk migrasi login.

## 5. Admin instalasi baru

Jika tidak melakukan migrasi dan belum ada admin:

```bash
npm run create:admin -- --nim ADMIN --name "Administrator METOPEN PFIS" --pin 123456
```

Parameter `--pin` boleh dihilangkan; tool akan menghasilkan PIN enam digit dan menampilkannya sekali di terminal.

## 6. Google Apps Script upload-only

Versi v2.0 tidak lagi memakai Apps Script untuk database. Salin hanya isi folder **`apps-script/`** ke project Apps Script baru.

Di `apps-script/Config.gs`, isi `ROOT_FOLDER_ID` dengan folder Google Drive tujuan. Lalu:

1. Jalankan `setupUploadBridge()` dari editor Apps Script.
2. Salin secret yang dicetak pada log; secret juga disimpan sebagai Script Property `UPLOAD_BRIDGE_SECRET`.
3. Deploy → New deployment → Web app.
4. Isi URL deployment sebagai `APPS_SCRIPT_URL`.
5. Isi secret yang sama sebagai `APPS_SCRIPT_UPLOAD_SECRET` di Vercel/Next.js.

Alur upload adalah: browser → `/api/gas` → validasi session Supabase → Apps Script → Google Drive. Apps Script tidak memiliki kredensial Supabase. Untuk file yang lebih besar dari sekitar 1,25 MB, frontend otomatis mengirim beberapa chunk kecil lalu Apps Script merakitnya kembali; batas file akhir tetap 5 MB.

## 7. Tugas 1 — lima artikel

Pada **Tugas 1 — Analisis Isu**, mahasiswa melihat lima slot sumber:

- Artikel 1
- Artikel 2
- Artikel 3
- Artikel 4
- Artikel 5

Setiap slot harus memiliki **link HTTP/HTTPS atau PDF yang berhasil diunggah**. PDF maksimal 5 MB per file. File disimpan di Google Drive; URL/file metadata disimpan di `submission_articles` dan melekat pada versi submission yang bersangkutan.

## 8. Karya Mahasiswa

Menu **Karya Mahasiswa** hanya dapat dibuka setelah login. Menu ini menampilkan submission terbaru Tugas 1–5 seluruh mahasiswa, termasuk:

- nama dan kelas penulis,
- isi proyek,
- URL/file proyek,
- lima sumber artikel untuk Tugas 1.

Yang **tidak** ditampilkan kepada mahasiswa lain: NIM, email, nilai, skor rubrik, dan feedback dosen.

## 9. Build dan deploy

```bash
npm install
npm run lint:content
npm run build
```

Kemudian deploy ke Vercel dan masukkan enam environment variable yang sama.

## 10. Backup / restore

Menu Data Admin tetap dapat mengekspor database Supabase menjadi workbook multi-sheet. Kolom JSON diserialisasi sebagai JSON text agar dapat diimpor kembali. Untuk `USERS`, hash/salt PIN pada export admin sengaja dikosongkan; restore instalasi baru dapat menggunakan kolom `initial_pin` atau tool `create:admin`.

## 11. Catatan backend lama

Folder `apps-script-legacy/` disimpan hanya sebagai referensi struktur database dan migrasi. Jangan deploy folder tersebut untuk runtime v2.0.
