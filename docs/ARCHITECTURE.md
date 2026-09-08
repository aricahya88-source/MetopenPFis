# Arsitektur METOPEN PFIS LMS

`Browser/PWA → Next.js API proxy (/api/gas) → Google Apps Script → Google Sheets / Google Drive`.

Frontend menggunakan Next.js, React, TypeScript dan TipTap untuk editor WYSIWYG. Backend GAS menangani autentikasi, data akademik, submission, komentar, diskusi, rubrik, nilai, import/export, dan log aktivitas. Google Sheets adalah database ringan satu mata kuliah; Drive menyimpan file submission.

Konten RPS dan kisi-kisi tugas juga tersedia sebagai file sumber di `public/rps` dan `public/tugas`.
