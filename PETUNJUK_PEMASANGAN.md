# Petunjuk Pemasangan METOPEN PFIS LMS v1.0.0

## 1. Kebutuhan
- Node.js 20+
- akun Google
- satu Google Spreadsheet kosong
- satu folder Google Drive khusus METOPEN PFIS
- project Google Apps Script
- Vercel atau hosting Next.js lain

## 2. Backend Google Apps Script
Salin seluruh file di folder `apps-script/` ke satu project Apps Script. Edit file `StorageConfig.gs` dan isi:
- `SPREADSHEET_ID` = ID spreadsheet database
- `ROOT_FOLDER_ID` = ID folder Drive utama

Lalu jalankan `setupLms()` satu kali. Fungsi setup akan memvalidasi kedua ID dan menyimpannya ke Script Properties untuk runtime. Fungsi ini membuat schema, 16 pertemuan, 16 unit materi, 5 tugas formal, UTS/UAS, forum diskusi contoh, rubrik, folder Drive, dan user admin awal.

## 3. Deploy Web App
Pilih **Deploy → New deployment → Web app**. Jalankan sebagai pemilik project dan atur akses sesuai kebijakan institusi. Salin URL deployment.

## 4. Frontend
Di root project:
```bash
npm install
cp .env.example .env.local
```
Isi:
```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```
Validasi dan build:
```bash
npm run lint:content
npm run build
```

## 5. Deploy Vercel
Upload repository ke GitHub, import di Vercel, lalu tambahkan Environment Variable `APPS_SCRIPT_URL`. Deploy.

## 6. Setelah instalasi
1. Login sebagai admin.
2. Import mahasiswa melalui menu Pengguna.
3. Atur deadline Tugas 1–5 dan UTS/UAS.
4. Periksa materi 16 pertemuan pada Kelola Materi.
5. Edit prompt forum diskusi bila diperlukan.
6. Gunakan Gradebook untuk komentar, nilai manual, atau rubrik.

## 7. Rubrik
Tugas 1–5 sudah mempunyai rubrik 4 level sesuai dokumen kisi-kisi. Saat aktivitas memiliki rubrik, Gradebook menampilkan kriteria dan menghitung nilai 0–100 otomatis.

**Catatan Tugas 3:** dokumen sumber berjumlah 90%, tetapi atas keputusan dosen rubrik LMS telah disesuaikan menjadi **100%**: 20% + 25% + 15% + 15% + 25%. Bobot **Rencana Analisis Data** menjadi 25%.

## 8. Import / Export Excel
Menu Gradebook dapat mengekspor submission yang membutuhkan komentar dan mengimpor komentar/nilai. Menu Data dapat melakukan backup/restore database multi-sheet. Jangan mengubah kolom ID teknis pada template ekspor.

## 9. File
File kecil dapat diunggah ke Drive melalui backend. Untuk file besar, lebih baik simpan di Drive/penyimpanan institusi dan kirim URL di submission.

## 10. PWA
`manifest.webmanifest`, service worker, favicon, dan icon 192/512 telah tersedia. Setelah deploy HTTPS, browser kompatibel dapat menawarkan instalasi.

## 11. Verifikasi backend
Setelah setup, jalankan `verifyBackend()` pada Apps Script. Periksa log dan pastikan schema, 16 pertemuan, 16 materi, 5 rubrik, dan aktivitas seed tersedia.


## Upgrade dari v1.0.0
Jika backend v1.0.0 sudah pernah di-setup, deploy kode Apps Script terbaru lalu jalankan `upgradeTask3RubricTo100()` satu kali. Fungsi ini hanya memperbarui Rubrik Tugas 3 menjadi total 100% dan tidak menghapus data lain.
