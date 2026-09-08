# METOPEN PFIS LMS v1.0.1

LMS/PWA untuk mata kuliah **Metode Penelitian Pendidikan Fisika (PFS115036, 3 SKS, Semester 5)**. Struktur pembelajaran mengikuti RPS OBE Dr. Ika Kartika, M.Pd.Si, sedangkan lima tugas produk dan rubrik mengikuti dokumen kisi-kisi tugas 2026.

## Fitur utama

- Next.js + React + TypeScript, responsif dan installable sebagai PWA.
- Google Apps Script sebagai backend, Google Sheets sebagai database, Google Drive untuk file submission.
- Login NIM/email + PIN; role mahasiswa, dosen, admin.
- 16 pertemuan dengan **1 unit materi inti per pertemuan**.
- 3 CPMK asli dari RPS.
- 5 tugas produk: analisis isu, analisis GAP/SOTA & artikel, rancangan desain penelitian, pengembangan instrumen, proposal BAB I–III.
- Rubrik 1–4 untuk lima tugas; dosen dapat menilai langsung dari Gradebook.
- Seluruh rubrik Tugas 1–5 kini memiliki total bobot **100%**. Khusus Tugas 3, bobot Rencana Analisis Data disesuaikan menjadi 25%.
- Submission versi/revisi, URL Drive, unggah file kecil, komentar dosen tanpa harus memberi nilai.
- Forum diskusi terarah dengan reply/thread dan penilaian opsional.
- Gradebook skala 0–100, feedback, published/unpublished, import/export Excel.
- Import mahasiswa Excel, pengumuman, activity log, backup/restore database multi-sheet.
- Materi dan instruksi aktivitas dapat diedit WYSIWYG.
- RPS DOCX dan kisi-kisi tugas PDF terintegrasi di LMS.
- Branding hijau–oranye–abu-abu dengan logo METOPEN PFIS.

## Sumber kurikulum yang ditanamkan

RPS menetapkan mata kuliah 3 SKS, semester 5, 3 CPMK dan rangkaian pertemuan mulai metode ilmiah, isu penelitian, pendekatan/jenis, variabel-sampling, hipotesis, kualitatif, kuantitatif, R&D, PTK, analisis data, analisis jurnal, proposal, UTS/UAS. LMS tidak menambahkan materi di luar kerangka tersebut sebagai materi wajib.

Dokumen tugas menetapkan lima produk dan rubrik. Pada sumber, Tugas 3 berjumlah 90%; atas keputusan dosen, rubrik LMS disesuaikan menjadi **20+25+15+15+25 = 100%** dengan menaikkan bobot **Rencana Analisis Data** menjadi 25%. Dokumen sumber tetap tidak diubah.

## Struktur folder

- `src/app` — halaman mahasiswa dan admin.
- `src/lib/courseConfig.ts` — 16 pertemuan, CPL/CPMK, dan lima tugas.
- `src/lib/taskRubrics.ts` — rubrik lima tugas.
- `apps-script/` — backend GAS lengkap dan fungsi setup.
- `public/rps/` — RPS sumber.
- `public/tugas/` — kisi-kisi tugas/rubrik sumber.
- `docs/` — arsitektur, data model, learning flow, dan catatan validasi.

## Instalasi singkat

1. Buat satu Google Spreadsheet dan satu folder Google Drive khusus METOPEN PFIS.
2. Buat project Google Apps Script dan salin seluruh file `apps-script/`.
3. Isi `SPREADSHEET_ID` dan `ROOT_FOLDER_ID` pada `apps-script/StorageConfig.gs` (fungsi setup akan menyalinnya ke Script Properties).
4. Jalankan `setupLms()` sekali dari editor Apps Script. Catat PIN admin yang muncul di log.
5. Deploy Apps Script sebagai Web App.
6. Isi `APPS_SCRIPT_URL` pada `.env.local` atau Environment Variables Vercel.
7. Jalankan `npm install`, `npm run lint:content`, `npm run build`.
8. Deploy frontend ke Vercel.

Panduan detail: `PETUNJUK_PEMASANGAN.md`.

Jika LMS v1.0.0 sudah pernah dipasang, jalankan `upgradeTask3RubricTo100()` satu kali di Apps Script untuk memperbarui Rubrik Tugas 3 tanpa menghapus data mahasiswa/submission/nilai.

## Keamanan

URL Apps Script berada di environment server/Vercel. Spreadsheet ID dan Drive Folder ID hanya disimpan pada Script Properties Apps Script. PIN disimpan sebagai hash+salt, bukan plaintext.
